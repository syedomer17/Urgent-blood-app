import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../config/logger';

class SocketManager {
    private io: Server | null = null;

    public init(httpServer: any) {
        this.io = new Server(httpServer, {
            cors: {
                origin: config.cors.origin,
                methods: ['GET', 'POST'],
            },
        });

        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            try {
                const decoded = jwt.verify(token, config.jwt.secret) as any;
                socket.data.userId = decoded.sub;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info(`Socket connected: ${socket.id}, User: ${socket.data.userId}`);

            // Join user specific room
            socket.join(socket.data.userId);

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    public getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }

    public emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }
}

export const socketManager = new SocketManager();

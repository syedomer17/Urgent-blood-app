import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../config/logger';
import { User } from '../modules/users/user.model';
import { BloodRequest } from '../modules/requests/request.model';
import { Notification } from '../modules/notifications/notification.model';

interface SocketUser {
    userId: string;
    socketId: string;
    role: string;
    bloodGroup?: string;
    location?: {
        coordinates: number[];
        city?: string;
        state?: string;
    };
    isActive: boolean;
    lastActivity: Date;
}

class SocketManager {
    private io: Server | null = null;
    private connectedUsers: Map<string, SocketUser> = new Map(); // userId -> SocketUser
    private activeRequests: Map<string, any> = new Map(); // requestId -> request data
    private userSockets: Map<string, string[]> = new Map(); // userId -> [socketIds]

    public init(httpServer: any) {
        this.io = new Server(httpServer, {
            cors: {
                origin: config.cors.origin,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingInterval: 25000,
            pingTimeout: 60000,
        });

        // Authentication Middleware
        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            try {
                const decoded = jwt.verify(token, config.jwt.secret) as any;
                socket.data.userId = decoded.sub;
                socket.data.role = decoded.role;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        // Connection Handler
        this.io.on('connection', (socket: Socket) => {
            const userId = socket.data.userId;

            // Join user-specific room
            socket.join(userId);
            socket.join(`${socket.data.role}:room`);

            // Track connected users
            this.addConnectedUser(userId, socket.id, socket.data.role);
            this.broadcast('active_users_count', {
                count: this.connectedUsers.size,
                timestamp: new Date(),
            });

            // Listen for socket events
            this.setupEventListeners(socket);

            // Handle disconnection
            socket.on('disconnect', () => {
                this.removeConnectedUser(userId, socket.id);
                this.broadcast('active_users_count', {
                    count: this.connectedUsers.size,
                });
            });

            // Handle errors
            socket.on('error', (error: any) => {
                logger.error(`Socket error:`, error?.message || error);
            });
        });

        logger.info('Socket.io ready');
    }

    private setupEventListeners(socket: Socket) {
        const userId = socket.data.userId;
        const role = socket.data.role;

        // User Location Update (for live tracking)
        socket.on('update_location', async (data: any) => {
            try {
                const { latitude, longitude, address, city, state } = data;

                // Update in connected users
                const user = this.connectedUsers.get(userId);
                if (user) {
                    user.location = {
                        coordinates: [longitude, latitude],
                        city,
                        state,
                    };
                    user.lastActivity = new Date();
                }

                // Update in database
                if (role === 'donor') {
                    await User.findByIdAndUpdate(userId, {
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                            address,
                            city,
                            state,
                        },
                    });

                    // Notify about new nearby donors
                    this.notifyNearbyRequesters(userId, {
                        latitude,
                        longitude,
                        city,
                        state,
                    });
                }

                socket.emit('location_update_success', {
                    message: 'Location updated successfully',
                    timestamp: new Date(),
                });
            } catch (error) {
                logger.error('Location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Real-time Request Updates
        socket.on('watch_request', (requestId: string) => {
            socket.join(`request:${requestId}`);
            socket.emit('watching_request', {
                requestId,
                message: 'Now watching real-time updates for this request',
            });
        });

        socket.on('unwatch_request', (requestId: string) => {
            socket.leave(`request:${requestId}`);
        });

        // Donor Availability Toggle
        socket.on('toggle_availability', async (data: any) => {
            try {
                const { available } = data;
                await User.findByIdAndUpdate(userId, { availability: available });

                this.connectedUsers.get(userId)!.isActive = available;

                socket.emit('availability_updated', {
                    available,
                    message: available ? 'You are now available' : 'You are now unavailable',
                });

                // Broadcast to requesters
                this.io?.to('requester:room').emit('donor_availability_changed', {
                    donorId: userId,
                    available,
                    timestamp: new Date(),
                });
            } catch (error) {
                logger.error('Availability toggle error:', error);
                socket.emit('error', { message: 'Failed to update availability' });
            }
        });

        // Accept/Reject Blood Request
        socket.on('accept_request', async (requestId: string) => {
            try {
                const request = await BloodRequest.findById(requestId);
                if (!request) {
                    socket.emit('error', { message: 'Request not found' });
                    return;
                }

                // Update request status
                request.status = 'accepted';
                await request.save();

                // Notify requester
                this.io?.to(request.requesterid.toString()).emit('request_accepted', {
                    requestId,
                    donorId: userId,
                    donor: await User.findById(userId),
                    message: 'Your blood request has been accepted!',
                    timestamp: new Date(),
                });

                // Notify all watching this request
                this.io?.to(`request:${requestId}`).emit('request_status_changed', {
                    requestId,
                    status: 'accepted',
                    acceptedBy: userId,
                    timestamp: new Date(),
                });

                socket.emit('accept_success', {
                    requestId,
                    message: 'Request accepted successfully',
                });
            } catch (error) {
                logger.error('Accept request error:', error);
                socket.emit('error', { message: 'Failed to accept request' });
            }
        });

        // Reject Blood Request
        socket.on('reject_request', async (requestId: string) => {
            try {
                this.io?.to(`request:${requestId}`).emit('donor_rejected', {
                    requestId,
                    donorId: userId,
                    timestamp: new Date(),
                });

                socket.emit('reject_success', {
                    requestId,
                    message: 'Request rejected',
                });
            } catch (error) {
                logger.error('Reject request error:', error);
            }
        });

        // Emergency Broadcast (Admins only)
        socket.on('broadcast_emergency', async (data: any) => {
            if (role !== 'admin') {
                socket.emit('error', { message: 'Unauthorized' });
                return;
            }

            try {
                const { message, bloodGroup, urgency, location } = data;
                this.io?.emit('emergency_alert', {
                    message,
                    bloodGroup,
                    urgency,
                    location,
                    timestamp: new Date(),
                    sound: true, // Client should play sound
                });
                logger.info('🚨 Emergency broadcast sent');
            } catch (error) {
                logger.error('Emergency broadcast error:', error);
            }
        });

        // Chat/Messaging
        socket.on('send_message', async (data: any) => {
            try {
                const { recipientId, message, requestId } = data;
                const sender = await User.findById(userId);

                this.io?.to(recipientId).emit('receive_message', {
                    from: userId,
                    senderName: sender?.name,
                    message,
                    requestId,
                    timestamp: new Date(),
                });

                socket.emit('message_sent', { timestamp: new Date() });
            } catch (error) {
                logger.error('Message send error:', error);
            }
        });

        // Typing Indicator
        socket.on('user_typing', (data: any) => {
            const { recipientId, isTyping } = data;
            this.io?.to(recipientId).emit('user_typing_indicator', {
                from: userId,
                isTyping,
            });
        });

        // Request Priority Level Change
        socket.on('request_update', async (data: any) => {
            try {
                const { requestId, updateData } = data;
                const request = await BloodRequest.findByIdAndUpdate(
                    requestId,
                    updateData,
                    { new: true }
                );

                // Notify all watchers
                this.io?.to(`request:${requestId}`).emit('request_updated', {
                    requestId,
                    updates: updateData,
                    fullRequest: request,
                    timestamp: new Date(),
                });
            } catch (error) {
                logger.error('Request update error:', error);
            }
        });

        // Get Online Donors
        socket.on('get_online_donors', () => {
            const onlineDonors = Array.from(this.connectedUsers.values())
                .filter(u => u.role === 'donor' && u.isActive)
                .map(u => ({
                    userId: u.userId,
                    location: u.location,
                    lastActivity: u.lastActivity,
                }));

            socket.emit('online_donors_list', {
                donors: onlineDonors,
                count: onlineDonors.length,
            });
        });

        // Request Status Poll (for live tracking)
        socket.on('poll_request_status', async (requestId: string) => {
            try {
                const request = await BloodRequest.findById(requestId);
                socket.emit('request_status', {
                    requestId,
                    status: request?.status,
                    updatedAt: request?.updatedAt,
                });
            } catch (error) {
                logger.error('Poll error:', error);
            }
        });
    }

    // Helper Methods
    private addConnectedUser(userId: string, socketId: string, role: string) {
        let sockets = this.userSockets.get(userId) || [];
        sockets.push(socketId);
        this.userSockets.set(userId, sockets);

        let user = this.connectedUsers.get(userId);
        if (!user) {
            user = {
                userId,
                socketId,
                role,
                isActive: true,
                lastActivity: new Date(),
            };
        }
        this.connectedUsers.set(userId, user);
    }

    private removeConnectedUser(userId: string, socketId: string) {
        let sockets = this.userSockets.get(userId) || [];
        sockets = sockets.filter(s => s !== socketId);

        if (sockets.length === 0) {
            this.userSockets.delete(userId);
            this.connectedUsers.delete(userId);
        } else {
            this.userSockets.set(userId, sockets);
        }
    }

    private async notifyNearbyRequesters(donorId: string, location: any) {
        try {
            const donor = await User.findById(donorId);
            if (!donor || !donor.bloodGroup) return;

            // Find active requests within 10km
            const nearbyRequests = await BloodRequest.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: location.coordinates || [0, 0],
                        },
                        distanceField: 'distance',
                        maxDistance: 10000, // 10km
                        spherical: true,
                    },
                },
                {
                    $match: {
                        status: 'pending',
                    },
                },
            ]);

            for (const request of nearbyRequests) {
                this.io?.to(request.requesterid.toString()).emit('nearby_donor_found', {
                    donor: {
                        id: donorId,
                        name: donor.name,
                        bloodGroup: donor.bloodGroup,
                        distance: (request.distance / 1000).toFixed(2) + ' km',
                    },
                    requestId: request._id,
                });
            }
        } catch (error) {
            logger.error('Notify nearby requesters error:', error);
        }
    }

    // Public Methods
    public getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }

    public emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
            logger.debug(`📤 Emitting ${event} to user ${userId}`);
        }
    }

    public emitToRoom(room: string, event: string, data: any) {
        if (this.io) {
            this.io.to(room).emit(event, data);
        }
    }

    public broadcast(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    public getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    public getOnlineDonors() {
        return Array.from(this.connectedUsers.values()).filter(u => u.role === 'donor' && u.isActive);
    }

    public getOnlineRequesters() {
        return Array.from(this.connectedUsers.values()).filter(u => u.role === 'requester');
    }

    public notifyLiveRequestCreated(request: any) {
        this.io?.to('donor:room').emit('new_blood_request', {
            request,
            timestamp: new Date(),
            sound: true,
        });
    }

    public notifyRequestUpdated(requestId: string, updates: any) {
        this.io?.to(`request:${requestId}`).emit('live_update', {
            requestId,
            updates,
            timestamp: new Date(),
        });
    }

    public notifyDonorMatched(requestId: string, donorId: string, donor: any) {
        this.io?.to(donorId).emit('blood_request_matched', {
            request: requestId,
            donor,
            message: 'You are matched with a blood request!',
            urgency: 'high',
            sound: true,
        });
    }

    public notifyNotification(userId: string, notification: any) {
        this.io?.to(userId).emit('new_notification', {
            notification,
            timestamp: new Date(),
        });
    }
}

export const socketManager = new SocketManager();

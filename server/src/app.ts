import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import { config } from './config/env';
import { globalErrorHandler } from './middlewares/error';
import { AppError } from './utils/appError';
import { StatusCodes } from 'http-status-codes';
import connectDB from './config/db';
import logger from './config/logger';
import { socketManager } from './sockets/socketManager';
import * as requestService from './modules/requests/requests.service';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import requestRoutes from './modules/requests/requests.routes';
import donationRoutes from './modules/donations/donations.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({ origin: config.cors.origin }));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Development logging
if (config.env === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
app.use('/api', limiter);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is healthy', timestamp: new Date() });
})

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Server is healthy', timestamp: new Date() });
});

// 404 Handler
app.use((req: Request, res: Response, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND));
});

// Global Error Handler
app.use(globalErrorHandler);

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        const server = http.createServer(app);

        // Initialize Socket.io
        socketManager.init(server);

        // Scheduler for Auto-Escalation (every 5 minutes)
        setInterval(() => {
            logger.info('Running auto-escalation job...');
            requestService.escalateAllPendingRequests().catch(err => logger.error('Auto-escalation failed', err));
        }, 5 * 60 * 1000);

        server.listen(config.port, () => {
            logger.info(`Server running in ${config.env} mode on port ${config.port}`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (err: Error) => {
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
            logger.error(err.name, err.message);
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err: Error) => {
            logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
            logger.error(err.name, err.message);
            process.exit(1);
        });

        // Graceful Shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM RECEIVED. Shutting down gracefully');
            server.close(() => {
                logger.info('💥 Process terminated!');
            });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
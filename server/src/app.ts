import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
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
import { InnovativeFeatures } from './sockets/innovativeFeatures';
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

// Parse cookies
app.use(cookieParser(config.jwt.secret));

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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
    console.error('Uncaught Exception:', err);
    if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Stack:', err.stack);
    }
    process.exit(1);
});

const startServer = async () => {
    try {
        await connectDB();
        const server = http.createServer(app);
        socketManager.init(server);

        // Background tasks
        setInterval(() => {
            InnovativeFeatures.generateDonorLeaderboard().catch(e => logger.error(e?.message));
        }, 5 * 60 * 1000);

        setInterval(() => {
            InnovativeFeatures.generateLiveHeatmap().catch(e => logger.error(e?.message));
        }, 2 * 60 * 1000);

        setInterval(() => {
            InnovativeFeatures.generateLiveAnalytics().catch(e => logger.error(e?.message));
        }, 3 * 60 * 1000);

        setInterval(() => {
            requestService.escalateAllPendingRequests().catch(e => logger.error(e?.message));
        }, 5 * 60 * 1000);

        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port}`);
        });

        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${config.port} is already in use`);
            } else {
                console.error('Server error:', err);
            }
            process.exit(1);
        });

        process.on('SIGTERM', () => {
            logger.info('Shutting down...');
            server.close();
        });
    } catch (error) {
        console.error('Server startup error:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
        }
        process.exit(1);
    }
};

startServer().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

export default app;
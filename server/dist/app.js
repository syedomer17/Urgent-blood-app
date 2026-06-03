"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const env_1 = require("./config/env");
const error_1 = require("./middlewares/error");
const appError_1 = require("./utils/appError");
const http_status_codes_1 = require("http-status-codes");
const db_1 = __importDefault(require("./config/db"));
const logger_1 = __importDefault(require("./config/logger"));
const innovativeFeatures_1 = require("./sockets/innovativeFeatures");
const requestService = __importStar(require("./modules/requests/requests.service"));
// Routes
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const requests_routes_1 = __importDefault(require("./modules/requests/requests.routes"));
const donations_routes_1 = __importDefault(require("./modules/donations/donations.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const donors_routes_1 = __importDefault(require("./modules/donors/donors.routes"));
const chat_routes_1 = __importDefault(require("./modules/chat/chat.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const app = (0, express_1.default)();
// Security HTTP headers
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Enable CORS
const allowedOrigins = [
    'https://urgentblood.syedomer.me',
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost'
];
// Add origins from config if they exist and are not '*'
if (env_1.config.cors.origin && env_1.config.cors.origin !== '*') {
    env_1.config.cors.origin.split(',').forEach((origin) => {
        const trimmed = origin.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (env_1.config.cors.origin === '*' || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, false); // Just disallow, don't throw error
        }
    },
    credentials: true
}));
// Parse JSON bodies
app.use(express_1.default.json());
// Parse URL-encoded bodies
app.use(express_1.default.urlencoded({ extended: true }));
// Parse cookies
app.use((0, cookie_parser_1.default)(env_1.config.jwt.secret));
// Gzip compression
app.use((0, compression_1.default)());
// Development logging
if (env_1.config.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Swagger Docs
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Serve uploaded files
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/requests', requests_routes_1.default);
app.use('/api/v1/donations', donations_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.default);
app.use('/api/v1/donors', donors_routes_1.default);
app.use('/api/v1/chat', chat_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
// console.log("MONGO_URI:", !!process.env.MONGO_URI);
// console.log("JWT_SECRET:", !!process.env.JWT_SECRET);
// console.log("GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY);
app.get("/", (req, res) => {
    res.status(200).json({ message: 'Server is healthy', timestamp: new Date() });
});
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy', timestamp: new Date() });
});
// 404 Handler
app.use((req, res, next) => {
    next(new appError_1.AppError(`Can't find ${req.originalUrl} on this server!`, http_status_codes_1.StatusCodes.NOT_FOUND));
});
// Global Error Handler
app.use(error_1.globalErrorHandler);
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Stack:', err.stack);
    }
    process.exit(1);
});
const startServer = async () => {
    try {
        await (0, db_1.default)();
        const server = http_1.default.createServer(app);
        // sockets have been disabled; socketManager is a no-op stub
        // Background tasks
        setInterval(() => {
            innovativeFeatures_1.InnovativeFeatures.generateDonorLeaderboard().catch(e => logger_1.default.error(e?.message));
        }, 5 * 60 * 1000);
        setInterval(() => {
            innovativeFeatures_1.InnovativeFeatures.generateLiveHeatmap().catch(e => logger_1.default.error(e?.message));
        }, 2 * 60 * 1000);
        setInterval(() => {
            innovativeFeatures_1.InnovativeFeatures.generateLiveAnalytics().catch(e => logger_1.default.error(e?.message));
        }, 3 * 60 * 1000);
        setInterval(() => {
            requestService.escalateAllPendingRequests().catch(e => logger_1.default.error(e?.message));
        }, 5 * 60 * 1000);
        server.listen(env_1.config.port, () => {
            logger_1.default.info(`Server running on port ${env_1.config.port}`);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${env_1.config.port} is already in use`);
            }
            else {
                console.error('Server error:', err);
            }
            process.exit(1);
        });
        process.on('SIGTERM', () => {
            logger_1.default.info('Shutting down...');
            server.close();
        });
    }
    catch (error) {
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
exports.default = app;

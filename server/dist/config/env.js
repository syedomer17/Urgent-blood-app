"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().default(9000),
    MONGO_URI: joi_1.default.string().required().description('MongoDB Connection URL'),
    GEMINI_API_KEY: joi_1.default.string().allow('').default('').description('Google Gemini API key for document verification'),
    JWT_SECRET: joi_1.default.string().required().description('JWT Secret Key'),
    JWT_ACCESS_EXPIRATION: joi_1.default.string().default('15m').description('JWT Access Token Expiration'),
    JWT_REFRESH_EXPIRATION: joi_1.default.string().default('7d').description('JWT Refresh Token Expiration'),
    CORS_ORIGIN: joi_1.default.string().default('*').description('CORS Origin'),
    LOG_LEVEL: joi_1.default.string().default('debug').valid('error', 'warn', 'info', 'debug').description('Logging Level'),
    SMTP_HOST: joi_1.default.string().default('smtp.gmail.com').description('SMTP host'),
    SMTP_PORT: joi_1.default.number().default(587).description('SMTP port'),
    SMTP_USER: joi_1.default.string().default('').description('SMTP username / email'),
    SMTP_PASS: joi_1.default.string().default('').description('SMTP password / app password'),
    SMTP_FROM: joi_1.default.string().default('LifeLink <noreply@lifelink.app>').description('From address'),
    AI_AUTO_APPROVE_CONFIDENCE: joi_1.default.number().min(0).max(1).default(0.8).description('Confidence threshold for auto-approving AI verifications'),
    CLOUDINARY_CLOUD_NAME: joi_1.default.string().required().description('Cloudinary Cloud Name'),
    CLOUDINARY_API_KEY: joi_1.default.string().required().description('Cloudinary API Key'),
    CLOUDINARY_API_SECRET: joi_1.default.string().required().description('Cloudinary API Secret'),
}).unknown();
const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
exports.config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongo: {
        uri: envVars.MONGO_URI,
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        accessExpiration: envVars.JWT_ACCESS_EXPIRATION,
        refreshExpiration: envVars.JWT_REFRESH_EXPIRATION,
    },
    cors: {
        origin: envVars.CORS_ORIGIN,
    },
    logging: {
        level: envVars.LOG_LEVEL,
    },
    smtp: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
        from: envVars.SMTP_FROM,
    },
    ai: {
        autoApproveConfidence: envVars.AI_AUTO_APPROVE_CONFIDENCE,
    },
    gemini: {
        apiKey: envVars.GEMINI_API_KEY,
    },
    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET,
    },
};

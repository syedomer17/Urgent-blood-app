import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(9000),
    MONGO_URI: Joi.string().required().description('MongoDB Connection URL'),
    GEMINI_API_KEY: Joi.string().allow('').default('').description('Google Gemini API key for document verification'),
    JWT_SECRET: Joi.string().required().description('JWT Secret Key'),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m').description('JWT Access Token Expiration'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d').description('JWT Refresh Token Expiration'),
    CORS_ORIGIN: Joi.string().default('*').description('CORS Origin'),
    LOG_LEVEL: Joi.string().default('debug').valid('error', 'warn', 'info', 'debug').description('Logging Level'),
    SMTP_HOST: Joi.string().default('smtp.gmail.com').description('SMTP host'),
    SMTP_PORT: Joi.number().default(587).description('SMTP port'),
    SMTP_USER: Joi.string().default('').description('SMTP username / email'),
    SMTP_PASS: Joi.string().default('').description('SMTP password / app password'),
    SMTP_FROM: Joi.string().default('LifeLink <noreply@lifelink.app>').description('From address'),
    AI_AUTO_APPROVE_CONFIDENCE: Joi.number().min(0).max(1).default(0.8).description('Confidence threshold for auto-approving AI verifications'),
}).unknown();

const { value: envVars, error } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
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
};

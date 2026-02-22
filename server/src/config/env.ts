import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(9000),
    MONGO_URI: Joi.string().required().description('MongoDB Connection URL'),
    JWT_SECRET: Joi.string().required().description('JWT Secret Key'),
    JWT_ACCESS_EXPIRATION: Joi.string().default('15m').description('JWT Access Token Expiration'),
    JWT_REFRESH_EXPIRATION: Joi.string().default('7d').description('JWT Refresh Token Expiration'),
    CORS_ORIGIN: Joi.string().default('*').description('CORS Origin'),
    LOG_LEVEL: Joi.string().default('debug').valid('error', 'warn', 'info', 'debug').description('Logging Level'),
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
};

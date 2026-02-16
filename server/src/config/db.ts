import mongoose from 'mongoose';
import { config } from './env';
import logger from './logger';

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongo.uri);
        logger.info('MongoDB Connected Successfully');
    } catch (error) {
        logger.error('MongoDB Connection Error: ', error);
        process.exit(1);
    }
};

export default connectDB;

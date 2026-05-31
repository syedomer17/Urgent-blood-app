"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = __importDefault(require("./logger"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(env_1.config.mongo.uri);
        logger_1.default.info('MongoDB Connected Successfully');
    }
    catch (error) {
        logger_1.default.error('MongoDB Connection Error: ', error);
        process.exit(1);
    }
};
exports.default = connectDB;

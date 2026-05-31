"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const appError_1 = require("../utils/appError");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError_1.AppError(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new appError_1.AppError(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError_1.AppError(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
};
const handleJWTError = () => new appError_1.AppError('Invalid token. Please log in again!', http_status_codes_1.StatusCodes.UNAUTHORIZED);
const handleJWTExpiredError = () => new appError_1.AppError('Your token has expired! Please log in again.', http_status_codes_1.StatusCodes.UNAUTHORIZED);
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    else {
        // Programming or other unknown error: don't leak error details
        logger_1.default.error('ERROR 💥', err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong!',
        });
    }
};
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (env_1.config.env === 'development') {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err };
        error.message = err.message;
        if (error.name === 'CastError')
            error = handleCastErrorDB(error);
        if (error.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        sendErrorProd(error, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;

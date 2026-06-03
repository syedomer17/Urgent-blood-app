"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const appError_1 = require("../utils/appError");
const user_model_1 = require("../modules/users/user.model");
const env_1 = require("../config/env");
const catchAsync_1 = require("../utils/catchAsync");
exports.protect = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    let token;
    // Check cookies first (primary method)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // Fallback: Check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new appError_1.AppError('You are not logged in! Please log in to get access.', http_status_codes_1.StatusCodes.UNAUTHORIZED));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        const currentUser = await user_model_1.User.findById(decoded.sub);
        if (!currentUser) {
            return next(new appError_1.AppError('The user belonging to this token does no longer exist.', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        if (currentUser.accountStatus === 'blocked' || currentUser.accountStatus === 'suspended') {
            return next(new appError_1.AppError('Your account is temporarily unavailable. Please contact an administrator.', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        req.user = currentUser;
        next();
    }
    catch (error) {
        // Distinguish between expired and invalid tokens
        if (error.name === 'TokenExpiredError') {
            return next(new appError_1.AppError('Your session has expired. Please refresh your token or log in again.', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        return next(new appError_1.AppError('Invalid token. Please log in again!', http_status_codes_1.StatusCodes.UNAUTHORIZED));
    }
});
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new appError_1.AppError('You do not have permission to perform this action', http_status_codes_1.StatusCodes.FORBIDDEN));
        }
        next();
    };
};
exports.restrictTo = restrictTo;

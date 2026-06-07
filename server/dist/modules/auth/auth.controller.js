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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.registerHospital = exports.register = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responseHandler_1 = require("../../utils/responseHandler");
const authService = __importStar(require("./auth.service"));
const http_status_codes_1 = require("http-status-codes");
// Cookie options for secure token storage
const cookieOptions = {
    httpOnly: true,
    secure: true, // Required for sameSite: 'none'
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
};
const accessTokenCookieOptions = {
    httpOnly: true,
    secure: true, // Required for sameSite: 'none'
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000, // 1 day for access token
};
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.register(req.body);
    // Set cookies (tokens are ONLY sent via cookies, not in response body)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    // Mobile clients cannot rely on browser-only httpOnly cookies, so expose tokens
    // in the response body while still setting cookies for the web client.
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.CREATED, true, 'User registered successfully', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });
});
exports.registerHospital = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const file = req.file ? { path: req.file.path, filename: req.file.filename, mimetype: req.file.mimetype } : undefined;
    const result = await authService.registerHospital(req.body, file);
    // Set cookies (tokens are ONLY sent via cookies, not in response body)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.CREATED, true, 'Hospital registered successfully', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        verificationResult: result.verificationResult,
    });
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.login(req.body);
    // Set cookies (tokens are ONLY sent via cookies, not in response body)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    // Mobile clients cannot rely on browser-only httpOnly cookies, so expose tokens
    // in the response body while still setting cookies for the web client.
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Login successful', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });
});
exports.refreshToken = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // Get refresh token from cookies (primary) or body (fallback)
    const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshTokenValue) {
        // Both tokens expired - automatic logout
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, false, 'Session expired. Please log in again.');
    }
    const result = await authService.refreshToken(refreshTokenValue);
    // Set new cookies (tokens are ONLY sent via cookies)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Token refreshed successfully', {
        tokenRefreshed: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    });
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;
    await authService.logout(req.user._id.toString(), refreshTokenValue);
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Logged out successfully');
});

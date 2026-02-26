import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as authService from './auth.service';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../config/env';

// Cookie options for secure token storage
const cookieOptions = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
};

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 1 day for access token
};


export const register = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    // Set cookies (tokens are ONLY sent via cookies, not in response body)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    // Send only user data in response (no tokens)
    sendResponse(res, StatusCodes.CREATED, true, 'User registered successfully', { user: result.user });
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    // Set cookies (tokens are ONLY sent via cookies, not in response body)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    // Send only user data in response (no tokens)
    sendResponse(res, StatusCodes.OK, true, 'Login successful', { user: result.user });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
    // Get refresh token from cookies (primary) or body (fallback)
    const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshTokenValue) {
        // Both tokens expired - automatic logout
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return sendResponse(res, StatusCodes.UNAUTHORIZED, false, 'Session expired. Please log in again.');
    }

    const result = await authService.refreshToken(refreshTokenValue);

    // Set new cookies (tokens are ONLY sent via cookies)
    res.cookie('accessToken', result.accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    sendResponse(res, StatusCodes.OK, true, 'Token refreshed successfully', { tokenRefreshed: true });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    const refreshTokenValue = req.cookies.refreshToken || req.body.refreshToken;
    await authService.logout(req.user!._id.toString(), refreshTokenValue);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    sendResponse(res, StatusCodes.OK, true, 'Logged out successfully');
});

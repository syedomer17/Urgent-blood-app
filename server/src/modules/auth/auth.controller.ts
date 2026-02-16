import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as authService from './auth.service';
import { StatusCodes } from 'http-status-codes';

export const register = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    sendResponse(res, StatusCodes.CREATED, true, 'User registered successfully', result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendResponse(res, StatusCodes.OK, true, 'Login successful', result);
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendResponse(res, StatusCodes.OK, true, 'Token refreshed successfully', result);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await authService.logout(req.user!._id.toString(), refreshToken);
    sendResponse(res, StatusCodes.OK, true, 'Logged out successfully');
});

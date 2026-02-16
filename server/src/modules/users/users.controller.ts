import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as userService from './users.service';
import { StatusCodes } from 'http-status-codes';

export const getProfile = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!._id.toString());
    sendResponse(res, StatusCodes.OK, true, 'User profile retrieved successfully', user);
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!._id.toString(), req.body);
    sendResponse(res, StatusCodes.OK, true, 'User profile updated successfully', user);
});

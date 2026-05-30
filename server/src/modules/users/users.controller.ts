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

export const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    sendResponse(res, StatusCodes.OK, true, 'Users retrieved successfully', users);
});

export const getDonors = catchAsync(async (req: Request, res: Response) => {
    const donors = await userService.getDonors();
    const callerRole = (req.user && (req.user as any).role) || 'anonymous';
    if (!['requester', 'admin'].includes(callerRole)) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }
    sendResponse(res, StatusCodes.OK, true, 'Donors retrieved successfully', donors);
});


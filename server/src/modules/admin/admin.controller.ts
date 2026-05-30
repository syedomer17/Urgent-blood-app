import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as adminService from './admin.service';
import { StatusCodes } from 'http-status-codes';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendResponse(res, StatusCodes.OK, true, 'Admin stats retrieved successfully', stats);
});

export const getPendingVerifications = catchAsync(async (req: Request, res: Response) => {
    const users = await adminService.getPendingVerifications();
    sendResponse(res, StatusCodes.OK, true, 'Pending verifications retrieved', users);
});

export const approveVerification = catchAsync(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const rawAdminId = (req as any).user?._id;
    const adminId = Array.isArray(rawAdminId) ? rawAdminId[0] : String(rawAdminId || '');
    const user = await adminService.approveUserVerification(String(id), adminId);
    sendResponse(res, StatusCodes.OK, true, 'User verification approved', user);
});

export const rejectVerification = catchAsync(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { reason } = req.body;
    const rawAdminId = (req as any).user?._id;
    const adminId = Array.isArray(rawAdminId) ? rawAdminId[0] : String(rawAdminId || '');
    const user = await adminService.rejectUserVerification(String(id), reason || 'Rejected by admin', adminId);
    sendResponse(res, StatusCodes.OK, true, 'User verification rejected', user);
});

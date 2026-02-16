import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as adminService from './admin.service';
import { StatusCodes } from 'http-status-codes';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendResponse(res, StatusCodes.OK, true, 'Admin stats retrieved successfully', stats);
});

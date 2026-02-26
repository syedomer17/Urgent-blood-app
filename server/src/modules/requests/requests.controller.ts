import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as requestService from './requests.service';
import { StatusCodes } from 'http-status-codes';

export const createRequest = catchAsync(async (req: Request, res: Response) => {
    const request = await requestService.createRequest(req.user!._id.toString(), req.body);
    sendResponse(res, StatusCodes.CREATED, true, 'Blood request created successfully', request);
});

export const getMyRequests = catchAsync(async (req: Request, res: Response) => {
    const requests = await requestService.getMyRequests(req.user!._id.toString());
    sendResponse(res, StatusCodes.OK, true, 'Requests retrieved successfully', requests);
});

export const getAllRequests = catchAsync(async (req: Request, res: Response) => {
    const requests = await requestService.getAllRequests();
    sendResponse(res, StatusCodes.OK, true, 'All requests retrieved successfully', requests);
});

export const getRequest = catchAsync(async (req: Request, res: Response) => {
    const request = await requestService.getRequestById(req.params.id as string);
    if (!request) {
        return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Request not found' });
    }
    sendResponse(res, StatusCodes.OK, true, 'Request retrieved successfully', request);
});

export const getMapData = catchAsync(async (_req: Request, res: Response) => {
    const data = await requestService.getMapData();
    sendResponse(res, StatusCodes.OK, true, 'Map data retrieved successfully', data);
});


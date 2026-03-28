import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as requestService from './requests.service';
import { verifyHospitalDocument } from './hospitalVerification.service';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs';

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

export const verifyDocument = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'No file uploaded. Please upload a hospital document (image or PDF).',
        });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed.',
        });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        fs.unlinkSync(req.file.path);
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.',
        });
    }

    try {
        const result = await verifyHospitalDocument(req.file.path);

        sendResponse(res, StatusCodes.OK, true, 'Document verification complete', {
            verification: result,
            file: {
                fileName: req.file.originalname,
                filePath: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        throw error;
    }
});


import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as requestService from './requests.service';
import { verifyHospitalDocument } from './hospitalVerification.service';
import { StatusCodes } from 'http-status-codes';
import fs from 'fs';
import { User } from '../users/user.model';
import { config } from '../../config/env';

export const createRequest = catchAsync(async (req: Request, res: Response) => {
    // If request references a hospital name, require the creator to be a verified hospital (requester) or admin
    const hospitalName = req.body?.hospitalName;
    if (hospitalName) {
        const user = req.user as any;
        const isAdmin = user?.role === 'admin';
        const isRequesterVerified = user?.role === 'requester' && Boolean(user?.isVerified);
        if (!isAdmin && !isRequesterVerified) {
            return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Only verified hospitals or admins can create requests mentioning a hospital.' });
        }
    }
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

        // Persist uploaded file metadata into the user's verification.documents
        try {
            if (req.user && (req.user as any)._id) {
                const fileDoc = {
                    filename: req.file.originalname,
                    path: req.file.path,
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date(),
                };

                // Store AI suggestion but keep status as 'pending' for admin review
                // Determine if we should auto-approve based on config threshold
                const threshold = Number(config.ai.autoApproveConfidence || 0.8);
                const shouldAutoApprove = Boolean(result.isVerified) && Number(result.confidence || 0) >= threshold;

                const update: any = {
                    $push: { 'verification.documents': fileDoc },
                    $set: {
                        'verification.aiSuggestedVerified': Boolean(result.isVerified),
                        'verification.aiConfidence': Number(result.confidence || 0),
                        'verification.aiDetails': result.details || '',
                    },
                };

                if (shouldAutoApprove) {
                    update.$set['verification.status'] = 'approved';
                    update.$set['verification.aiAutoApproved'] = true;
                    update.$set['isVerified'] = true;
                    update.$set['verification.reviewedAt'] = new Date();
                } else {
                    update.$set['verification.status'] = 'pending';
                }

                await User.findByIdAndUpdate((req.user as any)._id, update).exec();
            }
        } catch (e) {
            // log but don't fail the whole request — admin can still review via record
            console.error('Failed to persist verification document info:', (e as any)?.message || e);
        }

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

export const getMatchingDonors = catchAsync(async (req: Request, res: Response) => {
    const donors = await requestService.getMatchingDonors(req.params.id as string);
    const callerRole = (req.user && (req.user as any).role) || 'anonymous';
    if (!['requester', 'admin'].includes(callerRole)) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }
    sendResponse(res, StatusCodes.OK, true, 'Matching donors retrieved', donors);
});


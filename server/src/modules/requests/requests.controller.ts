import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as requestService from './requests.service';
import { verifyHospitalDocument } from '../../utils/hospitalVerification';
import { verifyPrescriptionDocument } from '../../utils/prescriptionVerification';
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
            const isVerifiedHospital = user?.role === 'hospital' && Boolean(user?.isVerified);
            const isVerifiedRequester = user?.role === 'requester' && (Boolean(user?.isVerified) || Boolean(req.body?.documentVerification?.isVerified));
            if (!isAdmin && !isVerifiedHospital && !isVerifiedRequester) {
            return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: 'Only verified hospitals, verified requesters, or admins can create requests mentioning a hospital.' });
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
            message: 'No file uploaded. Please upload a document (prescription, blood bank receipt, or hospital document).',
        });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed.',
        });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.',
        });
    }

    try {
        // Since we use Cloudinary storage, the file is already uploaded
        // We need to fetch it to a buffer for Gemini AI verification
        const response = await fetch(req.file.path);
        const fileBuffer = Buffer.from(await response.arrayBuffer());

        // Determine document type: prescription (default for requests) or hospital (for hospital registration)
        const documentType = req.query.type === 'hospital' ? 'hospital' : 'prescription';
        
        const result = documentType === 'hospital' 
            ? await verifyHospitalDocument(fileBuffer, req.file.mimetype)
            : await verifyPrescriptionDocument(fileBuffer, req.file.mimetype);

        // Persist uploaded file metadata into the user's verification.documents
        try {
            if (req.user && (req.user as any)._id) {
                const fileDoc = {
                    filename: (req.file as any).originalname || (req.file as any).filename,
                    path: req.file.path, // Cloudinary URL
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date(),
                };

                // For hospital documents: Store AI suggestion but keep status as 'pending' for admin review
                // For prescriptions: Only store, don't auto-verify user
                if (documentType === 'hospital') {
                    const threshold = Number(config.ai.autoApproveConfidence || 0.8);
                    const shouldAutoApprove = Boolean((result as any).verificationStatus === 'verified') && Number((result as any).confidenceScore || 0) >= threshold;

                    const update: any = {
                        $push: { 'verification.documents': fileDoc },
                        $set: {
                            'verification.aiSuggestedVerified': Boolean((result as any).verificationStatus === 'verified'),
                            'verification.aiConfidence': Number((result as any).confidenceScore || 0),
                            'verification.aiDetails': (result as any).reasons?.join(', ') || '',
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
                } else {
                    // For prescriptions, just track that a document was submitted for verification
                    // Don't auto-approve the user - this is for blood requests, not user verification
                    const update: any = {
                        $push: { 'requestDocuments': fileDoc },
                    };
                    // Optionally track prescription verification results
                    if ((result as any).isVerified) {
                        update.$push['prescriptionVerifications'] = {
                            ...result,
                            uploadedAt: new Date(),
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Failed to persist verification document info:', (e as any)?.message || e);
        }

        sendResponse(res, StatusCodes.OK, true, 'Document verification complete', {
            verification: result,
            documentType,
            file: {
                fileName: (req.file as any).originalname || (req.file as any).filename,
                filePath: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error) {
        throw error;
    }
});

export const getMatchingDonors = catchAsync(async (req: Request, res: Response) => {
    const donors = await requestService.getMatchingDonors(req.params.id as string);
    const callerRole = (req.user && (req.user as any).role) || 'anonymous';
    if (!['requester', 'hospital', 'admin'].includes(callerRole)) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }
    sendResponse(res, StatusCodes.OK, true, 'Matching donors retrieved', donors);
});


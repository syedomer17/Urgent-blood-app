"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingDonors = exports.verifyDocument = exports.getMapData = exports.getRequest = exports.getAllRequests = exports.getMyRequests = exports.createRequest = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responseHandler_1 = require("../../utils/responseHandler");
const requestService = __importStar(require("./requests.service"));
const hospitalVerification_1 = require("../../utils/hospitalVerification");
const prescriptionVerification_1 = require("../../utils/prescriptionVerification");
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../users/user.model");
const env_1 = require("../../config/env");
exports.createRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    // If request references a hospital name, require the creator to be a verified hospital (requester) or admin
    const hospitalName = req.body?.hospitalName;
    if (hospitalName) {
        const user = req.user;
        const isAdmin = user?.role === 'admin';
        const isVerifiedHospital = user?.role === 'hospital' && Boolean(user?.isVerified);
        const isVerifiedRequester = user?.role === 'requester' && (Boolean(user?.isVerified) || Boolean(req.body?.documentVerification?.isVerified));
        if (!isAdmin && !isVerifiedHospital && !isVerifiedRequester) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ success: false, message: 'Only verified hospitals, verified requesters, or admins can create requests mentioning a hospital.' });
        }
    }
    const request = await requestService.createRequest(req.user._id.toString(), req.body);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.CREATED, true, 'Blood request created successfully', request);
});
exports.getMyRequests = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const requests = await requestService.getMyRequests(req.user._id.toString());
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Requests retrieved successfully', requests);
});
exports.getAllRequests = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const requests = await requestService.getAllRequests();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'All requests retrieved successfully', requests);
});
exports.getRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const request = await requestService.getRequestById(req.params.id);
    if (!request) {
        return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ success: false, message: 'Request not found' });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Request retrieved successfully', request);
});
exports.getMapData = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const data = await requestService.getMapData();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Map data retrieved successfully', data);
});
exports.verifyDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.file) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'No file uploaded. Please upload a document (prescription, blood bank receipt, or hospital document).',
        });
    }
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Invalid file type. Only JPG, PNG, WebP, and PDF files are allowed.',
        });
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
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
            ? await (0, hospitalVerification_1.verifyHospitalDocument)(fileBuffer, req.file.mimetype)
            : await (0, prescriptionVerification_1.verifyPrescriptionDocument)(fileBuffer, req.file.mimetype);
        // Persist uploaded file metadata into the user's verification.documents
        try {
            if (req.user && req.user._id) {
                const fileDoc = {
                    filename: req.file.originalname || req.file.filename,
                    path: req.file.path, // Cloudinary URL
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date(),
                };
                // For hospital documents: Store AI suggestion but keep status as 'pending' for admin review
                // For prescriptions: Only store, don't auto-verify user
                if (documentType === 'hospital') {
                    const threshold = Number(env_1.config.ai.autoApproveConfidence || 0.8);
                    const shouldAutoApprove = Boolean(result.verificationStatus === 'verified') && Number(result.confidenceScore || 0) >= threshold;
                    const update = {
                        $push: { 'verification.documents': fileDoc },
                        $set: {
                            'verification.aiSuggestedVerified': Boolean(result.verificationStatus === 'verified'),
                            'verification.aiConfidence': Number(result.confidenceScore || 0),
                            'verification.aiDetails': result.reasons?.join(', ') || '',
                        },
                    };
                    if (shouldAutoApprove) {
                        update.$set['verification.status'] = 'approved';
                        update.$set['verification.aiAutoApproved'] = true;
                        update.$set['isVerified'] = true;
                        update.$set['verification.reviewedAt'] = new Date();
                    }
                    else {
                        update.$set['verification.status'] = 'pending';
                    }
                    await user_model_1.User.findByIdAndUpdate(req.user._id, update).exec();
                }
                else {
                    // For prescriptions, just track that a document was submitted for verification
                    // Don't auto-approve the user - this is for blood requests, not user verification
                    const update = {
                        $push: { 'requestDocuments': fileDoc },
                    };
                    // Optionally track prescription verification results
                    if (result.isVerified) {
                        update.$push['prescriptionVerifications'] = {
                            ...result,
                            uploadedAt: new Date(),
                        };
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to persist verification document info:', e?.message || e);
        }
        (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Document verification complete', {
            verification: result,
            documentType,
            file: {
                fileName: req.file.originalname || req.file.filename,
                filePath: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size,
            },
        });
    }
    catch (error) {
        throw error;
    }
});
exports.getMatchingDonors = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const donors = await requestService.getMatchingDonors(req.params.id);
    const callerRole = (req.user && req.user.role) || 'anonymous';
    if (!['requester', 'hospital', 'admin'].includes(callerRole)) {
        donors.forEach((d) => { if (d && d.contactNumber)
            delete d.contactNumber; });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Matching donors retrieved', donors);
});

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapData = exports.getMatchingDonors = exports.getAllRequests = exports.getMyRequests = exports.getRequestById = exports.escalateAllPendingRequests = exports.escalateRequest = exports.matchAndNotifyDonors = exports.createRequest = void 0;
const request_model_1 = require("./request.model");
const user_model_1 = require("../users/user.model");
const socketManager_1 = require("../../sockets/socketManager");
const liveNotificationService_1 = require("../../sockets/liveNotificationService");
const innovativeFeatures_1 = require("../../sockets/innovativeFeatures");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../../config/logger"));
const findDonors = async (bloodGroup, coordinates, maxDistanceKm) => {
    const compatibleDonorGroups = getCompatibleDonorGroups(bloodGroup);
    const donors = await user_model_1.User.find({
        role: 'donor',
        bloodGroup: { $in: compatibleDonorGroups },
        availability: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates,
                },
                $maxDistance: maxDistanceKm * 1000, // meters
            },
        },
        // Exclude those who donated recently (< 90 days)
        $or: [
            { lastDonationDate: { $exists: false } },
            { lastDonationDate: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        ]
    });
    return donors;
};
const getCompatibleDonorGroups = (targetGroup) => {
    switch (targetGroup) {
        case 'A+': return ['A+', 'A-', 'O+', 'O-'];
        case 'A-': return ['A-', 'O-'];
        case 'B+': return ['B+', 'B-', 'O+', 'O-'];
        case 'B-': return ['B-', 'O-'];
        case 'AB+': return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        case 'AB-': return ['A-', 'B-', 'AB-', 'O-'];
        case 'O+': return ['O+', 'O-'];
        case 'O-': return ['O-'];
        default: return [];
    }
};
const createRequest = async (requesterId, requestData) => {
    let location;
    try {
        location = await Promise.resolve().then(() => __importStar(require('../../utils/locationHelper'))).then(m => m.processLocation(requestData.location));
    }
    catch (error) {
        throw new appError_1.AppError('Geocoding service unavailable', http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE);
    }
    if (!location || !location.coordinates) {
        throw new appError_1.AppError('Location coordinates are required', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const newRequest = await request_model_1.BloodRequest.create({
        ...requestData,
        requesterid: requesterId,
        location,
        searchRadius: 5, // Start with 5km
    });
    // Trigger matching and live notifications
    await (0, exports.matchAndNotifyDonors)(newRequest);
    // Broadcast to all requesters that new request was created
    socketManager_1.socketManager.notifyLiveRequestCreated(newRequest);
    logger_1.default.info(`✅ New blood request created: ${newRequest._id}`);
    return newRequest;
};
exports.createRequest = createRequest;
const matchAndNotifyDonors = async (request) => {
    try {
        const donors = await findDonors(request.bloodGroup, request.location.coordinates, request.searchRadius);
        if (donors.length === 0) {
            logger_1.default.warn(`⚠️ No donors found for request ${request._id}`);
            return;
        }
        // Use LiveNotificationService for comprehensive notifications
        await liveNotificationService_1.LiveNotificationService.notifyNewBloodRequest(request, donors);
        // Find perfect matches using AI algorithm
        const perfectMatches = await innovativeFeatures_1.InnovativeFeatures.findPerfectMatches(request._id.toString());
        if (perfectMatches && perfectMatches.length > 0) {
            for (const match of perfectMatches) {
                await liveNotificationService_1.LiveNotificationService.notifyDonorMatch(request._id.toString(), match._id);
            }
            logger_1.default.info(`🎯 Perfect matches found: ${perfectMatches.length}`);
        }
        // Emit live update
        socketManager_1.socketManager.notifyRequestUpdated(request._id.toString(), {
            status: 'matching_in_progress',
            donorsNotified: donors.length,
        });
    }
    catch (error) {
        logger_1.default.error('Error in matchAndNotifyDonors:', error);
    }
};
exports.matchAndNotifyDonors = matchAndNotifyDonors;
const escalateRequest = async (requestId) => {
    try {
        const request = await request_model_1.BloodRequest.findById(requestId);
        if (!request || request.status !== 'pending')
            return;
        // Increase radius
        request.searchRadius += 5;
        if (request.searchRadius > 50) {
            logger_1.default.warn(`🚨 Request ${requestId} reached max search radius (50km)`);
            return;
        }
        await request.save();
        logger_1.default.info(`⬆️ Request ${requestId} escalated to ${request.searchRadius}km radius`);
        // Notify requesters about escalation
        socketManager_1.socketManager.emitToUser(request.requesterid.toString(), 'request_escalated', {
            requestId,
            newRadius: request.searchRadius,
            message: `Search radius expanded to ${request.searchRadius}km`,
        });
        // Re-run matching
        await (0, exports.matchAndNotifyDonors)(request);
    }
    catch (error) {
        logger_1.default.error('Error escalating request:', error);
    }
};
exports.escalateRequest = escalateRequest;
const escalateAllPendingRequests = async () => {
    try {
        const pendingRequests = await request_model_1.BloodRequest.find({
            status: 'pending',
            searchRadius: { $lt: 50 },
            updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
        });
        for (const request of pendingRequests) {
            await (0, exports.escalateRequest)(request._id.toString());
        }
        logger_1.default.info(`✅ Escalated ${pendingRequests.length} pending requests`);
    }
    catch (error) {
        logger_1.default.error('Error in escalateAllPendingRequests:', error);
    }
};
exports.escalateAllPendingRequests = escalateAllPendingRequests;
const getRequestById = async (id) => {
    return await request_model_1.BloodRequest.findById(id).populate('requesterid', 'name email contactNumber');
};
exports.getRequestById = getRequestById;
const getMyRequests = async (requesterId) => {
    return await request_model_1.BloodRequest.find({ requesterid: requesterId }).sort({ createdAt: -1 });
};
exports.getMyRequests = getMyRequests;
const getAllRequests = async () => {
    return await request_model_1.BloodRequest.find()
        .populate('requesterid', 'name email contactNumber')
        .sort({ createdAt: -1 });
};
exports.getAllRequests = getAllRequests;
const getMatchingDonors = async (requestId) => {
    const request = await request_model_1.BloodRequest.findById(requestId);
    if (!request)
        throw new appError_1.AppError('Request not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);
    const coords = request.location?.coordinates;
    if (!coords || coords.length < 2) {
        throw new appError_1.AppError('Request has no location data', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const maxDistanceMetres = (request.searchRadius || 25) * 1000;
    const donors = await user_model_1.User.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: coords },
                distanceField: 'distanceMetres',
                maxDistance: maxDistanceMetres,
                spherical: true,
                key: 'location',
                query: {
                    role: 'donor',
                    bloodGroup: { $in: compatibleGroups },
                },
            },
        },
        {
            $project: {
                name: 1,
                bloodGroup: 1,
                availability: 1,
                trustRating: 1,
                totalDonations: 1,
                lastDonationDate: 1,
                location: 1,
                contactNumber: 1,
                distanceMetres: 1,
                isOnline: 1,
                lastActivity: 1,
            },
        },
    ]);
    return donors;
};
exports.getMatchingDonors = getMatchingDonors;
const getMapData = async () => {
    return await request_model_1.BloodRequest.find({
        status: 'pending',
        'location.coordinates': { $exists: true, $ne: [] },
    })
        .select('patientName bloodGroup urgency unitsRequired location status')
        .populate('requesterid', 'name')
        .sort({ createdAt: -1 });
};
exports.getMapData = getMapData;

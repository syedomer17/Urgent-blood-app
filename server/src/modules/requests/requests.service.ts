import { BloodRequest, IBloodRequest } from './request.model';
import { User } from '../users/user.model';
import { Notification } from '../notifications/notification.model';
import { socketManager } from '../../sockets/socketManager';
import { LiveNotificationService } from '../../sockets/liveNotificationService';
import { InnovativeFeatures } from '../../sockets/innovativeFeatures';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';
import logger from '../../config/logger';
import { haversineDistance } from '../../utils/haversine';

const findDonors = async (bloodGroup: string, coordinates: number[], maxDistanceKm: number) => {
    const compatibleDonorGroups = getCompatibleDonorGroups(bloodGroup);

    const donors = await User.find({
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

const getCompatibleDonorGroups = (targetGroup: string): string[] => {
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

export const createRequest = async (requesterId: string, requestData: any) => {
    let location;
    try {
        location = await import('../../utils/locationHelper').then(m => m.processLocation(requestData.location));
    } catch (error) {
        throw new AppError('Geocoding service unavailable', StatusCodes.SERVICE_UNAVAILABLE);
    }

    if (!location || !location.coordinates) {
        throw new AppError('Location coordinates are required', StatusCodes.BAD_REQUEST);
    }

    const newRequest = await BloodRequest.create({
        ...requestData,
        requesterid: requesterId,
        location,
        searchRadius: 5, // Start with 5km
    });

    // Trigger matching and live notifications
    await matchAndNotifyDonors(newRequest);

    // Broadcast to all requesters that new request was created
    socketManager.notifyLiveRequestCreated(newRequest);

    logger.info(`✅ New blood request created: ${newRequest._id}`);
    return newRequest;
};

export const matchAndNotifyDonors = async (request: IBloodRequest) => {
    try {
        const donors = await findDonors(request.bloodGroup, request.location.coordinates, request.searchRadius);

        if (donors.length === 0) {
            logger.warn(`⚠️ No donors found for request ${request._id}`);
            return;
        }

        // Use LiveNotificationService for comprehensive notifications
        await LiveNotificationService.notifyNewBloodRequest(request, donors);

        // Find perfect matches using AI algorithm
        const perfectMatches = await InnovativeFeatures.findPerfectMatches(request._id.toString());
        if (perfectMatches && perfectMatches.length > 0) {
            for (const match of perfectMatches) {
                await LiveNotificationService.notifyDonorMatch(request._id.toString(), match._id);
            }
            logger.info(`🎯 Perfect matches found: ${perfectMatches.length}`);
        }

        // Emit live update
        socketManager.notifyRequestUpdated(request._id.toString(), {
            status: 'matching_in_progress',
            donorsNotified: donors.length,
        });

    } catch (error) {
        logger.error('Error in matchAndNotifyDonors:', error);
    }
};

export const escalateRequest = async (requestId: string) => {
    try {
        const request = await BloodRequest.findById(requestId);
        if (!request || request.status !== 'pending') return;

        // Increase radius
        request.searchRadius += 5;
        if (request.searchRadius > 50) {
            logger.warn(`🚨 Request ${requestId} reached max search radius (50km)`);
            return;
        }

        await request.save();

        logger.info(`⬆️ Request ${requestId} escalated to ${request.searchRadius}km radius`);

        // Notify requesters about escalation
        socketManager.emitToUser(request.requesterid.toString(), 'request_escalated', {
            requestId,
            newRadius: request.searchRadius,
            message: `Search radius expanded to ${request.searchRadius}km`,
        });

        // Re-run matching
        await matchAndNotifyDonors(request);
    } catch (error) {
        logger.error('Error escalating request:', error);
    }
};

export const escalateAllPendingRequests = async () => {
    try {
        const pendingRequests = await BloodRequest.find({
            status: 'pending',
            searchRadius: { $lt: 50 },
            updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
        });

        for (const request of pendingRequests) {
            await escalateRequest(request._id.toString());
        }

        logger.info(`✅ Escalated ${pendingRequests.length} pending requests`);
    } catch (error) {
        logger.error('Error in escalateAllPendingRequests:', error);
    }
};

export const getRequestById = async (id: string) => {
    return await BloodRequest.findById(id).populate('requesterid', 'name email contactNumber');
};

export const getMyRequests = async (requesterId: string) => {
    return await BloodRequest.find({ requesterid: requesterId }).sort({ createdAt: -1 });
};

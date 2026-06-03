"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveNotificationService = void 0;
const socketManager_1 = require("./socketManager");
const notification_model_1 = require("../modules/notifications/notification.model");
const user_model_1 = require("../modules/users/user.model");
const request_model_1 = require("../modules/requests/request.model");
const logger_1 = __importDefault(require("../config/logger"));
const emailService_1 = require("../utils/emailService");
/**
 * Live Notification Service
 * Handles real-time notifications for all app events
 */
class LiveNotificationService {
    /**
     * Notify new blood request to nearby donors
     */
    static async notifyNewBloodRequest(request, donors) {
        try {
            for (const donor of donors) {
                // Create notification record
                await notification_model_1.Notification.create({
                    recipientId: donor._id,
                    title: '🩸 New Blood Request!',
                    message: `${request.patientName} needs ${request.bloodGroup} blood ${request.urgency === 'critical' ? '(URGENT)' : ''}`,
                    type: 'blood_request',
                    relatedEntityId: request._id,
                });
                // Emit live notification
                socketManager_1.socketManager.notifyLiveRequestCreated({
                    ...request.toObject(),
                    distance: this.calculateDistance(donor.location.coordinates, request.location.coordinates),
                });
                // Send push notification
                await this.sendPushNotification(donor._id.toString(), {
                    title: '🩸 Blood Request Nearby!',
                    body: `${request.patientName} needs ${request.bloodGroup} - ${request.urgency} urgency`,
                    sound: true,
                    badge: 1,
                });
                logger_1.default.info(`✅ Notified donor ${donor._id} about request ${request._id}`);
            }
        }
        catch (error) {
            logger_1.default.error('Error notifying donors:', error);
        }
    }
    /**
     * Notify when donor comes online nearby
     */
    static async notifyNewDonorOnline(donor, nearbyRequests) {
        try {
            for (const request of nearbyRequests) {
                const requester = await user_model_1.User.findById(request.requesterid);
                if (!requester)
                    continue;
                await notification_model_1.Notification.create({
                    recipientId: requester._id,
                    title: '📍 Donor Available Nearby!',
                    message: `A ${donor.bloodGroup} donor just came online near you`,
                    type: 'donor_online',
                    relatedEntityId: donor._id,
                });
                const distKm = this.calculateDistance(donor.location.coordinates, request.location.coordinates);
                socketManager_1.socketManager.emitToUser(requester._id.toString(), 'nearby_donor_online', {
                    donor: {
                        id: donor._id,
                        name: donor.name,
                        bloodGroup: donor.bloodGroup,
                    },
                    distance: distKm,
                });
                // Email the requester
                if (requester.email) {
                    (0, emailService_1.emailNewDonorNearby)(requester.email, requester.name, donor.name, donor.bloodGroup ?? 'Unknown', distKm).catch(() => { });
                }
            }
        }
        catch (error) {
            logger_1.default.error('Error notifying requesters:', error);
        }
    }
    /**
     * Notify request status changes
     */
    static async notifyRequestStatusChanged(requestId, newStatus, actor) {
        try {
            const request = await request_model_1.BloodRequest.findById(requestId);
            if (!request)
                return;
            const requester = await user_model_1.User.findById(request.requesterid);
            const donor = await user_model_1.User.findById(actor._id);
            let title = '';
            let message = '';
            switch (newStatus) {
                case 'accepted':
                    title = '✅ Request Accepted!';
                    message = `${donor?.name} has accepted your blood request`;
                    break;
                case 'fulfilled':
                    title = '🎉 Request Fulfilled!';
                    message = 'Your blood request has been fulfilled';
                    break;
                case 'cancelled':
                    title = '❌ Request Cancelled';
                    message = 'Your blood request has been cancelled';
                    break;
                default:
                    title = '📝 Request Updated';
                    message = `Your request status changed to ${newStatus}`;
            }
            await notification_model_1.Notification.create({
                recipientId: requester._id,
                title,
                message,
                type: 'request_status_change',
                relatedEntityId: requestId,
            });
            socketManager_1.socketManager.emitToUser(requester._id.toString(), 'request_status_notification', {
                requestId,
                status: newStatus,
                actor: {
                    id: actor._id,
                    name: actor.name,
                    role: actor.role,
                },
                title,
                message,
            });
            // Email the requester about status change
            if (requester?.email) {
                (0, emailService_1.emailRequestStatusUpdate)(requester.email, requester.name, request.patientName, request.bloodGroup, newStatus, donor?.name).catch(() => { });
            }
            logger_1.default.info(`✅ Notified requester about status change: ${newStatus}`);
        }
        catch (error) {
            logger_1.default.error('Error notifying status change:', error);
        }
    }
    /**
     * Notify emergency alerts
     */
    static async broadcastEmergencyAlert(alert) {
        try {
            // Get all online donors
            const onlineDonors = socketManager_1.socketManager.getOnlineDonors();
            // Filter by blood group compatibility
            const compatibleDonors = onlineDonors.filter((donor) => this.isCompatibleBloodGroup(donor.bloodGroup, alert.bloodGroup));
            // Create notifications for all compatible donors
            for (const donor of compatibleDonors) {
                await notification_model_1.Notification.create({
                    recipientId: donor.userId,
                    title: '🚨 EMERGENCY ALERT!',
                    message: alert.message,
                    type: 'emergency',
                });
                // Emit with sound
                socketManager_1.socketManager.emitToUser(donor.userId, 'emergency_notification', {
                    ...alert,
                    sound: true,
                    vibrate: [500, 200, 500],
                });
            }
            logger_1.default.info(`🚨 Emergency alert sent to ${compatibleDonors.length} donors`);
        }
        catch (error) {
            logger_1.default.error('Error broadcasting emergency:', error);
        }
    }
    /**
     * Notify donor leaderboard updates
     */
    static async notifyLeaderboardUpdate(donorId, rank, totalDonations) {
        try {
            let message = `You are ranked #${rank} with ${totalDonations} donations`;
            if (rank <= 10) {
                message = `🏆 You made TOP 10! Ranked #${rank}`;
            }
            await notification_model_1.Notification.create({
                recipientId: donorId,
                title: '🏅 Leaderboard Update',
                message,
                type: 'achievement',
            });
            socketManager_1.socketManager.emitToUser(donorId, 'leaderboard_update', {
                rank,
                totalDonations,
                message,
                achievement: rank <= 10,
            });
        }
        catch (error) {
            logger_1.default.error('Error notifying leaderboard:', error);
        }
    }
    /**
     * Notify when recipient's message is received
     */
    static async notifyMessage(recipientId, senderId, message) {
        try {
            const sender = await user_model_1.User.findById(senderId);
            await notification_model_1.Notification.create({
                recipientId,
                title: `💬 Message from ${sender?.name}`,
                message: message.substring(0, 100),
                type: 'message',
                relatedEntityId: senderId,
            });
            socketManager_1.socketManager.emitToUser(recipientId, 'message_notification', {
                senderId,
                senderName: sender?.name,
                preview: message.substring(0, 50),
            });
        }
        catch (error) {
            logger_1.default.error('Error notifying message:', error);
        }
    }
    /**
     * Notify community achievement/trust rating
     */
    static async notifyTrustRatingUpdate(donorId, newRating) {
        try {
            let title = '';
            let message = '';
            if (newRating >= 4.8) {
                title = '⭐ Superb Donor Rating!';
                message = `Your trust rating is ${newRating}/5 - You're a community hero!`;
            }
            else if (newRating >= 4.5) {
                title = '⭐ Excellent Donor Rating!';
                message = `Your trust rating is ${newRating}/5`;
            }
            else if (newRating >= 4.0) {
                title = '⭐ Good Donor Rating';
                message = `Your trust rating is ${newRating}/5`;
            }
            if (title) {
                await notification_model_1.Notification.create({
                    recipientId: donorId,
                    title,
                    message,
                    type: 'achievement',
                });
                socketManager_1.socketManager.emitToUser(donorId, 'trust_rating_update', {
                    rating: newRating,
                    title,
                    message,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error notifying trust rating:', error);
        }
    }
    /**
     * Notify when nearby donors match for a request
     */
    static async notifyDonorMatch(requestId, donorId) {
        try {
            const request = await request_model_1.BloodRequest.findById(requestId);
            const donor = await user_model_1.User.findById(donorId);
            if (!request || !donor)
                return;
            await notification_model_1.Notification.create({
                recipientId: donorId,
                title: '🎯 Perfect Match!',
                message: `Your blood type matches a request: ${donor.bloodGroup} needed for ${request.patientName}`,
                type: 'donor_match',
                relatedEntityId: requestId,
            });
            socketManager_1.socketManager.notifyDonorMatched(requestId, donorId, {
                id: donor._id,
                name: donor.name,
                bloodGroup: donor.bloodGroup,
                distance: '5.2 km',
            });
            logger_1.default.info(`✅ Notified donor match: ${donorId} for request ${requestId}`);
        }
        catch (error) {
            logger_1.default.error('Error notifying donor match:', error);
        }
    }
    /**
     * Real-time request progress update
     */
    static async notifyRequestProgress(requestId, progress, message) {
        try {
            const request = await request_model_1.BloodRequest.findById(requestId);
            if (!request)
                return;
            socketManager_1.socketManager.emitToRoom(`request:${requestId}`, 'request_progress_update', {
                requestId,
                progress,
                message,
                timestamp: new Date(),
            });
            logger_1.default.info(`📊 Request ${requestId} progress updated: ${progress}%`);
        }
        catch (error) {
            logger_1.default.error('Error notifying progress:', error);
        }
    }
    /**
     * Notify recipient of donation completion
     */
    static async notifyDonationCompleted(requestId, unitsReceived) {
        try {
            const request = await request_model_1.BloodRequest.findById(requestId);
            if (!request)
                return;
            const requester = await user_model_1.User.findById(request.requesterid);
            await notification_model_1.Notification.create({
                recipientId: requester._id,
                title: '✅ Blood Received!',
                message: `${unitsReceived} unit(s) of blood has been received`,
                type: 'donation_completed',
                relatedEntityId: requestId,
            });
            socketManager_1.socketManager.emitToUser(requester._id.toString(), 'blood_received', {
                requestId,
                unitsReceived,
                message: `${unitsReceived} units received successfully`,
            });
        }
        catch (error) {
            logger_1.default.error('Error notifying completion:', error);
        }
    }
    // ==================== HELPER METHODS ====================
    static calculateDistance(coord1, coord2) {
        // Haversine formula
        const R = 6371; // Earth's radius in km
        const lat1 = (coord1[1] * Math.PI) / 180;
        const lat2 = (coord2[1] * Math.PI) / 180;
        const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
        const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    static isCompatibleBloodGroup(donorGroup, recipientGroup) {
        const compatibility = {
            'A+': ['A+', 'AB+'],
            'A-': ['A+', 'A-', 'AB+', 'AB-'],
            'B+': ['B+', 'AB+'],
            'B-': ['B+', 'B-', 'AB+', 'AB-'],
            'AB+': ['AB+'],
            'AB-': ['AB+', 'AB-'],
            'O+': ['A+', 'B+', 'AB+', 'O+'],
            'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        };
        return compatibility[donorGroup]?.includes(recipientGroup) || false;
    }
    static async sendPushNotification(userId, notification) {
        try {
            // Integration point for push notification service
            // Can integrate with Firebase Cloud Messaging, Expo, or similar
            logger_1.default.debug(`📱 Push notification queued for ${userId}:`, notification.title);
            // TODO: Implement actual push notification service
        }
        catch (error) {
            logger_1.default.error('Error sending push notification:', error);
        }
    }
}
exports.LiveNotificationService = LiveNotificationService;
exports.default = LiveNotificationService;

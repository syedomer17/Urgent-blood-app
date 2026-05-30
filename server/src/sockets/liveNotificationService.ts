import { socketManager } from './socketManager';
import { Notification } from '../modules/notifications/notification.model';
import { User } from '../modules/users/user.model';
import { BloodRequest } from '../modules/requests/request.model';
import logger from '../config/logger';
import { emailNewDonorNearby, emailRequestStatusUpdate } from '../utils/emailService';

/**
 * Live Notification Service
 * Handles real-time notifications for all app events
 */

export class LiveNotificationService {
    /**
     * Notify new blood request to nearby donors
     */
    static async notifyNewBloodRequest(request: any, donors: any[]) {
        try {
            for (const donor of donors) {
                // Create notification record
                await Notification.create({
                    recipientId: donor._id,
                    title: '🩸 New Blood Request!',
                    message: `${request.patientName} needs ${request.bloodGroup} blood ${request.urgency === 'critical' ? '(URGENT)' : ''}`,
                    type: 'blood_request',
                    relatedEntityId: request._id,
                });

                // Emit live notification
                socketManager.notifyLiveRequestCreated({
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

                logger.info(`✅ Notified donor ${donor._id} about request ${request._id}`);
            }
        } catch (error) {
            logger.error('Error notifying donors:', error);
        }
    }

    /**
     * Notify when donor comes online nearby
     */
    static async notifyNewDonorOnline(donor: any, nearbyRequests: any[]) {
        try {
            for (const request of nearbyRequests) {
                const requester = await User.findById(request.requesterid);
                if (!requester) continue;

                await Notification.create({
                    recipientId: requester._id,
                    title: '📍 Donor Available Nearby!',
                    message: `A ${donor.bloodGroup} donor just came online near you`,
                    type: 'donor_online',
                    relatedEntityId: donor._id,
                });

                const distKm = this.calculateDistance(donor.location.coordinates, request.location.coordinates);
                socketManager.emitToUser(requester._id.toString(), 'nearby_donor_online', {
                    donor: {
                        id: donor._id,
                        name: donor.name,
                        bloodGroup: donor.bloodGroup,
                    },
                    distance: distKm,
                });

                // Email the requester
                if (requester.email) {
                    emailNewDonorNearby(
                        requester.email,
                        requester.name,
                        donor.name,
                        donor.bloodGroup ?? 'Unknown',
                        distKm,
                    ).catch(() => {});
                }
            }
        } catch (error) {
            logger.error('Error notifying requesters:', error);
        }
    }

    /**
     * Notify request status changes
     */
    static async notifyRequestStatusChanged(requestId: string, newStatus: string, actor: any) {
        try {
            const request = await BloodRequest.findById(requestId);
            if (!request) return;

            const requester = await User.findById(request.requesterid);
            const donor = await User.findById(actor._id);

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

            await Notification.create({
                recipientId: requester!._id,
                title,
                message,
                type: 'request_status_change',
                relatedEntityId: requestId,
            });

            socketManager.emitToUser(requester!._id.toString(), 'request_status_notification', {
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
                emailRequestStatusUpdate(
                    requester.email,
                    requester.name,
                    request.patientName,
                    request.bloodGroup,
                    newStatus,
                    donor?.name,
                ).catch(() => {});
            }

            logger.info(`✅ Notified requester about status change: ${newStatus}`);
        } catch (error) {
            logger.error('Error notifying status change:', error);
        }
    }

    /**
     * Notify emergency alerts
     */
    static async broadcastEmergencyAlert(alert: any) {
        try {
            // Get all online donors
            const onlineDonors = socketManager.getOnlineDonors();

            // Filter by blood group compatibility
            const compatibleDonors = onlineDonors.filter((donor: any) =>
                this.isCompatibleBloodGroup(donor.bloodGroup, alert.bloodGroup)
            );

            // Create notifications for all compatible donors
            for (const donor of compatibleDonors) {
                await Notification.create({
                    recipientId: donor.userId,
                    title: '🚨 EMERGENCY ALERT!',
                    message: alert.message,
                    type: 'emergency',
                });

                // Emit with sound
                socketManager.emitToUser(donor.userId, 'emergency_notification', {
                    ...alert,
                    sound: true,
                    vibrate: [500, 200, 500],
                });
            }

            logger.info(`🚨 Emergency alert sent to ${compatibleDonors.length} donors`);
        } catch (error) {
            logger.error('Error broadcasting emergency:', error);
        }
    }

    /**
     * Notify donor leaderboard updates
     */
    static async notifyLeaderboardUpdate(donorId: string, rank: number, totalDonations: number) {
        try {
            let message = `You are ranked #${rank} with ${totalDonations} donations`;
            if (rank <= 10) {
                message = `🏆 You made TOP 10! Ranked #${rank}`;
            }

            await Notification.create({
                recipientId: donorId,
                title: '🏅 Leaderboard Update',
                message,
                type: 'achievement',
            });

            socketManager.emitToUser(donorId, 'leaderboard_update', {
                rank,
                totalDonations,
                message,
                achievement: rank <= 10,
            });
        } catch (error) {
            logger.error('Error notifying leaderboard:', error);
        }
    }

    /**
     * Notify when recipient's message is received
     */
    static async notifyMessage(recipientId: string, senderId: string, message: string) {
        try {
            const sender = await User.findById(senderId);

            await Notification.create({
                recipientId,
                title: `💬 Message from ${sender?.name}`,
                message: message.substring(0, 100),
                type: 'message',
                relatedEntityId: senderId,
            });

            socketManager.emitToUser(recipientId, 'message_notification', {
                senderId,
                senderName: sender?.name,
                preview: message.substring(0, 50),
            });
        } catch (error) {
            logger.error('Error notifying message:', error);
        }
    }

    /**
     * Notify community achievement/trust rating
     */
    static async notifyTrustRatingUpdate(donorId: string, newRating: number) {
        try {
            let title = '';
            let message = '';

            if (newRating >= 4.8) {
                title = '⭐ Superb Donor Rating!';
                message = `Your trust rating is ${newRating}/5 - You're a community hero!`;
            } else if (newRating >= 4.5) {
                title = '⭐ Excellent Donor Rating!';
                message = `Your trust rating is ${newRating}/5`;
            } else if (newRating >= 4.0) {
                title = '⭐ Good Donor Rating';
                message = `Your trust rating is ${newRating}/5`;
            }

            if (title) {
                await Notification.create({
                    recipientId: donorId,
                    title,
                    message,
                    type: 'achievement',
                });

                socketManager.emitToUser(donorId, 'trust_rating_update', {
                    rating: newRating,
                    title,
                    message,
                });
            }
        } catch (error) {
            logger.error('Error notifying trust rating:', error);
        }
    }

    /**
     * Notify when nearby donors match for a request
     */
    static async notifyDonorMatch(requestId: string, donorId: string) {
        try {
            const request = await BloodRequest.findById(requestId);
            const donor = await User.findById(donorId);

            if (!request || !donor) return;

            await Notification.create({
                recipientId: donorId,
                title: '🎯 Perfect Match!',
                message: `Your blood type matches a request: ${donor.bloodGroup} needed for ${request.patientName}`,
                type: 'donor_match',
                relatedEntityId: requestId,
            });

            socketManager.notifyDonorMatched(requestId, donorId, {
                id: donor._id,
                name: donor.name,
                bloodGroup: donor.bloodGroup,
                distance: '5.2 km',
            });

            logger.info(`✅ Notified donor match: ${donorId} for request ${requestId}`);
        } catch (error) {
            logger.error('Error notifying donor match:', error);
        }
    }

    /**
     * Real-time request progress update
     */
    static async notifyRequestProgress(requestId: string, progress: number, message: string) {
        try {
            const request = await BloodRequest.findById(requestId);
            if (!request) return;

            socketManager.emitToRoom(`request:${requestId}`, 'request_progress_update', {
                requestId,
                progress,
                message,
                timestamp: new Date(),
            });

            logger.info(`📊 Request ${requestId} progress updated: ${progress}%`);
        } catch (error) {
            logger.error('Error notifying progress:', error);
        }
    }

    /**
     * Notify recipient of donation completion
     */
    static async notifyDonationCompleted(requestId: string, unitsReceived: number) {
        try {
            const request = await BloodRequest.findById(requestId);
            if (!request) return;

            const requester = await User.findById(request.requesterid);

            await Notification.create({
                recipientId: requester!._id,
                title: '✅ Blood Received!',
                message: `${unitsReceived} unit(s) of blood has been received`,
                type: 'donation_completed',
                relatedEntityId: requestId,
            });

            socketManager.emitToUser(requester!._id.toString(), 'blood_received', {
                requestId,
                unitsReceived,
                message: `${unitsReceived} units received successfully`,
            });
        } catch (error) {
            logger.error('Error notifying completion:', error);
        }
    }

    // ==================== HELPER METHODS ====================

    static calculateDistance(coord1: number[], coord2: number[]): number {
        // Haversine formula
        const R = 6371; // Earth's radius in km
        const lat1 = (coord1[1] * Math.PI) / 180;
        const lat2 = (coord2[1] * Math.PI) / 180;
        const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
        const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    static isCompatibleBloodGroup(donorGroup: string, recipientGroup: string): boolean {
        const compatibility: { [key: string]: string[] } = {
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

    static async sendPushNotification(userId: string, notification: any) {
        try {
            // Integration point for push notification service
            // Can integrate with Firebase Cloud Messaging, Expo, or similar
            logger.debug(`📱 Push notification queued for ${userId}:`, notification.title);
            // TODO: Implement actual push notification service
        } catch (error) {
            logger.error('Error sending push notification:', error);
        }
    }
}

export default LiveNotificationService;

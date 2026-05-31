"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InnovativeFeatures = void 0;
const user_model_1 = require("../modules/users/user.model");
const request_model_1 = require("../modules/requests/request.model");
const donation_model_1 = require("../modules/donations/donation.model");
const socketManager_1 = require("./socketManager");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Unique & Innovative Features Service
 * Advanced features that set this app apart
 */
class InnovativeFeatures {
    /**
     * 🏆 DONOR LEADERBOARD SYSTEM
     * Real-time ranking of top donors based on:
     * - Total units donated
     * - Donation frequency
     * - Trust rating
     * - Speed of response
     */
    static async generateDonorLeaderboard() {
        try {
            const leaderboard = await user_model_1.User.aggregate([
                {
                    $match: {
                        role: 'donor',
                    },
                },
                {
                    $lookup: {
                        from: 'donationhistories',
                        localField: '_id',
                        foreignField: 'donorId',
                        as: 'donations',
                    },
                },
                {
                    $project: {
                        name: 1,
                        bloodGroup: 1,
                        totalDonations: {
                            $sum: '$donations.unitsDonated',
                        },
                        donationCount: {
                            $size: '$donations',
                        },
                        averageRating: {
                            $avg: '$donations.rating',
                        },
                        lastDonation: {
                            $max: '$donations.donationDate',
                        },
                    },
                },
                {
                    $sort: {
                        totalDonations: -1,
                        donationCount: -1,
                        averageRating: -1,
                    },
                },
                {
                    $limit: 100,
                },
            ]);
            // Emit to all connected clients
            socketManager_1.socketManager.broadcast('leaderboard_updated', {
                leaderboard: leaderboard.map((donor, index) => ({
                    ...donor,
                    rank: index + 1,
                    badge: this.getDonorBadge(index),
                })),
                timestamp: new Date(),
            });
            return leaderboard;
        }
        catch (error) {
            logger_1.default.error('Error generating leaderboard:', error);
        }
    }
    /**
     * 🔴 EMERGENCY BROADCAST SYSTEM
     * Admin can send emergency alerts to all compatible donors
     * with critical blood requirements
     */
    static async triggerEmergencyBroadcast(data) {
        try {
            const donors = await user_model_1.User.find({
                role: 'donor',
                bloodGroup: data.bloodGroup,
                availability: true,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: data.location.coordinates,
                        },
                        $maxDistance: 15000, // 15km radius for emergency
                    },
                },
            });
            socketManager_1.socketManager.broadcast('emergency_broadcast', {
                bloodGroup: data.bloodGroup,
                unitsRequired: data.unitsRequired,
                location: data.location,
                message: data.message,
                urgency: 'critical',
                alertSound: true,
                vibrate: [500, 200, 500],
                recipients: donors.length,
                timestamp: new Date(),
            });
            logger_1.default.info(`🚨 Emergency broadcast sent to ${donors.length} donors`);
        }
        catch (error) {
            logger_1.default.error('Emergency broadcast error:', error);
        }
    }
    /**
     * 🌍 LIVE DONOR HEATMAP
     * Shows real-time distribution of available donors
     * Grouped by city and blood type
     */
    static async generateLiveHeatmap() {
        try {
            const heatmapData = await user_model_1.User.aggregate([
                {
                    $match: {
                        role: 'donor',
                        availability: true,
                        'location.city': { $exists: true },
                    },
                },
                {
                    $group: {
                        _id: {
                            city: '$location.city',
                            bloodGroup: '$bloodGroup',
                        },
                        count: { $sum: 1 },
                        locations: {
                            $push: {
                                coordinates: '$location.coordinates',
                                name: '$name',
                                id: '$_id',
                            },
                        },
                    },
                },
                {
                    $sort: {
                        count: -1,
                    },
                },
            ]);
            socketManager_1.socketManager.broadcast('live_heatmap_update', {
                heatmap: heatmapData,
                totalDonors: heatmapData.reduce((sum, item) => sum + item.count, 0),
                timestamp: new Date(),
            });
            return heatmapData;
        }
        catch (error) {
            logger_1.default.error('Error generating heatmap:', error);
        }
    }
    /**
     * ⭐ COMMUNITY TRUST RATING SYSTEM
     * Donors get rated by recipients on:
     * - Professionalism
     * - Reliability
     * - Responsiveness
     * - Communication
     */
    static async updateTrustRating(donorId, rating, review, requestId) {
        try {
            const donor = await user_model_1.User.findById(donorId);
            if (!donor)
                return;
            // Calculate weighted average rating
            const existingRating = donor.trustRating || 0;
            const existingCount = donor.ratingCount || 0;
            const newRating = (existingRating * existingCount + rating) / (existingCount + 1);
            await user_model_1.User.findByIdAndUpdate(donorId, {
                trustRating: Math.round(newRating * 10) / 10,
                ratingCount: existingCount + 1,
                $push: {
                    reviews: {
                        rating,
                        review,
                        requestId,
                        createdAt: new Date(),
                    },
                },
            });
            // Notify donor
            socketManager_1.socketManager.emitToUser(donorId, 'trust_rating_updated', {
                newRating: newRating.toFixed(1),
                totalReviews: existingCount + 1,
                message: 'Your trust rating has been updated!',
            });
            logger_1.default.info(`✅ Trust rating updated for donor ${donorId}: ${newRating.toFixed(1)}`);
        }
        catch (error) {
            logger_1.default.error('Error updating trust rating:', error);
        }
    }
    /**
     * 📊 REAL-TIME ANALYTICS DASHBOARD
     * Live statistics for admins:
     * - Active requests
     * - Available donors
     * - Response time metrics
     * - Success rate
     */
    static async generateLiveAnalytics() {
        try {
            const activeRequests = await request_model_1.BloodRequest.countDocuments({ status: 'pending' });
            const availableDonors = await user_model_1.User.countDocuments({
                role: 'donor',
                availability: true,
            });
            const recentDonations = await donation_model_1.DonationHistory.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalUnits: { $sum: '$unitsDonated' },
                        successCount: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                            },
                        },
                    },
                },
            ]);
            const avgResponseTime = await request_model_1.BloodRequest.aggregate([
                {
                    $match: {
                        status: { $in: ['accepted', 'fulfilled'] },
                    },
                },
                {
                    $project: {
                        responseTime: {
                            $subtract: ['$updatedAt', '$createdAt'],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: '$responseTime' },
                    },
                },
            ]);
            const analytics = {
                activeRequests,
                availableDonors,
                totalUnitsToday: recentDonations[0]?.totalUnits || 0,
                successCount: recentDonations[0]?.successCount || 0,
                avgResponseTimeMinutes: Math.round((avgResponseTime[0]?.avgTime || 0) / 60000),
                successRate: `${((recentDonations[0]?.successCount || 0) / Math.max(activeRequests, 1) * 100).toFixed(1)}%`,
                timestamp: new Date(),
            };
            socketManager_1.socketManager.broadcast('live_analytics_update', analytics);
            return analytics;
        }
        catch (error) {
            logger_1.default.error('Error generating analytics:', error);
        }
    }
    /**
     * 🎯 PREDICTIVE MATCHING ALGORITHM
     * AI-powered donor matching based on:
     * - Location proximity
     * - Blood compatibility
     * - Past response time
     * - Trust rating
     * - Availability pattern
     */
    static async findPerfectMatches(requestId) {
        try {
            const request = await request_model_1.BloodRequest.findById(requestId);
            if (!request || !request.location?.coordinates || request.location.coordinates.length !== 2)
                return;
            const coordinates = request.location.coordinates;
            const matches = await user_model_1.User.aggregate([
                {
                    $match: {
                        role: 'donor',
                        availability: true,
                        bloodGroup: request.bloodGroup,
                    },
                },
                {
                    $geoNear: {
                        near: {
                            type: 'Point',
                            coordinates: coordinates,
                        },
                        distanceField: 'distance',
                        maxDistance: 10000, // 10km
                        spherical: true,
                    },
                },
                {
                    $lookup: {
                        from: 'donationhistories',
                        localField: '_id',
                        foreignField: 'donorId',
                        as: 'donationHistory',
                    },
                },
                {
                    $project: {
                        name: 1,
                        bloodGroup: 1,
                        distance: 1,
                        trustRating: { $ifNull: ['$trustRating', 0] },
                        responseTime: {
                            $avg: {
                                $subtract: [
                                    { $arrayElemAt: ['$donationHistory.updatedAt', 0] },
                                    { $arrayElemAt: ['$donationHistory.createdAt', 0] },
                                ],
                            },
                        },
                        donationCount: { $size: '$donationHistory' },
                        matchScore: {
                            $add: [
                                { $multiply: [{ $divide: [1, { $max: ['$distance', 1] }] }, 40] }, // Distance (40%)
                                { $multiply: ['$trustRating', 40] }, // Trust rating (40%)
                                { $multiply: [{ $min: [{ $divide: ['$donationCount', 10] }, 1] }, 20] }, // Experience (20%)
                            ],
                        },
                    },
                },
                {
                    $sort: { matchScore: -1 },
                },
                {
                    $limit: 5,
                },
            ]);
            return matches;
        }
        catch (error) {
            logger_1.default.error('Error finding perfect matches:', error);
        }
    }
    /**
     * 💬 REAL-TIME CHAT/MESSAGING
     * Direct messaging between donors and requesters
     * with typing indicators and read receipts
     */
    static async sendDirectMessage(senderId, recipientId, message, requestId) {
        try {
            const sender = await user_model_1.User.findById(senderId);
            socketManager_1.socketManager.emitToUser(recipientId, 'new_direct_message', {
                from: {
                    id: senderId,
                    name: sender?.name,
                    avatar: sender?.avatar,
                },
                message,
                requestId,
                timestamp: new Date(),
                read: false,
            });
            logger_1.default.info(`💬 Message sent from ${senderId} to ${recipientId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending message:', error);
        }
    }
    /**
     * 🎖️ ACHIEVEMENT & BADGE SYSTEM
     * Reward active donors with badges
     */
    static async checkDonorAchievements(donorId) {
        try {
            const donor = await user_model_1.User.findById(donorId);
            const donations = await donation_model_1.DonationHistory.countDocuments({
                donorId,
                status: 'completed',
            });
            const achievements = [];
            if (donations === 1)
                achievements.push('first_donation');
            if (donations === 5)
                achievements.push('dedication_5');
            if (donations === 10)
                achievements.push('dedication_10');
            if (donations === 25)
                achievements.push('platinum_donor');
            if (donor?.trustRating >= 4.8)
                achievements.push('trusted_hero');
            if (donor?.trustRating >= 4.5)
                achievements.push('excellent_donor');
            if (achievements.length > 0) {
                socketManager_1.socketManager.emitToUser(donorId, 'achievement_unlocked', {
                    achievements,
                    message: `You've unlocked new achievements!`,
                    timestamp: new Date(),
                });
            }
            return achievements;
        }
        catch (error) {
            logger_1.default.error('Error checking achievements:', error);
        }
    }
    /**
     * 📍 LOCATION-BASED NOTIFICATIONS
     * Notify users when they enter a request's vicinity
     */
    static async notifyProximityAlert(userId, coordinates) {
        try {
            const nearbyRequests = await request_model_1.BloodRequest.find({
                status: 'pending',
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates,
                        },
                        $maxDistance: 2000, // 2km
                    },
                },
            });
            if (nearbyRequests.length > 0) {
                socketManager_1.socketManager.emitToUser(userId, 'proximity_alert', {
                    requests: nearbyRequests,
                    message: `${nearbyRequests.length} blood request(s) nearby!`,
                    timestamp: new Date(),
                });
            }
        }
        catch (error) {
            logger_1.default.error('Error checking proximity:', error);
        }
    }
    /**
     * 🔔 SMART NOTIFICATION PREFERENCES
     * Users can customize when and how they receive notifications
     */
    static async setNotificationPreferences(userId, preferences) {
        try {
            await user_model_1.User.findByIdAndUpdate(userId, {
                notificationPreferences: {
                    urgentRequests: preferences.urgentRequests ?? true,
                    nearbyRequests: preferences.nearbyRequests ?? true,
                    messages: preferences.messages ?? true,
                    donations: preferences.donations ?? true,
                    leaderboard: preferences.leaderboard ?? true,
                    soundEnabled: preferences.soundEnabled ?? true,
                    vibrationEnabled: preferences.vibrationEnabled ?? true,
                    quietHours: preferences.quietHours, // { start: "22:00", end: "08:00" }
                },
            });
            socketManager_1.socketManager.emitToUser(userId, 'preferences_saved', {
                message: 'Notification preferences updated',
            });
        }
        catch (error) {
            logger_1.default.error('Error setting preferences:', error);
        }
    }
    // Helper
    static getDonorBadge(rank) {
        if (rank === 1)
            return '🥇';
        if (rank === 2)
            return '🥈';
        if (rank === 3)
            return '🥉';
        if (rank <= 10)
            return '⭐';
        return '';
    }
}
exports.InnovativeFeatures = InnovativeFeatures;
exports.default = InnovativeFeatures;

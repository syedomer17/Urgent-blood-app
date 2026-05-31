"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUserVerification = exports.approveUserVerification = exports.getPendingVerifications = exports.getDashboardStats = void 0;
const user_model_1 = require("../users/user.model");
const request_model_1 = require("../requests/request.model");
const donation_model_1 = require("../donations/donation.model");
const getDashboardStats = async () => {
    const totalDonors = await user_model_1.User.countDocuments({ role: 'donor' });
    const activeRequests = await request_model_1.BloodRequest.countDocuments({ status: { $in: ['pending', 'accepted'] } });
    const completedDonations = await donation_model_1.DonationHistory.countDocuments({ status: 'completed' });
    const bloodGroupDistribution = await user_model_1.User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);
    // Average response time: Time between request creation and donation/acceptance?
    // We can track time from Request Created -> DonationHistory Created.
    // Using DonationHistory which has requestId.
    // We need to Join with requests.
    const avgResponseTime = await donation_model_1.DonationHistory.aggregate([
        {
            $lookup: {
                from: 'bloodrequests',
                localField: 'requestId',
                foreignField: '_id',
                as: 'request'
            }
        },
        { $unwind: '$request' },
        {
            $project: {
                duration: { $subtract: ['$createdAt', '$request.createdAt'] }
            }
        },
        {
            $group: {
                _id: null,
                avgTime: { $avg: '$duration' } // in milliseconds
            }
        }
    ]);
    return {
        totalDonors,
        activeRequests,
        completedDonations,
        bloodGroupDistribution,
        averageResponseTimeMinutes: avgResponseTime.length > 0 ? (avgResponseTime[0].avgTime / 60000).toFixed(2) : 0,
    };
};
exports.getDashboardStats = getDashboardStats;
const getPendingVerifications = async () => {
    const users = await user_model_1.User.find({ 'verification.status': 'pending' }).select('name email role contactNumber verification isVerified createdAt');
    return users;
};
exports.getPendingVerifications = getPendingVerifications;
const approveUserVerification = async (userId, adminId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new Error('User not found');
    if (!user.verification) {
        user.verification = {
            documents: [],
            status: 'approved',
            aiSuggestedVerified: false,
            aiConfidence: 0,
            aiDetails: null,
            aiAutoApproved: false,
            reviewedBy: adminId,
            reviewedAt: new Date(),
        };
    }
    else {
        user.verification.status = 'approved';
        user.verification.reviewedBy = adminId;
        user.verification.reviewedAt = new Date();
    }
    user.isVerified = true;
    await user.save();
    return user;
};
exports.approveUserVerification = approveUserVerification;
const rejectUserVerification = async (userId, reason, adminId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new Error('User not found');
    if (!user.verification) {
        user.verification = {
            documents: [],
            status: 'rejected',
            aiSuggestedVerified: false,
            aiConfidence: 0,
            aiDetails: null,
            aiAutoApproved: false,
            rejectionReason: reason,
            reviewedBy: adminId,
            reviewedAt: new Date(),
        };
    }
    else {
        user.verification.status = 'rejected';
        user.verification.rejectionReason = reason;
        user.verification.reviewedBy = adminId;
        user.verification.reviewedAt = new Date();
    }
    user.isVerified = false;
    await user.save();
    return user;
};
exports.rejectUserVerification = rejectUserVerification;

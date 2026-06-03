"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUserVerification = exports.approveUserVerification = exports.getActionableRequests = exports.getReports = exports.sendEmergencyBroadcast = exports.updateRequestStatus = exports.updateUserAccountStatus = exports.getAuditLogs = exports.getAllRequests = exports.getAllUsers = exports.getPendingVerifications = exports.getDashboardStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../users/user.model");
const request_model_1 = require("../requests/request.model");
const donation_model_1 = require("../donations/donation.model");
const adminAuditLog_model_1 = require("./adminAuditLog.model");
const notification_model_1 = require("../notifications/notification.model");
const liveNotificationService_1 = require("../../sockets/liveNotificationService");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};
const recordAudit = async (action, targetType, actorId, targetId, metadata = {}) => {
    await adminAuditLog_model_1.AdminAuditLog.create({
        action,
        targetType,
        actorId: actorId ? new mongoose_1.default.Types.ObjectId(actorId) : undefined,
        targetId,
        metadata,
    });
};
const getDashboardStats = async () => {
    const totalDonors = await user_model_1.User.countDocuments({ role: 'donor' });
    const activeDonors = await user_model_1.User.countDocuments({ role: 'donor', availability: true, accountStatus: 'active' });
    const completedDonations = await donation_model_1.DonationHistory.countDocuments({ status: 'completed' });
    const activeRequests = await request_model_1.BloodRequest.countDocuments({ status: { $in: ['pending', 'accepted'] } });
    const bloodRequestsToday = await request_model_1.BloodRequest.countDocuments({ createdAt: { $gte: getTodayRange().start, $lt: getTodayRange().end } });
    const emergencyRequests = await request_model_1.BloodRequest.countDocuments({ urgency: 'critical', status: { $ne: 'cancelled' } });
    const fulfilledRequests = await request_model_1.BloodRequest.countDocuments({ status: 'fulfilled' });
    const bloodGroupDistribution = await user_model_1.User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);
    const requestStatusDistribution = await request_model_1.BloodRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);
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
        activeDonors,
        activeRequests,
        completedDonations,
        bloodRequestsToday,
        emergencyRequests,
        fulfilledRequests,
        bloodGroupDistribution,
        requestStatusDistribution,
        averageResponseTimeMinutes: avgResponseTime.length > 0 ? (avgResponseTime[0].avgTime / 60000).toFixed(2) : 0,
    };
};
exports.getDashboardStats = getDashboardStats;
const getPendingVerifications = async () => {
    const users = await user_model_1.User.find({ 'verification.status': 'pending' }).select('name email role contactNumber verification isVerified accountStatus hospitalDetails createdAt');
    return users;
};
exports.getPendingVerifications = getPendingVerifications;
const getAllUsers = async () => {
    return user_model_1.User.find().select('name email role contactNumber verification isVerified accountStatus hospitalDetails availability bloodGroup trustRating totalDonations lastDonationDate createdAt').sort({ createdAt: -1 }).lean();
};
exports.getAllUsers = getAllUsers;
const getAllRequests = async () => {
    return request_model_1.BloodRequest.find().populate('requesterid', 'name email contactNumber role accountStatus').sort({ createdAt: -1 }).lean();
};
exports.getAllRequests = getAllRequests;
const getAuditLogs = async () => {
    return adminAuditLog_model_1.AdminAuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(100).lean();
};
exports.getAuditLogs = getAuditLogs;
const updateUserAccountStatus = async (userId, accountStatus, adminId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new Error('User not found');
    user.accountStatus = accountStatus;
    if (accountStatus === 'blocked') {
        user.availability = false;
    }
    await user.save();
    await recordAudit(`user:${accountStatus}`, 'User', adminId, user._id, { email: user.email, role: user.role });
    return user;
};
exports.updateUserAccountStatus = updateUserAccountStatus;
const updateRequestStatus = async (requestId, status, adminId, reason) => {
    const request = await request_model_1.BloodRequest.findByIdAndUpdate(requestId, { $set: { status } }, { new: true, runValidators: false });
    if (!request)
        throw new appError_1.AppError('Request not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    await recordAudit(`request:${status}`, 'BloodRequest', adminId, request._id, {
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        reason: reason || '',
    });
    return request;
};
exports.updateRequestStatus = updateRequestStatus;
const sendEmergencyBroadcast = async (payload, adminId) => {
    const alert = {
        bloodGroup: payload.bloodGroup,
        message: payload.message,
        region: payload.region,
        createdBy: adminId,
    };
    await liveNotificationService_1.LiveNotificationService.broadcastEmergencyAlert(alert);
    await notification_model_1.Notification.create({
        recipientId: new mongoose_1.default.Types.ObjectId(adminId),
        title: 'Emergency broadcast sent',
        message: payload.message,
        type: 'system',
    });
    await recordAudit('alert:emergency', 'Notification', adminId, undefined, alert);
    return alert;
};
exports.sendEmergencyBroadcast = sendEmergencyBroadcast;
const getReports = async () => {
    const hospitalActivity = await request_model_1.BloodRequest.aggregate([
        {
            $group: {
                _id: '$hospitalName',
                totalRequests: { $sum: 1 },
                fulfilledRequests: { $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] } },
                cancelledRequests: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            },
        },
        { $sort: { totalRequests: -1 } },
    ]);
    const requestFulfillment = await request_model_1.BloodRequest.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
    ]);
    const donationHistory = await donation_model_1.DonationHistory.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                unitsDonated: { $sum: '$unitsDonated' },
            },
        },
    ]);
    return {
        hospitalActivity,
        requestFulfillment,
        donationHistory,
    };
};
exports.getReports = getReports;
const getActionableRequests = async () => {
    return request_model_1.BloodRequest.find({ status: { $in: ['pending', 'accepted'] } }).populate('requesterid', 'name email contactNumber role accountStatus').sort({ createdAt: -1 }).lean();
};
exports.getActionableRequests = getActionableRequests;
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
    await recordAudit('verification:approve', 'User', adminId, user._id, { email: user.email, role: user.role });
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
    await recordAudit('verification:reject', 'User', adminId, user._id, { email: user.email, role: user.role, reason });
    return user;
};
exports.rejectUserVerification = rejectUserVerification;

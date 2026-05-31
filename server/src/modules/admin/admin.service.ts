import mongoose from 'mongoose';
import { User } from '../users/user.model';
import { BloodRequest } from '../requests/request.model';
import { DonationHistory } from '../donations/donation.model';
import { AdminAuditLog } from './adminAuditLog.model';
import { Notification } from '../notifications/notification.model';
import { socketManager } from '../../sockets/socketManager';
import { LiveNotificationService } from '../../sockets/liveNotificationService';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';

const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

const recordAudit = async (
    action: string,
    targetType: string,
    actorId?: string,
    targetId?: string | mongoose.Types.ObjectId,
    metadata: Record<string, unknown> = {}
) => {
    await AdminAuditLog.create({
        action,
        targetType,
        actorId: actorId ? new mongoose.Types.ObjectId(actorId) : undefined,
        targetId,
        metadata,
    });
};

export const getDashboardStats = async () => {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const activeDonors = await User.countDocuments({ role: 'donor', availability: true, accountStatus: 'active' });
    const completedDonations = await DonationHistory.countDocuments({ status: 'completed' });
    const activeRequests = await BloodRequest.countDocuments({ status: { $in: ['pending', 'accepted'] } });
    const bloodRequestsToday = await BloodRequest.countDocuments({ createdAt: { $gte: getTodayRange().start, $lt: getTodayRange().end } });
    const emergencyRequests = await BloodRequest.countDocuments({ urgency: 'critical', status: { $ne: 'cancelled' } });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });

    const bloodGroupDistribution = await User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const requestStatusDistribution = await BloodRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const avgResponseTime = await DonationHistory.aggregate([
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

export const getPendingVerifications = async () => {
    const users = await User.find({ 'verification.status': 'pending' }).select('name email role contactNumber verification isVerified accountStatus hospitalDetails createdAt');
    return users;
};

export const getAllUsers = async () => {
    return User.find().select('name email role contactNumber verification isVerified accountStatus hospitalDetails availability bloodGroup trustRating totalDonations lastDonationDate createdAt').sort({ createdAt: -1 }).lean();
};

export const getAllRequests = async () => {
    return BloodRequest.find().populate('requesterid', 'name email contactNumber role accountStatus').sort({ createdAt: -1 }).lean();
};

export const getAuditLogs = async () => {
    return AdminAuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(100).lean();
};

export const updateUserAccountStatus = async (userId: string, accountStatus: 'active' | 'suspended' | 'blocked', adminId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    (user as any).accountStatus = accountStatus;
    if (accountStatus === 'blocked') {
        user.availability = false;
    }
    await user.save();
    await recordAudit(`user:${accountStatus}`, 'User', adminId, user._id, { email: user.email, role: user.role });
    return user;
};

export const updateRequestStatus = async (
    requestId: string,
    status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled',
    adminId: string,
    reason?: string
) => {
    const request = await BloodRequest.findByIdAndUpdate(
        requestId,
        { $set: { status } },
        { new: true, runValidators: false }
    );
    if (!request) throw new AppError('Request not found', StatusCodes.NOT_FOUND);
    await recordAudit(`request:${status}`, 'BloodRequest', adminId, request._id, {
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        reason: reason || '',
    });
    return request;
};

export const sendEmergencyBroadcast = async (payload: { bloodGroup: string; message: string; region?: string }, adminId: string) => {
    const alert = {
        bloodGroup: payload.bloodGroup,
        message: payload.message,
        region: payload.region,
        createdBy: adminId,
    };

    await LiveNotificationService.broadcastEmergencyAlert(alert);
    await Notification.create({
        recipientId: new mongoose.Types.ObjectId(adminId),
        title: 'Emergency broadcast sent',
        message: payload.message,
        type: 'system',
    });
    await recordAudit('alert:emergency', 'Notification', adminId, undefined, alert);
    return alert;
};

export const getReports = async () => {
    const hospitalActivity = await BloodRequest.aggregate([
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

    const requestFulfillment = await BloodRequest.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
    ]);

    const donationHistory = await DonationHistory.aggregate([
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

export const getActionableRequests = async () => {
    return BloodRequest.find({ status: { $in: ['pending', 'accepted'] } }).populate('requesterid', 'name email contactNumber role accountStatus').sort({ createdAt: -1 }).lean();
};

export const approveUserVerification = async (userId: string, adminId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.verification) {
        user.verification = {
            documents: [],
            status: 'approved',
            aiSuggestedVerified: false,
            aiConfidence: 0,
            aiDetails: null,
            aiAutoApproved: false,
            reviewedBy: adminId as any,
            reviewedAt: new Date(),
        } as any;
    } else {
        user.verification.status = 'approved';
        user.verification.reviewedBy = adminId as any;
        user.verification.reviewedAt = new Date();
    }
    user.isVerified = true;
    await user.save();
    await recordAudit('verification:approve', 'User', adminId, user._id, { email: user.email, role: user.role });
    return user;
};

export const rejectUserVerification = async (userId: string, reason: string, adminId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.verification) {
        user.verification = {
            documents: [],
            status: 'rejected',
            aiSuggestedVerified: false,
            aiConfidence: 0,
            aiDetails: null,
            aiAutoApproved: false,
            rejectionReason: reason,
            reviewedBy: adminId as any,
            reviewedAt: new Date(),
        } as any;
    } else {
        user.verification.status = 'rejected';
        user.verification.rejectionReason = reason;
        user.verification.reviewedBy = adminId as any;
        user.verification.reviewedAt = new Date();
    }
    user.isVerified = false;
    await user.save();
    await recordAudit('verification:reject', 'User', adminId, user._id, { email: user.email, role: user.role, reason });
    return user;
};

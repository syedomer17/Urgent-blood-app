import { User } from '../users/user.model';
import { BloodRequest } from '../requests/request.model';
import { DonationHistory } from '../donations/donation.model';

export const getDashboardStats = async () => {
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const activeRequests = await BloodRequest.countDocuments({ status: { $in: ['pending', 'accepted'] } });
    const completedDonations = await DonationHistory.countDocuments({ status: 'completed' });

    const bloodGroupDistribution = await User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    // Average response time: Time between request creation and donation/acceptance?
    // We can track time from Request Created -> DonationHistory Created.
    // Using DonationHistory which has requestId.
    // We need to Join with requests.

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
        activeRequests,
        completedDonations,
        bloodGroupDistribution,
        averageResponseTimeMinutes: avgResponseTime.length > 0 ? (avgResponseTime[0].avgTime / 60000).toFixed(2) : 0,
    };
};

export const getPendingVerifications = async () => {
    const users = await User.find({ 'verification.status': 'pending' }).select('name email role contactNumber verification isVerified createdAt');
    return users;
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
    return user;
};

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

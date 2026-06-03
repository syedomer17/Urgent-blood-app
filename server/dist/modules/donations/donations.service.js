"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.getDonationHistory = exports.acceptRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const request_model_1 = require("../requests/request.model");
const user_model_1 = require("../users/user.model");
const donation_model_1 = require("./donation.model");
const notification_model_1 = require("../notifications/notification.model");
const socketManager_1 = require("../../sockets/socketManager");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const emailService_1 = require("../../utils/emailService");
const acceptRequest = async (donorId, requestId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const request = await request_model_1.BloodRequest.findById(requestId).session(session);
        if (!request) {
            throw new appError_1.AppError('Blood request not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        if (request.status !== 'pending') {
            throw new appError_1.AppError('This request is no longer active', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Check if donor is eligible (extra check)
        const donor = await user_model_1.User.findById(donorId).session(session);
        if (!donor) {
            throw new appError_1.AppError('Donor not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        // Blood compatibility check — which donor groups can donate TO this recipient group
        const COMPATIBLE_DONORS = {
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'A-': ['A-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            'AB-': ['A-', 'B-', 'AB-', 'O-'],
            'O+': ['O+', 'O-'],
            'O-': ['O-'],
        };
        const compatibleDonorGroups = COMPATIBLE_DONORS[request.bloodGroup] || [];
        if (donor.bloodGroup && !compatibleDonorGroups.includes(donor.bloodGroup)) {
            throw new appError_1.AppError(`Blood group ${donor.bloodGroup} is not compatible with the requested ${request.bloodGroup}`, http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Update request status
        request.status = 'accepted';
        await request.save({ session });
        // Create donation history
        // Note: 'completed' status usually after donation. Here "Accept" means "I will donate".
        // But the requirement says "Request Acceptance: Update request status, Create donation history, Update donor lastDonationDate"
        // This implies immediate record of commitment or completion.
        // Usually there is a flow: Accept -> Show up -> Donate -> Complete.
        // Assuming "Accept" means the deal is sealed for this system's scope.
        // However, updating `lastDonationDate` immediately prevents them from donating again immediately.
        // This is good for "blocking" them until 90 days if we assume they WILL donate.
        await donation_model_1.DonationHistory.create([{
                donorId,
                requestId,
                unitsDonated: request.unitsRequired, // Assuming full fulfillment
                status: 'completed' // Or 'pending' if we had that state
            }], { session });
        // Update donor
        donor.lastDonationDate = new Date();
        await donor.save({ session });
        await session.commitTransaction();
        // Notify Requester (outside transaction usually safer for side effects like sockets, but inside for consistency? 
        // Sockets are fire-and-forget usually, so outside is fine. DB notifications should be inside?
        // Mongoose transactions don't support unrelated models if not in session? 
        // Notification model is related, let's put it in session if we want atomicity.
        // But for now, let's do it after commit to ensure data is visible.)
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
    // Reload request to get populated data or just use IDs
    const request = await request_model_1.BloodRequest.findById(requestId).populate('requesterid');
    if (request) {
        // Notify Requester
        await notification_model_1.Notification.create({
            recipientId: request.requesterid,
            title: 'Donor Found!',
            message: `Your blood request has been accepted.`,
            type: 'request_accepted',
            relatedEntityId: request._id
        });
        socketManager_1.socketManager.emitToUser(request.requesterid._id.toString(), 'request_accepted', { requestId: request._id });
        // Send email notification to requester
        const requesterObj = request.requesterid;
        const donor = await user_model_1.User.findById(donorId);
        if (requesterObj?.email && donor) {
            (0, emailService_1.emailDonorAccepted)(requesterObj.email, requesterObj.name ?? 'Requester', donor.name, donor.bloodGroup ?? 'Unknown', donor.contactNumber ?? '', request.patientName, request.bloodGroup).catch(() => { }); // fire-and-forget
        }
    }
    return { success: true };
};
exports.acceptRequest = acceptRequest;
const getDonationHistory = async (donorId) => {
    return donation_model_1.DonationHistory.find({ donorId, status: 'completed' })
        .populate('requestId')
        .sort({ donationDate: -1 })
        .lean();
};
exports.getDonationHistory = getDonationHistory;
const getLeaderboard = async (limit = 10) => {
    const leaderboard = await donation_model_1.DonationHistory.aggregate([
        {
            $match: {
                status: 'completed',
            },
        },
        {
            $group: {
                _id: '$donorId',
                totalUnits: { $sum: '$unitsDonated' },
                completedDonations: { $sum: 1 },
                lastDonationDate: { $max: '$donationDate' },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'donor',
            },
        },
        {
            $unwind: '$donor',
        },
        {
            $match: {
                'donor.role': 'donor',
            },
        },
        {
            $sort: {
                totalUnits: -1,
                completedDonations: -1,
                'donor.trustRating': -1,
            },
        },
        {
            $limit: limit,
        },
        {
            $project: {
                donorId: '$_id',
                name: '$donor.name',
                bloodGroup: '$donor.bloodGroup',
                availability: '$donor.availability',
                trustRating: '$donor.trustRating',
                totalDonations: '$donor.totalDonations',
                achievements: '$donor.achievements',
                totalUnits: 1,
                completedDonations: 1,
                lastDonationDate: 1,
            },
        },
    ]);
    return leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        badge: getLeaderboardBadge(index + 1),
    }));
};
exports.getLeaderboard = getLeaderboard;
function getLeaderboardBadge(rank) {
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

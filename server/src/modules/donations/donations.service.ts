import mongoose from 'mongoose';
import { BloodRequest } from '../requests/request.model';
import { User } from '../users/user.model';
import { DonationHistory } from './donation.model';
import { Notification } from '../notifications/notification.model';
import { socketManager } from '../../sockets/socketManager';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';
import { emailDonorAccepted } from '../../utils/emailService';

export const acceptRequest = async (donorId: string, requestId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const request = await BloodRequest.findById(requestId).session(session);
        if (!request) {
            throw new AppError('Blood request not found', StatusCodes.NOT_FOUND);
        }

        if (request.status !== 'pending') {
            throw new AppError('This request is no longer active', StatusCodes.BAD_REQUEST);
        }

        // Check if donor is eligible (extra check)
        const donor = await User.findById(donorId).session(session);
        if (!donor) {
            throw new AppError('Donor not found', StatusCodes.NOT_FOUND);
        }

        // Blood compatibility check — which donor groups can donate TO this recipient group
        const COMPATIBLE_DONORS: Record<string, string[]> = {
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
            throw new AppError(
                `Blood group ${donor.bloodGroup} is not compatible with the requested ${request.bloodGroup}`,
                StatusCodes.BAD_REQUEST
            );
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

        await DonationHistory.create([{
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

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }

    // Reload request to get populated data or just use IDs
    const request = await BloodRequest.findById(requestId).populate('requesterid');

    if (request) {
        // Notify Requester
        await Notification.create({
            recipientId: request.requesterid,
            title: 'Donor Found!',
            message: `Your blood request has been accepted.`,
            type: 'request_accepted',
            relatedEntityId: request._id
        });

        socketManager.emitToUser(
            (request.requesterid as any)._id.toString(),
            'request_accepted',
            { requestId: request._id }
        );

        // Send email notification to requester
        const requesterObj = request.requesterid as any;
        const donor = await User.findById(donorId);
        if (requesterObj?.email && donor) {
            emailDonorAccepted(
                requesterObj.email,
                requesterObj.name ?? 'Requester',
                donor.name,
                donor.bloodGroup ?? 'Unknown',
                donor.contactNumber ?? '',
                request.patientName,
                request.bloodGroup,
            ).catch(() => {}); // fire-and-forget
        }
    }

    return { success: true };
};

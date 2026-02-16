import { BloodRequest, IBloodRequest } from './request.model';
import { User } from '../users/user.model';
import { Notification } from '../notifications/notification.model';
import { socketManager } from '../../sockets/socketManager';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';
import { haversineDistance } from '../../utils/haversine'; // Need to insure this exists

const findDonors = async (bloodGroup: string, coordinates: number[], maxDistanceKm: number) => {
    // Simple matchmaking: compatible blood groups
    // For now, exact match or compatible? 
    // Requirement says: "Auto-match donors using $near"
    // Usually exact match or compatible. Let's stick to exact match for simplicity unless specified.
    // Actually, standard is compatible. But let's assume exact match requested ("Emergency Blood Matching" often implies specific need).
    // "Blood Group Compatibility" would be better.
    // A+ can receive from A+, A-, O+, O-
    // But donors are usually filtered by what they ARE.
    // If request is A+, we need A+ or O+ donors? No, we need A+ or O+ blood. 
    // Wait, if I am A+, I can give to A+ and AB+.
    // If request is A+, we need donors who can GIVE to A+. i.e. A+, A-, O+, O-.

    // Let's implement function to get compatible donor groups
    const compatibleDonorGroups = getCompatibleDonorGroups(bloodGroup);

    const donors = await User.find({
        role: 'donor',
        bloodGroup: { $in: compatibleDonorGroups },
        availability: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates,
                },
                $maxDistance: maxDistanceKm * 1000, // meters
            },
        },
        // Exclude those who donated recently (< 90 days)
        $or: [
            { lastDonationDate: { $exists: false } },
            { lastDonationDate: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        ]
    });

    return donors;
};

const getCompatibleDonorGroups = (targetGroup: string): string[] => {
    switch (targetGroup) {
        case 'A+': return ['A+', 'A-', 'O+', 'O-'];
        case 'A-': return ['A-', 'O-'];
        case 'B+': return ['B+', 'B-', 'O+', 'O-'];
        case 'B-': return ['B-', 'O-'];
        case 'AB+': return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']; // Universal receiver
        case 'AB-': return ['A-', 'B-', 'AB-', 'O-'];
        case 'O+': return ['O+', 'O-'];
        case 'O-': return ['O-']; // Universal donor
        default: return [];
    }
};

export const createRequest = async (requesterId: string, requestData: any) => {
    let { latitude, longitude, address } = requestData.location;

    // If coordinates missing but address exists, try geocoding
    if ((latitude === undefined || longitude === undefined) && address) {
        try {
            const loc = await import('../../utils/geocoder').then(m => m.default.geocode(address));
            if (loc && loc.length > 0) {
                latitude = loc[0].latitude;
                longitude = loc[0].longitude;
            } else {
                // If address provided but geocoding fails, maybe we should throw or just save address?
                // Requirement: "Auto-convert address to coords". If fail, maybe just save address?
                // But we need coords for matchmaking ($near).
                throw new AppError('Could not determine location from address', StatusCodes.BAD_REQUEST);
            }
        } catch (err) {
            throw new AppError('Geocoding service unavailable', StatusCodes.SERVICE_UNAVAILABLE);
        }
    }

    const location: any = {
        type: 'Point',
        // Default to [0,0] or null if no coords? $near requires valid coords.
        // Schema says coordinates required.
        coordinates: [longitude, latitude],
        address,
    };

    // Ensure we have valid coordinates
    if (latitude === undefined || longitude === undefined) {
        throw new AppError('Location coordinates are required', StatusCodes.BAD_REQUEST);
    }

    const newRequest = await BloodRequest.create({
        ...requestData,
        requesterid: requesterId,
        location,
        searchRadius: 5, // Start with 5km
    });

    // Trigger matching
    await matchAndNotifyDonors(newRequest);

    return newRequest;
};

export const matchAndNotifyDonors = async (request: IBloodRequest) => {
    const donors = await findDonors(request.bloodGroup, request.location.coordinates, request.searchRadius);

    // Send notifications
    for (const donor of donors) {
        // Create in-app notification
        await Notification.create({
            recipientId: donor._id,
            title: 'Urgent Blood Request!',
            message: `Blood needed for ${request.patientName} (${request.bloodGroup}) near you.`,
            type: 'blood_request',
            relatedEntityId: request._id,
        });

        // Emit socket event
        socketManager.emitToUser(donor._id.toString(), 'blood_request', {
            requestId: request._id,
            patientName: request.patientName,
            bloodGroup: request.bloodGroup,
            unitsRequired: request.unitsRequired,
            distance: 'calculated via haversine or taken from $near result if projected', // Simplify for now
        });
    }

    // If no donors found or not enough accepted, we need to escalate.
    // This should be a scheduled job basically. 
    // For this "demo/implementation", we can use setTimeout or just mention it.
    // Constraint: "Design it cleanly (service-based escalation function) Do NOT block event loop"

    if (donors.length === 0) {
        // Trigger escalation immediately or schedule it
        // In production, use BullMQ / Agenda. 
        // Here, let's just log it or simulate a delayed check if this was a long running process.
    }
};

export const escalateRequest = async (requestId: string) => {
    const request = await BloodRequest.findById(requestId);
    if (!request || request.status !== 'pending') return;

    // Increase radius
    request.searchRadius += 5; // Increase by 5km
    if (request.searchRadius > 50) return; // Cap at 50km

    await request.save();

    // Re-run matching
    await matchAndNotifyDonors(request);
};

export const escalateAllPendingRequests = async () => {
    // Find requests that are pending and haven't been updated in last X minutes (e.g., 15 mins)
    // For demo, we check all pending.
    const pendingRequests = await BloodRequest.find({
        status: 'pending',
        searchRadius: { $lt: 50 },
        updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) } // Older than 15 mins
    });

    for (const request of pendingRequests) {
        await escalateRequest(request._id.toString());
    }
};

export const getRequestById = async (id: string) => {
    return await BloodRequest.findById(id).populate('requesterid', 'name email contactNumber');
};

export const getMyRequests = async (requesterId: string) => {
    return await BloodRequest.find({ requesterid: requesterId }).sort({ createdAt: -1 });
};

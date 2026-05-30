import { User } from './user.model';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';

export const getProfile = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
};

export const updateProfile = async (userId: string, updateBody: any) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    if (updateBody.location) {
        try {
            const processedLocation = await import('../../utils/locationHelper').then(m => m.processLocation(updateBody.location));
            if (processedLocation) {
                user.location = processedLocation;
            }
        } catch (error) {
            // Log error but proceed with other updates? Or throw?
            // Existing logic was silent on failure or just set coordinates.
            // Let's keep it safe.
        }
        delete updateBody.location;
    }

    Object.assign(user, updateBody);
    await user.save();
    return user;
};

export const getAllUsers = async () => {
    return await User.find()
        .select('-password -refreshToken')
        .sort({ trustRating: -1 });
};

export const getDonors = async () => {
    return await User.find({
        role: 'donor',
        'location.coordinates': { $exists: true, $ne: [] },
    }).select('name bloodGroup availability trustRating totalDonations location contactNumber').lean();
};


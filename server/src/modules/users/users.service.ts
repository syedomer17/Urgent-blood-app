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
        user.location = {
            type: 'Point',
            coordinates: [updateBody.location.longitude, updateBody.location.latitude],
        };
        delete updateBody.location;
    }

    Object.assign(user, updateBody);
    await user.save();
    return user;
};

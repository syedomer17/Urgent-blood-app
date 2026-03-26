import { User } from '../users/user.model';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';

/** All donors that have a valid GeoJSON location. */
export const getDonorsWithLocation = async () => {
    return User.find({
        role: 'donor',
        'location.type': 'Point',
        'location.coordinates': { $exists: true, $not: { $size: 0 } },
    }).select('name bloodGroup availability trustRating totalDonations location contactNumber');
};

/**
 * Returns donors within `radiusMetres` of the given coordinates using
 * MongoDB's $nearSphere / 2dsphere index.
 */
export const getDonorsNear = async (
    lat: number,
    lng: number,
    radiusMetres: number
) => {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new AppError('Invalid latitude — must be between -90 and 90.', StatusCodes.BAD_REQUEST);
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new AppError('Invalid longitude — must be between -180 and 180.', StatusCodes.BAD_REQUEST);
    }
    if (!Number.isFinite(radiusMetres) || radiusMetres <= 0 || radiusMetres > 500_000) {
        throw new AppError('Radius must be a positive number up to 500 000 metres (500 km).', StatusCodes.BAD_REQUEST);
    }

    return User.find({
        role: 'donor',
        location: {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: radiusMetres,
            },
        },
    }).select('name bloodGroup availability trustRating totalDonations location contactNumber');
};

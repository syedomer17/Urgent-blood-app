"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDonorsNear = exports.getDonorsWithLocation = void 0;
const user_model_1 = require("../users/user.model");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
/** All donors that have a valid GeoJSON location. */
const getDonorsWithLocation = async () => {
    return user_model_1.User.find({
        role: 'donor',
        'location.type': 'Point',
        'location.coordinates': { $exists: true, $not: { $size: 0 } },
    }).select('name bloodGroup availability trustRating totalDonations location contactNumber').lean();
};
exports.getDonorsWithLocation = getDonorsWithLocation;
/**
 * Returns donors within `radiusMetres` of the given coordinates using
 * MongoDB's $geoNear aggregation stage (requires 2dsphere index on location).
 */
const getDonorsNear = async (lat, lng, radiusMetres) => {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new appError_1.AppError('Invalid latitude — must be between -90 and 90.', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new appError_1.AppError('Invalid longitude — must be between -180 and 180.', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (!Number.isFinite(radiusMetres) || radiusMetres <= 0 || radiusMetres > 500000) {
        throw new appError_1.AppError('Radius must be a positive number up to 500 000 metres (500 km).', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    const results = await user_model_1.User.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [lng, lat] },
                distanceField: 'distanceMetres',
                maxDistance: radiusMetres,
                spherical: true,
                key: 'location',
                query: { role: 'donor' },
            },
        },
        {
            $project: {
                name: 1,
                bloodGroup: 1,
                availability: 1,
                trustRating: 1,
                totalDonations: 1,
                location: 1,
                contactNumber: 1,
                distanceMetres: 1,
            },
        },
    ]);
    return results;
};
exports.getDonorsNear = getDonorsNear;

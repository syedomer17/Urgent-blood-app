"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDonors = exports.getAllUsers = exports.updateProfile = exports.getProfile = void 0;
const user_model_1 = require("./user.model");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const getProfile = async (userId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return user;
};
exports.getProfile = getProfile;
const updateProfile = async (userId, updateBody) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    if (updateBody.location) {
        try {
            const processedLocation = await Promise.resolve().then(() => __importStar(require('../../utils/locationHelper'))).then(m => m.processLocation(updateBody.location));
            if (processedLocation) {
                user.location = processedLocation;
            }
        }
        catch (error) {
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
exports.updateProfile = updateProfile;
const getAllUsers = async () => {
    return await user_model_1.User.find()
        .select('-password -refreshToken')
        .sort({ trustRating: -1 });
};
exports.getAllUsers = getAllUsers;
const getDonors = async () => {
    return await user_model_1.User.find({
        role: 'donor',
        'location.coordinates': { $exists: true, $ne: [] },
    }).select('name bloodGroup availability trustRating totalDonations lastDonationDate location contactNumber').lean();
};
exports.getDonors = getDonors;

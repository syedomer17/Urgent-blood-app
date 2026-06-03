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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHospital = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../users/user.model");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const env_1 = require("../../config/env");
const hospitalVerification_1 = require("../../utils/hospitalVerification");
const generateTokens = (userId, role) => {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId, role }, env_1.config.jwt.secret, {
        expiresIn: env_1.config.jwt.accessExpiration,
    });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, env_1.config.jwt.secret, {
        expiresIn: env_1.config.jwt.refreshExpiration,
    });
    return { accessToken, refreshToken };
};
const register = async (userData) => {
    // console.log('Register User Data:', JSON.stringify(userData, null, 2)); // Debugging
    if (await user_model_1.User.findOne({ email: userData.email })) {
        throw new appError_1.AppError('Email already taken', http_status_codes_1.StatusCodes.CONFLICT);
    }
    const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
    const userObj = {
        ...userData,
        password: hashedPassword,
    };
    if (userData.location) {
        try {
            const processedLocation = await Promise.resolve().then(() => __importStar(require('../../utils/locationHelper'))).then(m => m.processLocation(userData.location));
            if (processedLocation) {
                userObj.location = processedLocation;
            }
        }
        catch (error) {
            // handle error
        }
    }
    const user = await user_model_1.User.create(userObj);
    const tokens = generateTokens(user._id.toString(), user.role);
    const hashedRefreshToken = await bcrypt_1.default.hash(tokens.refreshToken, 10);
    user.refreshTokens = [hashedRefreshToken];
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.activationCode;
    return { user: userResponse, ...tokens };
};
exports.register = register;
const login = async (loginData) => {
    const user = await user_model_1.User.findOne({ email: loginData.email }).select('+password +refreshTokens');
    if (!user || !(await bcrypt_1.default.compare(loginData.password, user.password))) {
        throw new appError_1.AppError('Incorrect email or password', http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    if (user.accountStatus === 'blocked' || user.accountStatus === 'suspended') {
        throw new appError_1.AppError('Your account is temporarily unavailable. Please contact an administrator.', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    const tokens = generateTokens(user._id.toString(), user.role);
    // Rotate: replace old tokens? Or add new?
    // "Access + Refresh Token Rotation" usually means new pair on refresh.
    // On Login, we usually clear old or just add new. Let's add new.
    // Limit to 5 sessions ? For now just push.
    const hashedRefreshToken = await bcrypt_1.default.hash(tokens.refreshToken, 10);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    delete userWithoutPassword.refreshTokens;
    return { user: userWithoutPassword, ...tokens };
};
exports.login = login;
const refreshToken = async (incomingRefreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(incomingRefreshToken, env_1.config.jwt.secret);
        if (decoded.type !== 'refresh')
            throw new Error();
        const user = await user_model_1.User.findById(decoded.sub).select('+refreshTokens');
        if (!user)
            throw new appError_1.AppError('User not found', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        if (user.accountStatus === 'blocked' || user.accountStatus === 'suspended') {
            throw new appError_1.AppError('Your account is temporarily unavailable. Please contact an administrator.', http_status_codes_1.StatusCodes.FORBIDDEN);
        }
        // Verify if token exists in DB (we stored hashed)
        // We have to iterate and compare because we stored hashes.
        let isValidToken = false;
        let tokenIndex = -1;
        for (let i = 0; i < user.refreshTokens.length; i++) {
            const isMatch = await bcrypt_1.default.compare(incomingRefreshToken, user.refreshTokens[i]);
            if (isMatch) {
                isValidToken = true;
                tokenIndex = i;
                break;
            }
        }
        if (!isValidToken) {
            // Reuse detection? If valid signature but not in DB, it might be reused/stolen.
            // For now, just reject.
            throw new appError_1.AppError('Invalid refresh token', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        // Reuse detection logic: detailed implementations might clear all tokens here if reuse detected.
        // Rotate
        const newTokens = generateTokens(user._id.toString(), user.role);
        const newHashedRefreshToken = await bcrypt_1.default.hash(newTokens.refreshToken, 10);
        // Replace the used token with the new one
        user.refreshTokens[tokenIndex] = newHashedRefreshToken;
        await user.save();
        return newTokens;
    }
    catch (error) {
        throw new appError_1.AppError('Invalid refresh token', http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
};
exports.refreshToken = refreshToken;
const logout = async (userId, incomingRefreshToken) => {
    const user = await user_model_1.User.findById(userId).select('+refreshTokens');
    if (!user)
        return;
    // Remove the token
    // Since hashed, we filter out the one that matches
    const newTokens = [];
    for (const tokenHash of user.refreshTokens) {
        if (!(await bcrypt_1.default.compare(incomingRefreshToken, tokenHash))) {
            newTokens.push(tokenHash);
        }
    }
    user.refreshTokens = newTokens;
    await user.save();
};
exports.logout = logout;
const registerHospital = async (userData, file) => {
    if (await user_model_1.User.findOne({ email: userData.email })) {
        throw new appError_1.AppError('Email already taken', http_status_codes_1.StatusCodes.CONFLICT);
    }
    const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
    const userObj = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'hospital',
        contactNumber: userData.contactNumber || '',
        hospitalDetails: {
            hospitalName: userData.hospitalName,
            registrationNumber: userData.registrationNumber,
            licenseNumber: userData.licenseNumber,
            gstNumber: userData.gstNumber || '',
            hospitalAddress: userData.hospitalAddress,
            hospitalEmail: userData.hospitalEmail,
            hospitalPhone: userData.hospitalPhone,
        },
        verification: {
            status: 'pending',
            documents: [],
        },
        isVerified: false,
    };
    let verificationResult = null;
    if (file) {
        userObj.verification.documents.push({
            filename: file.filename,
            path: file.path,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
        });
        // Fetch buffer from Cloudinary for AI verification
        const response = await fetch(file.path);
        const fileBuffer = Buffer.from(await response.arrayBuffer());
        verificationResult = await (0, hospitalVerification_1.verifyHospitalDocument)(fileBuffer, file.mimetype);
        userObj.verification.aiSuggestedVerified = verificationResult.verificationStatus === 'verified';
        userObj.verification.aiConfidence = verificationResult.confidenceScore;
        userObj.verification.aiDetails = JSON.stringify(verificationResult);
        const threshold = Number(env_1.config.ai.autoApproveConfidence || 0.8);
        if (verificationResult.confidenceScore >= (threshold * 100) && verificationResult.verificationStatus === 'verified') {
            userObj.verification.status = 'approved';
            userObj.isVerified = true;
        }
    }
    if (userData.location) {
        try {
            const processedLocation = await Promise.resolve().then(() => __importStar(require('../../utils/locationHelper'))).then(m => m.processLocation(userData.location));
            if (processedLocation) {
                userObj.location = processedLocation;
            }
        }
        catch (error) {
            // handle error
        }
    }
    const user = await user_model_1.User.create(userObj);
    const tokens = generateTokens(user._id.toString(), user.role);
    const hashedRefreshToken = await bcrypt_1.default.hash(tokens.refreshToken, 10);
    user.refreshTokens = [hashedRefreshToken];
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    return { user: userResponse, ...tokens, verificationResult };
};
exports.registerHospital = registerHospital;

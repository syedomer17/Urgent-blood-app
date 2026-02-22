import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../config/env';

const generateTokens = (userId: string, role: string) => {
    const accessToken = jwt.sign({ sub: userId, role }, config.jwt.secret, {
        expiresIn: config.jwt.accessExpiration,
    });

    const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiration,
    });

    return { accessToken, refreshToken };
};

export const register = async (userData: any) => {
    // console.log('Register User Data:', JSON.stringify(userData, null, 2)); // Debugging

    if (await User.findOne({ email: userData.email })) {
        throw new AppError('Email already taken', StatusCodes.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const userObj: any = {
        ...userData,
        password: hashedPassword,
    };

    if (userData.location) {
        try {
            const processedLocation = await import('../../utils/locationHelper').then(m => m.processLocation(userData.location));
            if (processedLocation) {
                userObj.location = processedLocation;
            }
        } catch (error) {
            // handle error
        }
    }

    const user = await User.create(userObj);
    const tokens = generateTokens(user._id.toString(), user.role);

    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokens = [hashedRefreshToken];
    await user.save();

    const userResponse = user.toObject();
    delete (userResponse as any).password;
    delete (userResponse as any).refreshTokens;
    delete (userResponse as any).activationCode;

    return { user: userResponse, ...tokens };
};

export const login = async (loginData: any) => {
    const user = await User.findOne({ email: loginData.email }).select('+password +refreshTokens');
    if (!user || !(await bcrypt.compare(loginData.password, user.password as string))) {
        throw new AppError('Incorrect email or password', StatusCodes.UNAUTHORIZED);
    }

    const tokens = generateTokens(user._id.toString(), user.role);

    // Rotate: replace old tokens? Or add new?
    // "Access + Refresh Token Rotation" usually means new pair on refresh.
    // On Login, we usually clear old or just add new. Let's add new.
    // Limit to 5 sessions ? For now just push.
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    user.refreshTokens.push(hashedRefreshToken);
    await user.save();

    const userWithoutPassword = user.toObject();
    delete (userWithoutPassword as any).password;
    delete (userWithoutPassword as any).refreshTokens;

    return { user: userWithoutPassword, ...tokens };
};

export const refreshToken = async (incomingRefreshToken: string) => {
    try {
        const decoded = jwt.verify(incomingRefreshToken, config.jwt.secret) as any;
        if (decoded.type !== 'refresh') throw new Error();

        const user = await User.findById(decoded.sub).select('+refreshTokens');
        if (!user) throw new AppError('User not found', StatusCodes.UNAUTHORIZED);

        // Verify if token exists in DB (we stored hashed)
        // We have to iterate and compare because we stored hashes.
        let isValidToken = false;
        let tokenIndex = -1;

        for (let i = 0; i < user.refreshTokens.length; i++) {
            const isMatch = await bcrypt.compare(incomingRefreshToken, user.refreshTokens[i]);
            if (isMatch) {
                isValidToken = true;
                tokenIndex = i;
                break;
            }
        }

        if (!isValidToken) {
            // Reuse detection? If valid signature but not in DB, it might be reused/stolen.
            // For now, just reject.
            throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
        }

        // Reuse detection logic: detailed implementations might clear all tokens here if reuse detected.

        // Rotate
        const newTokens = generateTokens(user._id.toString(), user.role);
        const newHashedRefreshToken = await bcrypt.hash(newTokens.refreshToken, 10);

        // Replace the used token with the new one
        user.refreshTokens[tokenIndex] = newHashedRefreshToken;
        await user.save();

        return newTokens;

    } catch (error) {
        throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }
};

export const logout = async (userId: string, incomingRefreshToken: string) => {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    // Remove the token
    // Since hashed, we filter out the one that matches
    const newTokens = [];
    for (const tokenHash of user.refreshTokens) {
        if (!(await bcrypt.compare(incomingRefreshToken, tokenHash))) {
            newTokens.push(tokenHash);
        }
    }

    user.refreshTokens = newTokens;
    await user.save();
};

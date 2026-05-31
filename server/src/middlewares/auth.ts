import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/appError';
import { User, IUser } from '../modules/users/user.model';
import { config } from '../config/env';
import { catchAsync } from '../utils/catchAsync';

interface JwtPayload {
    sub: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token;
    
    // Check cookies first (primary method)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    
    // Fallback: Check Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', StatusCodes.UNAUTHORIZED));
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

        const currentUser = await User.findById(decoded.sub);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist.', StatusCodes.UNAUTHORIZED));
        }

        if ((currentUser as any).accountStatus === 'blocked' || (currentUser as any).accountStatus === 'suspended') {
            return next(new AppError('Your account is temporarily unavailable. Please contact an administrator.', StatusCodes.FORBIDDEN));
        }

        req.user = currentUser;
        next();
    } catch (error: any) {
        // Distinguish between expired and invalid tokens
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please refresh your token or log in again.', StatusCodes.UNAUTHORIZED));
        }
        return next(new AppError('Invalid token. Please log in again!', StatusCodes.UNAUTHORIZED));
    }
});

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN));
        }
        next();
    };
};

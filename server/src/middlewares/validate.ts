import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

const validate = (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        console.error('Validation Error for', req.originalUrl, ':', errorMessage);
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        return next(new AppError(errorMessage, StatusCodes.BAD_REQUEST));
    }


    next();
};

export default validate;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = require("../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        console.error('Validation Error for', req.originalUrl, ':', errorMessage);
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        return next(new appError_1.AppError(errorMessage, http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    next();
};
exports.default = validate;

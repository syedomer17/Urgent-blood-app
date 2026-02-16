import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('donor', 'requester').default('donor'),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').when('role', { is: 'donor', then: Joi.required(), otherwise: Joi.optional() }),
    contactNumber: Joi.string().optional(),
    location: Joi.object({
        location: Joi.object({
            latitude: Joi.number().min(-90).max(90),
            longitude: Joi.number().min(-180).max(180),
            address: Joi.string(),
        }).optional(),
    }).optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().trim(),
    password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

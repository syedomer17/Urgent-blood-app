import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('donor', 'requester', 'hospital').default('donor'),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').when('role', { is: 'donor', then: Joi.required(), otherwise: Joi.optional().allow('', null) }),
    contactNumber: Joi.string().optional().allow('', null),

    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string().allow('', null),
        state: Joi.string(),
        city: Joi.string(),
        zipCode: Joi.string(),
        areaName: Joi.string(),
    }).optional(),
});

export const registerHospitalSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('hospital').required(),
    contactNumber: Joi.string().optional().allow('', null),
    hospitalName: Joi.string().required().trim(),
    registrationNumber: Joi.string().required().trim(),
    licenseNumber: Joi.string().required().trim(),
    gstNumber: Joi.string().optional().allow('', null).trim(),
    hospitalAddress: Joi.string().required().trim(),
    hospitalEmail: Joi.string().email().required().trim(),
    hospitalPhone: Joi.string().required().trim(),

    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string().allow('', null),
        state: Joi.string(),
        city: Joi.string(),
        zipCode: Joi.string(),
        areaName: Joi.string(),
    }).optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required().trim(),
    password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().optional(),
});

import Joi from 'joi';

export const createRequestSchema = Joi.object({
    patientName: Joi.string().required().trim(),
    hospitalName: Joi.string().required(),
    requiredDate: Joi.date().iso().required(),
    expiresAt: Joi.date().iso().optional(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    unitsRequired: Joi.number().min(1).required(),
    urgency: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string(),
        state: Joi.string(),
        city: Joi.string(),
        zipCode: Joi.string(),
        areaName: Joi.string(),
    }).required(),
    contactNumber: Joi.string().required(),
    notes: Joi.string().optional().allow(''),
       documentVerification: Joi.object({
           isVerified: Joi.boolean().required(),
           confidence: Joi.number().min(0).max(1).optional(),
           hospitalName: Joi.string().allow('', null).optional(),
           documentType: Joi.string().allow('', null).optional(),
           patientName: Joi.string().allow('', null).optional(),
           bloodGroup: Joi.string().allow('', null).optional(),
           details: Joi.string().allow('', null).optional(),
           flags: Joi.array().items(Joi.string()).optional(),
       }).optional(),
});

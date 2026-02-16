import Joi from 'joi';

export const createRequestSchema = Joi.object({
    patientName: Joi.string().required().trim(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    unitsRequired: Joi.number().min(1).required(),
    urgency: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string().optional(),
    }).required(),
    contactNumber: Joi.string().required(),
    notes: Joi.string().optional().allow(''),
});

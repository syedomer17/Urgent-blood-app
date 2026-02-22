import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    availability: Joi.boolean(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string(),
        state: Joi.string(),
        city: Joi.string(),
        zipCode: Joi.string(),
        areaName: Joi.string(),
    }),
}).min(1);

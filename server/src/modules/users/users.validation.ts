import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    availability: Joi.boolean(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
    }),
}).min(1);

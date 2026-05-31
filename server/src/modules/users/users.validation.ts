import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    availability: Joi.boolean(),
    dateOfBirth: Joi.date().iso().allow(null),
    weightKg: Joi.number().min(30).max(250).allow(null),
    medicalConditions: Joi.array().items(Joi.string().trim().min(1)),
    nextReminderAt: Joi.date().iso().allow(null),
    reminderEnabled: Joi.boolean(),
    location: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        address: Joi.string().allow('', null),
        country: Joi.string().required(),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().allow('', null),
        areaName: Joi.string().allow('', null),
    }),
}).min(1);

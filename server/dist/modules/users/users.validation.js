"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string().trim(),
    bloodGroup: joi_1.default.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    availability: joi_1.default.boolean(),
    dateOfBirth: joi_1.default.date().iso().allow(null),
    weightKg: joi_1.default.number().min(30).max(250).allow(null),
    medicalConditions: joi_1.default.array().items(joi_1.default.string().trim().min(1)),
    nextReminderAt: joi_1.default.date().iso().allow(null),
    reminderEnabled: joi_1.default.boolean(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().min(-90).max(90),
        longitude: joi_1.default.number().min(-180).max(180),
        address: joi_1.default.string().allow('', null),
        country: joi_1.default.string().required(),
        state: joi_1.default.string().required(),
        city: joi_1.default.string().required(),
        zipCode: joi_1.default.string().allow('', null),
        areaName: joi_1.default.string().allow('', null),
    }),
}).min(1);

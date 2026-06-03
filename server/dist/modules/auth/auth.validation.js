"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerHospitalSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    email: joi_1.default.string().email().required().trim(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('donor', 'requester', 'hospital').default('donor'),
    bloodGroup: joi_1.default.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').when('role', { is: 'donor', then: joi_1.default.required(), otherwise: joi_1.default.optional().allow('', null) }),
    contactNumber: joi_1.default.string().optional().allow('', null),
    location: joi_1.default.object({
        latitude: joi_1.default.number().min(-90).max(90),
        longitude: joi_1.default.number().min(-180).max(180),
        address: joi_1.default.string().allow('', null),
        state: joi_1.default.string(),
        city: joi_1.default.string(),
        zipCode: joi_1.default.string(),
        areaName: joi_1.default.string(),
    }).optional(),
});
exports.registerHospitalSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    email: joi_1.default.string().email().required().trim(),
    password: joi_1.default.string().min(6).required(),
    role: joi_1.default.string().valid('hospital').required(),
    contactNumber: joi_1.default.string().optional().allow('', null),
    hospitalName: joi_1.default.string().required().trim(),
    registrationNumber: joi_1.default.string().required().trim(),
    licenseNumber: joi_1.default.string().required().trim(),
    gstNumber: joi_1.default.string().optional().allow('', null).trim(),
    hospitalAddress: joi_1.default.string().required().trim(),
    hospitalEmail: joi_1.default.string().email().required().trim(),
    hospitalPhone: joi_1.default.string().required().trim(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().min(-90).max(90),
        longitude: joi_1.default.number().min(-180).max(180),
        address: joi_1.default.string().allow('', null),
        state: joi_1.default.string(),
        city: joi_1.default.string(),
        zipCode: joi_1.default.string(),
        areaName: joi_1.default.string(),
    }).optional(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().trim(),
    password: joi_1.default.string().required(),
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().optional(),
});

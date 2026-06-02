"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createRequestSchema = joi_1.default.object({
    patientName: joi_1.default.string().required().trim(),
    hospitalName: joi_1.default.string().required(),
    requiredDate: joi_1.default.date().iso().required(),
    bloodGroup: joi_1.default.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
    unitsRequired: joi_1.default.number().min(1).required(),
    urgency: joi_1.default.string().valid('low', 'medium', 'high', 'critical').required(),
    location: joi_1.default.object({
        latitude: joi_1.default.number().min(-90).max(90),
        longitude: joi_1.default.number().min(-180).max(180),
        address: joi_1.default.string(),
        state: joi_1.default.string(),
        city: joi_1.default.string(),
        zipCode: joi_1.default.string(),
        areaName: joi_1.default.string(),
    }).required(),
    contactNumber: joi_1.default.string().required(),
    notes: joi_1.default.string().optional().allow(''),
    documentVerification: joi_1.default.object({
        isVerified: joi_1.default.boolean().required(),
        confidence: joi_1.default.number().min(0).max(1).optional(),
        hospitalName: joi_1.default.string().allow('', null).optional(),
        documentType: joi_1.default.string().allow('', null).optional(),
        patientName: joi_1.default.string().allow('', null).optional(),
        bloodGroup: joi_1.default.string().allow('', null).optional(),
        details: joi_1.default.string().allow('', null).optional(),
        flags: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).optional(),
});

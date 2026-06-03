"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bloodRequestSchema = new mongoose_1.Schema({
    requesterid: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientName: {
        type: String,
        required: true,
        trim: true,
    },
    hospitalName: {
        type: String,
        required: true,
        trim: true,
    },
    requiredDate: {
        type: Date,
        required: true,
    },
    expiresAt: {
        type: Date,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true,
    },
    unitsRequired: {
        type: Number,
        required: true,
        min: 1,
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere',
        },
        address: String,
        state: String,
        city: String,
        zipCode: String,
        areaName: String,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    notes: String,
    status: {
        type: String,
        enum: ['pending', 'accepted', 'fulfilled', 'cancelled'],
        default: 'pending',
    },
    searchRadius: {
        type: Number,
        default: 5, // Initial radius in km
    },
    hospitalVerification: {
        fileName: String,
        filePath: String,
        mimeType: String,
        isVerified: { type: Boolean, default: false },
        confidence: { type: Number, default: 0 },
        hospitalName: String,
        documentType: String,
        patientName: String,
        bloodGroup: String,
        details: String,
        flags: [String],
        verifiedAt: Date,
    },
}, {
    timestamps: true,
});
// Indexes
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ status: 1, createdAt: -1 }); // Compound index for fetching latest active requests
exports.BloodRequest = mongoose_1.default.model('BloodRequest', bloodRequestSchema);

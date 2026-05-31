import mongoose, { Schema, Document } from 'mongoose';

export interface IHospitalVerification {
    fileName: string;
    filePath: string;
    mimeType: string;
    isVerified: boolean;
    confidence: number;
    hospitalName?: string;
    documentType?: string;
    patientName?: string;
    bloodGroup?: string;
    details?: string;
    flags?: string[];
    verifiedAt?: Date;
}

export interface IBloodRequest extends Document {
    requesterid: mongoose.Types.ObjectId;
    patientName: string;
    hospitalName: string;
    requiredDate: Date;
    expiresAt?: Date;
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    unitsRequired: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    location: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
        address?: string;
        state?: string;
        city?: string;
        zipCode?: string;
        areaName?: string;
    };
    contactNumber: string;
    notes?: string;
    status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
    searchRadius: number; // in km
    hospitalVerification?: IHospitalVerification;
    createdAt: Date;
    updatedAt: Date;
}

const bloodRequestSchema = new Schema<IBloodRequest>(
    {
        requesterid: {
            type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

// Indexes
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ status: 1, createdAt: -1 }); // Compound index for fetching latest active requests

export const BloodRequest = mongoose.model<IBloodRequest>('BloodRequest', bloodRequestSchema);

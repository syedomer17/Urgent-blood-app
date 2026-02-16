import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodRequest extends Document {
    requesterid: mongoose.Types.ObjectId;
    patientName: string;
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    unitsRequired: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    location: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
        address?: string;
    };
    contactNumber: string;
    notes?: string;
    status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
    searchRadius: number; // in km
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

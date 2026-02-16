import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'donor' | 'requester' | 'admin';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    contactNumber: string;
    location?: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
        address?: string;
    };
    availability: boolean;
    lastDonationDate?: Date;
    refreshTokens: string[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['donor', 'requester', 'admin'],
            default: 'donor',
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        },
        contactNumber: {
            type: String,
            required: false
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
                index: '2dsphere',
            },
            address: String,
        },
        availability: {
            type: Boolean,
            default: true,
        },
        lastDonationDate: {
            type: Date,
        },
        refreshTokens: {
            type: [String],
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ bloodGroup: 1, role: 1 }); // Compound index

export const User = mongoose.model<IUser>('User', userSchema);

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
        state?: string;
        city?: string;
        zipCode?: string;
        areaName?: string;
    };
    availability: boolean;
    lastDonationDate?: Date;
    refreshTokens: string[];
    // New fields for innovative features
    trustRating?: number; // 0-5 stars
    ratingCount?: number;
    reviews?: Array<{
        rating: number;
        review: string;
        requestId: string;
        createdAt: Date;
    }>;
    totalDonations?: number;
    achievements?: string[];
    notificationPreferences?: {
        urgentRequests: boolean;
        nearbyRequests: boolean;
        messages: boolean;
        donations: boolean;
        leaderboard: boolean;
        soundEnabled: boolean;
        vibrationEnabled: boolean;
        quietHours?: {
            start: string;
            end: string;
        };
    };
    avatar?: string;
    isOnline?: boolean;
    lastActivity?: Date;
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
            state: String,
            city: String,
            zipCode: String,
            areaName: String,
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
        trustRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        ratingCount: {
            type: Number,
            default: 0,
        },
        reviews: [
            {
                rating: Number,
                review: String,
                requestId: {
                    type: Schema.Types.ObjectId,
                    ref: 'BloodRequest',
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        totalDonations: {
            type: Number,
            default: 0,
        },
        achievements: [String],
        notificationPreferences: {
            urgentRequests: { type: Boolean, default: true },
            nearbyRequests: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            donations: { type: Boolean, default: true },
            leaderboard: { type: Boolean, default: true },
            soundEnabled: { type: Boolean, default: true },
            vibrationEnabled: { type: Boolean, default: true },
            quietHours: {
                start: String,
                end: String,
            },
        },
        avatar: String,
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastActivity: Date,
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

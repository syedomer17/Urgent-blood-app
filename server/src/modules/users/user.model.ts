import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'donor' | 'requester' | 'admin' | 'hospital';
    accountStatus?: 'active' | 'suspended' | 'blocked';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    contactNumber: string;
    dateOfBirth?: Date;
    weightKg?: number;
    medicalConditions?: string[];
    nextReminderAt?: Date;
    reminderEnabled?: boolean;
    location?: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
        address?: string;
        country?: string;
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
    hospitalDetails?: {
        hospitalName?: string;
        registrationNumber?: string;
        licenseNumber?: string;
        gstNumber?: string;
        hospitalAddress?: string;
        hospitalEmail?: string;
        hospitalPhone?: string;
    };
    isOnline?: boolean;
    lastActivity?: Date;
    // Verification fields for admin review
    verification?: {
        status?: 'pending' | 'approved' | 'rejected';
        documents?: Array<{
            filename?: string;
            path?: string;
            mimeType?: string;
            uploadedAt?: Date;
        }>;
        // AI suggestion metadata
        aiSuggestedVerified?: boolean;
        aiConfidence?: number;
        aiDetails?: string;
        reviewedBy?: string;
        reviewedAt?: Date;
        rejectionReason?: string;
    };
    isVerified?: boolean;
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
            enum: ['donor', 'requester', 'admin', 'hospital'],
            default: 'donor',
        },
        accountStatus: {
            type: String,
            enum: ['active', 'suspended', 'blocked'],
            default: 'active',
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        },
        dateOfBirth: {
            type: Date,
        },
        weightKg: {
            type: Number,
            min: 30,
            max: 250,
        },
        medicalConditions: {
            type: [String],
            default: [],
        },
        nextReminderAt: {
            type: Date,
        },
        reminderEnabled: {
            type: Boolean,
            default: false,
        },
        contactNumber: {
            type: String,
            required: false
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
            address: String,
            country: String,
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
        hospitalDetails: {
            hospitalName: String,
            registrationNumber: String,
            licenseNumber: String,
            gstNumber: String,
            hospitalAddress: String,
            hospitalEmail: String,
            hospitalPhone: String,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        lastActivity: Date,
            // Verification subdocument for admin review
            verification: {
                status: {
                    type: String,
                    enum: ['pending', 'approved', 'rejected'],
                    default: 'pending',
                },
                documents: [
                    {
                        filename: String,
                        path: String,
                        mimeType: String,
                        uploadedAt: Date,
                    },
                ],
                // AI suggestion metadata
                aiSuggestedVerified: {
                    type: Boolean,
                    default: false,
                },
                aiConfidence: {
                    type: Number,
                    default: 0,
                },
                aiDetails: String,
                reviewedBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                reviewedAt: Date,
                rejectionReason: String,
            },
            isVerified: {
                type: Boolean,
                default: false,
            },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', function () {
    const location = this.location as IUser['location'] | undefined;
    if (location && (!Array.isArray(location.coordinates) || location.coordinates.length < 2)) {
        this.set('location', undefined);
    }
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ bloodGroup: 1, role: 1 }); // Compound index
userSchema.index({ location: '2dsphere' }); // Geospatial index for $nearSphere queries

export const User = mongoose.model<IUser>('User', userSchema);

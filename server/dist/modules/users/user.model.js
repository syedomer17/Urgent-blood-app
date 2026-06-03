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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
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
                type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
        rejectionReason: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', function () {
    const location = this.location;
    if (location && (!Array.isArray(location.coordinates) || location.coordinates.length < 2)) {
        this.set('location', undefined);
    }
});
// Indexes
userSchema.index({ role: 1 });
userSchema.index({ bloodGroup: 1 });
userSchema.index({ bloodGroup: 1, role: 1 }); // Compound index
userSchema.index({ location: '2dsphere' }); // Geospatial index for $nearSphere queries
exports.User = mongoose_1.default.model('User', userSchema);

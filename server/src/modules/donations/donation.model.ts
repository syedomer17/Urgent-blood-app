import mongoose, { Schema, Document } from 'mongoose';

export interface IDonationHistory extends Document {
    donorId: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;
    donationDate: Date;
    unitsDonated: number;
    status: 'completed' | 'failed';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const donationHistorySchema = new Schema<IDonationHistory>(
    {
        donorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestId: {
            type: Schema.Types.ObjectId,
            ref: 'BloodRequest',
            required: true,
        },
        donationDate: {
            type: Date,
            default: Date.now,
        },
        unitsDonated: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ['completed', 'failed'],
            default: 'completed',
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
donationHistorySchema.index({ donorId: 1 });
donationHistorySchema.index({ donationDate: -1 });

export const DonationHistory = mongoose.model<IDonationHistory>('DonationHistory', donationHistorySchema);

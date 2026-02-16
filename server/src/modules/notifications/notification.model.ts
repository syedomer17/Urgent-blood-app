import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    recipientId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'blood_request' | 'request_accepted' | 'system';
    relatedEntityId?: mongoose.Types.ObjectId; // e.g., requestId
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['blood_request', 'request_accepted', 'system'],
            required: true,
        },
        relatedEntityId: {
            type: Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
    actorId?: mongoose.Types.ObjectId;
    action: string;
    targetType: string;
    targetId?: mongoose.Types.ObjectId | string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        action: {
            type: String,
            required: true,
        },
        targetType: {
            type: String,
            required: true,
        },
        targetId: {
            type: Schema.Types.Mixed,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1, targetType: 1 });

export const AdminAuditLog = mongoose.model<IAdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
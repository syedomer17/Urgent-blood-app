import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    text: string;
    read: boolean;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        from: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        to:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        text: { type: String, required: true, trim: true, maxlength: 2000 },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for fetching a conversation between two users quickly
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, read: 1 }); // for unread counts

export const Message = mongoose.model<IMessage>('Message', messageSchema);

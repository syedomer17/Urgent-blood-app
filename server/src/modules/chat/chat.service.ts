import mongoose from 'mongoose';
import { Message } from './message.model';
import { User } from '../users/user.model';

/**
 * Save a message to the database.
 */
export const saveMessage = async (fromId: string, toId: string, text: string) => {
    return Message.create({ from: fromId, to: toId, text });
};

/**
 * Fetch all messages between two users, oldest first.
 * Marks messages sent TO `viewerId` as read.
 */
export const getConversation = async (
    userId: string,
    peerId: string,
    limit = 100,
    before?: string // message _id cursor for pagination
) => {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const peerObjId = new mongoose.Types.ObjectId(peerId);

    const query: Record<string, unknown> = {
        $or: [
            { from: userObjId, to: peerObjId },
            { from: peerObjId, to: userObjId },
        ],
    };

    if (before) {
        query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    // Mark all unread messages sent to this user as read
    await Message.updateMany(
        { from: peerObjId, to: userObjId, read: false },
        { $set: { read: true } }
    );

    return messages.reverse(); // return chronological order
};

/**
 * Get all conversations for a user — one entry per unique peer,
 * with the latest message and unread count.
 */
export const getInbox = async (userId: string) => {
    const userObjId = new mongoose.Types.ObjectId(userId);

    const conversations = await Message.aggregate([
        // All messages involving this user
        {
            $match: {
                $or: [{ from: userObjId }, { to: userObjId }],
            },
        },
        // Identify the peer in each message
        {
            $addFields: {
                peer: {
                    $cond: [{ $eq: ['$from', userObjId] }, '$to', '$from'],
                },
                isMine: { $eq: ['$from', userObjId] },
            },
        },
        // Sort newest first before grouping
        { $sort: { createdAt: -1 } },
        // Group by peer — keep the latest message
        {
            $group: {
                _id: '$peer',
                lastMessage: { $first: '$text' },
                lastTime: { $first: '$createdAt' },
                lastMine: { $first: '$isMine' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$to', userObjId] }, { $eq: ['$read', false] }] },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        // Lookup peer's name and blood group
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'peerInfo',
            },
        },
        { $unwind: '$peerInfo' },
        {
            $project: {
                peerId: '$_id',
                peerName: '$peerInfo.name',
                peerBloodGroup: '$peerInfo.bloodGroup',
                peerRole: '$peerInfo.role',
                lastMessage: 1,
                lastTime: 1,
                lastMine: 1,
                unreadCount: 1,
            },
        },
        { $sort: { lastTime: -1 } },
    ]);

    return conversations;
};

/**
 * Total unread count for a user across all conversations.
 */
export const getUnreadCount = async (userId: string) => {
    return Message.countDocuments({
        to: new mongoose.Types.ObjectId(userId),
        read: false,
    });
};

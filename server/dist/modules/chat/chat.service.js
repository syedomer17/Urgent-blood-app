"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.getInbox = exports.getConversation = exports.saveMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_model_1 = require("./message.model");
/**
 * Save a message to the database.
 */
const saveMessage = async (fromId, toId, text) => {
    return message_model_1.Message.create({ from: fromId, to: toId, text });
};
exports.saveMessage = saveMessage;
/**
 * Fetch all messages between two users, oldest first.
 * Marks messages sent TO `viewerId` as read.
 */
const getConversation = async (userId, peerId, limit = 100, before // message _id cursor for pagination
) => {
    const userObjId = new mongoose_1.default.Types.ObjectId(userId);
    const peerObjId = new mongoose_1.default.Types.ObjectId(peerId);
    const query = {
        $or: [
            { from: userObjId, to: peerObjId },
            { from: peerObjId, to: userObjId },
        ],
    };
    if (before) {
        query._id = { $lt: new mongoose_1.default.Types.ObjectId(before) };
    }
    const messages = await message_model_1.Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    // Mark all unread messages sent to this user as read
    await message_model_1.Message.updateMany({ from: peerObjId, to: userObjId, read: false }, { $set: { read: true } });
    return messages.reverse(); // return chronological order
};
exports.getConversation = getConversation;
/**
 * Get all conversations for a user — one entry per unique peer,
 * with the latest message and unread count.
 */
const getInbox = async (userId) => {
    const userObjId = new mongoose_1.default.Types.ObjectId(userId);
    const conversations = await message_model_1.Message.aggregate([
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
exports.getInbox = getInbox;
/**
 * Total unread count for a user across all conversations.
 */
const getUnreadCount = async (userId) => {
    return message_model_1.Message.countDocuments({
        to: new mongoose_1.default.Types.ObjectId(userId),
        read: false,
    });
};
exports.getUnreadCount = getUnreadCount;

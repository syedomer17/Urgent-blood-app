"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getUnreadCount = exports.getMyNotifications = void 0;
const notification_model_1 = require("./notification.model");
const appError_1 = require("../../utils/appError");
const http_status_codes_1 = require("http-status-codes");
const getMyNotifications = async (userId) => {
    return notification_model_1.Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean();
};
exports.getMyNotifications = getMyNotifications;
const getUnreadCount = async (userId) => {
    return notification_model_1.Notification.countDocuments({ recipientId: userId, isRead: false });
};
exports.getUnreadCount = getUnreadCount;
const markAsRead = async (userId, notificationId) => {
    const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipientId: userId }, { $set: { isRead: true } }, { new: true });
    if (!notification) {
        throw new appError_1.AppError('Notification not found', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    return notification;
};
exports.markAsRead = markAsRead;

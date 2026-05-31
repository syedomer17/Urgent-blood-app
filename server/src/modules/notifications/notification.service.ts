import { Notification } from './notification.model';
import { AppError } from '../../utils/appError';
import { StatusCodes } from 'http-status-codes';

export const getMyNotifications = async (userId: string) => {
    return Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(25)
        .lean();
};

export const getUnreadCount = async (userId: string) => {
    return Notification.countDocuments({ recipientId: userId, isRead: false });
};

export const markAsRead = async (userId: string, notificationId: string) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { $set: { isRead: true } },
        { new: true }
    );

    if (!notification) {
        throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
    }

    return notification;
};
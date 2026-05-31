import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as notificationService from './notification.service';

export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const notifications = await notificationService.getMyNotifications(req.user!._id.toString());
    sendResponse(res, StatusCodes.OK, true, 'Notifications retrieved successfully', notifications);
});

export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const unreadCount = await notificationService.getUnreadCount(req.user!._id.toString());
    sendResponse(res, StatusCodes.OK, true, 'Unread count retrieved successfully', { unreadCount });
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await notificationService.markAsRead(req.user!._id.toString(), String(notificationId));
    sendResponse(res, StatusCodes.OK, true, 'Notification marked as read', notification);
});
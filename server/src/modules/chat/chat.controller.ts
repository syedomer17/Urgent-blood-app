import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as chatService from './chat.service';

/** GET /api/v1/chat/inbox — all conversations for the logged-in user */
export const getInbox = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const inbox = await chatService.getInbox(userId);
    sendResponse(res, StatusCodes.OK, true, 'Inbox retrieved', inbox);
});

/** GET /api/v1/chat/:peerId — messages between logged-in user and peer */
export const getConversation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const peerId = String(req.params.peerId);
    const limitParam = typeof req.query.limit === 'string' ? req.query.limit : '100';
    const limit = Math.min(parseInt(limitParam) || 100, 200);
    const before = typeof req.query.before === 'string' ? req.query.before : undefined;

    const messages = await chatService.getConversation(userId, peerId, limit, before);
    sendResponse(res, StatusCodes.OK, true, 'Conversation retrieved', messages);
});

/** GET /api/v1/chat/unread — total unread count */
export const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id.toString();
    const count = await chatService.getUnreadCount(userId);
    sendResponse(res, StatusCodes.OK, true, 'Unread count retrieved', { count });
});

import express from 'express';
import { protect } from '../../middlewares/auth';
import * as notificationController from './notification.controller';

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);

export default router;

import express from 'express';
import { protect } from '../../middlewares/auth';
import * as chatController from './chat.controller';

const router = express.Router();

router.use(protect);

router.get('/inbox', chatController.getInbox);
router.get('/unread', chatController.getUnreadCount);
router.get('/:peerId', chatController.getConversation);

export default router;

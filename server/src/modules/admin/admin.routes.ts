import express from 'express';
import * as adminController from './admin.controller';
import { protect, restrictTo } from '../../middlewares/auth';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin analytics and management
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 */
router.get('/stats', adminController.getDashboardStats);

export default router;

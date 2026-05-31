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
router.get('/verifications', adminController.getPendingVerifications);
router.patch('/verifications/:id/approve', adminController.approveVerification);
router.patch('/verifications/:id/reject', adminController.rejectVerification);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/activate', adminController.activateUser);
router.patch('/users/:id/block', adminController.blockUser);
router.get('/requests', adminController.getRequests);
router.get('/requests/actionable', adminController.getActionableRequests);
router.patch('/requests/:id/approve-emergency', adminController.approveEmergencyRequest);
router.patch('/requests/:id/reject-emergency', adminController.rejectEmergencyRequest);
router.patch('/requests/:id/fulfill', adminController.fulfillRequest);
router.patch('/requests/:id/cancel', adminController.cancelRequest);
router.post('/alerts/emergency', adminController.sendEmergencyAlert);
router.get('/reports', adminController.getReports);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;

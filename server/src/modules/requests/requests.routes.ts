import express from 'express';
import validate from '../../middlewares/validate';
import { createRequestSchema } from './requests.validation';
import * as requestController from './requests.controller';
import { protect, restrictTo } from '../../middlewares/auth';

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Blood request management
 */

/**
 * @swagger
 * /requests:
 *   post:
 *     summary: Create a blood request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientName
 *               - bloodGroup
 *               - unitsRequired
 *               - urgency
 *               - location
 *               - contactNumber
 *             properties:
 *               patientName:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *               unitsRequired:
 *                 type: number
 *               urgency:
 *                 type: string
 *                 enum: [routine, urgent, critical]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               contactNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Blood request created successfully
 *       403:
 *         description: Forbidden (Only requesters or admins)
 */
router.post('/', restrictTo('requester', 'admin'), validate(createRequestSchema), requestController.createRequest);

/**
 * @swagger
 * /requests/my-requests:
 *   get:
 *     summary: Get logged-in user's blood requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
 */
router.get('/my-requests', restrictTo('requester'), requestController.getMyRequests);

/**
 * @swagger
 * /requests/{id}:
 *   get:
 *     summary: Get a specific blood request details
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request retrieved successfully
 *       404:
 *         description: Request not found
 */
router.get('/:id', requestController.getRequest);

export default router;

import express from 'express';
import * as donationController from './donations.controller';
import { protect, restrictTo } from '../../middlewares/auth';
// No validation schema needed for just requestId in body? Or assume param?
// Controller uses req.body.requestId. Let's validate it.
import validate from '../../middlewares/validate';
import Joi from 'joi';

const router = express.Router();

const acceptRequestSchema = Joi.object({
    requestId: Joi.string().required() // Should validation objectid format
});

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Donation management
 */

/**
 * @swagger
 * /donations/accept:
 *   post:
 *     summary: Accept a blood request
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *             properties:
 *               requestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request accepted successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden (Only donors)
 */
router.post('/accept', restrictTo('donor'), validate(acceptRequestSchema), donationController.acceptRequest);
router.get('/history', restrictTo('donor'), donationController.getMyDonationHistory);
router.get('/leaderboard', donationController.getLeaderboard);

export default router;

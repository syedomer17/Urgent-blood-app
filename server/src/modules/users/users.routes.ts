import express from 'express';
import validate from '../../middlewares/validate';
import { updateProfileSchema } from './users.validation';
import * as userController from './users.controller';
import { protect } from '../../middlewares/auth';

const router = express.Router();

router.use(protect); // All routes protected

// GET all users — any authenticated user can view the donor list
router.get('/', userController.getAllUsers);

// GET donors with location — for map view
router.get('/donors', userController.getDonors);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *               availability:
 *                 type: boolean
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);

export default router;

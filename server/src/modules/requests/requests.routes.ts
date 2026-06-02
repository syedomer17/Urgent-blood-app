import express from 'express';
import multer from 'multer';
import validate from '../../middlewares/validate';
import { createRequestSchema } from './requests.validation';
import * as requestController from './requests.controller';
import { protect, restrictTo } from '../../middlewares/auth';
import { storage } from '../../utils/cloudinary';

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.'));
        }
    },
});

const router = express.Router();

router.use(protect);

// GET all blood requests — any authenticated user can view
router.get('/', requestController.getAllRequests);

// GET map data — pending requests with location (for map view)
router.get('/map-data', requestController.getMapData);

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
router.post('/', restrictTo('requester', 'hospital', 'admin'), validate(createRequestSchema), requestController.createRequest);

// POST verify hospital document — upload + AI verification
router.post('/verify-document', restrictTo('requester', 'hospital', 'admin'), upload.single('document'), requestController.verifyDocument);

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
router.get('/my-requests', restrictTo('requester', 'hospital'), requestController.getMyRequests);

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
router.get('/:id/matches', requestController.getMatchingDonors);
router.get('/:id', requestController.getRequest);

export default router;

import express from 'express';
import * as donorsController from './donors.controller';
import { protect } from '../../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Donors
 *   description: Donor map data (OpenStreetMap / Leaflet)
 */

/**
 * @swagger
 * /donors:
 *   get:
 *     summary: Get all donors with location data
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of donors with GeoJSON location
 */
router.get('/', protect, donorsController.getAllDonors);

/**
 * @swagger
 * /donors/near:
 *   get:
 *     summary: Get donors within a radius of given coordinates
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         description: Latitude (-90 to 90)
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         description: Longitude (-180 to 180)
 *       - in: query
 *         name: radius
 *         schema: { type: number, default: 10000 }
 *         description: Search radius in metres (max 500 000)
 *     responses:
 *       200:
 *         description: Array of nearby donors
 *       400:
 *         description: Invalid lat/lng/radius
 *       429:
 *         description: Rate limit exceeded
 */
router.get('/near', protect, donorsController.getNearbyDonors);

// Search donors by city name (geocoded on server)
router.get('/search', protect, donorsController.searchDonorsByCity);

export default router;

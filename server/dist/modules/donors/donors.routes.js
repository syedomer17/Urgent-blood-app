"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const donorsController = __importStar(require("./donors.controller"));
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
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
router.get('/', auth_1.protect, donorsController.getAllDonors);
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
router.get('/near', auth_1.protect, donorsController.getNearbyDonors);
// Search donors by city name (geocoded on server)
router.get('/search', auth_1.protect, donorsController.searchDonorsByCity);
exports.default = router;

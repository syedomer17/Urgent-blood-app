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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const requests_validation_1 = require("./requests.validation");
const requestController = __importStar(require("./requests.controller"));
const auth_1 = require("../../middlewares/auth");
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'hospital-docs');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `hospital-${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.'));
        }
    },
});
const router = express_1.default.Router();
router.use(auth_1.protect);
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
router.post('/', (0, auth_1.restrictTo)('requester', 'hospital', 'admin'), (0, validate_1.default)(requests_validation_1.createRequestSchema), requestController.createRequest);
// POST verify hospital document — upload + AI verification
router.post('/verify-document', (0, auth_1.restrictTo)('requester', 'hospital', 'admin'), upload.single('document'), requestController.verifyDocument);
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
router.get('/my-requests', (0, auth_1.restrictTo)('requester', 'hospital'), requestController.getMyRequests);
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
exports.default = router;

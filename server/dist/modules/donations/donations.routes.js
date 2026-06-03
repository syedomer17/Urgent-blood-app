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
const donationController = __importStar(require("./donations.controller"));
const auth_1 = require("../../middlewares/auth");
// No validation schema needed for just requestId in body? Or assume param?
// Controller uses req.body.requestId. Let's validate it.
const validate_1 = __importDefault(require("../../middlewares/validate"));
const joi_1 = __importDefault(require("joi"));
const router = express_1.default.Router();
const acceptRequestSchema = joi_1.default.object({
    requestId: joi_1.default.string().required() // Should validation objectid format
});
router.use(auth_1.protect);
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
router.post('/accept', (0, auth_1.restrictTo)('donor'), (0, validate_1.default)(acceptRequestSchema), donationController.acceptRequest);
router.get('/history', (0, auth_1.restrictTo)('donor'), donationController.getMyDonationHistory);
router.get('/leaderboard', donationController.getLeaderboard);
exports.default = router;

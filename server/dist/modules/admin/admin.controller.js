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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectVerification = exports.approveVerification = exports.getPendingVerifications = exports.getDashboardStats = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responseHandler_1 = require("../../utils/responseHandler");
const adminService = __importStar(require("./admin.service"));
const http_status_codes_1 = require("http-status-codes");
exports.getDashboardStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Admin stats retrieved successfully', stats);
});
exports.getPendingVerifications = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const users = await adminService.getPendingVerifications();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Pending verifications retrieved', users);
});
exports.approveVerification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const rawAdminId = req.user?._id;
    const adminId = Array.isArray(rawAdminId) ? rawAdminId[0] : String(rawAdminId || '');
    const user = await adminService.approveUserVerification(String(id), adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User verification approved', user);
});
exports.rejectVerification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { reason } = req.body;
    const rawAdminId = req.user?._id;
    const adminId = Array.isArray(rawAdminId) ? rawAdminId[0] : String(rawAdminId || '');
    const user = await adminService.rejectUserVerification(String(id), reason || 'Rejected by admin', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User verification rejected', user);
});

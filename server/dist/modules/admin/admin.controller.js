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
exports.sendEmergencyAlert = exports.cancelRequest = exports.fulfillRequest = exports.rejectEmergencyRequest = exports.approveEmergencyRequest = exports.blockUser = exports.activateUser = exports.suspendUser = exports.rejectVerification = exports.approveVerification = exports.getAuditLogs = exports.getReports = exports.getActionableRequests = exports.getRequests = exports.getUsers = exports.getPendingVerifications = exports.getDashboardStats = void 0;
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
exports.getUsers = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const users = await adminService.getAllUsers();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Users retrieved successfully', users);
});
exports.getRequests = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const requests = await adminService.getAllRequests();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Requests retrieved successfully', requests);
});
exports.getActionableRequests = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const requests = await adminService.getActionableRequests();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Actionable requests retrieved successfully', requests);
});
exports.getReports = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const reports = await adminService.getReports();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Reports retrieved successfully', reports);
});
exports.getAuditLogs = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const logs = await adminService.getAuditLogs();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Audit logs retrieved successfully', logs);
});
const getAdminId = (req) => {
    const rawAdminId = req.user?._id;
    return Array.isArray(rawAdminId) ? String(rawAdminId[0]) : String(rawAdminId || '');
};
exports.approveVerification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const adminId = getAdminId(req);
    const user = await adminService.approveUserVerification(String(id), adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User verification approved', user);
});
exports.rejectVerification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { reason } = req.body;
    const adminId = getAdminId(req);
    const user = await adminService.rejectUserVerification(String(id), reason || 'Rejected by admin', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User verification rejected', user);
});
exports.suspendUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'suspended', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User suspended successfully', user);
});
exports.activateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'active', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User activated successfully', user);
});
exports.blockUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'blocked', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User blocked successfully', user);
});
exports.approveEmergencyRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'accepted', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Emergency request approved', request);
});
exports.rejectEmergencyRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'cancelled', adminId, req.body?.reason);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Emergency request rejected', request);
});
exports.fulfillRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'fulfilled', adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Request marked as fulfilled', request);
});
exports.cancelRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'cancelled', adminId, req.body?.reason);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Request cancelled', request);
});
exports.sendEmergencyAlert = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const adminId = getAdminId(req);
    const alert = await adminService.sendEmergencyBroadcast({
        bloodGroup: req.body?.bloodGroup || 'O-',
        message: req.body?.message || 'Emergency blood donation needed',
        region: req.body?.region,
    }, adminId);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Emergency alert sent', alert);
});

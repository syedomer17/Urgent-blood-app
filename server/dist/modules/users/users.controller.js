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
exports.getDonors = exports.getAllUsers = exports.updateProfile = exports.getProfile = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responseHandler_1 = require("../../utils/responseHandler");
const userService = __importStar(require("./users.service"));
const http_status_codes_1 = require("http-status-codes");
exports.getProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await userService.getProfile(req.user._id.toString());
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User profile retrieved successfully', user);
});
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await userService.updateProfile(req.user._id.toString(), req.body);
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'User profile updated successfully', user);
});
exports.getAllUsers = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const users = await userService.getAllUsers();
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Users retrieved successfully', users);
});
exports.getDonors = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const donors = await userService.getDonors();
    const callerRole = (req.user && req.user.role) || 'anonymous';
    if (!['requester', 'admin'].includes(callerRole)) {
        donors.forEach((d) => { if (d && d.contactNumber)
            delete d.contactNumber; });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Donors retrieved successfully', donors);
});

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
exports.searchDonorsByCity = exports.getNearbyDonors = exports.getAllDonors = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responseHandler_1 = require("../../utils/responseHandler");
const http_status_codes_1 = require("http-status-codes");
const donorsService = __importStar(require("./donors.service"));
/** GET /api/v1/donors — all donors with location data */
exports.getAllDonors = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const donors = await donorsService.getDonorsWithLocation();
    // Redact contactNumber for callers who are not admin, requester, or hospital
    const callerRole = (_req.user && _req.user.role) || 'anonymous';
    const callerIsAuthorized = ['admin', 'requester', 'hospital'].includes(callerRole);
    if (!callerIsAuthorized) {
        donors.forEach((d) => { if (d && d.contactNumber)
            delete d.contactNumber; });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Donors retrieved successfully', donors);
});
/** GET /api/v1/donors/near?lat=&lng=&radius= */
exports.getNearbyDonors = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = req.query.radius ? parseFloat(req.query.radius) : 10000;
    const donors = await donorsService.getDonorsNear(lat, lng, radius);
    // Redact contactNumber for callers who are not admin, requester, or hospital
    const callerRole = (req.user && req.user.role) || 'anonymous';
    const callerIsAuthorized2 = ['admin', 'requester', 'hospital'].includes(callerRole);
    if (!callerIsAuthorized2) {
        donors.forEach((d) => { if (d && d.contactNumber)
            delete d.contactNumber; });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Nearby donors retrieved successfully', donors);
});
/** GET /api/v1/donors/search?city=&radius= */
exports.searchDonorsByCity = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const radius = req.query.radius ? parseFloat(req.query.radius) : 20000;
    // Allow direct lat/lng search (useful for tests and clients), otherwise geocode the city
    const latQuery = req.query.lat;
    const lngQuery = req.query.lng;
    let lat;
    let lng;
    if (latQuery && lngQuery) {
        lat = parseFloat(latQuery);
        lng = parseFloat(lngQuery);
    }
    else {
        const city = req.query.city || '';
        if (!city.trim()) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: 'City is required' });
        }
        const geocoder = (await Promise.resolve().then(() => __importStar(require('../../utils/geocoder')))).default;
        const results = await geocoder.geocode(city);
        if (!results || results.length === 0) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ success: false, message: 'City not found' });
        }
        const loc = results[0];
        lat = loc.latitude;
        lng = loc.longitude;
    }
    const donors = await donorsService.getDonorsNear(lat, lng, radius);
    // Redact contactNumber for callers who are not admin, requester, or hospital
    const callerRole = (req.user && req.user.role) || 'anonymous';
    const callerIsAuthorized3 = ['admin', 'requester', 'hospital'].includes(callerRole);
    if (!callerIsAuthorized3) {
        donors.forEach((d) => { if (d && d.contactNumber)
            delete d.contactNumber; });
    }
    (0, responseHandler_1.sendResponse)(res, http_status_codes_1.StatusCodes.OK, true, 'Donors retrieved for city', donors);
});

import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import { StatusCodes } from 'http-status-codes';
import * as donorsService from './donors.service';

/** GET /api/v1/donors — all donors with location data */
export const getAllDonors = catchAsync(async (_req: Request, res: Response) => {
    const donors = await donorsService.getDonorsWithLocation();
    // Redact contactNumber for callers who are not admin or verified hospitals
    const callerRole = (_req.user && (_req.user as any).role) || 'anonymous';
    const callerIsAdmin = callerRole === 'admin';
    const callerIsRequesterVerified = (callerRole === 'requester' || callerRole === 'hospital') && Boolean((_req.user as any)?.isVerified);
    if (!callerIsAdmin && !callerIsRequesterVerified) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }
    sendResponse(res, StatusCodes.OK, true, 'Donors retrieved successfully', donors);
});

/** GET /api/v1/donors/near?lat=&lng=&radius= */
export const getNearbyDonors = catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10_000;

    const donors = await donorsService.getDonorsNear(lat, lng, radius);
    // Redact contactNumber for callers who are not admin or verified hospitals
    const callerRole = (req.user && (req.user as any).role) || 'anonymous';
    const callerIsAdmin2 = callerRole === 'admin';
    const callerIsRequesterVerified2 = (callerRole === 'requester' || callerRole === 'hospital') && Boolean((req.user as any)?.isVerified);
    if (!callerIsAdmin2 && !callerIsRequesterVerified2) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }
    sendResponse(res, StatusCodes.OK, true, 'Nearby donors retrieved successfully', donors);
});

/** GET /api/v1/donors/search?city=&radius= */
export const searchDonorsByCity = catchAsync(async (req: Request, res: Response) => {
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 20_000;
    // Allow direct lat/lng search (useful for tests and clients), otherwise geocode the city
    const latQuery = req.query.lat as string | undefined;
    const lngQuery = req.query.lng as string | undefined;
    let lat: number | undefined;
    let lng: number | undefined;
    if (latQuery && lngQuery) {
        lat = parseFloat(latQuery);
        lng = parseFloat(lngQuery);
    } else {
        const city = (req.query.city as string) || '';
        if (!city.trim()) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'City is required' });
        }
        const geocoder = (await import('../../utils/geocoder')).default;
        const results = await geocoder.geocode(city);
        if (!results || results.length === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'City not found' });
        }
        const loc = results[0];
        lat = loc.latitude as number;
        lng = loc.longitude as number;
    }
    const donors = await donorsService.getDonorsNear(lat!, lng!, radius);

    // Redact contactNumber for callers who are not admin or verified hospitals
    const callerRole = (req.user && (req.user as any).role) || 'anonymous';
    const callerIsAdmin3 = callerRole === 'admin';
    const callerIsRequesterVerified3 = (callerRole === 'requester' || callerRole === 'hospital') && Boolean((req.user as any)?.isVerified);
    if (!callerIsAdmin3 && !callerIsRequesterVerified3) {
        donors.forEach((d: any) => { if (d && d.contactNumber) delete d.contactNumber; });
    }

    sendResponse(res, StatusCodes.OK, true, 'Donors retrieved for city', donors);
});

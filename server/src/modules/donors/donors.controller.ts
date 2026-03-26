import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import { StatusCodes } from 'http-status-codes';
import * as donorsService from './donors.service';

/** GET /api/v1/donors — all donors with location data */
export const getAllDonors = catchAsync(async (_req: Request, res: Response) => {
    const donors = await donorsService.getDonorsWithLocation();
    sendResponse(res, StatusCodes.OK, true, 'Donors retrieved successfully', donors);
});

/** GET /api/v1/donors/near?lat=&lng=&radius= */
export const getNearbyDonors = catchAsync(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10_000;

    const donors = await donorsService.getDonorsNear(lat, lng, radius);
    sendResponse(res, StatusCodes.OK, true, 'Nearby donors retrieved successfully', donors);
});

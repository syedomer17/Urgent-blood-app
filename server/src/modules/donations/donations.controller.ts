import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as donationService from './donations.service';
import { StatusCodes } from 'http-status-codes';

export const acceptRequest = catchAsync(async (req: Request, res: Response) => {
    const { requestId } = req.body;
    await donationService.acceptRequest(req.user!._id.toString(), requestId);
    sendResponse(res, StatusCodes.OK, true, 'Request accepted successfully. Thank you for your donation!');
});

import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/responseHandler';
import * as adminService from './admin.service';
import { StatusCodes } from 'http-status-codes';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendResponse(res, StatusCodes.OK, true, 'Admin stats retrieved successfully', stats);
});

export const getPendingVerifications = catchAsync(async (req: Request, res: Response) => {
    const users = await adminService.getPendingVerifications();
    sendResponse(res, StatusCodes.OK, true, 'Pending verifications retrieved', users);
});

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
    const users = await adminService.getAllUsers();
    sendResponse(res, StatusCodes.OK, true, 'Users retrieved successfully', users);
});

export const getRequests = catchAsync(async (_req: Request, res: Response) => {
    const requests = await adminService.getAllRequests();
    sendResponse(res, StatusCodes.OK, true, 'Requests retrieved successfully', requests);
});

export const getActionableRequests = catchAsync(async (_req: Request, res: Response) => {
    const requests = await adminService.getActionableRequests();
    sendResponse(res, StatusCodes.OK, true, 'Actionable requests retrieved successfully', requests);
});

export const getReports = catchAsync(async (_req: Request, res: Response) => {
    const reports = await adminService.getReports();
    sendResponse(res, StatusCodes.OK, true, 'Reports retrieved successfully', reports);
});

export const getAuditLogs = catchAsync(async (_req: Request, res: Response) => {
    const logs = await adminService.getAuditLogs();
    sendResponse(res, StatusCodes.OK, true, 'Audit logs retrieved successfully', logs);
});

const getAdminId = (req: Request) => {
    const rawAdminId = (req as any).user?._id;
    return Array.isArray(rawAdminId) ? String(rawAdminId[0]) : String(rawAdminId || '');
};

export const approveVerification = catchAsync(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const adminId = getAdminId(req);
    const user = await adminService.approveUserVerification(String(id), adminId);
    sendResponse(res, StatusCodes.OK, true, 'User verification approved', user);
});

export const rejectVerification = catchAsync(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { reason } = req.body;
    const adminId = getAdminId(req);
    const user = await adminService.rejectUserVerification(String(id), reason || 'Rejected by admin', adminId);
    sendResponse(res, StatusCodes.OK, true, 'User verification rejected', user);
});

export const suspendUser = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'suspended', adminId);
    sendResponse(res, StatusCodes.OK, true, 'User suspended successfully', user);
});

export const activateUser = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'active', adminId);
    sendResponse(res, StatusCodes.OK, true, 'User activated successfully', user);
});

export const blockUser = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const user = await adminService.updateUserAccountStatus(String(req.params.id), 'blocked', adminId);
    sendResponse(res, StatusCodes.OK, true, 'User blocked successfully', user);
});

export const approveEmergencyRequest = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'accepted', adminId);
    sendResponse(res, StatusCodes.OK, true, 'Emergency request approved', request);
});

export const rejectEmergencyRequest = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'cancelled', adminId, req.body?.reason);
    sendResponse(res, StatusCodes.OK, true, 'Emergency request rejected', request);
});

export const fulfillRequest = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'fulfilled', adminId);
    sendResponse(res, StatusCodes.OK, true, 'Request marked as fulfilled', request);
});

export const cancelRequest = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const request = await adminService.updateRequestStatus(String(req.params.id), 'cancelled', adminId, req.body?.reason);
    sendResponse(res, StatusCodes.OK, true, 'Request cancelled', request);
});

export const sendEmergencyAlert = catchAsync(async (req: Request, res: Response) => {
    const adminId = getAdminId(req);
    const alert = await adminService.sendEmergencyBroadcast(
        {
            bloodGroup: req.body?.bloodGroup || 'O-',
            message: req.body?.message || 'Emergency blood donation needed',
            region: req.body?.region,
        },
        adminId
    );
    sendResponse(res, StatusCodes.OK, true, 'Emergency alert sent', alert);
});


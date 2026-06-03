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
const notification_controller_1 = require("./notification.controller");
const notificationService = __importStar(require("./notification.service"));
jest.mock('./notification.service');
const mockedNotificationService = notificationService;
describe('Notification controller', () => {
    let res;
    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    it('returns current user notifications', async () => {
        mockedNotificationService.getMyNotifications.mockResolvedValue([{ _id: 'n1', title: 'Alert' }]);
        const req = { user: { _id: 'user-1' } };
        await notification_controller_1.getMyNotifications(req, res, null);
        expect(mockedNotificationService.getMyNotifications).toHaveBeenCalledWith('user-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    it('returns unread notification count', async () => {
        mockedNotificationService.getUnreadCount.mockResolvedValue(3);
        const req = { user: { _id: 'user-1' } };
        await notification_controller_1.getUnreadCount(req, res, null);
        expect(mockedNotificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
    it('marks a notification as read using a normalized string id', async () => {
        mockedNotificationService.markAsRead.mockResolvedValue({ _id: 'notif-1', isRead: true });
        const req = { user: { _id: 'user-1' }, params: { id: ['notif-1'] } };
        await notification_controller_1.markAsRead(req, res, null);
        expect(mockedNotificationService.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});

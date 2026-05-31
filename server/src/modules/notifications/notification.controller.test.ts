import { getMyNotifications, getUnreadCount, markAsRead } from './notification.controller';
import * as notificationService from './notification.service';

jest.mock('./notification.service');

const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('Notification controller', () => {
  let res: any;

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
    mockedNotificationService.getMyNotifications.mockResolvedValue([{ _id: 'n1', title: 'Alert' }] as any);

    const req: any = { user: { _id: 'user-1' } };

    await (getMyNotifications as any)(req, res, null);

    expect(mockedNotificationService.getMyNotifications).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns unread notification count', async () => {
    mockedNotificationService.getUnreadCount.mockResolvedValue(3 as any);

    const req: any = { user: { _id: 'user-1' } };

    await (getUnreadCount as any)(req, res, null);

    expect(mockedNotificationService.getUnreadCount).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('marks a notification as read using a normalized string id', async () => {
    mockedNotificationService.markAsRead.mockResolvedValue({ _id: 'notif-1', isRead: true } as any);

    const req: any = { user: { _id: 'user-1' }, params: { id: ['notif-1'] } };

    await (markAsRead as any)(req, res, null);

    expect(mockedNotificationService.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
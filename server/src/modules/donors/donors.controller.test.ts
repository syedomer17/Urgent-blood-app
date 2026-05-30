import { getAllDonors } from './donors.controller';
import * as donorsService from './donors.service';

// Mock donorsService
jest.mock('./donors.service');

const mockedDonorsService = donorsService as jest.Mocked<typeof donorsService>;

describe('Donors controller - contact access', () => {
  const sampleDonors = [
    { _id: '1', name: 'Alice', bloodGroup: 'A+', contactNumber: '+111111111' },
    { _id: '2', name: 'Bob', bloodGroup: 'O-', contactNumber: '+222222222' },
  ];

  let res: any;
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockedDonorsService.getDonorsWithLocation.mockResolvedValue(sampleDonors.map(d => ({ ...d })) as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should redact contactNumber for non-hospital roles', async () => {
    const req: any = { user: { role: 'donor' } };

    await (getAllDonors as any)(req, res, null);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toBeDefined();
    expect(Array.isArray(payload.data)).toBe(true);
    for (const d of payload.data) {
      expect(d.contactNumber).toBeUndefined();
    }
  });

  it('should include contactNumber for requester role (when verified)', async () => {
    const req: any = { user: { role: 'requester', isVerified: true } };

    await (getAllDonors as any)(req, res, null);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data).toBeDefined();
    for (const d of payload.data) {
      expect(d.contactNumber).toBeDefined();
    }
  });
});

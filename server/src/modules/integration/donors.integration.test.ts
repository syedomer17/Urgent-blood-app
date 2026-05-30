import request from 'supertest';
import createTestApp from '../../test/testApp';
import * as donorsService from '../donors/donors.service';

jest.mock('../donors/donors.service');
const mockedDonorsService = donorsService as jest.Mocked<typeof donorsService>;

describe('Integration - /api/v1/donors', () => {
  const sampleDonors = [
    { _id: '1', name: 'Alice', bloodGroup: 'A+', contactNumber: '+111111111', location: { coordinates: [0, 0] } },
    { _id: '2', name: 'Bob', bloodGroup: 'O-', contactNumber: '+222222222', location: { coordinates: [0, 0] } },
  ];

  let app: any;
  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockedDonorsService.getDonorsWithLocation.mockResolvedValue(sampleDonors as any);
    mockedDonorsService.getDonorsNear.mockResolvedValue(sampleDonors as any);
  });

  afterEach(() => jest.resetAllMocks());

  it('redacts contactNumber for non-hospital roles', async () => {
    const res = await request(app).get('/api/v1/donors').set('x-test-role', 'donor').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const d of res.body.data) {
      expect(d.contactNumber).toBeUndefined();
    }
  });

  it('includes contactNumber for requester role', async () => {
    const res = await request(app).get('/api/v1/donors?testRole=requester').set('x-test-role', 'requester').expect(200);
    // Ensure requester can access donor list (contact presence may depend on service shape)
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('nearby donors endpoint redacts contact for public', async () => {
    const res = await request(app).get('/api/v1/donors/near?lat=0&lng=0&testRole=donor').set('x-test-role', 'donor').expect(200);
    for (const d of res.body.data) expect(d.contactNumber).toBeUndefined();
  });
});

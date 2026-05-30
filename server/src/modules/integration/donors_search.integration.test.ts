import request from 'supertest';
import createTestApp from '../../test/testApp';
import * as donorsService from '../donors/donors.service';

jest.mock('../donors/donors.service');
jest.mock('../../utils/geocoder', () => ({
  __esModule: true,
  default: {
    geocode: jest.fn().mockResolvedValue([{ latitude: 10, longitude: 20 }]),
  },
}));

const mockedDonorsService = donorsService as jest.Mocked<typeof donorsService>;

describe('Integration - /api/v1/donors/search', () => {
  const sampleDonors = [
    { _id: '1', name: 'Alice', bloodGroup: 'A+', contactNumber: '+111111111', location: { coordinates: [20, 10] } },
    { _id: '2', name: 'Bob', bloodGroup: 'O-', contactNumber: '+222222222', location: { coordinates: [20, 10] } },
  ];

  let app: any;
  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockedDonorsService.getDonorsNear.mockResolvedValue(sampleDonors.map(d => ({ ...d })) as any);
  });

  afterEach(() => jest.resetAllMocks());

  it('redacts contactNumber for public users', async () => {
    const res = await request(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'donor').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const d of res.body.data) expect(d.contactNumber).toBeUndefined();
  });

  it('does not include contactNumber for requester when not verified', async () => {
    const res = await request(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'requester').expect(200);
    for (const d of res.body.data) expect(d.contactNumber).toBeUndefined();
  });

  it('includes contactNumber for requester when verified', async () => {
    const res = await request(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'requester').set('x-test-verified', 'true').expect(200);
    for (const d of res.body.data) expect(d.contactNumber).toBeDefined();
  });

  it('includes contactNumber for admin role', async () => {
    const res = await request(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'admin').expect(200);
    for (const d of res.body.data) expect(d.contactNumber).toBeDefined();
  });
});

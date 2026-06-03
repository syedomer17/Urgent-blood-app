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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const testApp_1 = __importDefault(require("../../test/testApp"));
const donorsService = __importStar(require("../donors/donors.service"));
jest.mock('../donors/donors.service');
jest.mock('../../utils/geocoder', () => ({
    __esModule: true,
    default: {
        geocode: jest.fn().mockResolvedValue([{ latitude: 10, longitude: 20 }]),
    },
}));
const mockedDonorsService = donorsService;
describe('Integration - /api/v1/donors/search', () => {
    const sampleDonors = [
        { _id: '1', name: 'Alice', bloodGroup: 'A+', contactNumber: '+111111111', location: { coordinates: [20, 10] } },
        { _id: '2', name: 'Bob', bloodGroup: 'O-', contactNumber: '+222222222', location: { coordinates: [20, 10] } },
    ];
    let app;
    beforeAll(() => {
        app = (0, testApp_1.default)();
    });
    beforeEach(() => {
        mockedDonorsService.getDonorsNear.mockResolvedValue(sampleDonors.map(d => ({ ...d })));
    });
    afterEach(() => jest.resetAllMocks());
    it('redacts contactNumber for public users', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'donor').expect(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        for (const d of res.body.data)
            expect(d.contactNumber).toBeUndefined();
    });
    it('does not include contactNumber for requester when not verified', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'requester').expect(200);
        for (const d of res.body.data)
            expect(d.contactNumber).toBeUndefined();
    });
    it('includes contactNumber for requester when verified', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'requester').set('x-test-verified', 'true').expect(200);
        for (const d of res.body.data)
            expect(d.contactNumber).toBeDefined();
    });
    it('includes contactNumber for admin role', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/donors/search?lat=10&lng=20').set('x-test-role', 'admin').expect(200);
        for (const d of res.body.data)
            expect(d.contactNumber).toBeDefined();
    });
});

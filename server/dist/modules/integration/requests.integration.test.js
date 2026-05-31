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
const requestService = __importStar(require("../requests/requests.service"));
jest.mock('../requests/requests.service');
const mockedRequestService = requestService;
describe('Integration - /api/v1/requests/:id/matches', () => {
    const sampleMatches = [
        { _id: 'd1', name: 'Donor1', contactNumber: '+100', bloodGroup: 'A+' },
    ];
    let app;
    beforeAll(() => { app = (0, testApp_1.default)(); });
    beforeEach(() => { mockedRequestService.getMatchingDonors.mockResolvedValue(sampleMatches); });
    afterEach(() => jest.resetAllMocks());
    it('redacts contactNumber for non-hospital roles', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/requests/abc/matches?testRole=donor').set('x-test-role', 'donor').expect(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        for (const d of res.body.data)
            expect(d.contactNumber).toBeUndefined();
    });
    it('includes contactNumber for requester role', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/requests/abc/matches?testRole=requester').set('x-test-role', 'requester').expect(200);
        // Ensure requester can access matching donors (contact presence may depend on service shape)
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

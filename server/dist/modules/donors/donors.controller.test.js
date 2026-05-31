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
const donors_controller_1 = require("./donors.controller");
const donorsService = __importStar(require("./donors.service"));
// Mock donorsService
jest.mock('./donors.service');
const mockedDonorsService = donorsService;
describe('Donors controller - contact access', () => {
    const sampleDonors = [
        { _id: '1', name: 'Alice', bloodGroup: 'A+', contactNumber: '+111111111' },
        { _id: '2', name: 'Bob', bloodGroup: 'O-', contactNumber: '+222222222' },
    ];
    let res;
    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockedDonorsService.getDonorsWithLocation.mockResolvedValue(sampleDonors.map(d => ({ ...d })));
    });
    afterEach(() => {
        jest.resetAllMocks();
    });
    it('should redact contactNumber for non-hospital roles', async () => {
        const req = { user: { role: 'donor' } };
        await donors_controller_1.getAllDonors(req, res, null);
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
        const req = { user: { role: 'requester', isVerified: true } };
        await donors_controller_1.getAllDonors(req, res, null);
        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload.data).toBeDefined();
        for (const d of payload.data) {
            expect(d.contactNumber).toBeDefined();
        }
    });
});

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
const requests_controller_1 = require("./requests.controller");
const hospitalService = __importStar(require("./hospitalVerification.service"));
const user_model_1 = require("../users/user.model");
jest.mock('./hospitalVerification.service');
jest.mock('../users/user.model');
describe('verifyDocument auto-approve', () => {
    it('auto-approves and sets isVerified when AI confidence >= threshold', async () => {
        const mockResult = {
            isVerified: true,
            confidence: 0.95,
            hospitalName: 'Test Hospital',
            documentType: 'Prescription',
            patientName: 'John',
            bloodGroup: 'A+',
            details: 'Looks legit',
            flags: [],
        };
        hospitalService.verifyHospitalDocument.mockResolvedValue(mockResult);
        const findByIdAndUpdateSpy = jest.spyOn(user_model_1.User, 'findByIdAndUpdate').mockResolvedValueOnce({});
        const req = {
            file: {
                path: '/uploads/test.pdf',
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
                size: 1234,
            },
            user: { _id: 'user123' },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        await (0, requests_controller_1.verifyDocument)(req, res, jest.fn());
        expect(hospitalService.verifyHospitalDocument).toHaveBeenCalledWith('/uploads/test.pdf');
        expect(findByIdAndUpdateSpy).toHaveBeenCalled();
        expect(findByIdAndUpdateSpy).toHaveBeenCalled();
        const callArgs = findByIdAndUpdateSpy.mock.calls[0];
        expect(callArgs).toBeDefined();
        const calledWith = callArgs[1];
        expect(calledWith).toBeDefined();
        expect(calledWith.$set['verification.status']).toBe('approved');
        expect(calledWith.$set['verification.aiAutoApproved']).toBe(true);
        expect(calledWith.$set['isVerified']).toBe(true);
    });
});

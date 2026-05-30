import { verifyDocument } from './requests.controller';
import * as hospitalService from './hospitalVerification.service';
import { User } from '../users/user.model';

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

    (hospitalService.verifyHospitalDocument as jest.Mock).mockResolvedValue(mockResult);

    const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValueOnce({} as any);

    const req: any = {
      file: {
        path: '/uploads/test.pdf',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1234,
      },
      user: { _id: 'user123' },
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await verifyDocument(req, res, jest.fn());

    expect(hospitalService.verifyHospitalDocument).toHaveBeenCalledWith('/uploads/test.pdf');
    expect(findByIdAndUpdateSpy).toHaveBeenCalled();

    expect(findByIdAndUpdateSpy).toHaveBeenCalled();
    const callArgs = findByIdAndUpdateSpy.mock.calls[0];
    expect(callArgs).toBeDefined();
    const calledWith = callArgs[1] as any;
    expect(calledWith).toBeDefined();
    expect(calledWith.$set['verification.status']).toBe('approved');
    expect(calledWith.$set['verification.aiAutoApproved']).toBe(true);
    expect(calledWith.$set['isVerified']).toBe(true);
  });
});

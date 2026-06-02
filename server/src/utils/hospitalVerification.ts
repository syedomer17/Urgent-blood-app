import { config } from '../config/env';
import fs from 'fs';

export interface HospitalVerificationResult {
    hospitalName: string;
    registrationNumber: string;
    licenseNumber: string;
    gstNumber: string;
    address: string;
    email: string;
    phoneNumber: string;
    issueDate: string;
    expiryDate: string;
    governmentSealDetected: boolean;
    signatureDetected: boolean;
    documentReadable: boolean;
    possibleTampering: boolean;
    verificationStatus: 'verified' | 'suspicious' | 'rejected';
    confidenceScore: number;
    reasons: string[];
    missingFields: string[];
}

const DEFAULT_RESULT: HospitalVerificationResult = {
    hospitalName: '',
    registrationNumber: '',
    licenseNumber: '',
    gstNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
    issueDate: '',
    expiryDate: '',
    governmentSealDetected: false,
    signatureDetected: false,
    documentReadable: false,
    possibleTampering: false,
    verificationStatus: 'suspicious',
    confidenceScore: 0,
    reasons: [],
    missingFields: [],
};

const VERIFICATION_PROMPT = `You are an AI Hospital Verification Assistant for a Blood Donation Platform.

Your task is to analyze the uploaded hospital documents and determine whether the hospital appears legitimate.

Instructions:

Extract all available information from the document.
Verify whether the document appears authentic.
Check for: Hospital Name, Registration Number, License Number, GST Number (if available), Address, Email, Phone Number, Issue Date, Expiry Date, Government Seal or Stamp, Authorized Signatures
Detect possible issues: Missing information, Expired licenses, Blurry or unreadable documents, Signs of editing or tampering, Missing seals or signatures
Assign a confidence score between 0 and 100.
Return ONLY valid JSON. Do not include markdown, explanations, or extra text.

Required JSON Format:
{"hospitalName":"","registrationNumber":"","licenseNumber":"","gstNumber":"","address":"","email":"","phoneNumber":"","issueDate":"","expiryDate":"","governmentSealDetected":false,"signatureDetected":false,"documentReadable":true,"possibleTampering":false,"verificationStatus":"verified | suspicious | rejected","confidenceScore":0,"reasons":[],"missingFields":[]}

Verification Rules:
If license is expired → verificationStatus = "rejected"
If document is unreadable → verificationStatus = "rejected"
If registration number is missing → verificationStatus = "suspicious"
If government seal is missing → verificationStatus = "suspicious"
If signs of tampering exist → verificationStatus = "suspicious"
If all required fields exist and no issues are found → verificationStatus = "verified"

Analyze the uploaded document and return the JSON response only.`;

export const verifyHospitalDocument = async (
    filePath: string,
    mimeType: string
): Promise<HospitalVerificationResult> => {
    try {
        if (!config.gemini.apiKey) {
            return {
                ...DEFAULT_RESULT,
                reasons: ['Document verification is temporarily unavailable. AI review will stay pending until GEMINI_API_KEY is configured.'],
            };
        }

        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: VERIFICATION_PROMPT,
                        },
                        {
                            inlineData: {
                                mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.gemini.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || `API error: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
            throw new Error('No response from API');
        }

        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        const parsed: HospitalVerificationResult = JSON.parse(text);
        return parsed;
    } catch (error: any) {
        console.error('Hospital verification error:', error?.message || error);
        return {
            ...DEFAULT_RESULT,
            reasons: [`Document verification failed: ${error?.message || 'Unknown error'}. Please retry after checking the AI verification service.`],
        };
    }
};

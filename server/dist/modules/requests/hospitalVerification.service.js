"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyHospitalDocument = verifyHospitalDocument;
const generative_ai_1 = require("@google/generative-ai");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../../config/env");
const GEMINI_API_KEY = String(env_1.config.gemini.apiKey || process.env.GEMINI_API_KEY || '');
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
function getMimeType(filePath) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
    };
    return mimeMap[ext] || 'application/octet-stream';
}
async function verifyHospitalDocument(filePath) {
    const fileBuffer = fs_1.default.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are an AI Hospital Verification Assistant for a Blood Donation Platform.

Your task is to analyze the uploaded hospital documents and determine whether the hospital appears legitimate.

Instructions:

1. Extract all available information from the document.
2. Verify whether the document appears authentic.
3. Check for:Hospital Name
4. Registration Number
5. License Number
6. GST Number (if available)
7. Address
8. Email
9. Phone Number
10. Issue Date
11. Expiry Date
12. Government Seal or Stamp
13. Authorized Signatures
14. Detect possible issues:Missing information
15. Expired licenses
16. Blurry or unreadable documents
17. Signs of editing or tampering
18. Missing seals or signatures
19. Assign a confidence score between 0 and 100.
20. Return ONLY valid JSON.
21. Do not include markdown, explanations, or extra text.

Required JSON Format:

{
"hospitalName": "",
"registrationNumber": "",
"licenseNumber": "",
"gstNumber": "",
"address": "",
"email": "",
"phoneNumber": "",
"issueDate": "",
"expiryDate": "",
"governmentSealDetected": false,
"signatureDetected": false,
"documentReadable": true,
"possibleTampering": false,
"verificationStatus": "verified | suspicious | rejected",
"confidenceScore": 0,
"reasons": [],
"missingFields": []
}

Verification Rules:

- If license is expired → verificationStatus = "rejected"
- If document is unreadable → verificationStatus = "rejected"
- If registration number is missing → verificationStatus = "suspicious"
- If government seal is missing → verificationStatus = "suspicious"
- If signs of tampering exist → verificationStatus = "suspicious"
- If all required fields exist and no issues are found → verificationStatus = "verified"

Analyze the uploaded document and return the JSON response only.`;
    try {
        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
        ]);
        const responseText = result.response.text().trim();
        // Parse JSON from response — handle potential markdown wrapping
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonStr);
        const verificationStatus = parsed.verificationStatus || (parsed.isVerified ? 'verified' : 'rejected');
        const confidenceScore = typeof parsed.confidenceScore === 'number'
            ? parsed.confidenceScore
            : Math.round((Number(parsed.confidence) || 0) * 100);
        return {
            isVerified: verificationStatus === 'verified',
            confidence: Math.min(1, Math.max(0, confidenceScore / 100)),
            hospitalName: parsed.hospitalName || null,
            registrationNumber: parsed.registrationNumber || null,
            licenseNumber: parsed.licenseNumber || null,
            gstNumber: parsed.gstNumber || null,
            address: parsed.address || null,
            email: parsed.email || null,
            phoneNumber: parsed.phoneNumber || null,
            issueDate: parsed.issueDate || null,
            expiryDate: parsed.expiryDate || null,
            governmentSealDetected: Boolean(parsed.governmentSealDetected),
            signatureDetected: Boolean(parsed.signatureDetected),
            documentReadable: parsed.documentReadable !== false,
            possibleTampering: Boolean(parsed.possibleTampering),
            verificationStatus,
            confidenceScore,
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
            missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
            documentType: parsed.documentType || null,
            patientName: parsed.patientName || null,
            bloodGroup: parsed.bloodGroup || null,
            details: parsed.details || parsed.reasons?.join(', ') || 'No details provided',
            flags: Array.isArray(parsed.flags) ? parsed.flags : Array.isArray(parsed.reasons) ? parsed.reasons : [],
        };
    }
    catch (error) {
        console.error('Gemini verification error:', error?.message);
        return {
            isVerified: false,
            confidence: 0,
            hospitalName: null,
            registrationNumber: null,
            licenseNumber: null,
            gstNumber: null,
            address: null,
            email: null,
            phoneNumber: null,
            issueDate: null,
            expiryDate: null,
            governmentSealDetected: false,
            signatureDetected: false,
            documentReadable: false,
            possibleTampering: false,
            verificationStatus: 'rejected',
            confidenceScore: 0,
            reasons: ['AI verification failed — service error'],
            missingFields: [],
            documentType: null,
            patientName: null,
            bloodGroup: null,
            details: 'Verification service temporarily unavailable. Please try again.',
            flags: ['AI verification failed — service error'],
        };
    }
}

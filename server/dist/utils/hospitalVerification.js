"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyHospitalDocument = void 0;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const fs_1 = __importDefault(require("fs"));
const DEFAULT_RESULT = {
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
const verifyHospitalDocument = async (filePath, mimeType) => {
    try {
        if (!env_1.config.gemini.apiKey) {
            return {
                ...DEFAULT_RESULT,
                reasons: ['Document verification is temporarily unavailable. AI review will stay pending until GEMINI_API_KEY is configured.'],
            };
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.config.gemini.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        const result = await model.generateContent([
            VERIFICATION_PROMPT,
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
        ]);
        const response = result.response;
        let text = response.text();
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const parsed = JSON.parse(text);
        return parsed;
    }
    catch (error) {
        return {
            ...DEFAULT_RESULT,
            reasons: ['Document verification failed. Please retry after checking the AI verification service.'],
        };
    }
};
exports.verifyHospitalDocument = verifyHospitalDocument;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPrescriptionDocument = void 0;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../config/env");
const fs_1 = __importDefault(require("fs"));
const DEFAULT_RESULT = {
    isVerified: false,
    confidence: 0,
    hospitalName: null,
    documentType: null,
    patientName: null,
    bloodGroup: null,
    details: 'Document verification is temporarily unavailable.',
    flags: [],
};
const PRESCRIPTION_VERIFICATION_PROMPT = `You are an AI Prescription Verification Assistant for a Blood Donation Platform.

Your task is to analyze the uploaded medical document and determine if it's a valid prescription or blood bank receipt for a blood request.

Instructions:

1. Extract all available information from the document
2. Verify the document appears authentic and readable
3. Check for:
   - Patient Name
   - Hospital/Medical Center Name
   - Blood Group (if mentioned)
   - Doctor Name or Medical Professional
   - Date (prescription/receipt date)
   - Any doctor signature, hospital seal, or stamp
   - Document type (prescription, blood bank receipt, OPD bill, lab report, etc.)

4. Detect possible issues:
   - Document is blurry or unreadable
   - Missing critical information (patient name, hospital, date)
   - Signs of editing or tampering
   - Missing signatures or seals
   - Document appears to be from a non-medical source

5. Assign a confidence score between 0 and 100 for document authenticity

Return ONLY valid JSON. Do not include markdown, explanations, or extra text.

Required JSON Format:
{
  "isVerified": boolean,
  "confidence": number (0-100),
  "hospitalName": string or null,
  "documentType": string (e.g., "prescription", "blood_bank_receipt", "opd_bill", "lab_report"),
  "patientName": string or null,
  "bloodGroup": string or null (e.g., "A+", "O-"),
  "details": "Brief summary of findings",
  "flags": ["issue1", "issue2"]
}

Verification Rules:
- If document is unreadable or blurry → isVerified = false
- If patient name is missing → flag: "missing_patient_name"
- If hospital name is missing → flag: "missing_hospital_name"
- If no date found → flag: "no_date"
- If no professional signature/seal detected → flag: "no_signature_or_seal"
- If signs of tampering exist → flag: "possible_tampering"
- If all critical fields exist and no major issues → isVerified = true
- Set confidence based on how complete and authentic the document appears

Analyze the uploaded document and return the JSON response only.`;
const verifyPrescriptionDocument = async (filePath, mimeType) => {
    try {
        if (!env_1.config.gemini.apiKey) {
            return {
                ...DEFAULT_RESULT,
                details: 'Document verification is temporarily unavailable. AI review will stay pending until GEMINI_API_KEY is configured.',
                flags: ['ai_service_unavailable'],
            };
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(env_1.config.gemini.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        const result = await model.generateContent([
            PRESCRIPTION_VERIFICATION_PROMPT,
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
        console.error('Prescription verification error:', error?.message || error);
        return {
            ...DEFAULT_RESULT,
            details: `Document verification failed: ${error?.message || 'Unknown error'}. Please retry after checking the AI verification service.`,
            flags: ['verification_error'],
        };
    }
};
exports.verifyPrescriptionDocument = verifyPrescriptionDocument;

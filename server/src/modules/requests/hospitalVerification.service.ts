import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/env';

const GEMINI_API_KEY = String(config.gemini.apiKey || process.env.GEMINI_API_KEY || '');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface VerificationResult {
    isVerified: boolean;
    confidence: number;
    hospitalName: string | null;
    documentType: string | null;
    patientName: string | null;
    bloodGroup: string | null;
    details: string;
    flags: string[];
}

function getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
    };
    return mimeMap[ext] || 'application/octet-stream';
}

export async function verifyHospitalDocument(filePath: string): Promise<VerificationResult> {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = getMimeType(filePath);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medical document verification AI for a blood donation platform called LifeLink.

Analyze this uploaded document (image or PDF) and determine if it is a legitimate hospital or medical document related to a blood request.

You must check for:
1. Is this a real hospital/medical document? (e.g., hospital letterhead, blood test report, doctor's prescription, hospital admission form, blood request form, patient records)
2. Can you identify the hospital or medical facility name?
3. Can you identify any patient name mentioned?
4. Can you identify any blood group mentioned?
5. What type of document is this? (e.g., "Blood Test Report", "Hospital Admission Form", "Doctor's Prescription", "Blood Request Form", "Unknown")
6. Are there any red flags? (e.g., the image looks edited/fake, it's not a medical document at all, it's a random photo, it's a screenshot of something unrelated)

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{
    "isVerified": true/false,
    "confidence": 0.0-1.0,
    "hospitalName": "Hospital Name or null",
    "documentType": "Type of document or null",
    "patientName": "Patient name if visible or null",
    "bloodGroup": "Blood group if visible or null",
    "details": "Brief description of what you see in the document",
    "flags": ["list of any concerns or red flags, empty array if none"]
}

Rules:
- Set isVerified to true ONLY if you are reasonably confident this is a legitimate medical/hospital document
- confidence should reflect how certain you are (0.0 = not at all, 1.0 = absolutely certain)
- If the document is clearly not medical related (random photo, meme, screenshot of social media, etc.), set isVerified to false with low confidence
- Be strict but fair — even a simple hospital letterhead or prescription should pass if it looks legitimate`;

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

        const parsed = JSON.parse(jsonStr) as VerificationResult;

        return {
            isVerified: Boolean(parsed.isVerified),
            confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
            hospitalName: parsed.hospitalName || null,
            documentType: parsed.documentType || null,
            patientName: parsed.patientName || null,
            bloodGroup: parsed.bloodGroup || null,
            details: parsed.details || 'No details provided',
            flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        };
    } catch (error: any) {
        console.error('Gemini verification error:', error?.message);
        return {
            isVerified: false,
            confidence: 0,
            hospitalName: null,
            documentType: null,
            patientName: null,
            bloodGroup: null,
            details: 'Verification service temporarily unavailable. Please try again.',
            flags: ['AI verification failed — service error'],
        };
    }
}

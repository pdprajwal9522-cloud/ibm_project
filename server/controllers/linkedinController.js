/**
 * @file linkedinController.js
 * @description Analyzes LinkedIn profile screenshots using Gemini Vision (Multi-modal) with Multi-Key Rotation.
 * @author Senior Architect
 */

import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
  
// Get all API keys from environment
const apiKeys = process.env.GEMINI_API_KEY?.split(',').map(k => k.trim()).filter(Boolean) || [];

if (apiKeys.length === 0) {
    console.error("❌ FATAL: No Gemini API keys found for LinkedIn vision.");
}

/**
 * @desc    Analyze a LinkedIn Screenshot for Branding & Professionalism
 * @route   POST /api/linkedin
 * @access  Public
 */
export const analyzeLinkedin = async (req, res) => {
    // 1. Validation
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            error: { code: 'NO_FILE', message: "Image screenshot is required." } 
        });
    }

    const filePath = req.file.path;

    try {
        console.log(`[Vision API] Processing file: ${req.file.originalname}`);

        let lastError = null;
        let uploadResponse = null;
        
        // 2. TRY EACH KEY UNTIL ONE WORKS (Multi-Key Rotation)
        for (let i = 0; i < apiKeys.length; i++) {
            const apiKey = apiKeys[i];
            
            try {
                console.log(`[Vision API] Attempt ${i + 1}/${apiKeys.length} with key ${i + 1}`);
                
                // Create fresh client and file manager for this key
                const genAI = new GoogleGenerativeAI(apiKey);
                const fileManager = new GoogleAIFileManager(apiKey);

                // 3. Upload to Google's Temporary File Store (only once)
                if (!uploadResponse) {
                    uploadResponse = await fileManager.uploadFile(filePath, {
                        mimeType: req.file.mimetype,
                        displayName: `User Upload ${Date.now()}`,
                    });
                }

                // 4. Generate Content using Vision Model
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash-lite-preview-09-2025",
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 900,
                        responseMimeType: "application/json",
                    },
                });
        
                const result = await model.generateContent([
                        {
                                fileData: {
                                        mimeType: uploadResponse.file.mimeType,
                                        fileUri: uploadResponse.file.uri
                                }
                        },
                        { text: `
                                You are a CRITICAL LinkedIn Profile Auditor. Your job is to find PROBLEMS and GAPS, not to praise.
                                Analyze this screenshot and identify what's WRONG or MISSING.
                                
                                CRITICAL RULES:
                                - The "critique" field MUST contain ONLY problems, weaknesses, gaps, or missing elements
                                - NEVER write compliments, praise, or "solid profile" statements in the critique field
                                - Even if the profile looks good, find at least 2-3 areas that need improvement
                                - Focus on: missing keywords, weak headline, poor photo quality, incomplete sections, lack of specificity
                                
                                Output STRICT JSON only (no prose). Keep strings under 120 characters.
                                {
                                    "visual_score": 78,
                                    "critique": "ONLY list problems/gaps/weaknesses separated by | . Example: Headline lacks industry keywords | Photo background too busy | No custom banner visible",
                                    "headline_suggestion": "Improved headline under 90 chars",
                                    "action_items": ["3-5 specific fixes needed"],
                                    "photo_report": {
                                        "strengths": ["2-3 photo strengths"],
                                        "issues": ["2-3 photo problems"],
                                        "suggestions": ["2-3 photo improvements"],
                                        "quality_score": 0-100,
                                        "helpful_data": {
                                            "background": "clean/busy/needs blur",
                                            "lighting": "good/harsh/dim",
                                            "framing": "tight/loose/awkward crop",
                                            "attire": "appropriate/upgrade needed",
                                            "expression": "friendly/neutral/serious/awkward"
                                        }
                                    }
                                }
                        `}
                ]);

                // 5. Parse Response
                const responseText = result.response.text();
                const cleanText = responseText.replace(/```(json)?/g, '').trim();
                const data = JSON.parse(cleanText);

                console.log(`[Vision API] ✅ Success with key ${i + 1}`);
                return res.status(200).json({ success: true, data });

            } catch (keyError) {
                lastError = keyError;
                
                // Check if it's a quota/rate limit error (429)
                if (keyError.message?.includes('429') || keyError.message?.includes('quota')) {
                    console.warn(`[Vision API] ⚠️ Key ${i + 1} quota exceeded, trying next key...`);
                    continue; // Try next key
                } else {
                    // Non-quota error, throw immediately
                    console.error(`[Vision API] ❌ Key ${i + 1} failed with non-quota error:`, keyError.message);
                    throw keyError;
                }
            }
        }

        // 6. All keys failed with quota errors
        throw new Error(`All ${apiKeys.length} API keys exhausted. Last error: ${lastError?.message || 'Unknown'}`);

    } catch (error) {
        console.error(`[LinkedIn Controller] Error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            error: { code: 'VISION_ERROR', message: "Failed to analyze image. All API keys may be at quota limit." } 
        });

    } finally {
        // 7. Cleanup (Critical for Disk Space)
        // Always delete the local file, success or failure
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[System] Cleaned up temp file: ${filePath}`);
        }
    }
};

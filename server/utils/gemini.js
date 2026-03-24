/**
 * @file gemini.js
 * @description Multi-Key Rotation System with Auto-Failover and Retry Logic.
 * @module utils/gemini
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. KEY MANAGEMENT SYSTEM ---
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ FATAL: GEMINI_API_KEY is missing in .env file");
    process.exit(1);
}

// Parse keys and remove whitespace
const apiKeys = process.env.GEMINI_API_KEY.split(',').map(key => key.trim()).filter(Boolean);

if (apiKeys.length === 0) {
    console.error("❌ FATAL: No valid API keys found.");
    process.exit(1);
}

console.log(`[AI Service] Loaded ${apiKeys.length} API Key(s) for rotation.`);

// Key Rotation State
let currentKeyIndex = 0;

/**
 * Rotates to the next available API key.
 * @returns {string} The next API key.
 */
const getNextKey = () => {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Loop back to 0
    return key;
};

/**
 * Creates a model instance with a specific key.
 * @param {string} key - API Key to use.
 * @returns {Object} GoogleGenerativeAI Model instance.
 */
const createModel = (key) => {
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite-preview-09-2025",
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
        }
    });
};

// --- 2. RESILIENCE LOGIC ---

const MAX_RETRIES = 3;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates JSON with Key Rotation and Failover.
 * @param {string} prompt - The prompt to send.
 * @returns {Promise<Object>} - Parsed JSON.
 */
const generateJSON = async (prompt) => {
    let attempt = 0;
    let usedKey = "";

    while (attempt < MAX_RETRIES) {
        try {
            // 1. Get a fresh key for this attempt
            usedKey = getNextKey();
            const model = createModel(usedKey);

            // 2. Generate
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // 3. Sanitize JSON
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No valid JSON found in response.");

            return JSON.parse(jsonMatch[0]);

        } catch (error) {
            attempt++;
            
            // Mask the key for logging security
            const maskedKey = usedKey.substring(0, 5) + "..."; 
            console.warn(`⚠️ [AI Service] Key (${maskedKey}) failed. Attempt ${attempt}/${MAX_RETRIES}. Error: ${error.message}`);

            // If it's a Rate Limit (429) or Quota error, we DON'T wait long. 
            // We switch keys immediately.
            const isRateLimit = error.message.includes('429') || error.message.includes('Quota');
            
            if (isRateLimit && apiKeys.length > 1) {
                console.log(`🔄 [AI Service] Switching key immediately due to Rate Limit...`);
                continue; // Retry loop immediately with next key
            }

            // For other errors (Server overloaded), wait with backoff
            if (attempt >= MAX_RETRIES) {
                console.error("❌ [AI Service] All keys/retries exhausted.");
                throw new Error("Service Unavailable. Please try again.");
            }

            const waitTime = 1000 * Math.pow(2, attempt - 1);
            await sleep(waitTime);
        }
    }
};

/**
 * Exports
 */
export { generateJSON };
export const getRawClient = () => new GoogleGenerativeAI(getNextKey());

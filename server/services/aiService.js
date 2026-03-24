/**
 * @file aiService.js
 * @description Interfaces with Google Gemini (Multi-Key Rotation).
 * UPDATED: Generates a detailed engineering audit.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKeys = () => {
    const raw = process.env.GEMINI_API_KEY || "";
    return raw.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

export const generateAnalysis = async (profileData, repoData, topLanguages) => {
    const apiKeys = getApiKeys();
    
    if (apiKeys.length === 0) {
        console.error("❌ NO API KEYS FOUND.");
        return getFallbackData(topLanguages, "No API Keys");
    }

    for (let i = 0; i < apiKeys.length; i++) {
        const apiKey = apiKeys[i];
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });

            const prompt = `
                Act as a Senior Staff Engineer at Google. Conduct a deep audit of this candidate's GitHub profile.
                
                PROFILE CONTEXT:
                - Bio: ${profileData.bio || "None"}
                - Top Languages: ${topLanguages.join(', ')}
                - Repositories: ${JSON.stringify(repoData)}

                TASK:
                Return a STRICT JSON object (no markdown). Do not include the "json" word block.
                Structure:
                {
                    "candidate_tier": "S" | "A" | "B" | "C",
                    "score": <0-100>,
                    "professional_summary": "<Professional executive summary of their coding style>",
                    "tech_stack": {
                        "frontend": ["<Specific Frameworks>"],
                        "backend": ["<Specific Languages/DBs>"]
                    },
                    "soft_skills_detected": ["<Infer 3 skills>"],
                    "strengths": ["<Specific coding strength 1>", "<Specific strength 2>"],
                    "weaknesses": ["<Specific area to improve 1>", "<Specific area to improve 2>"],
                    "best_project_analysis": {
                        "name": "<Name of best repo>",
                        "insight": "<Why this project stands out (complexity, structure, etc)>"
                    },
                    "recommended_roles": ["<Role 1>", "<Role 2>"],
                    "roast": "<Short, witty roast>"
                }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            
            return JSON.parse(text);

        } catch (error) {
            console.warn(`⚠️ Key #${i + 1} Failed: ${error.message}`);
            if (i === apiKeys.length - 1) console.error("❌ ALL API KEYS FAILED.");
        }
    }

    return getFallbackData(topLanguages, "Service Unavailable");
};

const getFallbackData = (langs, reason) => ({
    candidate_tier: "B",
    score: 70,
    professional_summary: `Audit incomplete (${reason}).`,
    tech_stack: { frontend: langs.slice(0,3), backend: [] },
    soft_skills_detected: ["Persistence"],
    strengths: ["Code Availability"],
    weaknesses: ["Cannot analyze code depth"],
    best_project_analysis: { name: "Unknown", insight: "Data unavailable" },
    recommended_roles: ["Developer"],
    roast: "I'm offline, so you get a free pass."
});

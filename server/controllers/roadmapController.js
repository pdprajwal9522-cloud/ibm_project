/**
 * @file roadmapController.js
 * @description Generates personalized, project-based learning timelines using GenAI.
 * @author Senior Architect
 */

import { generateJSON } from '../utils/gemini.js';

/**
 * @desc    Generate a 4-Week Skill Mastery Plan
 * @route   POST /api/roadmap
 * @access  Public
 */
export const generateRoadmap = async (req, res) => {
    try {
        const { skill, currentLevel = "Beginner" } = req.body;
        const cleanedSkill = (skill || '').trim();

        // Comprehensive validation
        if (cleanedSkill.length < 2 || cleanedSkill.length > 80) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_SKILL_FORMAT', message: "Skill must be 2-80 characters." }
            });
        }

        // Block obvious gibberish patterns
        const hasRepeatedChars = /^([a-zA-Z])\1{3,}$/.test(cleanedSkill); // 'aaaa', 'bbbb'
        const isKeyboardMashing = /^[qwertyuiopasdfghjklzxcvbnm]{5,}$/.test(cleanedSkill); // keyboard rows
        const vowels = cleanedSkill.match(/[aeiouAEIOU]/g)?.length || 0;
        const consonants = cleanedSkill.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g)?.length || 0;
        const totalLetters = vowels + consonants;
        const vowelRatio = totalLetters > 0 ? vowels / totalLetters : 0;
        const isWeirdRatio = vowelRatio < 0.15 || vowelRatio > 0.85;
        
        if (hasRepeatedChars || isKeyboardMashing || isWeirdRatio) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_SKILL_FORMAT', message: "That doesn't look like a real skill. Try 'Python', 'Docker', 'React', etc." }
            });
        }

        console.log(`[Roadmap API] Generating plan for: ${skill} (${currentLevel})`);

        const prompt = `You are an expert coding mentor. Analyze if "${cleanedSkill}" is a REAL, LEARNABLE skill/topic. If it IS valid, create a practical learning roadmap. If NOT, return [] (empty array).

STRICT REJECTION RULES - Return [] IMMEDIATELY if:
1. Gibberish/keyboard mashing: 'asdfgh', 'qwerty', 'gfnhgnrh', 'aaaa', random letter combinations
2. Not a skill: 'stuff', 'thing', 'whatever', 'hello', 'test', 'xyz'
3. Offensive/inappropriate content
4. Single character or non-sensical input

VALID SKILLS include:
- Programming languages (Python, JavaScript, Rust, Go)
- Frameworks/libraries (React, Django, Spring, Vue)
- Technologies (Docker, Kubernetes, AWS, Terraform)
- Concepts (System Design, Microservices, OOP, Design Patterns)
- Tools (Git, Jenkins, Prometheus, Elasticsearch)
- Soft skills (Leadership, Communication, Project Management)
- Data/AI (Machine Learning, Data Science, NLP)
- Infrastructure (Linux, Networking, Database Design)

For VALID topics, decide duration:
- Simple/focused: 3 weeks
- Moderate: 4-5 weeks  
- Broad/advanced: 6 weeks

Return ONLY a JSON array with 0 items (invalid) or 3-6 items (valid). No markdown, no explanation.

Array structure:
[
  {
    "week": 1,
    "theme": "Foundation & Setup",
    "tasks": ["Task 1", "Task 2", "Task 3"],
    "project": "Deliverable",
    "resources": ["Resource 1", "Resource 2"]
  }
]`;

        console.log(`[Roadmap API] Sending prompt to AI...`);
        const roadmap = await generateJSON(prompt);
        
        const isArray = Array.isArray(roadmap);
        if (!isArray) {
            throw new Error('AI returned an invalid roadmap shape.');
        }

        if (roadmap.length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_SKILL', message: "This doesn't look like a real skill or topic. Try something like 'Docker', 'Python', or 'System Design'." }
            });
        }

        const validLength = roadmap.length >= 3 && roadmap.length <= 6;
        if (!validLength) {
            throw new Error('AI returned an invalid roadmap length.');
        }

        console.log(`[Roadmap API] ✅ Roadmap generated successfully:`, roadmap);
        return res.status(200).json({ success: true, data: roadmap });

    } catch (error) {
        console.error('[Roadmap API] ❌ Error generating roadmap:', error);
        
        let statusCode = 500;
        let errorMessage = {
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong on our end. Please try again in a moment.' }
        };

        if (error.message.includes('AI returned an invalid roadmap shape')) {
            statusCode = 500;
            errorMessage = {
                success: false,
                error: { code: 'AI_INVALID_SHAPE', message: 'The AI returned an unexpected data format. Please try again.' }
            };
        } else if (error.message.includes('AI returned an invalid roadmap length')) {
            statusCode = 500;
            errorMessage = {
                success: false,
                error: { code: 'AI_INVALID_LENGTH', message: 'The AI generated a roadmap with an invalid number of steps. Please try again.' }
            };
        }
        
        return res.status(statusCode).json(errorMessage);
    }
};

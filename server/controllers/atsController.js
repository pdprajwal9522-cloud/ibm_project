/**
 * @file atsController.js
 * @description Parsons PDF Resumes and performs a Gap Analysis against Job Descriptions.
 * @author Senior Architect
 */

import { PDFParse } from 'pdf-parse';
import { generateJSON } from '../utils/gemini.js';

/**
 * @desc    Audit Resume vs Job Description
 * @route   POST /api/ats
 * @access  Public
 */
export const analyzeResume = async (req, res) => {
    // 1. Validation
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            error: { code: 'NO_FILE', message: "Resume PDF is required." } 
        });
    }

    if (!req.body.jobDescription) {
        return res.status(400).json({ 
            success: false, 
            error: { code: 'NO_JD', message: "Job Description text is required." } 
        });
    }

    try {
        console.log(`[ATS API] Parsing PDF: ${req.file.originalname}`);

        // 2. Parse PDF from Memory Buffer using PDFParse
        const parser = new PDFParse({ data: req.file.buffer });
        await parser.load();
        const text = await parser.getText();
        const extractedText = Array.isArray(text) ? text.map(t => t.text || t).join(' ') : (text?.text || text || "");
        
        if (!extractedText || extractedText.length < 50) {
            throw new Error("PDF_EMPTY");
        }

        // 3. Pre-process Text (Token Optimization)
        // We take the first 3000 chars which usually covers Skills + Recent Exp.
        const resumeText = extractedText.replace(/\s+/g, ' ').substring(0, 3000);
        const jdText = req.body.jobDescription.replace(/\s+/g, ' ').substring(0, 1500);

        // 4. System Prompt
        const prompt = `
            You are an Enterprise Applicant Tracking System (ATS) Expert.
            
            **Candidate Resume:**
            "${resumeText}"

            **Target Job Description:**
            "${jdText}"

            **Task:**
            Perform a strict Gap Analysis. Identify why this resume might get rejected by a robot.

            **Return strictly JSON:**
            {
                "match_score": 65, // Integer 0-100
                "hard_skills_missing": ["Kubernetes", "TypeScript"], // Critical technical gaps
                "soft_skills_missing": ["Leadership", "Agile"], // Soft skill gaps
                "formatting_issues": ["No quantifying metrics found", "Summary too vague"],
                "correction": "Rewrite the bullet point 'Worked on backend' to: 'Engineered a Node.js microservice handling 10k req/s, reducing latency by 40%.'"
            }
        `;

        // 5. AI Inference (Uses Key Rotation automatically)
        const analysis = await generateJSON(prompt);

        return res.status(200).json({ success: true, data: analysis });

    } catch (error) {
        console.error(`[ATS Controller] Error: ${error.message}`);

        if (error.message === 'PDF_EMPTY') {
            return res.status(400).json({ 
                success: false, 
                error: { code: 'PDF_ERROR', message: "Resume text could not be read. Try a different PDF." } 
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: { code: 'SERVER_ERROR', message: "ATS analysis failed." } 
        });
    }
}; 

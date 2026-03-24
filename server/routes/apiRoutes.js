/**
 * @file apiRoutes.js
 * @description Centralized API Routing with specialized Upload strategies.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { analyzeGithub, uploadResumeFile, upload } from '../controllers/githubController.js';
import { analyzeResume } from '../controllers/atsController.js';
import { analyzeLinkedin } from '../controllers/linkedinController.js';
import { generateRoadmap } from '../controllers/roadmapController.js';
import { getLearningResources } from '../controllers/resourceController.js';
import { auditResume, auditResumeText, tailorResume, parseResume, roastResume } from '../controllers/resumeController.js';
import gridfsUpload from '../middleware/upload.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- UPLOAD CONFIGURATIONS ---

// Strategy 1: Memory Storage (For ATS / PDFs / DOCX)
// Why: We parse files instantly with pdf-parse/mammoth, no need to write to disk. Faster.
const ramStorage = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed'), false);
        }
    }
});

// Strategy 2: Disk Storage (For LinkedIn / Images)
// Why: Gemini Vision API requires a file path/URI, so we must save it first.
const diskStorage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, `vision-${Date.now()}${path.extname(file.originalname)}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// --- DEFINING ROUTES ---

// 1. GitHub Intelligence
router.post('/github', analyzeGithub);

// 1b. GitHub Resume Upload (File-based)
router.post('/upload-resume-file', upload.single('resume'), uploadResumeFile);

// 2. ATS Resume Audit (Uses RAM Storage)
router.post('/ats', ramStorage.single('resume'), analyzeResume);

// 3. LinkedIn Vision (Uses Disk Storage)
router.post('/linkedin', diskStorage.single('screenshot'), analyzeLinkedin);

// 4. Career Roadmap
router.post('/roadmap', generateRoadmap);

// 4b. Learning resources (YouTube)
router.get('/resources', getLearningResources);

// 5. Resume Audit (Career Strategist) - Use GridFS Storage for MongoDB (Protected)
router.post('/resume/audit', requireAuth, gridfsUpload.single('resume'), auditResume);

// 5b. Resume Audit from Text (no file upload) (Protected)
router.post('/resume/audit-text', requireAuth, auditResumeText);

// 5c. Resume parse-only (no AI) (Protected)
router.post('/resume/parse', requireAuth, ramStorage.single('resume'), parseResume);

// 6. Resume Tailor (Job Assassin) (Protected)
router.post('/resume/tailor', requireAuth, tailorResume);

// 7. Resume Roaster (Protected)
router.post('/resume/roast', requireAuth, roastResume);

export default router;

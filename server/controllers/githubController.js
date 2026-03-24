import axios from 'axios';
import { generateAnalysis } from '../services/aiService.js';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @desc    Analyze GitHub Profile (Robust Version)
 * @route   POST /api/github
 */
export const analyzeGithub = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ success: false, error: { message: "Username required" } });

        console.log(`[GitHub] Scanning: ${username}...`);

        // 1. Fetch Data (User + 100 Repos to get accurate stats)
        // We use process.env.GITHUB_TOKEN if available to avoid rate limits
        const headers = process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {};
        
        const [userRes, repoRes] = await Promise.all([
            axios.get(`https://api.github.com/users/${username}`, { headers }),
            axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`, { headers })
        ]);

        const profile = userRes.data;
        const repos = repoRes.data;

        // 2. MANUAL CALCULATIONS (Don't rely on AI for this)
        // Calculate Total Stars
        const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);

        // Calculate Language Usage
        const languageMap = {};
        let totalLanguages = 0;
        
        repos.forEach(repo => {
            if (repo.language) {
                languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
                totalLanguages++;
            }
        });
        
        // Sort languages by frequency and create array with percentages
        const topLanguages = Object.keys(languageMap)
            .map(lang => ({
                language: lang,
                percentage: Math.round((languageMap[lang] / totalLanguages) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5); // Take top 5
        
        // Also keep simple array for AI context
        const topLanguageNames = topLanguages.map(l => l.language);

        // Prepare data for AI
        const aiRepoContext = repos.slice(0, 10).map(repo => ({
            name: repo.name,
            desc: repo.description,
            lang: repo.language,
            stars: repo.stargazers_count
        }));

        // 3. Generate AI Intelligence
        // We pass the manually calculated languages to the AI so it knows them
        const analysis = await generateAnalysis(profile, aiRepoContext, topLanguageNames);

        // 4. Send Response
        // We merge Manual Stats with AI Analysis
        res.status(200).json({
            success: true,
            data: {
                profile: {
                    name: profile.name || username,
                    avatar: profile.avatar_url,
                    url: profile.html_url,
                    bio: profile.bio,
                    stats: {
                        followers: profile.followers,
                        repos: profile.public_repos,
                        stars: totalStars, // Uses robust calculation
                        topLanguages: topLanguages // For pie chart with percentages
                    }
                },
                analysis: {
                    ...analysis,
                    // Force the manual tech stack if AI fails or returns "Detected"
                    tech_stack: {
                        frontend: analysis.tech_stack?.frontend[0] !== "Detected" ? analysis.tech_stack.frontend : topLanguageNames,
                        backend: analysis.tech_stack?.backend[0] !== "Detected" ? analysis.tech_stack.backend : []
                    }
                }
            }
        });

    } catch (error) {
        console.error("GitHub Controller Error:", error.message);
        const msg = error.response?.status === 404 ? "User not found" : "Scan failed";
        res.status(500).json({ success: false, error: { message: msg } });
    }
};

/**
 * @desc    Upload Resume File (PDF/DOCX/TXT)
 * @route   POST /api/upload-resume-file
 */
export const uploadResumeFile = async (req, res) => {
    try {
        const { githubUsername } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: "No file uploaded" });

        let extractedText = "";

        // 1. Determine File Type & Extract Text
        if (file.mimetype === 'application/pdf') {
            const parser = new PDFParse({ data: file.buffer });
            await parser.load();
            const text = await parser.getText();
            extractedText = Array.isArray(text) ? text.map(t => t.text || t).join(' ') : (text?.text || text || "");
        } 
        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = result.value;
        } 
        else if (file.mimetype === 'text/plain') {
            extractedText = file.buffer.toString('utf8');
        } 
        else {
            return res.status(400).json({ message: "Unsupported file type. Use PDF, DOCX, or TXT." });
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ message: "Could not extract text from this file." });
        }

        // 2. For now, just return success
        // (You can add database logic here later to save to MongoDB)
        console.log(`[Resume Upload] File processed for ${githubUsername}: ${file.originalname}`);
        console.log(`[Resume Upload] Extracted ${extractedText.length} characters`);

        res.status(200).json({ 
            success: true,
            message: "Resume processed successfully!",
            data: {
                fileName: file.originalname,
                textLength: extractedText.length
            }
        });

    } catch (error) {
        console.error("[Resume Upload Error]:", error);
        res.status(500).json({ message: "File processing failed", error: error.message });
    }
};

export { upload };

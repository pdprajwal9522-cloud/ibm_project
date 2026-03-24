import axios from 'axios';
import UserProfile from '../models/UserProfile.js';

// Helper: Determine Job Role based on languages
const inferJobRoles = (languages) => {
  const roles = [];
  const langMap = languages.map(l => l.language.toLowerCase());

  if (langMap.includes('javascript') && langMap.includes('react')) roles.push('Frontend Developer', 'React Developer');
  if (langMap.includes('node') || langMap.includes('express')) roles.push('Backend Developer', 'Node.js Developer');
  if (langMap.includes('python') && (langMap.includes('pandas') || langMap.includes('numpy'))) roles.push('Data Analyst');
  if (langMap.includes('python') && langMap.includes('django')) roles.push('Python Developer');
  
  // Default if no specific match
  if (roles.length === 0) roles.push('Software Engineer Intern');
  
  return [...new Set(roles)]; // Remove duplicates
};

export const scanGithub = async (req, res) => {
  const { githubUsername } = req.body;

  try {
    // 1. Fetch from GitHub API
    const userRes = await axios.get(`https://api.github.com/users/${githubUsername}`);
    const reposRes = await axios.get(`https://api.github.com/users/${githubUsername}/repos?per_page=100`);

    // 2. Calculate Stats & Languages
    let totalCommits = 0; // Note: Accurate commit count requires complex queries, using approximation or repo count for now
    const languageCounts = {};

    reposRes.data.forEach(repo => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });

    // Convert to percentage
    const totalRepos = reposRes.data.length;
    const topLanguages = Object.keys(languageCounts).map(lang => ({
      language: lang,
      percentage: Math.round((languageCounts[lang] / totalRepos) * 100)
    })).sort((a, b) => b.percentage - a.percentage);

    // 3. Infer Job Roles
    const suggestedRoles = inferJobRoles(topLanguages);

    // 4. Check DB for existing Resume
    // (Assuming we identify user by GitHub username for this standalone tool, 
    // in a real app you'd use req.user.id)
    let userProfile = await UserProfile.findOne({ githubUsername });
    
    // If first time, create basic profile
    if (!userProfile) {
      userProfile = new UserProfile({ githubUsername });
    }
    
    // Update GitHub stats in DB
    userProfile.githubStats = {
      followers: userRes.data.followers,
      repos: userRes.data.public_repos,
      topLanguages
    };
    await userProfile.save();

    // 5. Send Response
    res.status(200).json({
      stats: userProfile.githubStats,
      suggestedRoles: suggestedRoles,
      resumeStatus: {
        hasResume: userProfile.resume.hasResume,
        message: userProfile.resume.hasResume 
          ? "Resume found. Ready for gap analysis." 
          : "⚠️ No resume found. We cannot compare your projects against your resume claims yet."
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "GitHub Scan Failed", error: error.message });
  }
};

// Simple Resume Upload Handler (Text only for now)
export const uploadResumeText = async (req, res) => {
  const { githubUsername, resumeText } = req.body;
  try {
    const user = await UserProfile.findOne({ githubUsername });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.resume.hasResume = true;
    user.resume.textContent = resumeText;
    user.resume.uploadedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Resume saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { scanGithub, uploadResumeText };

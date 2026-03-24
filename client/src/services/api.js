/**
 * @file api.js
 * @description Centralized Axios Service.
 * Handles all HTTP communication with the Backend.
 */

import axios from 'axios';

// Configuration
// Use relative URL to leverage Vite proxy in development
// In Production, this would be an environment variable (import.meta.env.VITE_API_URL)
const API_BASE_URL = '/api';

// Create Axios Instance with Defaults
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30s timeout for AI operations
});

// Attach Authorization header if token exists
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    /**
     * GitHub Intelligence
     * @param {string} username 
     */
    scanGithub: (username) => apiClient.post('/github', { username }),

    /**
     * ATS Resume Audit
     * Note: We don't manually set Content-Type here; Axios sets it automatically for FormData
     * @param {FormData} formData - Keys: 'resume', 'jobDescription'
     */
    scanAts: (formData) => apiClient.post('/ats', formData),

    /**
     * LinkedIn Vision Analysis
     * @param {FormData} formData - Keys: 'screenshot'
     */
    analyzeLinkedin: (formData) => apiClient.post('/linkedin', formData),

    /**
     * Career Roadmap Generation
     * @param {string} skill - e.g. "Docker"
     * @param {string} currentLevel - e.g. "Beginner"
     */
    generateRoadmap: (skill, currentLevel = 'Beginner') => apiClient.post('/roadmap', { skill, currentLevel }),

    /**
     * Learning resources (YouTube)
     * @param {string} skill
     */
    getLearningResources: (skill) => apiClient.get('/resources', { params: { skill } }),

    // --- AUTH ---
    signUp: (name, email, password) => apiClient.post('/auth/signup', { name, email, password }),
    signIn: (email, password) => apiClient.post('/auth/signin', { email, password }),
    getMe: () => apiClient.get('/auth/me'),
    googleAuth: (credential) => apiClient.post('/auth/google', { credential }),
    uploadResume: (formData) => apiClient.post('/auth/upload-resume', formData),
    getResume: () => apiClient.get('/auth/resume'),
    // alias to avoid breaking older calls
    getSavedResume: () => apiClient.get('/auth/resume'),

    // Resume utilities (protected)
    parseResume: (formData) => apiClient.post('/resume/parse', formData),
    auditResumeText: (resumeText) => apiClient.post('/resume/audit-text', { resumeText }),
    tailorResume: (resumeText, jobDescription) =>
        apiClient.post('/resume/tailor', { existingResumeText: resumeText, jobDescription }),

    /**
     * Resume Roaster
     * @param {string} resumeText
     * @param {('Mild'|'Medium'|'Spicy')} roastLevel
     */
    roastResume: (resumeText, roastLevel = 'Mild') => apiClient.post('/resume/roast', { resumeText, roastLevel }),
};

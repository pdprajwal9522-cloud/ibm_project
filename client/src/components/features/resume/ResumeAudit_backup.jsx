import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { Briefcase, AlertTriangle, CheckCircle, Cpu, UploadCloud, ExternalLink, Eye, AlertOctagon, Zap, TrendingUp, XCircle, Target, Award } from 'lucide-react';
import { api } from '../../../services/api';

const ResumeAudit = () => {
    const { resumeData, setResumeData, authUser } = useStore();
    const [file, setFile] = useState(null);
    const [manualText, setManualText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadMode, setUploadMode] = useState("file"); // "file", "text", "paste", or "saved"
    const [savedResume, setSavedResume] = useState(null);
    const [loadingResume, setLoadingResume] = useState(false);

    const handleSelectUploadMode = async (mode) => {
        if (mode !== "saved") {
            setUploadMode(mode);
            return;
        }

        if (savedResume) {
            setUploadMode("saved");
            return;
        }

        if (!authUser) {
            setError("Please sign in to use your saved resume.");
            setUploadMode("file");
            return;
        }

        try {
            setLoadingResume(true);
            const { data } = await api.getResume();
            const resume = data?.resume;
            if (resume?.hasResume && resume.extractedText) {
                setSavedResume(resume);
                setUploadMode("saved");
            } else {
                setSavedResume(null);
                setUploadMode("file");
                setError("No saved resume found. Upload or paste to continue.");
            }
        } catch (err) {
            console.error("Error fetching saved resume:", err);
            setSavedResume(null);
            setUploadMode("file");
            setError("No saved resume found. Upload or paste to continue.");
        } finally {
            setLoadingResume(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError("");
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            let resumeText = "";

            if (uploadMode === "file") {
                if (!file) {
                    setError("Please upload a resume file");
                    setLoading(false);
                    return;
                }
                const formData = new FormData();
                formData.append("resume", file);
                const { data } = await api.parseResume(formData);
                resumeText = data.extractedText;
            } else if (uploadMode === "paste") {
                if (!manualText.trim()) {
                    setError("Please paste your resume text");
                    setLoading(false);
                    return;
                }
                resumeText = manualText;
            } else if (uploadMode === "saved") {
                if (!savedResume) {
                    setError("No saved resume found");
                    setLoading(false);
                    return;
                }
                resumeText = savedResume.extractedText;
            }

            const { data } = await api.auditResumeText(resumeText);
            console.log("Response:", data);
            setResult(data.data);
            setResumeData({ type: 'text', text: resumeText });
        } catch (err) {
            console.error("Analysis error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze resume. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Resume Mode Selection + Upload in one card */}
            <GlassCard className="p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">Select Resume Source</h2>
                
                {/* Horizontal tabs for desktop, vertical for mobile */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => handleSelectUploadMode("file")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            uploadMode === "file" 
                                ? "bg-blue-500 text-white shadow-lg" 
                                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                        }`}
                    >
                        Upload File
                    </button>
                    
                    {savedResume && (
                        <button
                            onClick={() => handleSelectUploadMode("saved")}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                uploadMode === "saved" 
                                    ? "bg-green-500 text-white shadow-lg" 
                                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                            }`}
                        >
                            Use Saved ({savedResume.filename})
                        </button>
                    )}
                    
                    <button
                        onClick={() => handleSelectUploadMode("paste")}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            uploadMode === "paste" 
                                ? "bg-blue-500 text-white shadow-lg" 
                                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                        }`}
                    >
                        Paste Text
                    </button>
                </div>

                {/* Content based on mode */}
                <div className="mt-4">
                    {uploadMode === "file" && (
                        <label className="block">
                            <div className="relative flex items-center justify-center w-full p-6 sm:p-8 border-2 border-dashed border-gray-500 rounded-lg hover:border-blue-400 transition cursor-pointer bg-slate-900/50">
                                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                                <div className="text-center">
                                    <UploadCloud className="mx-auto mb-2 text-blue-400" size={32} />
                                    <p className="text-gray-300 text-sm sm:text-base">{file ? file.name : "Click to upload or drag and drop"}</p>
                                    <p className="text-gray-500 text-xs mt-1">PDF or DOCX (max 5MB)</p>
                                </div>
                            </div>
                        </label>
                    )}

                    {uploadMode === "paste" && (
                        <textarea 
                            value={manualText} 
                            onChange={(e) => setManualText(e.target.value)} 
                            placeholder="Paste your resume text here..." 
                            className="w-full h-40 sm:h-48 p-4 bg-slate-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none text-sm"
                        />
                    )}

                    {uploadMode === "saved" && savedResume && (
                        <div className="p-4 bg-slate-900/50 border border-green-500/30 rounded-lg">
                            <p className="text-gray-300 text-sm">Using saved resume: <strong>{savedResume.filename}</strong></p>
                            <p className="text-xs text-gray-400 mt-1">Uploaded: {new Date(savedResume.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    )}
                    
                    {uploadMode === "saved" && loadingResume && (
                        <p className="text-sm text-gray-400">Loading saved resume...</p>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 rounded-lg">
                        <div className="flex items-start">
                            <AlertTriangle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <GradientButton onClick={handleAnalyze} disabled={loading} className="w-full mt-4">
                    {loading ? "Analyzing..." : "Analyze Resume"}
                </GradientButton>
            </GlassCard>

            {result && (
                <div className="space-y-4">
                    <GlassCard className="p-6 sm:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                            <Cpu className="mr-2 text-blue-400" /> ATS Compatibility Score
                        </h2>

                        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-blue-500/50">
                            <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                                {result.atsScore}%
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-3 sm:mb-4">
                                <div className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full" style={{ width: `${result.atsScore}%` }}></div>
                            </div>
                            <p className="text-gray-300 text-sm sm:text-base">{result.profileSummary}</p>
                            {result.experienceLevel && (
                                <p className="text-gray-400 mt-2 text-xs sm:text-sm">Experience Level: {result.experienceLevel}</p>
                            )}
                            {result.detectedRole && (
                                <p className="text-gray-400 text-xs sm:text-sm">Detected Role: {result.detectedRole}</p>
                            )}
                        </div>

                        {result.detectedSkills && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-green-400 mb-3 sm:mb-4 flex items-center">
                                    <CheckCircle className="mr-2" size={20} /> Detected Skills
                                </h3>
                                {result.detectedSkills.technical && result.detectedSkills.technical.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2">Technical:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.detectedSkills.technical.map((skill, idx) => (
                                                <span key={idx} className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-300 text-xs sm:text-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {result.detectedSkills.soft && result.detectedSkills.soft.length > 0 && (
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2">Soft Skills:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.detectedSkills.soft.map((skill, idx) => (
                                                <span key={idx} className="px-2 sm:px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs sm:text-sm">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.actionableInsights && result.actionableInsights.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-3 sm:mb-4 flex items-center">
                                    <Zap className="mr-2" size={20} /> Actionable Insights
                                </h3>
                                <ul className="space-y-2">
                                    {result.actionableInsights.map((insight, idx) => (
                                        <li key={idx} className="text-gray-300 flex items-start text-sm sm:text-base">
                                            <span className="text-blue-400 mr-2 sm:mr-3 flex-shrink-0">→</span>
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.recommendedJobs && result.recommendedJobs.length > 0 && (
                            <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-purple-400 mb-3 sm:mb-4 flex items-center">
                                    <Briefcase className="mr-2" size={20} /> Recommended Jobs
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {result.recommendedJobs.map((job, idx) => (
                                        <div key={idx} className="p-3 sm:p-4 bg-slate-900/50 border border-purple-500/30 rounded-lg">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-base sm:text-lg font-semibold text-white">{job.role}</h4>
                                                <span className="text-purple-400 font-bold text-sm sm:text-base">{job.matchConfidence}%</span>
                                            </div>
                                            <p className="text-gray-400 text-xs sm:text-sm mb-2">{job.reason}</p>
                                            {job.avgSalary && (
                                                <p className="text-green-400 text-xs sm:text-sm mb-2">💰 {job.avgSalary}</p>
                                            )}
                                            {job.applyOn && job.applyOn.length > 0 && (
                                                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                                                    {job.applyOn.map((platform, pidx) => {
                                                        const searchQuery = encodeURIComponent(job.role);
                                                        const platformUrls = {
                                                            'LinkedIn': `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`,
                                                            'Naukri': `https://www.naukri.com/jobs-${searchQuery.toLowerCase().replace(/\s+/g, '-')}`,
                                                            'Indeed': `https://www.indeed.com/jobs?q=${searchQuery}`,
                                                            'AngelList': `https://wellfound.com/role/${searchQuery.toLowerCase().replace(/\s+/g, '-')}`,
                                                            'Instahyre': `https://www.instahyre.com/search-jobs/?q=${searchQuery}`,
                                                            'Glassdoor': `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${searchQuery}`
                                                        };
                                                        return (
                                                            <a
                                                                key={pidx}
                                                                href={platformUrls[platform] || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 text-xs hover:bg-indigo-500/20 hover:border-indigo-400/50 transition-colors cursor-pointer"
                                                            >
                                                                {platform}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default ResumeAudit;

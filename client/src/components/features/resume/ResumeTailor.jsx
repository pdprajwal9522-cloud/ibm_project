import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { FileText, AlertTriangle, Check, Sparkles, UploadCloud, ChevronRight } from 'lucide-react';
import { api } from '../../../services/api';

const ResumeTailor = () => {
    const navigate = useNavigate();
    const { resumeData, setResumeData, authUser, tailorResult, setTailorResult } = useStore();
    const [jobDescription, setJobDescription] = useState("");
    const [file, setFile] = useState(null);
    const [manualText, setManualText] = useState("");
    const [result, setResult] = useState(tailorResult);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadMode, setUploadMode] = useState("file"); // "file", "paste", or "saved"
    const [savedResume, setSavedResume] = useState(null);
    const [loadingResume, setLoadingResume] = useState(false);

    const handleSelectUploadMode = async (mode) => {
        if (mode !== "saved") {
            setUploadMode(mode);
            return;
        }

        // If we already have it, just switch modes without hitting the API again
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

    const handleTailor = async () => {
        const trimmedJD = (jobDescription || '').trim();
        if (!trimmedJD || trimmedJD.length < 20) {
            setError("Please enter a detailed job description (min 20 characters)");
            return;
        }

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

            const { data } = await api.tailorResume(resumeText, jobDescription);

            setResult(data.data);
            setTailorResult(data.data);
            setResumeData({ type: 'text', text: resumeText });
        } catch (err) {
            console.error("Tailor error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.error || err.message || "Failed to tailor resume. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Compact Resume Mode Selection + Upload */}
            <GlassCard className="p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">Select Resume Source</h2>
                
                {/* Horizontal tabs */}
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

                {/* Resume Content */}
                <div className="mb-4">
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
                            className="w-full h-32 sm:h-40 p-4 bg-slate-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none text-sm"
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

                {/* Job Description in same card */}
                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 text-white">Job Description</h2>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description you want to tailor your resume for..."
                        className="w-full h-32 sm:h-40 p-4 bg-slate-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none text-sm"
                    />
                </div>

                {error && (
                    <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 rounded-lg">
                        <div className="flex items-start">
                            <AlertTriangle className="text-red-400 mr-2 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <GradientButton onClick={handleTailor} disabled={loading} className="w-full mt-4">
                    {loading ? "Tailoring..." : "Tailor Resume"}
                </GradientButton>

                {result && (
                    <button
                        onClick={() => { setResult(null); setTailorResult(null); }}
                        className="w-full mt-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold text-gray-200 hover:bg-white/5 transition-colors"
                    >
                        Clear last result
                    </button>
                )}
            </GlassCard>

            {result && (
                <div className="space-y-4">
                    <GlassCard className="p-6 sm:p-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                            <Sparkles className="mr-2 text-blue-400" /> Tailoring Analysis
                        </h2>

                        {result.matchScore && (
                            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-slate-900/50 rounded-lg border border-blue-500/50">
                                <div className="text-xs sm:text-sm text-gray-400 mb-2">Job Match Score</div>
                                <div className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                                    {result.matchScore}%
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full" style={{ width: `${result.matchScore}%` }}></div>
                                </div>
                                {result.hiringVerdict && (
                                    <p className="text-gray-300 text-sm sm:text-base mt-3">{result.hiringVerdict}: {result.verdict_explanation}</p>
                                )}
                            </div>
                        )}

                        {result.keywordGapMatrix && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-3 sm:mb-4">Keyword Analysis</h3>
                                
                                {result.keywordGapMatrix.matched && result.keywordGapMatrix.matched.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2">✓ Matched Keywords:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.keywordGapMatrix.matched.map((keyword, idx) => (
                                                <span key={idx} className="px-2 sm:px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-300 text-xs sm:text-sm">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {result.keywordGapMatrix.missing && result.keywordGapMatrix.missing.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2">✗ Missing Keywords:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.keywordGapMatrix.missing.map((keyword, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => navigate('/roadmap', { state: { skill: keyword } })}
                                                    className="px-2 sm:px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-300 text-xs sm:text-sm hover:bg-red-500/20 hover:border-red-400/50 transition-colors cursor-pointer"
                                                >
                                                    {keyword}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.bulletPointFixes && result.bulletPointFixes.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-purple-400 mb-3 sm:mb-4">Bullet Point Improvements</h3>
                                <div className="space-y-4">
                                    {result.bulletPointFixes.map((fix, idx) => (
                                        <div key={idx} className="p-3 sm:p-4 bg-slate-900/50 border border-purple-500/30 rounded-lg">
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-400 mb-1">Before:</p>
                                                <p className="text-red-300 text-sm sm:text-base italic">{fix.original}</p>
                                            </div>
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-400 mb-1">After:</p>
                                                <p className="text-green-300 text-sm sm:text-base font-medium">{fix.improved}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">{fix.suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.missingKeywordsSuggestions && result.missingKeywordsSuggestions.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-3 sm:mb-4">How to Add Missing Keywords</h3>
                                <ul className="space-y-2">
                                    {result.missingKeywordsSuggestions.map((item, idx) => (
                                        <li key={idx} className="text-gray-300 flex items-start text-sm sm:text-base p-3 bg-slate-900/50 rounded-lg border border-blue-500/30">
                                            <ChevronRight className="text-blue-400 mr-2 flex-shrink-0 mt-0.5" size={16} />
                                            <div>
                                                <button
                                                    onClick={() => navigate('/roadmap', { state: { skill: item.skill } })}
                                                    className="text-blue-300 font-semibold hover:text-blue-200 transition-colors mr-1"
                                                >
                                                    {item.skill}
                                                </button>
                                                <span className="text-gray-300">{item.suggestion}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result.similarRolesAtOtherCompanies && (
                            <div className="p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                                <h3 className="text-base sm:text-lg font-semibold text-indigo-300 mb-2">Similar Opportunities</h3>
                                <p className="text-gray-300 text-xs sm:text-sm">{result.similarRolesAtOtherCompanies}</p>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default ResumeTailor;

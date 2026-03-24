import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { Briefcase, AlertTriangle, CheckCircle, Cpu, UploadCloud, ExternalLink, Eye, AlertOctagon, Zap, TrendingUp, XCircle, Target, Award, Flame, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';

const ResumeAudit = () => {
    const navigate = useNavigate();
    const { resumeData, setResumeData, authUser, auditResult, setAuditResult } = useStore();
    const [file, setFile] = useState(null);
    const [manualText, setManualText] = useState("");
    const [result, setResult] = useState(auditResult);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadMode, setUploadMode] = useState("file"); // "file", "text", "paste", or "saved"
    const [savedResume, setSavedResume] = useState(null);
    const [loadingResume, setLoadingResume] = useState(false);
    const [roastText, setRoastText] = useState("");
    const [roastLevel, setRoastLevel] = useState("Mild");
    const [roastResult, setRoastResult] = useState(null);
    const [roastLoading, setRoastLoading] = useState(false);
    const [roastError, setRoastError] = useState("");

    const hasAnalyzedResume = Boolean(resumeData?.text);

    useEffect(() => {
        if (resumeData?.text) {
            setRoastText(resumeData.text);
        }
    }, [resumeData?.text]);
    
    const handleSkillClick = (skill) => {
        navigate('/roadmap', { state: { skill } });
    };

    const handleSelectUploadMode = async (mode) => {
        if (mode !== "saved") {
            setUploadMode(mode);
            return;
        }

        if (savedResume) {
            setUploadMode("saved");
            return;
        }

        setLoadingResume(true);
        try {
            const { data } = await api.getResume();
            if (data.resume) {
                setSavedResume(data.resume);
                setUploadMode("saved");
            }
        } catch (err) {
            console.error("Failed to load saved resume:", err);
            setError("Failed to load saved resume");
        } finally {
            setLoadingResume(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setError("File size must be less than 5MB");
            return;
        }
        setFile(selectedFile);
        setError("");
    };

    const handleAnalyze = async () => {
        setError("");
        setLoading(true);
        setResult(null);

        try {
            let resumeText;

            if (uploadMode === "file") {
                if (!file) {
                    setError("Please select a resume file");
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
            setAuditResult(data.data);
            setResumeData({ type: 'text', text: resumeText });
            setRoastText(resumeText);
        } catch (err) {
            console.error("Analysis error:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze resume. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRoast = async () => {
        const textToRoast = roastText.trim() || resumeData?.text || "";

        if (!textToRoast) {
            setRoastError("Add or paste a resume to roast.");
            return;
        }
        setRoastError("");
        setRoastLoading(true);
        setRoastResult(null);
        try {
            const { data } = await api.roastResume(textToRoast, roastLevel);
            if (data?.success) {
                setRoastResult(data.data);
            } else {
                setRoastError(data?.error?.message || "Roast failed.");
            }
        } catch (err) {
            const msg = err.response?.data?.error?.message || err.message || "Roast failed.";
            setRoastError(msg);
        } finally {
            setRoastLoading(false);
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

                {result && (
                    <button
                        onClick={() => { setResult(null); setAuditResult(null); }}
                        className="w-full mt-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold text-gray-200 hover:bg-white/5 transition-colors"
                    >
                        Clear last result
                    </button>
                )}
            </GlassCard>

            {/* Resume Roaster */}
            <GlassCard className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Flame className="text-orange-300" size={18} />
                        <h2 className="text-lg sm:text-xl font-semibold text-white">Resume Roaster</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {["Mild", "Medium", "Spicy"].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setRoastLevel(lvl)}
                                className={`px-3 py-1 rounded-lg text-sm font-semibold border transition-colors ${
                                    roastLevel === lvl ? 'bg-orange-500/20 border-orange-400 text-orange-100' : 'border-white/15 text-gray-200 hover:bg-white/5'
                                }`}
                            >
                                {lvl}
                            </button>
                        ))}
                    </div>
                </div>

                {!hasAnalyzedResume && (
                    <>
                        <p className="text-sm text-gray-400">Paste the resume text you want roasted.</p>
                        <textarea
                            value={roastText}
                            onChange={(e) => setRoastText(e.target.value)}
                            placeholder="Paste resume text or summary to roast..."
                            className="w-full h-32 sm:h-40 p-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-orange-400 focus:outline-none text-sm"
                        />
                    </>
                )}

                {hasAnalyzedResume && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-400/20 rounded-lg text-sm text-emerald-100">
                        it uses the analyzed resume above. You can roast it directly.
                    </div>
                )}

                {roastError && (
                    <div className="flex items-center gap-2 text-sm text-red-300"><AlertCircle size={14} /> {roastError}</div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <GradientButton onClick={handleRoast} loading={roastLoading} disabled={(!roastText && !hasAnalyzedResume) || roastLoading} className="px-4 py-2 text-sm">
                        {roastLoading ? 'Roasting...' : 'Roast my resume'}
                    </GradientButton>
                    {roastResult && (
                        <button
                            onClick={() => { setRoastResult(null); setRoastText(''); }}
                            className="px-4 py-2 rounded-lg border border-white/20 text-sm font-semibold text-gray-200 hover:bg-white/5"
                        >
                            Clear roast
                        </button>
                    )}
                </div>

                {roastResult && (
                    <div className="space-y-3">
                        <div className="text-sm text-orange-200 font-semibold">{roastResult.one_liner}</div>
                        {roastResult.playful_roast?.length > 0 && (
                            <ul className="space-y-1 text-sm text-gray-200">
                                {roastResult.playful_roast.map((line, idx) => (
                                    <li key={idx}>• {line}</li>
                                ))}
                            </ul>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-200">
                            {roastResult.strengths?.length > 0 && (
                                <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3">
                                    <p className="text-emerald-200 text-xs uppercase mb-1">Strengths</p>
                                    <ul className="space-y-1">{roastResult.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                                </div>
                            )}
                            {roastResult.gaps?.length > 0 && (
                                <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
                                    <p className="text-red-200 text-xs uppercase mb-1">Gaps</p>
                                    <ul className="space-y-1">{roastResult.gaps.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                                </div>
                            )}
                        </div>
                        {roastResult.actionable_improvements?.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-200">
                                <p className="text-xs text-gray-400 uppercase mb-1">Actionable improvements</p>
                                <ul className="space-y-1">{roastResult.actionable_improvements.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                            </div>
                        )}
                        {roastResult.warnings?.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-3 text-sm text-amber-100">
                                <p className="text-xs uppercase mb-1">Warnings</p>
                                <ul className="space-y-1">{roastResult.warnings.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                            </div>
                        )}
                    </div>
                )}
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

                        {/* Skill Gaps Section */}
                        {result.skillGaps && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-3 sm:mb-4 flex items-center">
                                    <AlertOctagon className="mr-2" size={20} /> Skill Gaps Analysis
                                </h3>
                                
                                {result.skillGaps.critical && result.skillGaps.critical.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs sm:text-sm font-medium text-red-300 mb-2 flex items-center">
                                            <XCircle className="mr-1" size={16} /> Critical (Must Have):
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.skillGaps.critical.map((skill, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSkillClick(skill)}
                                                    className="px-2 sm:px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-300 text-xs sm:text-sm hover:bg-red-500/20 hover:border-red-400/50 transition-colors cursor-pointer"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {result.skillGaps.recommended && result.skillGaps.recommended.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs sm:text-sm font-medium text-orange-300 mb-2 flex items-center">
                                            <AlertTriangle className="mr-1" size={16} /> Recommended:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.skillGaps.recommended.map((skill, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSkillClick(skill)}
                                                    className="px-2 sm:px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-300 text-xs sm:text-sm hover:bg-orange-500/20 hover:border-orange-400/50 transition-colors cursor-pointer"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {result.skillGaps.niceToHave && result.skillGaps.niceToHave.length > 0 && (
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-yellow-300 mb-2 flex items-center">
                                            <Eye className="mr-1" size={16} /> Nice to Have:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.skillGaps.niceToHave.map((skill, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSkillClick(skill)}
                                                    className="px-2 sm:px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-300 text-xs sm:text-sm hover:bg-yellow-500/20 hover:border-yellow-400/50 transition-colors cursor-pointer"
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recommended Skills to Learn */}
                        {result.recommendedSkillsToLearn && result.recommendedSkillsToLearn.length > 0 && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-3 sm:mb-4 flex items-center">
                                    <Target className="mr-2" size={20} /> Top Skills to Learn
                                </h3>
                                <div className="space-y-3">
                                    {result.recommendedSkillsToLearn.map((item, idx) => (
                                        <div key={idx} className="p-3 sm:p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <button
                                                    onClick={() => handleSkillClick(item.skill)}
                                                    className="text-base sm:text-lg font-semibold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer text-left"
                                                >
                                                    {item.skill}
                                                </button>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    item.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                    item.priority === 'Medium' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                }`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs sm:text-sm">{item.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Strengths and Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 sm:mb-8">
                            {result.strengths && result.strengths.length > 0 && (
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-green-400 mb-3 flex items-center">
                                        <Award className="mr-2" size={20} /> Strengths
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.strengths.map((strength, idx) => (
                                            <li key={idx} className="text-gray-300 flex items-start text-sm">
                                                <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {result.weaknesses && result.weaknesses.length > 0 && (
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-3 flex items-center">
                                        <XCircle className="mr-2" size={20} /> Areas to Improve
                                    </h3>
                                    <ul className="space-y-2">
                                        {result.weaknesses.map((weakness, idx) => (
                                            <li key={idx} className="text-gray-300 flex items-start text-sm">
                                                <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                                                {weakness}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Career Progression */}
                        {result.careerProgression && (
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg sm:text-xl font-semibold text-purple-400 mb-3 sm:mb-4 flex items-center">
                                    <TrendingUp className="mr-2" size={20} /> Career Progression Path
                                </h3>
                                <div className="p-4 sm:p-6 bg-slate-900/50 border border-purple-500/30 rounded-lg">
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-400">Current Level:</span>
                                            <span className="text-base font-semibold text-blue-300">{result.careerProgression.currentLevel}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-400">Next Level:</span>
                                            <span className="text-base font-semibold text-purple-300">{result.careerProgression.nextLevel}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Estimated Timeframe:</span>
                                            <span className="text-base font-semibold text-green-300">{result.careerProgression.timeframe}</span>
                                        </div>
                                    </div>
                                    
                                    {result.careerProgression.keyMilestones && result.careerProgression.keyMilestones.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-purple-300 mb-2">Key Milestones:</p>
                                            <ul className="space-y-2">
                                                {result.careerProgression.keyMilestones.map((milestone, idx) => (
                                                    <li key={idx} className="text-gray-300 flex items-start text-sm">
                                                        <span className="text-purple-400 mr-2 flex-shrink-0">{idx + 1}.</span>
                                                        {milestone}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
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

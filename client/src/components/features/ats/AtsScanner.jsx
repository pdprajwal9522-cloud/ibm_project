import { useState } from 'react';
import { useScanAts } from '../../../hooks/useScanAts';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { UploadCloud, FileText, CheckCircle, AlertOctagon, XCircle } from 'lucide-react';

const AtsScanner = () => {
    // 1. Setup State
    const [file, setFile] = useState(null);
    const [jd, setJd] = useState('');
    const { scan, loading, error } = useScanAts();
    const atsData = useStore((state) => state.atsData);

    const handleScan = () => {
        if(file && jd) scan(file, jd);
    };

    // Helper to calculate color based on score
    const getScoreColor = (score) => {
        const numScore = Number(score) || 0;
        if (numScore >= 80) return "text-emerald-400";
        if (numScore >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 animate-fade-in-up">
            
            {/* --- LEFT COLUMN: INPUTS --- */}
            <div className="space-y-4 sm:space-y-6">
                
                {/* File Upload Zone */}
                <GlassCard className="group relative cursor-pointer hover:bg-white/15 transition-all border-dashed border-2 border-white/20 p-4 sm:p-6">
                    <input 
                        type="file" 
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                        <div className={`p-3 sm:p-4 rounded-full mb-3 sm:mb-4 transition-colors ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-indigo-300'}`}>
                            {file ? <CheckCircle size={28} className="sm:w-8 sm:h-8" /> : <UploadCloud size={28} className="sm:w-8 sm:h-8" />}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white text-center px-4">
                            {file ? file.name : "Drag & Drop Resume (PDF)"}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">Max Size: 5MB</p>
                    </div>
                </GlassCard>

                {/* JD Input */}
                <div className="relative">
                    <div className="absolute top-2 sm:top-3 left-3 sm:left-4 text-[10px] sm:text-xs font-bold text-indigo-300 uppercase tracking-wider bg-slate-900/80 px-2 rounded z-10">
                        Target Job Description
                    </div>
                    <textarea 
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste the Job Description here (e.g. 'We are looking for a Senior React Developer...')"
                        className="w-full h-40 sm:h-48 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 pt-7 sm:pt-8 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none text-xs sm:text-sm leading-relaxed"
                    />
                </div>

                <GradientButton onClick={handleScan} loading={loading} disabled={!file || !jd} className="w-full text-sm sm:text-base py-3">
                    RUN ATS AUDIT
                </GradientButton>

                {error && (
                    <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/30">
                        {error}
                    </p>
                )}
            </div>

            {/* --- RIGHT COLUMN: RESULTS --- */}
            <div className="relative">
                {atsData ? (
                    <div className="space-y-4 sm:space-y-6">
                        
                        {/* Match Score */}
                        <GlassCard delay={0.1} className="text-center py-6 sm:py-8 bg-gradient-to-b from-slate-800/50 to-slate-900/50">
                            <h3 className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 mb-3 sm:mb-4">ATS Compatibility Score</h3>
                            <div className="relative inline-flex items-center justify-center">
                                {/* SVG Circular Progress */}
                                <svg className="w-36 h-36 sm:w-48 sm:h-48 transform -rotate-90">
                                    <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-700 sm:hidden" />
                                    <circle 
                                        cx="72" cy="72" r="64" 
                                        stroke="currentColor" strokeWidth="10" fill="transparent" 
                                        strokeDasharray={402} 
                                        strokeDashoffset={402 - (402 * atsData.match_score) / 100} 
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ease-out ${getScoreColor(atsData.match_score)} sm:hidden`} 
                                    />
                                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-700 hidden sm:block" />
                                    <circle 
                                        cx="96" cy="96" r="88" 
                                        stroke="currentColor" strokeWidth="12" fill="transparent" 
                                        strokeDasharray={552} 
                                        strokeDashoffset={552 - (552 * atsData.match_score) / 100} 
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ease-out ${getScoreColor(atsData.match_score)} hidden sm:block`} 
                                    />
                                </svg>
                                <span className="absolute text-4xl sm:text-5xl font-black text-white">
                                    {atsData.match_score}%
                                </span>
                            </div>
                        </GlassCard>

                        {/* Critical Gaps */}
                        <GlassCard delay={0.2} className="bg-red-900/10 border-red-500/20 p-4 sm:p-6">
                            <h4 className="flex items-center gap-2 text-red-300 font-bold mb-3 sm:mb-4 uppercase text-[10px] sm:text-xs tracking-wider">
                                <AlertOctagon size={14} className="sm:w-4 sm:h-4"/> Critical Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {atsData.hard_skills_missing && Array.isArray(atsData.hard_skills_missing) && atsData.hard_skills_missing.length > 0 ? (
                                    atsData.hard_skills_missing.map((skill, idx) => (
                                        <span key={idx} className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-500/10 text-red-200 rounded-lg text-[10px] sm:text-xs border border-red-500/20">
                                            <XCircle size={10} className="sm:w-3 sm:h-3"/> {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-xs">No critical gaps detected</p>
                                )}
                            </div>
                        </GlassCard>

                        {/* AI Fix */}
                        <GlassCard delay={0.3} className="bg-emerald-900/10 border-emerald-500/20 p-4 sm:p-6">
                            <h4 className="flex items-center gap-2 text-emerald-300 font-bold mb-2 sm:mb-3 uppercase text-[10px] sm:text-xs tracking-wider">
                                <CheckCircle size={14} className="sm:w-4 sm:h-4"/> Suggested Rewrite
                            </h4>
                            <div className="bg-slate-900/50 p-3 sm:p-4 rounded-xl border-l-2 border-emerald-500">
                                <p className="text-gray-300 text-xs sm:text-sm italic leading-relaxed">
                                    "{atsData.correction}"
                                </p>
                            </div>
                        </GlassCard>

                    </div>
                ) : (
                    // Empty State Placeholder
                    <div className="h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/10 rounded-3xl">
                        <FileText size={48} className="text-white mb-3 sm:mb-4 sm:w-16 sm:h-16" />
                        <p className="text-white text-sm sm:text-lg font-light">Analysis Results will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AtsScanner;

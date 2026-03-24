import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScanLinkedin } from '../../../hooks/useScanLinkedin';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { Linkedin, Camera, Upload, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';

const LinkedinScanner = () => {
    // 1. Setup State
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const { analyze, loading, error } = useScanLinkedin();
    const linkedinData = useStore((state) => state.linkedinData);
    const setLinkedinData = useStore((state) => state.setLinkedinData);

    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setLinkedinData(null);
    };

    // Handle File Selection & Preview Generation
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleAnalyze = () => {
        if (file) analyze(file);
    };

    // Cleanup preview URL on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    return (
        <div className="space-y-6">
            {/* Explore Skills Button */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center mb-4"
            >
                <a
                    href="https://skill4skill.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                    Explore Skills with Skill4Skill
                    <span className="text-xs opacity-75">→</span>
                </a>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 animate-fade-in-up">
                
                {/* --- LEFT: UPLOAD & PREVIEW --- */}
                <div className="space-y-4 sm:space-y-6">
                    <GlassCard className="relative overflow-hidden group p-4 sm:p-6">
                        <div className="absolute top-0 left-0 bg-[#0077b5] p-2 sm:p-3 rounded-br-2xl z-20">
                            <Linkedin className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                        </div>

                        {/* Upload Logic */}
                        <div className="relative min-h-[250px] sm:min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
                            
                            {preview ? (
                                <img 
                                    src={preview} 
                                    alt="Profile Preview" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                                />
                            ) : (
                                <div className="text-center p-4 sm:p-6">
                                    <div className="bg-white/10 p-3 sm:p-4 rounded-full inline-block mb-3 sm:mb-4">
                                        <Camera size={28} className="text-indigo-300 sm:w-8 sm:h-8" />
                                    </div>
                                    <h3 className="text-white font-bold text-sm sm:text-base">Upload Profile Screenshot</h3>
                                    <p className="text-xs sm:text-sm text-gray-400 mt-2">Include Banner & Headline</p>
                                </div>
                            )}

                            {/* Hidden Input */}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                            />
                        </div>
                    </GlassCard>

                    <GradientButton 
                        onClick={handleAnalyze} 
                        loading={loading} 
                        disabled={!file} 
                        className="w-full text-sm sm:text-base py-3"
                    >
                        ANALYZE VISUAL BRAND
                    </GradientButton>

                    {error && (
                        <div className="p-3 sm:p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200 text-xs sm:text-sm flex gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5 sm:w-4 sm:h-4" /> {error}
                        </div>
                    )}
                </div>

                {/* --- RIGHT: AI ANALYSIS --- */}
                <div className="space-y-4 sm:space-y-6">
                    {linkedinData ? (
                        <>
                            {/* Clear Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleClear}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-red-200 text-xs sm:text-sm font-bold transition-colors"
                                >
                                    <X size={16} /> Clear Report
                                </button>
                            </div>
                            
                            {/* Score Card */}
                            <GlassCard delay={0.1} className="flex flex-col sm:flex-row items-center justify-between border-l-4 border-[#0077b5] gap-3 sm:gap-0 p-4 sm:p-6">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-[10px] sm:text-xs font-bold text-[#0077b5] uppercase tracking-widest">First Impression Score</h3>
                                    <p className="text-gray-400 text-[10px] sm:text-xs">Based on visual hierarchy & clarity</p>
                                </div>
                                <div className="text-4xl sm:text-5xl font-black text-white">
                                    {linkedinData.visual_score}<span className="text-base sm:text-lg text-gray-500 font-normal">/100</span>
                                </div>
                            </GlassCard>

                            {/* Critique */}
                            <GlassCard delay={0.2} className="bg-red-900/10 border-red-500/20 p-4 sm:p-6">
                                <h4 className="flex items-center gap-2 text-red-300 font-bold mb-2 text-xs sm:text-sm uppercase">
                                    <AlertCircle size={14} className="sm:w-4 sm:h-4"/> Critical Issues
                                </h4>
                                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                                    "{linkedinData.critique}"
                                </p>
                            </GlassCard>

                            {/* Headline Fix */}
                            <GlassCard delay={0.3} className="bg-emerald-900/10 border-emerald-500/20 p-4 sm:p-6">
                                <h4 className="flex items-center gap-2 text-emerald-300 font-bold mb-2 text-xs sm:text-sm uppercase">
                                    <Sparkles size={14} className="sm:w-4 sm:h-4"/> AI Headline Rewrite
                                </h4>
                                <div className="bg-black/30 p-2.5 sm:p-3 rounded-lg border border-white/5 font-mono text-xs sm:text-sm text-emerald-100">
                                    {linkedinData.headline_suggestion}
                                </div>
                            </GlassCard>

                            {/* Action Items */}
                            <GlassCard delay={0.4} className="p-4 sm:p-6">
                                <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider">Optimization Checklist</h4>
                                <motion.ul 
                                    initial={{ opacity: 0 }} 
                                    whileInView={{ opacity: 1 }} 
                                    viewport={{ once: true, amount: 0.2 }}
                                    className="space-y-1.5 sm:space-y-2"
                                >
                                    {linkedinData.action_items?.map((item, idx) => (
                                        <motion.li 
                                            key={idx}
                                            initial={{ opacity: 0, y: 8 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.25, ease: 'easeOut', delay: idx * 0.05 }}
                                            className="flex items-start gap-2 text-xs sm:text-sm text-gray-400"
                                        >
                                            <CheckCircle size={12} className="mt-1 text-[#0077b5] sm:w-3.5 sm:h-3.5 shrink-0" />
                                            {item}
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </GlassCard>

                            {linkedinData.photo_report && (
                                <GlassCard delay={0.5} className="p-4 sm:p-6 bg-white/5 border-white/10">
                                    <h4 className="font-bold text-white mb-3 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Camera size={14} className="text-indigo-300" /> Profile Photo Report
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-300">
                                        <div>
                                            <p className="text-gray-400 text-[11px] uppercase mb-1">Strengths</p>
                                            <ul className="space-y-1">
                                                {linkedinData.photo_report.strengths?.map((p, i) => (
                                                    <li key={i} className="flex gap-2"><CheckCircle size={12} className="text-emerald-400 mt-0.5" />{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[11px] uppercase mb-1">Issues</p>
                                            <ul className="space-y-1">
                                                {linkedinData.photo_report.issues?.map((p, i) => (
                                                    <li key={i} className="flex gap-2"><AlertCircle size={12} className="text-amber-300 mt-0.5" />{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {linkedinData.photo_report.suggestions?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-gray-400 text-[11px] uppercase mb-1">Suggestions</p>
                                            <ul className="space-y-1 text-gray-200">
                                                {linkedinData.photo_report.suggestions.map((p, i) => (
                                                    <li key={i} className="flex gap-2"><Sparkles size={12} className="text-sky-300 mt-0.5" />{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {linkedinData.photo_report.helpful_data && (
                                        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-[12px] text-gray-300">
                                            {Object.entries(linkedinData.photo_report.helpful_data).map(([k, v]) => (
                                                <div key={k} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                                                    <span className="uppercase text-[10px] text-gray-400">{k}</span>
                                                    <span className="text-white text-xs ml-2 text-right">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {typeof linkedinData.photo_report.quality_score === 'number' && (
                                        <div className="mt-3 text-xs text-gray-300">Photo quality: <span className="text-white font-semibold">{linkedinData.photo_report.quality_score}/100</span></div>
                                    )}
                                </GlassCard>
                            )}
                        </>
                    ) : (
                        // Empty State
                        <div className="h-full min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                            <Upload size={40} className="text-white mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                            <p className="text-white font-light text-sm sm:text-base">Results will appear here</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default LinkedinScanner;

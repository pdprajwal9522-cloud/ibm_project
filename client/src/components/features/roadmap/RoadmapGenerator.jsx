import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRoadmap } from '../../../hooks/useRoadmap';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { CountUp } from '../../ui/Animations';
import { api } from '../../../services/api';
import { Map, ArrowRight, Rocket, BookOpen, CheckCircle2, AlertCircle, Clock, Target, Zap, X, Youtube } from 'lucide-react';

const RoadmapGenerator = () => {
    const location = useLocation();
    const [skill, setSkill] = useState('');
    const [level, setLevel] = useState('Beginner');
    const [clientError, setClientError] = useState('');
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [resourceError, setResourceError] = useState('');
    const { generate, loading, error } = useRoadmap();
    const roadmapData = useStore((s) => s.roadmapData);
    const setRoadmapData = useStore((s) => s.setRoadmapData);

    useEffect(() => {
        if (location.state?.skill) {
            setSkill(location.state.skill);
        }
    }, [location.state]);

    const stats = useMemo(() => {
        if (!roadmapData || !Array.isArray(roadmapData) || roadmapData.length === 0) return null;
        return {
            totalWeeks: roadmapData.length,
            totalTasks: roadmapData.reduce((s, w) => s + (w?.tasks?.length || 0), 0),
            projects: roadmapData.length,
            hours: roadmapData.length * 18,
        };
    }, [roadmapData]);

    const validateSkill = (value) => {
        const cleaned = value.trim();
        
        // Check length
        if (cleaned.length < 2 || cleaned.length > 80) return null;
        
        // Must have at least one letter
        if (!/[a-zA-Z]/.test(cleaned)) return null;
        
        // Must match valid character set
        if (!/^[a-zA-Z0-9\s\-+.#]+$/.test(cleaned)) return null;
        
        // Block obvious keyboard mashing: repeated single chars like 'aaaa'
        if (/^([a-zA-Z])\1{3,}$/.test(cleaned)) return null; // 'aaaa', 'bbbb', etc.
        // Block common keyboard row patterns specifically (not all letter words)
        const lower = cleaned.toLowerCase();
        const keyboardPatterns = [
            'qwerty', 'asdfgh', 'zxcvbn', 'qwer', 'asdf', 'zxcv'
        ];
        if (keyboardPatterns.some(p => lower.includes(p))) return null;
        
        // Block mostly consonants or mostly vowels (weird ratio)
        const vowels = cleaned.match(/[aeiouAEIOU]/g)?.length || 0;
        const consonants = cleaned.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g)?.length || 0;
        const totalLetters = vowels + consonants;
        if (totalLetters > 0) {
            const vowelRatio = vowels / totalLetters;
            // Block if too heavily skewed (e.g., all consonants or all vowels)
            if (vowelRatio < 0.15 || vowelRatio > 0.85) return null;
        }
        
        return cleaned;
    };

    const handleGenerate = () => {
        const cleaned = validateSkill(skill);
        if (!cleaned) {
            setClientError('Enter a real skill (min 3 characters, letters required).');
            setRoadmapData(null);
            return;
        }
        setClientError('');
        generate(cleaned, level);
    };

    const handleClear = () => {
        setRoadmapData(null);
        setClientError('');
        setResources([]);
        setResourceError('');
    };

    const fetchResources = async (query) => {
        if (!query || !query.trim()) return;
        setLoadingResources(true);
        setResourceError('');
        try {
            const res = await api.getLearningResources(query);
            const videos = res.data?.data?.videos;
            setResources(Array.isArray(videos) ? videos : []);
        } catch (err) {
            const msg = err.response?.data?.error?.message || err.message || 'Could not fetch resources.';
            setResourceError(msg);
            setResources([]);
        } finally {
            setLoadingResources(false);
        }
    };

    useEffect(() => {
        if (roadmapData && skill) {
            fetchResources(skill);
        }
    }, [roadmapData, skill]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_32%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.08),transparent_30%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:120px_120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 text-xs font-semibold uppercase tracking-[0.2em]">
                        <Rocket size={14} className="animate-pulse" /> Career Roadmap
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
                        Master Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Skill</span>
                    </h1>
                    <p className="text-gray-400 max-w-3xl mx-auto text-base sm:text-lg px-2">
                        Generate a tailored plan with tasks and proof-of-work projects sized between 3 and 6 weeks.
                    </p>

                    <div className="flex flex-col lg:flex-row gap-3 max-w-4xl mx-auto mt-6">
                        <input
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder="Docker, System Design, React Hooks, Kubernetes..."
                            className="flex-1 h-14 sm:h-16 px-4 sm:px-6 rounded-xl bg-white/5 border border-white/10 text-white text-base sm:text-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 placeholder-white/30"
                        />
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="h-14 sm:h-16 px-4 rounded-xl bg-slate-900 border border-purple-400/40 text-white font-semibold focus:outline-none focus:border-purple-300"
                        >
                            <option value="Beginner">🌱 Beginner</option>
                            <option value="Intermediate">📈 Intermediate</option>
                            <option value="Advanced">🚀 Advanced</option>
                        </select>
                        <GradientButton onClick={handleGenerate} loading={loading} disabled={!skill} className="h-14 sm:h-16 px-6 shadow-lg shadow-indigo-500/25">
                            Generate <ArrowRight size={16} className="ml-2" />
                        </GradientButton>
                        {roadmapData && (
                            <button onClick={handleClear} className="h-14 sm:h-16 px-4 rounded-xl border border-red-400/50 text-red-300 bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center">
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {(clientError || error) && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 text-sm">
                            <AlertCircle size={16} /> {clientError || error}
                        </div>
                    )}
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            {
                                icon: Clock,
                                label: 'Weeks',
                                value: stats.totalWeeks,
                                detail: 'Duration adjusts by skill complexity (3-6 weeks).',
                                accent: 'from-indigo-500/40 to-cyan-500/20',
                            },
                            {
                                icon: Target,
                                label: 'Tasks',
                                value: stats.totalTasks,
                                detail: 'Actionable micro-steps; batch similar tasks on busy days.',
                                accent: 'from-purple-500/40 to-pink-500/20',
                            },
                            {
                                icon: Rocket,
                                label: 'Projects',
                                value: stats.projects,
                                detail: 'Proof-of-work builds to showcase weekly progress.',
                                accent: 'from-emerald-500/35 to-teal-500/15',
                            },
                            {
                                icon: Zap,
                                label: 'Hours',
                                value: stats.hours,
                                detail: 'Estimated focused time (~18 hrs/week) to stay on pace.',
                                accent: 'from-amber-500/35 to-orange-500/15',
                            },
                        ].map((s, i) => (
                            <GlassCard
                                key={i}
                                delay={i * 0.05}
                                className={`relative overflow-hidden bg-white/5 border-white/10 p-4 text-center transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10`}
                            >
                                <div className={`absolute inset-0 opacity-60 bg-gradient-to-br ${s.accent}`} aria-hidden />
                                <div className="relative flex flex-col gap-1 items-center">
                                    <div className="flex items-center justify-center gap-2 text-indigo-100 mb-1">
                                        <s.icon size={18} className="drop-shadow" />
                                        <span className="text-2xl font-black text-white"><CountUp to={s.value} /></span>
                                    </div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-gray-200">{s.label}</p>
                                    <p className="text-[11px] text-indigo-50/80 leading-snug">{s.detail}</p>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}

                {(loadingResources || resources.length > 0 || resourceError) && (
                    <GlassCard className="bg-white/5 border-white/10 p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Youtube className="text-red-400" size={18} />
                            <h3 className="text-lg sm:text-xl font-semibold text-white">Top YouTube resources</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Learn the selected skill with curated videos and channels.</p>

                        {loadingResources && (
                            <p className="text-sm text-gray-300">Fetching fresh links...</p>
                        )}

                        {resourceError && (
                            <div className="text-sm text-red-300 mb-3">{resourceError}</div>
                        )}

                        {!loadingResources && !resourceError && resources.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {resources.map((video, idx) => (
                                    <a
                                        key={idx}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-red-300/40 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-20 h-12 flex-shrink-0 bg-slate-800 rounded overflow-hidden">
                                            {video.thumbnail ? (
                                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-red-300 text-xs">YT</div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{video.title}</p>
                                            <p className="text-xs text-gray-400 mt-1">{video.channel}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                )}

                {roadmapData && roadmapData.length > 0 ? (
                    <div className="space-y-4 sm:space-y-5">
                        {roadmapData.map((week, idx) => (
                            <div key={idx} className="relative pl-6 sm:pl-8">
                                {idx < roadmapData.length - 1 && (
                                    <div className="absolute left-3 sm:left-3 top-8 bottom-0 w-px bg-white/10" />
                                )}
                                <div className="absolute left-1.5 sm:left-2 top-3 w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />

                                <GlassCard className="w-full bg-white/5 border border-white/10 px-4 sm:px-6 py-5">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200 bg-indigo-500/15 border border-indigo-400/30 px-3 py-1 rounded-full">
                                                Week {week.week || idx + 1}
                                            </span>
                                            <p className="text-gray-400 text-xs md:text-sm">{week.resources?.length || 0} resources</p>
                                        </div>
                                        <p className="text-gray-400 text-xs md:text-sm">Level: {level}</p>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">{week.theme || week.topic}</h3>

                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-indigo-200 mb-2 flex items-center gap-2">
                                                <BookOpen size={14} /> Tasks
                                            </p>
                                            <ul className="space-y-2">
                                                {(week.tasks || []).map((t, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200 bg-white/5 rounded-lg p-2 border border-white/10">
                                                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5" />
                                                        <span>{t}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                                            <div className="text-emerald-300 text-xs font-semibold flex items-center gap-2 mb-1">
                                                <Rocket size={14} /> Proof of Work
                                            </div>
                                            <p className="text-emerald-100 text-sm leading-relaxed">{week.project}</p>
                                        </div>

                                        {week.resources?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {week.resources.map((r, i) => (
                                                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-100">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-400">
                        <Map size={64} className="mx-auto mb-4 opacity-60" />
                        <p className="text-lg font-semibold">Start by entering a valid skill to plot your journey.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoadmapGenerator;

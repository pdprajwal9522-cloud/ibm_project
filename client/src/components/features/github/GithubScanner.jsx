import { useState, useMemo } from 'react';
import { useScanGithub } from '../../../hooks/useScanGithub';
import useStore from '../../../store/useStore';
import { GlassCard } from '../../ui/GlassCard';
import { GradientButton } from '../../ui/GradientButton';
import { CountUp, Typewriter } from '../../ui/Animations';
import { 
    Search, Terminal, ExternalLink, Cpu, CheckCircle, 
    AlertTriangle, ArrowLeft, Zap, Sparkles, TrendingUp, 
    Briefcase, XCircle, Linkedin 
} from 'lucide-react';
// Added Recharts Imports
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const GithubScanner = () => {
    // --- STATE ---
    const [input, setInput] = useState('');
    const { scan, loading, error } = useScanGithub();
    const { githubData, setGithubData } = useStore();

    // Chart Colors
    const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

    // Custom label renderer to show language names on chart
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, language, percentage }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor={x > cx ? 'start' : 'end'} 
                dominantBaseline="central"
                className="text-xs font-bold"
            >
                {`${language} ${percentage}%`}
            </text>
        );
    };

    // --- CHART DATA LOGIC ---
    const chartData = useMemo(() => {
        if (!githubData) return [];
        let data = githubData.profile?.stats?.topLanguages;
        
        // Fallback Logic
        if (!data || !Array.isArray(data) || data.length === 0) {
            const frontend = githubData.analysis?.tech_stack?.frontend || [];
            const backend = githubData.analysis?.tech_stack?.backend || [];
            const allTech = [...frontend, ...backend].filter(Boolean);

            if (allTech.length > 0) {
                const uniqueTech = [...new Set(allTech)];
                const val = Math.floor(100 / uniqueTech.length);
                data = uniqueTech.map(tech => ({
                    language: tech,
                    percentage: val
                }));
            }
        }
        return Array.isArray(data) ? data : [];
    }, [githubData]);

    // --- HANDLERS ---

    const handleScan = (targetInput = input) => {
        if (!targetInput) return;
        let cleanInput = targetInput.trim().replace(/\/$/, "");
        if (cleanInput.includes('github.com')) {
            cleanInput = cleanInput.split('github.com/')[1].split('/')[0];
        }
        scan(cleanInput);
    };

    const handleReset = () => {
        setGithubData(null);
        setInput('');
    };

    // Helper to generate search URLs for the new Buttons
    const getSearchUrl = (platform, role) => {
        const query = encodeURIComponent(role);
        switch (platform) {
            case 'linkedin': return `https://www.linkedin.com/jobs/search/?keywords=${query}`;
            case 'internshala': return `https://internshala.com/internships/${query.replace(/ /g, '-')}-internships`;
            case 'indeed': return `https://in.indeed.com/jobs?q=${query}`;
            default: return '#';
        }
    };

    // --- SEARCH VIEW (Unchanged) ---
    if (!githubData) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in-up px-4">
                <div className="w-full max-w-3xl space-y-6 sm:space-y-8 text-center">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] sm:text-xs font-mono tracking-wider">
                            <Sparkles size={12} /> ENTERPRISE INTELLIGENCE V2.5
                        </div>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tight px-4">
                            Decode Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Developer.</span>
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-400 max-w-xl mx-auto px-4">
                            Get a detailed engineering audit: Strengths, Weaknesses, and Hiring Fit.
                        </p>
                    </div>

                    <div className="relative group max-w-2xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-[#0f172a] rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border border-white/10 shadow-2xl">
                            <div className="hidden sm:block p-3">
                                <Search className="text-gray-400" size={24} />
                            </div>
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                placeholder="github.com/username"
                                className="flex-1 bg-transparent border-none text-base sm:text-xl text-white placeholder-gray-600 focus:outline-none font-mono px-3 sm:px-0 py-2 sm:py-0"
                                autoFocus
                            />
                            <GradientButton onClick={() => handleScan()} loading={loading} className="py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-sm sm:text-base">
                                AUDIT
                            </GradientButton>
                        </div>
                    </div>

                    {error && (
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm mt-4">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- REPORT VIEW (Updated) ---
    // Debug logging
    if (githubData) {
        console.log('GitHub Data received:', githubData);
        console.log('Profile stats:', githubData.profile?.stats);
        console.log('Top Languages:', githubData.profile?.stats?.topLanguages);
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-10 sm:pb-20 animate-fade-in-up">{/* Header / Nav */}
            <div className="flex items-center justify-between">
                <button onClick={handleReset} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                    <div className="p-1.5 sm:p-2 rounded-full bg-white/5 group-hover:bg-white/10"><ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                    <span className="text-xs sm:text-sm font-bold">New Audit</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
                
                {/* 1. Profile Summary */}
                <GlassCard delay={0.1} className="md:col-span-12 flex flex-col md:flex-row items-center gap-4 sm:gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-indigo-500/30 p-4 sm:p-6">
                    <img src={githubData.profile.avatar} alt="Profile" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.25)]" />
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl font-black text-white">{githubData.profile.name}</h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed px-2 sm:px-0">
                            "{githubData.analysis?.professional_summary}"
                        </p>
                    </div>
                    <div className="text-center px-4 sm:px-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:ml-6 w-full md:w-auto">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${
                                (githubData.analysis?.score || 0) >= 80 ? 'text-emerald-400' : 
                                (githubData.analysis?.score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                <CountUp to={githubData.analysis?.score || 0} />
                            </span>
                            <span className="text-lg sm:text-xl font-bold text-gray-500">/100</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">
                            Audit Score
                        </div>
                    </div>
                </GlassCard>

                {/* 2. Detailed Report Grid */}
                <div className="md:col-span-8 space-y-4 sm:space-y-6">
                    
                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <GlassCard delay={0.2} className="bg-emerald-900/10 border-emerald-500/20 p-4 sm:p-6">
                            <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3 sm:mb-4 uppercase text-[10px] sm:text-xs tracking-wider">
                                <TrendingUp size={14} className="sm:w-4 sm:h-4"/> Engineering Strengths
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {githubData.analysis?.strengths?.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300">
                                        <CheckCircle size={12} className="mt-1 text-emerald-500 shrink-0 sm:w-3.5 sm:h-3.5"/> {item}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>

                        <GlassCard delay={0.3} className="bg-red-900/10 border-red-500/20 p-4 sm:p-6">
                            <h4 className="flex items-center gap-2 text-red-400 font-bold mb-3 sm:mb-4 uppercase text-[10px] sm:text-xs tracking-wider">
                                <XCircle size={14} className="sm:w-4 sm:h-4"/> Areas for Improvement
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                {githubData.analysis?.weaknesses?.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-300">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"/> {item}
                                    </li>
                                ))}
                            </ul>
                        </GlassCard>
                    </div>

                    {/* Best Project Spotlight */}
                    <GlassCard delay={0.4} className="border-l-4 border-purple-500 p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-purple-400 sm:w-4 sm:h-4"/>
                            <h3 className="text-xs sm:text-sm font-bold text-white uppercase">Project Spotlight: {githubData.analysis?.best_project_analysis?.name}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                            {githubData.analysis?.best_project_analysis?.insight}
                        </p>
                    </GlassCard>

                    {/* NEW FEATURE: Career Fit with Buttons */}
                    <GlassCard delay={0.5} className="p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <Briefcase size={14} className="text-blue-400 sm:w-4 sm:h-4"/>
                            <h3 className="text-xs sm:text-sm font-bold text-white uppercase">Recommended Roles & Openings</h3>
                        </div>
                        <div className="grid gap-3 sm:gap-4">
                            {githubData.analysis?.recommended_roles?.map((role, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                                    <span className="font-bold text-gray-200 text-sm sm:text-base">{role}</span>
                                    
                                    {/* Platform Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <a href={getSearchUrl('linkedin', role)} target="_blank" rel="noreferrer" 
                                           className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20 hover:bg-[#0077b5]/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all">
                                            <Linkedin size={12} /> LinkedIn
                                        </a>
                                        <a href={getSearchUrl('internshala', role)} target="_blank" rel="noreferrer" 
                                           className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#1295c9]/10 text-[#1295c9] border border-[#1295c9]/20 hover:bg-[#1295c9]/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all">
                                            <Search size={12} /> Internshala
                                        </a>
                                        <a href={getSearchUrl('indeed', role)} target="_blank" rel="noreferrer" 
                                           className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#2164f3]/10 text-[#2164f3] border border-[#2164f3]/20 hover:bg-[#2164f3]/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all">
                                            <ExternalLink size={12} /> Indeed
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* 3. Tech Stack Sidebar (With Chart) */}
                <div className="md:col-span-4 space-y-4 sm:space-y-6">
                    <GlassCard delay={0.2} className="flex flex-col min-h-[350px] sm:min-h-[400px] p-4 sm:p-6">
                         <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
                            <Cpu size={12} className="sm:w-3.5 sm:h-3.5"/> Tech DNA
                         </h4>
                         
                         {/* CHART CONTAINER WITH FIXED HEIGHT */}
                         <div className="w-full" style={{ height: '200px', minHeight: '200px' }}> 
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%" cy="50%"
                                            innerRadius={45} outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="percentage"
                                            nameKey="language"
                                            stroke="none"
                                            label={renderCustomLabel}
                                            labelLine={false}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs sm:text-sm">
                                    Not enough data for visual graph
                                </div>
                            )}
                         </div>

                         <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                            {githubData.analysis?.tech_stack?.frontend?.map(s => (
                                <span key={s} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 text-gray-300 border border-white/10 rounded text-[10px] sm:text-xs">{s}</span>
                            ))}
                            {githubData.analysis?.tech_stack?.backend?.map(s => (
                                <span key={s} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 text-gray-300 border border-white/10 rounded text-[10px] sm:text-xs">{s}</span>
                            ))}
                         </div>
                    </GlassCard>

                    <GlassCard delay={0.3} className="bg-black/40 border-pink-500/20 p-4 sm:p-6">
                        <h4 className="text-pink-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Terminal size={12} className="sm:w-3.5 sm:h-3.5"/> Final Verdict
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-400 font-mono leading-relaxed">
                            <span className="text-pink-500 mr-2">$</span>
                            <Typewriter text={githubData.analysis?.roast} speed={15} />
                        </p>
                    </GlassCard>
                </div>

            </div>
        </div>
    );
};

export default GithubScanner;

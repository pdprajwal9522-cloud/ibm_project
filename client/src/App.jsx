import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';

// Components
import HeroScene from './components/3d/HeroScene';
import GithubScanner from './components/features/github/GithubScanner';
import AtsScanner from './components/features/ats/AtsScanner';
import RoadmapGenerator from './components/features/roadmap/RoadmapGenerator';
import LinkedinScanner from './components/features/linkedin/LinkedinScanner';
import ResumeAudit from './components/features/resume/ResumeAudit';
import ResumeTailor from './components/features/resume/ResumeTailor';
import ResumeCombined from './components/features/resume/ResumeCombined';

// Icons
import { Github, FileText, Map, Linkedin, Terminal, Menu, X, Briefcase, Target, User, Compass } from 'lucide-react';
import SignIn from './components/features/auth/SignIn';
import SignUp from './components/features/auth/SignUp';
import useStore from './store/useStore';
import { api } from './services/api';

const App = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const authUser = useStore((s) => s.authUser);
    const logout = useStore((s) => s.logout);
    const resumeData = useStore((s) => s.resumeData);
    const setResumeData = useStore((s) => s.setResumeData);

    // Fetch saved resume once after login so all pages can reuse it
    useEffect(() => {
        const fetchResume = async () => {
            try {
                const { data } = await api.getResume();
                const resume = data?.resume;
                if (resume?.hasResume && resume.extractedText) {
                    setResumeData({ type: 'text', text: resume.extractedText, filename: resume.filename });
                }
            } catch (err) {
                // silent fail to avoid blocking UI
                console.warn('Resume prefetch failed', err.message);
            }
        };

        if (authUser && !resumeData) {
            fetchResume();
        }
    }, [authUser, resumeData, setResumeData]);

    const navLinks = [
        { path: '/resume-combined', label: 'Resume Tailor', icon: <FileText size={18}/> },
        { path: '/roadmap', label: 'Career Roadmap', icon: <Map size={18}/> },
        { path: '/linkedin', label: 'Explore', icon: <Compass size={18}/> },
        { path: '/github', label: 'Github Analysis', icon: <Github size={18}/> },
    ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f172a] text-white">
      {/* 3D Interactive Background */}
      <HeroScene />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Terminal size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
                <h1 className="text-base sm:text-xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  SkillVerse<span className="text-indigo-600 dark:text-indigo-400">_AI</span>
                </h1>
            </Link>

                        {/* Desktop Nav */}
            <div className="hidden md:flex gap-1">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                            ${location.pathname === link.path 
                                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {link.icon} {link.label}
                    </Link>
                ))}
                                <div className="ml-2">
                                    {authUser ? (
                                        <button onClick={() => { localStorage.removeItem('auth_token'); logout(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500">
                                            <User size={18}/> {authUser.name} (Logout)
                                        </button>
                                    ) : (
                                        <Link to="/signin" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500">
                                            <User size={18}/> Sign In
                                        </Link>
                                    )}
                                </div>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-white"
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900/95 dark:backdrop-blur-md border-b border-gray-300 dark:border-white/10 shadow-xl"
            >
                <div className="flex flex-col p-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all
                                ${location.pathname === link.path 
                                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                    
                    {/* Mobile Auth Button */}
                    <div className="pt-2 border-t border-white/10">
                        {authUser ? (
                            <button 
                                onClick={() => { 
                                    localStorage.removeItem('auth_token'); 
                                    logout(); 
                                    setMobileMenuOpen(false);
                                }} 
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                                <User size={18}/> {authUser.name} (Logout)
                            </button>
                        ) : (
                            <Link 
                                to="/signin" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                                <User size={18}/> Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </nav>

      {/* Main Content with Page Transitions */}
      <main className="relative z-10 pt-20 sm:pt-24 md:pt-32 pb-10 sm:pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto min-h-[80vh]">
        <AnimatePresence mode='wait'>
            <Routes location={location} key={location.pathname}>
                
                {/* 1. Landing Page (The "Pipeline" View) */}
                <Route path="/" element={
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                    >
                        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono tracking-wider">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                            SYSTEM STATUS: ONLINE
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6">
                            Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Dream Career</span> in Tech
                        </h1>

                        <p className="text-gray-400 text-lg max-w-2xl mb-12 px-4">
                            A complete toolkit to audit your resume, learn new skills, and land your next role.
                        </p>

                        {/* THE PIPELINE VISUALIZATION GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
                            
                            {/* Step 1: Resume Tailor */}
                            <Link to="/resume-combined" className="group relative p-6 bg-[#0f172a] border border-white/10 rounded-2xl hover:border-indigo-500/50 transition-all text-left">
                                <div className="absolute top-4 right-4 text-xs font-bold text-gray-600 group-hover:text-indigo-400">STEP 01</div>
                                <div className="w-12 h-12 bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Audit Resume</h3>
                                <p className="text-sm text-gray-400">Identify gap keywords and parsing errors before applying.</p>
                            </Link>

                            {/* Step 2: Roadmap (The Gap Filler) */}
                            <Link to="/roadmap" className="group relative p-6 bg-[#0f172a] border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all text-left">
                                <div className="absolute top-4 right-4 text-xs font-bold text-gray-600 group-hover:text-purple-400">STEP 02</div>
                                <div className="w-12 h-12 bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                                    <Map size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Bridge Gaps</h3>
                                <p className="text-sm text-gray-400">Generate a 4-week tactical roadmap to learn missing tech.</p>
                            </Link>

                             {/* Step 3: GitHub (The Proof) */}
                             <Link to="/github" className="group relative p-6 bg-[#0f172a] border border-white/10 rounded-2xl hover:border-emerald-500/50 transition-all text-left">
                                <div className="absolute top-4 right-4 text-xs font-bold text-gray-600 group-hover:text-emerald-400">STEP 03</div>
                                <div className="w-12 h-12 bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Github size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Verify Code</h3>
                                <p className="text-sm text-gray-400">Ensure your commit history and code quality match S-Tier standards.</p>
                            </Link>

                        </div>
                    </motion.div>
                }/>

                {/* 2. Feature Pages */}
                <Route path="/ats" element={
                    <ProtectedRoute>
                        <PageWrapper><AtsScanner /></PageWrapper>
                    </ProtectedRoute>
                }/>
                <Route path="/resume-combined" element={
                    <ProtectedRoute>
                        <PageWrapper><ResumeCombined /></PageWrapper>
                    </ProtectedRoute>
                }/>
                <Route path="/roadmap" element={
                    <ProtectedRoute>
                        <PageWrapper><RoadmapGenerator /></PageWrapper>
                    </ProtectedRoute>
                }/>
                <Route path="/linkedin" element={
                    <ProtectedRoute>
                        <PageWrapper><LinkedinScanner /></PageWrapper>
                    </ProtectedRoute>
                }/>
                <Route path="/github" element={
                    <ProtectedRoute>
                        <PageWrapper><GithubScanner /></PageWrapper>
                    </ProtectedRoute>
                }/>

                {/* Auth */}
                <Route path="/signin" element={<PageWrapper><SignIn /></PageWrapper>} />
                <Route path="/signup" element={<PageWrapper><SignUp /></PageWrapper>} />

            </Routes>
        </AnimatePresence>
      </main>

    </div>
  );
};

// Helper Wrapper for consistent page animation
const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

// Simple auth gate: redirects unauthenticated users to sign-in and preserves the intended path.
const ProtectedRoute = ({ children }) => {
    const authUser = useStore((s) => s.authUser);
    const location = useLocation();

    if (!authUser) {
        return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
    }

    return children;
};

export default App;

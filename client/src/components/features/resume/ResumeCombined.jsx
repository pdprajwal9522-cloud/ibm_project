import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Target } from 'lucide-react';
import ResumeAudit from './ResumeAudit';
import ResumeTailor from './ResumeTailor';

const ResumeCombined = () => {
  const [activeTab, setActiveTab] = useState('audit');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const tabs = [
    { id: 'audit', label: 'Resume Auditor', icon: FileText, blurb: 'Parse, score, and fix your resume' },
    { id: 'tailor', label: 'Resume Tailor', icon: Target, blurb: 'Align resume to any job description' },
  ];

  const tabSpring = {
    type: 'spring',
    stiffness: 320,
    damping: 26,
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Compact header with both tabs inline */}
      <div className="sticky top-16 sm:top-20 z-20 bg-[#0f172a]/95 backdrop-blur-md rounded-xl border border-white/10 shadow-lg px-3 sm:px-4 py-3 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                activeTab === tab.id
                  ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/50' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-400' : 'text-gray-500'} />
              <div className="text-left">
                <p className="leading-tight">{tab.label}</p>
                <p className="text-[10px] text-gray-500 hidden sm:block">{tab.blurb}</p>
              </div>
              {activeTab === tab.id && (
                <motion.span
                  layoutId="tabGlow"
                  transition={tabSpring}
                  className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="scroll-mt-24"
          >
            <ResumeAudit />
          </motion.div>
        )}

        {activeTab === 'tailor' && (
          <motion.div
            key="tailor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="scroll-mt-24"
          >
            <ResumeTailor />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeCombined;

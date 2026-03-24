/**
 * @file useStore.js
 * @description Global State Management. 
 * Acts as the 'Single Source of Truth' for the UI.
 * Now includes PERSISTENCE (saves data to LocalStorage).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // --- DATA PERSISTENCE ---
      githubData: null,
      setGithubData: (data) => set({ githubData: data }),

      atsData: null,
      setAtsData: (data) => set({ atsData: data }),

      roadmapData: null,
      setRoadmapData: (data) => set({ roadmapData: data }),

      // Resume audit and tailoring persisted results
      auditResult: null,
      setAuditResult: (data) => set({ auditResult: data }),

      tailorResult: null,
      setTailorResult: (data) => set({ tailorResult: data }),

      linkedinData: null,
      setLinkedinData: (data) => set({ linkedinData: data }),

      // Resume data (shared between Resume Auditor and Career Audit)
      resumeData: null,
      setResumeData: (data) => set({ resumeData: data }),

      // --- GLOBAL LOADING STATE ---
      globalLoading: false,
      setGlobalLoading: (status) => set({ globalLoading: status }),
      
      // Clear Data (Utility for "New Scan" buttons)
      resetAll: () => set({ 
        githubData: null, 
        atsData: null, 
        roadmapData: null, 
        linkedinData: null,
        resumeData: null
      }),

      // --- AUTH STATE ---
      authUser: null,
      authToken: null,
      setAuth: (user, token) => set({ authUser: user, authToken: token }),
      logout: () => set({ authUser: null, authToken: null }),
    }),
    {
      name: 'career-ai-storage', // The key in localStorage
      storage: createJSONStorage(() => localStorage),
      
      // PARTIALIZE: Choose what to save. 
      // We save only data, not loading states.
      partialize: (state) => ({
        githubData: state.githubData,
        atsData: state.atsData,
        roadmapData: state.roadmapData,
        linkedinData: state.linkedinData,
        resumeData: state.resumeData,
        auditResult: state.auditResult,
        tailorResult: state.tailorResult,
        authUser: state.authUser,
        authToken: state.authToken,
      }),
    }
  )
);

export default useStore;

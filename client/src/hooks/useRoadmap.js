import { useState } from 'react';
import { api } from '../services/api';
import useStore from '../store/useStore';

export const useRoadmap = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setRoadmapData = useStore((state) => state.setRoadmapData);

    const generate = async (skill, level = "Beginner") => {
        if (!skill) return;

        setLoading(true);
        setError(null);

        try {
            console.log(`[useRoadmap] Generating roadmap for: ${skill} (Level: ${level})`);
            const res = await api.generateRoadmap(skill, level);
            
            console.log(`[useRoadmap] Response:`, res.data);
            
            if (res.data.success) {
                setRoadmapData(res.data.data);
                console.log(`[useRoadmap] ✅ Roadmap generated successfully`);
            } else {
                throw new Error(res.data.error?.message || "Generation failed");
            }
        } catch (err) {
            console.error(`[useRoadmap] ❌ Error:`, err.response?.data || err.message);
            const msg = err.response?.data?.error?.message || err.message || "Could not generate roadmap.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return { generate, loading, error };
};

import { useState } from 'react';
import { api } from '../services/api';
import useStore from '../store/useStore';

// The "export" keyword here is CRITICAL
export const useScanGithub = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setGithubData = useStore((state) => state.setGithubData);

    const scan = async (username) => {
        if (!username) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const res = await api.scanGithub(username);
            // The backend returns { success: true, data: ... }
            if (res.data.success) {
                setGithubData(res.data.data);
            }
        } catch (err) {
            const msg = err.response?.data?.error?.message || "Failed to analyze profile.";
            setError(msg);
            console.error("[GitHub Hook]", err);
        } finally {
            setLoading(false);
        }
    };

    return { scan, loading, error };
};

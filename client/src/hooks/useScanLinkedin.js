import { useState } from 'react';
import { api } from '../services/api';
import useStore from '../store/useStore';

export const useScanLinkedin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setLinkedinData = useStore((state) => state.setLinkedinData);

    const analyze = async (imageFile) => {
        if (!imageFile) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('screenshot', imageFile);

        try {
            const res = await api.analyzeLinkedin(formData);
            if (res.data.success) {
                setLinkedinData(res.data.data);
            }
        } catch (err) {
            const msg = err.response?.data?.error?.message || "Vision Analysis failed.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return { analyze, loading, error };
};

import { useState } from 'react';
import { api } from '../services/api';
import useStore from '../store/useStore';

export const useScanAts = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const setAtsData = useStore((state) => state.setAtsData);

    const scan = async (file, jobDescription) => {
        if (!file || !jobDescription) {
            setError("Please provide both a Resume (PDF) and Job Description.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('jobDescription', jobDescription);

        try {
            const res = await api.scanAts(formData);
            if (res.data.success) {
                setAtsData(res.data.data);
            }
        } catch (err) {
            const msg = err.response?.data?.error?.message || "ATS Analysis failed.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return { scan, loading, error };
};

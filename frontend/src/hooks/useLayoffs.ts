import { useState, useEffect, useCallback } from 'react';
import type { Layoff } from '../types';
import { fetchLayoffs } from '../api';

interface UseLayoffsResult {
    layoffs: Layoff[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Deduplicate layoffs: keep only one entry per company + employee count + month
const deduplicateLayoffs = (data: Layoff[]): Layoff[] => {
    const seen = new Map<string, Layoff>();

    for (const layoff of data) {
        // Create a key based on company + employee count + month
        const date = new Date(layoff.layoff_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const key = `${layoff.company_name}-${layoff.employees_laid_off}-${monthKey}`;

        // Keep the first (most recent) entry for each unique combination
        if (!seen.has(key)) {
            seen.set(key, layoff);
        }
    }

    return Array.from(seen.values());
};

export const useLayoffs = (): UseLayoffsResult => {
    const [layoffs, setLayoffs] = useState<Layoff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchLayoffs();
            // Deduplicate the data
            const uniqueData = deduplicateLayoffs(data);
            setLayoffs(uniqueData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { layoffs, loading, error, refetch: fetchData };
};

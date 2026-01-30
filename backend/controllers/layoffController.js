const { supabase } = require('../db');
const newsService = require('../services/newsService');

const getLayoffs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('layoffs')
            .select('*')
            .order('layoff_date', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Deduplicate in backend: keep only one entry per company + employee count + month
        const seen = new Map();
        const uniqueData = [];

        for (const layoff of (data || [])) {
            const date = new Date(layoff.layoff_date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const key = `${layoff.company_name}-${layoff.employees_laid_off}-${monthKey}`;

            if (!seen.has(key)) {
                seen.set(key, true);
                uniqueData.push(layoff);
            }
        }

        res.json(uniqueData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const syncLayoffs = async (req, res) => {
    try {
        const result = await newsService.fetchAndStoreLayoffs();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Clean up duplicate entries in database
const cleanupDuplicates = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('layoffs')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const seen = new Map();
        const toDelete = [];

        for (const layoff of (data || [])) {
            const date = new Date(layoff.layoff_date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const key = `${layoff.company_name}-${layoff.employees_laid_off}-${monthKey}`;

            if (seen.has(key)) {
                // This is a duplicate, mark for deletion
                toDelete.push(layoff.id);
            } else {
                seen.set(key, layoff.id);
            }
        }

        // Delete duplicates
        if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('layoffs')
                .delete()
                .in('id', toDelete);

            if (deleteError) {
                return res.status(500).json({ error: deleteError.message });
            }
        }

        console.log(`[CLEANUP] Deleted ${toDelete.length} duplicate entries`);
        res.json({ message: 'Cleanup complete', deleted: toDelete.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete entries with 100,000+ employees (unrealistic counts)
const cleanupLargeEntries = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('layoffs')
            .select('id, company_name, employees_laid_off')
            .gte('employees_laid_off', 100000);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const toDelete = (data || []).map(l => l.id);

        if (toDelete.length > 0) {
            console.log(`[CLEANUP] Deleting ${toDelete.length} entries with 100k+ employees:`, data.map(l => `${l.company_name}: ${l.employees_laid_off}`));

            const { error: deleteError } = await supabase
                .from('layoffs')
                .delete()
                .in('id', toDelete);

            if (deleteError) {
                return res.status(500).json({ error: deleteError.message });
            }
        }

        res.json({ message: 'Large entries cleanup complete', deleted: toDelete.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getLayoffs, syncLayoffs, cleanupDuplicates, cleanupLargeEntries };

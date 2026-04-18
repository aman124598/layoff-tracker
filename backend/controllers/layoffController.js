const { supabase } = require('../db');
const newsService = require('../services/newsService');

const VALID_COMMENT_KINDS = new Set(['general', 'helpful', 'question', 'correction', 'false_flag']);

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

// Get all available sources and their statistics
const getSources = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('layoffs')
            .select('source_name, id')
            .order('source_name', { ascending: true });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Count by source
        const sourceStats = {};
        for (const item of (data || [])) {
            const source = item.source_name || 'Unknown';
            sourceStats[source] = (sourceStats[source] || 0) + 1;
        }

        // Convert to array and sort by count
        const sources = Object.entries(sourceStats)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        res.json({ sources, total: data?.length || 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Get layoffs filtered by source
const getLayoffsBySource = async (req, res) => {
    try {
        const { source } = req.query;

        if (!source) {
            return res.status(400).json({ error: 'Source parameter is required' });
        }

        const { data, error } = await supabase
            .from('layoffs')
            .select('*')
            .eq('source_name', source)
            .order('layoff_date', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Deduplicate
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

// Get statistics about data sources
const getSourceStats = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('layoffs')
            .select('source_name, company_name, employees_laid_off, country, created_at');

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: error.message });
        }

        const stats = {
            total_records: data?.length || 0,
            sources: {},
            by_country: {},
            last_updated: null
        };

        // Get newest record date
        if (data && data.length > 0) {
            const dates = data.map(d => new Date(d.created_at)).sort((a, b) => b - a);
            stats.last_updated = dates[0];
        }

        // Aggregate by source
        for (const item of (data || [])) {
            const source = item.source_name || 'Unknown';
            if (!stats.sources[source]) {
                stats.sources[source] = {
                    count: 0,
                    employees_total: 0,
                    first_seen: null,
                    last_seen: null
                };
            }
            stats.sources[source].count++;
            stats.sources[source].employees_total += item.employees_laid_off || 0;

            const created = new Date(item.created_at);
            if (!stats.sources[source].first_seen) {
                stats.sources[source].first_seen = created;
            }
            stats.sources[source].last_seen = created;

            // Count by country
            const country = item.country || 'Unknown';
            stats.by_country[country] = (stats.by_country[country] || 0) + 1;
        }

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getLayoffComments = async (req, res) => {
    try {
        const layoffId = Number(req.params.layoffId);

        if (!Number.isInteger(layoffId) || layoffId <= 0) {
            return res.status(400).json({ error: 'Invalid layoff id' });
        }

        const { data, error } = await supabase
            .from('layoff_comments')
            .select('*')
            .eq('layoff_id', layoffId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addLayoffComment = async (req, res) => {
    try {
        const layoffId = Number(req.params.layoffId);
        const { display_name, comment_text, comment_kind } = req.body || {};

        if (!Number.isInteger(layoffId) || layoffId <= 0) {
            return res.status(400).json({ error: 'Invalid layoff id' });
        }

        const trimmedText = String(comment_text || '').trim();
        if (!trimmedText) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        if (trimmedText.length > 1000) {
            return res.status(400).json({ error: 'Comment text must be 1000 characters or less' });
        }

        const safeKind = VALID_COMMENT_KINDS.has(comment_kind) ? comment_kind : 'general';
        const safeName = String(display_name || '').trim().slice(0, 80) || 'Anonymous peer';

        const { data: layoff, error: layoffError } = await supabase
            .from('layoffs')
            .select('id')
            .eq('id', layoffId)
            .maybeSingle();

        if (layoffError) {
            return res.status(500).json({ error: layoffError.message });
        }

        if (!layoff) {
            return res.status(404).json({ error: 'Layoff record not found' });
        }

        const { data, error } = await supabase
            .from('layoff_comments')
            .insert({
                layoff_id: layoffId,
                display_name: safeName,
                comment_text: trimmedText,
                comment_kind: safeKind,
            })
            .select('*')
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getLayoffs,
    syncLayoffs,
    cleanupDuplicates,
    cleanupLargeEntries,
    getSources,
    getLayoffsBySource,
    getSourceStats,
    getLayoffComments,
    addLayoffComment,
};

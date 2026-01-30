import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Users, Building2, Globe, IndianRupee, RefreshCw, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Filters } from '../components/Filters';
import { LayoffTable } from '../components/LayoffTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useLayoffs } from '../hooks/useLayoffs';
import { syncLayoffs } from '../api';

type Tab = 'india' | 'worldwide';

export const Dashboard = () => {
    const { layoffs, loading, error, refetch } = useLayoffs();
    const [activeTab, setActiveTab] = useState<Tab>('india');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [syncing, setSyncing] = useState(false);

    // Only keep layoffs with actual employee counts
    const validLayoffs = useMemo(() => {
        return layoffs.filter(l => l.employees_laid_off && l.employees_laid_off > 0);
    }, [layoffs]);

    // Separate India and Worldwide data
    const indiaLayoffs = useMemo(() => {
        return validLayoffs.filter((l) => l.country === 'India');
    }, [validLayoffs]);

    const worldwideLayoffs = useMemo(() => {
        return validLayoffs.filter((l) => l.country !== 'India');
    }, [validLayoffs]);

    const currentLayoffs = activeTab === 'india' ? indiaLayoffs : worldwideLayoffs;

    // Extract unique industries
    const industries = useMemo(() => {
        return [...new Set(currentLayoffs.map((l) => l.industry))].sort();
    }, [currentLayoffs]);

    // Filter layoffs
    const filteredLayoffs = useMemo(() => {
        return currentLayoffs.filter((layoff) => {
            const matchesSearch = layoff.company_name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesIndustry = !selectedIndustry || layoff.industry === selectedIndustry;
            return matchesSearch && matchesIndustry;
        });
    }, [currentLayoffs, searchQuery, selectedIndustry]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalLayoffs = filteredLayoffs.reduce((sum, l) => sum + (l.employees_laid_off || 0), 0);
        const totalCompanies = new Set(filteredLayoffs.map((l) => l.company_name)).size;
        const industriesCount = new Set(filteredLayoffs.map((l) => l.industry)).size;
        return { totalLayoffs, totalCompanies, industriesCount, totalRecords: filteredLayoffs.length };
    }, [filteredLayoffs]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await syncLayoffs();
            refetch();
        } catch (err) {
            console.error('Sync failed:', err);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Switcher */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex bg-[#141414] rounded-2xl border border-[#2a2a2a] p-1.5">
                        <button
                            onClick={() => { setActiveTab('india'); setSelectedIndustry(''); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'india'
                                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-red-600/30'
                                    : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                        >
                            <IndianRupee className="w-4 h-4" />
                            India
                            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${activeTab === 'india' ? 'bg-white/20' : 'bg-red-600/20 text-red-400'
                                }`}>
                                {indiaLayoffs.length}
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('worldwide'); setSelectedIndustry(''); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'worldwide'
                                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30'
                                    : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Worldwide
                            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${activeTab === 'worldwide' ? 'bg-white/20' : 'bg-red-600/20 text-red-400'
                                }`}>
                                {worldwideLayoffs.length}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-red-600/30"
                    >
                        {syncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {syncing ? 'Syncing...' : 'Sync Data'}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        key={`employees-${activeTab}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5 hover:border-red-600/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="text-sm text-neutral-500 font-medium">Total Laid Off</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.totalLayoffs.toLocaleString()}</p>
                    </motion.div>

                    <motion.div
                        key={`companies-${activeTab}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5 hover:border-red-600/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="text-sm text-neutral-500 font-medium">Companies</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.totalCompanies}</p>
                    </motion.div>

                    <motion.div
                        key={`industries-${activeTab}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5 hover:border-red-600/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="text-sm text-neutral-500 font-medium">Industries</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.industriesCount}</p>
                    </motion.div>

                    <motion.div
                        key={`records-${activeTab}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-5 hover:border-red-600/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="text-sm text-neutral-500 font-medium">Records</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.totalRecords}</p>
                    </motion.div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <Filters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedCountry=""
                        onCountryChange={() => { }}
                        selectedIndustry={selectedIndustry}
                        onIndustryChange={setSelectedIndustry}
                        countries={[]}
                        industries={industries}
                    />
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState message={error} onRetry={refetch} />
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: activeTab === 'india' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: activeTab === 'india' ? 20 : -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <LayoffTable layoffs={filteredLayoffs} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#2a2a2a] mt-12 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-neutral-600">
                        Data sourced from NewsAPI • Auto-updates every 30 minutes
                    </p>
                </div>
            </footer>
        </div>
    );
};

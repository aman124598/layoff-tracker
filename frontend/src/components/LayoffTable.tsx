import { motion } from 'framer-motion';
import { ExternalLink, Building2, Calendar, Users, MapPin, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Layoff } from '../types';

interface LayoffTableProps {
    layoffs: Layoff[];
}

export const LayoffTable = ({ layoffs }: LayoffTableProps) => {
    // Filter to only show records with actual employee counts
    const validLayoffs = layoffs.filter(l => l.employees_laid_off && l.employees_laid_off > 0);

    if (validLayoffs.length === 0) {
        return (
            <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-12 text-center">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No layoffs found</h3>
                <p className="text-sm text-neutral-500">Try adjusting your filters or sync new data.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Company</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Employees</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Country</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Industry</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Source</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a]">
                        {validLayoffs.map((layoff, index) => (
                            <motion.tr
                                key={layoff.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="hover:bg-[#1a1a1a] transition-colors group"
                            >
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-600/20 rounded-xl flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-red-500" />
                                        </div>
                                        <span className="font-semibold text-white">{layoff.company_name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-sm text-neutral-400">
                                    {format(parseISO(layoff.layoff_date), 'MMM d, yyyy')}
                                </td>
                                <td className="py-4 px-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-600/20 text-red-400 rounded-lg text-sm font-bold">
                                        <Users className="w-4 h-4" />
                                        {layoff.employees_laid_off?.toLocaleString()}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-1.5 text-sm text-neutral-400">
                                        <MapPin className="w-4 h-4 text-neutral-600" />
                                        {layoff.country}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-300 rounded-lg text-sm">
                                        <Briefcase className="w-4 h-4 text-neutral-500" />
                                        {layoff.industry}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <a
                                        href={layoff.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
                                    >
                                        View
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-[#2a2a2a]">
                {validLayoffs.map((layoff, index) => (
                    <motion.div
                        key={layoff.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 hover:bg-[#1a1a1a] transition-colors"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-600/20 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{layoff.company_name}</h3>
                                    <p className="text-xs text-neutral-500">{layoff.industry}</p>
                                </div>
                            </div>
                            <a
                                href={layoff.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-red-500 hover:bg-red-600/10 rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/10 border border-red-600/20 rounded-lg text-xs text-red-400 font-bold">
                                <Users className="w-3 h-3" />
                                {layoff.employees_laid_off?.toLocaleString()} laid off
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-neutral-400">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(layoff.layoff_date), 'MMM d, yyyy')}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-neutral-400">
                                <MapPin className="w-3 h-3" />
                                {layoff.country}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

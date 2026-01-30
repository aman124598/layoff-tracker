import { Search, X } from 'lucide-react';

interface FiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedCountry: string;
    onCountryChange: (value: string) => void;
    selectedIndustry: string;
    onIndustryChange: (value: string) => void;
    countries: string[];
    industries: string[];
}

export const Filters = ({
    searchQuery,
    onSearchChange,
    selectedIndustry,
    onIndustryChange,
    industries,
}: FiltersProps) => {
    const hasFilters = searchQuery || selectedIndustry;

    const clearFilters = () => {
        onSearchChange('');
        onIndustryChange('');
    };

    return (
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-4">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all"
                    />
                </div>

                {/* Industry Filter */}
                <div className="relative">
                    <select
                        value={selectedIndustry}
                        onChange={(e) => onIndustryChange(e.target.value)}
                        className="w-full lg:w-48 px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all cursor-pointer"
                    >
                        <option value="">All Industries</option>
                        {industries.map((industry) => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters */}
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20 rounded-xl text-sm font-medium transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};

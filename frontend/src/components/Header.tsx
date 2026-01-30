import { TrendingDown } from 'lucide-react';

export const Header = () => {
    return (
        <header className="bg-[#0f0f0f] border-b border-[#2a2a2a] sticky top-0 z-50 backdrop-blur-xl bg-opacity-90">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                            <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Layoff Tracker</h1>
                            <p className="text-xs text-neutral-500">Real-time workforce changes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-full">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-red-400">Live</span>
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

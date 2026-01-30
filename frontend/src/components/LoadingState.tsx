import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
    return (
        <div className="bg-[#141414] rounded-2xl border border-[#2a2a2a] p-12">
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
                <p className="text-sm text-neutral-500">Loading layoff data...</p>
            </div>
        </div>
    );
};

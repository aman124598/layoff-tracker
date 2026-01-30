import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    message: string;
    onRetry: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
    return (
        <div className="bg-[#141414] rounded-2xl border border-red-900/30 p-12">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
                <p className="text-sm text-neutral-500 mb-6 max-w-md">{message}</p>
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
};

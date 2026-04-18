import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
    ExternalLink,
    Building2,
    Calendar,
    Users,
    MapPin,
    Briefcase,
    MessageSquare,
    MessageSquarePlus,
    Send,
    X,
    Lightbulb,
    ShieldAlert,
    CircleHelp,
    TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { addLayoffComment, fetchLayoffComments } from '../api';
import type { Layoff, LayoffComment, CommentKind } from '../types';

interface LayoffTableProps {
    layoffs: Layoff[];
}

const COMMENT_KIND_META: Record<CommentKind, { label: string; tone: string; icon: LucideIcon }> = {
    general: { label: 'General', tone: 'bg-neutral-600/10 text-neutral-300 border-neutral-600/20', icon: MessageSquare },
    helpful: { label: 'Helpful', tone: 'bg-emerald-600/10 text-emerald-300 border-emerald-600/20', icon: Lightbulb },
    question: { label: 'Question', tone: 'bg-sky-600/10 text-sky-300 border-sky-600/20', icon: CircleHelp },
    correction: { label: 'Correction', tone: 'bg-amber-600/10 text-amber-300 border-amber-600/20', icon: ShieldAlert },
    false_flag: { label: 'False Flag', tone: 'bg-rose-600/10 text-rose-300 border-rose-600/20', icon: TriangleAlert },
};

export const LayoffTable = ({ layoffs }: LayoffTableProps) => {
    // Filter to only show records with actual employee counts
    const validLayoffs = layoffs.filter(l => l.employees_laid_off && l.employees_laid_off > 0);
    const [selectedLayoff, setSelectedLayoff] = useState<Layoff | null>(null);
    const [comments, setComments] = useState<LayoffComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [commentKind, setCommentKind] = useState<CommentKind>('general');

    useEffect(() => {
        const loadComments = async () => {
            if (!selectedLayoff) {
                setComments([]);
                return;
            }

            setLoadingComments(true);
            setCommentError(null);

            try {
                const data = await fetchLayoffComments(selectedLayoff.id);
                setComments(data);
            } catch (err) {
                setCommentError(err instanceof Error ? err.message : 'Failed to load comments');
            } finally {
                setLoadingComments(false);
            }
        };

        loadComments();
    }, [selectedLayoff]);

    const openDiscussion = (layoff: Layoff) => {
        setSelectedLayoff((current) => (current?.id === layoff.id ? null : layoff));
        setCommentError(null);
        setCommentText('');
        setCommentKind('general');
    };

    const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedLayoff) return;

        const trimmedText = commentText.trim();
        if (!trimmedText) {
            setCommentError('Write a comment before posting.');
            return;
        }

        setSubmittingComment(true);
        setCommentError(null);

        try {
            const savedComment = await addLayoffComment(selectedLayoff.id, {
                display_name: displayName,
                comment_text: trimmedText,
                comment_kind: commentKind,
            });

            setComments((current) => [...current, savedComment]);
            setCommentText('');
            setCommentKind('general');
        } catch (err) {
            setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };

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
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Link</th>
                            <th className="text-left py-4 px-6 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Community</th>
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
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-xs font-medium">
                                        {layoff.source_name || 'Unknown'}
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
                                <td className="py-4 px-6">
                                    <button
                                        type="button"
                                        onClick={() => openDiscussion(layoff)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-600/20 bg-red-600/10 text-red-300 text-xs font-medium hover:bg-red-600/20 transition-colors"
                                    >
                                        <MessageSquarePlus className="w-4 h-4" />
                                        Discuss
                                    </button>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg text-xs text-blue-400 font-medium">
                                {layoff.source_name || 'Unknown'}
                            </span>
                            <button
                                type="button"
                                onClick={() => openDiscussion(layoff)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/10 border border-red-600/20 rounded-lg text-xs text-red-300 font-medium"
                            >
                                <MessageSquarePlus className="w-3 h-3" />
                                Discuss
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {selectedLayoff && (
                <div className="mt-6 border border-red-600/20 bg-[#101010] rounded-2xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6 p-5 lg:p-6">
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-semibold mb-2">Community discussion</p>
                                    <h3 className="text-xl font-bold text-white">{selectedLayoff.company_name}</h3>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        Add context, ask for help, or flag a report if it looks off.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLayoff(null)}
                                    className="p-2 rounded-lg border border-[#2a2a2a] text-neutral-400 hover:text-white hover:border-red-600/30 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                {loadingComments ? (
                                    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 text-sm text-neutral-500">
                                        Loading comments...
                                    </div>
                                ) : commentError ? (
                                    <div className="rounded-xl border border-rose-600/20 bg-rose-600/10 p-4 text-sm text-rose-300">
                                        {commentError}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4 text-sm text-neutral-500">
                                        No peer comments yet. Be the first to add context.
                                    </div>
                                ) : (
                                    comments.map((comment) => {
                                        const meta = COMMENT_KIND_META[comment.comment_kind] || COMMENT_KIND_META.general;
                                        const KindIcon = meta.icon;

                                        return (
                                            <div key={comment.id} className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-4">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                                                        <KindIcon className="w-4 h-4 text-red-400" />
                                                        {comment.display_name}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${meta.tone}`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-xs text-neutral-500">
                                                        {format(parseISO(comment.created_at), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                                <p className="text-sm leading-6 text-neutral-300 whitespace-pre-wrap">
                                                    {comment.comment_text}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleCommentSubmit} className="lg:w-[360px] rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 space-y-4">
                            <div>
                                <h4 className="text-base font-semibold text-white">Add your note</h4>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Keep it useful, factual, or clearly label a false flag if needed.
                                </p>
                            </div>

                            <label className="block space-y-2">
                                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Display name</span>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    placeholder="Anonymous peer"
                                    className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Comment type</span>
                                <select
                                    value={commentKind}
                                    onChange={(event) => setCommentKind(event.target.value as CommentKind)}
                                    className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600"
                                >
                                    <option value="general">General</option>
                                    <option value="helpful">Helpful</option>
                                    <option value="question">Question</option>
                                    <option value="correction">Correction</option>
                                    <option value="false_flag">False flag</option>
                                </select>
                            </label>

                            <label className="block space-y-2">
                                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Your comment</span>
                                <textarea
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    rows={5}
                                    placeholder="Share context, a correction, or a helpful link..."
                                    className="w-full rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 focus:border-red-600 resize-none"
                                />
                            </label>

                            {commentError && (
                                <div className="rounded-xl border border-rose-600/20 bg-rose-600/10 px-4 py-3 text-sm text-rose-300">
                                    {commentError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submittingComment}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submittingComment ? 'Posting...' : 'Post public comment'}
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

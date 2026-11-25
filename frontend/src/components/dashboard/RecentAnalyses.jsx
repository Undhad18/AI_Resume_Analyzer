import { Link } from "react-router-dom";
import {
    Sparkles,
    ArrowUpRight,
    Clock,
    Award,
    TrendingUp,
    AlertCircle
} from "lucide-react";

/**
 * RecentAnalyses Component
 * Displays the latest AI analyses and ATS scores for the authenticated user
 * 
 * @param {object} props
 * @param {Array<object>} props.analyses - List of recent analysis records
 * @param {boolean} [props.isLoading=false] - Loading state
 */
const RecentAnalyses = ({ analyses = [], isLoading = false }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "Recently";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return "Recently";
        }
    };

    const getScoreBadge = (score) => {
        if (score === null || score === undefined) {
            return (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                    Pending
                </span>
            );
        }

        const numericScore = Number(score);

        if (numericScore >= 80) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Award size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold">{numericScore}/100</span>
                </div>
            );
        }

        if (numericScore >= 60) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <TrendingUp size={14} className="text-amber-600" />
                    <span className="text-xs font-bold">{numericScore}/100</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle size={14} className="text-rose-600" />
                <span className="text-xs font-bold">{numericScore}/100</span>
            </div>
        );
    };

    const getStatusIndicator = (status) => {
        if (status === "completed") {
            return (
                <span className="text-xs text-emerald-600 font-medium capitalize">
                    Completed
                </span>
            );
        }
        if (status === "failed") {
            return (
                <span className="text-xs text-rose-600 font-medium capitalize">
                    Failed
                </span>
            );
        }
        return (
            <span className="text-xs text-blue-600 font-medium capitalize animate-pulse">
                {status || "In Progress"}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Recent Analysis Reports
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Latest AI scoring and ATS optimization results
                    </p>
                </div>

                <Link
                    to="/history"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                    <span>View All</span>
                    <ArrowUpRight size={16} />
                </Link>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-center">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                                <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                </div>
                                <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                            No Analysis Reports Yet
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            Submit a resume for AI analysis to get detailed ATS scores, industry keyword metrics, and suggestions.
                        </p>
                        <Link
                            to="/resume-analysis"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                            <Sparkles size={14} />
                            <span>Analyze a Resume</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Sparkles size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                            {analysis.resumeTitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                            {getStatusIndicator(analysis.status)}
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(analysis.analyzedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {getScoreBadge(analysis.overallScore)}
                                    <Link
                                        to={`/resume-analysis?analysisId=${analysis.id}`}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors hidden sm:inline-block"
                                    >
                                        View Report
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentAnalyses;

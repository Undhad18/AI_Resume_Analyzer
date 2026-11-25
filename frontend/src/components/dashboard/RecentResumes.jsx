import { Link } from "react-router-dom";
import {
    FileText,
    Upload,
    ArrowUpRight,
    Clock,
    FileSpreadsheet,
    FileCheck
} from "lucide-react";

/**
 * RecentResumes Component
 * Displays the latest uploaded resumes for the authenticated user
 * 
 * @param {object} props
 * @param {Array<object>} props.resumes - List of recent resumes
 * @param {boolean} [props.isLoading=false] - Loading state
 */
const RecentResumes = ({ resumes = [], isLoading = false }) => {
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

    const getStatusBadge = (status) => {
        switch (status) {
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Ready
                    </span>
                );
            case "processing":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Processing
                    </span>
                );
            case "failed":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Failed
                    </span>
                );
            case "uploaded":
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Uploaded
                    </span>
                );
        }
    };

    const getFileTypeIcon = (fileType) => {
        const type = (fileType || "").toLowerCase();
        if (type === "pdf") {
            return (
                <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                </div>
            );
        }
        return (
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={18} />
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Recent Resumes
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Your latest uploaded resume documents
                    </p>
                </div>

                <Link
                    to="/resumes"
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
                                <div className="w-9 h-9 bg-slate-200 rounded-lg shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                                </div>
                                <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                ) : resumes.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <FileCheck size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                            No Resumes Found
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                            Upload your existing resume to unlock AI scoring, keyword matching, and targeted improvements.
                        </p>
                        <Link
                            to="/upload"
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                            <Upload size={14} />
                            <span>Upload Resume</span>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {getFileTypeIcon(resume.fileType)}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                            {resume.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                            {resume.fileType && (
                                                <span className="uppercase font-medium text-slate-500">
                                                    {resume.fileType}
                                                </span>
                                            )}
                                            {resume.fileType && <span>•</span>}
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(resume.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {getStatusBadge(resume.status)}
                                    <Link
                                        to={`/resume-analysis?resumeId=${resume.id}`}
                                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:inline-block"
                                    >
                                        Analyze
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

export default RecentResumes;

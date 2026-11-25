import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    Eye,
    Download,
    Trash2,
    UploadCloud,
    Plus,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    FileSearch
} from "lucide-react";
import { getAllResumes, downloadResume, deleteResume } from "../../services/resumeService";
import PdfPreviewModal from "../../components/resumes/PdfPreviewModal";
import DeleteResumeDialog from "../../components/resumes/DeleteResumeDialog";
import ExtractedTextModal from "../../components/resumes/ExtractedTextModal";
import ResumeAnalysisModal from "../../components/resumes/ResumeAnalysisModal";

/**
 * Format bytes to readable string (B, KB, MB)
 */
const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

/**
 * Format timestamp safely
 */
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

const MyResumes = () => {
    const [resumes, setResumes] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    // Modal states
    const [previewTarget, setPreviewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [textExtractTarget, setTextExtractTarget] = useState(null);
    const [analysisTarget, setAnalysisTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadResumes = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAllResumes({ page, limit: 10 });
            const list = data?.resumes || (Array.isArray(data) ? data : []);
            setResumes(list);
            if (data?.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error("Failed to load resumes:", err);
            setError(err?.message || "Failed to load your resumes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadResumes(1);
    }, [loadResumes]);

    // Handle delete execution
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteResume(deleteTarget.id);
            setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            setActionSuccess(`Successfully deleted "${deleteTarget.originalFilename || deleteTarget.title}".`);
            setDeleteTarget(null);
        } catch (err) {
            console.error("Delete failure:", err);
            setError(err?.message || "Failed to delete resume. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = (resume) => {
        downloadResume(resume.id, resume.originalFilename || "resume.pdf");
    };

    return (
        <div className="w-full space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <Sparkles size={14} />
                        <span>Document Management</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        My Resumes
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm max-w-xl">
                        View, preview, download, and manage your uploaded and analyzed resumes.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => loadResumes(pagination.page)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition cursor-pointer disabled:opacity-50"
                        title="Refresh List"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Upload New Resume</span>
                    </Link>
                </div>
            </div>

            {/* Success Alert */}
            {actionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>{actionSuccess}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setActionSuccess(null)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadResumes(pagination.page)}
                        className="text-xs font-bold px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Content States */}
            {isLoading ? (
                /* Skeleton State */
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="w-44 h-4 bg-slate-200 rounded" />
                                    <div className="w-28 h-3 bg-slate-100 rounded" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                                <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : resumes.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UploadCloud size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Resumes Uploaded Yet</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
                        Upload your first PDF or DOCX resume to extract skills, evaluate ATS compatibility, and receive AI optimization suggestions.
                    </p>
                    <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Upload Resume Now</span>
                    </Link>
                </div>
            ) : (
                /* Resume Table / Cards */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Document</th>
                                    <th className="py-3.5 px-6">Format</th>
                                    <th className="py-3.5 px-6">File Size</th>
                                    <th className="py-3.5 px-6">Uploaded</th>
                                    <th className="py-3.5 px-6">Status</th>
                                    <th className="py-3.5 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {resumes.map((resume) => {
                                    const isDocx =
                                        resume.fileType === "docx" ||
                                        resume.originalFilename?.toLowerCase().endsWith(".docx");
                                    return (
                                        <tr key={resume.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                        isDocx ? "bg-sky-50 text-sky-600" : "bg-rose-50 text-rose-600"
                                                    }`}>
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="truncate max-w-xs">
                                                        <span className="font-bold text-slate-900 block truncate" title={resume.originalFilename}>
                                                            {resume.originalFilename || resume.title || "Resume"}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            ID: #{resume.id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    isDocx
                                                        ? "bg-sky-100 text-sky-800"
                                                        : "bg-rose-100 text-rose-800"
                                                }`}>
                                                    {isDocx ? "DOCX" : "PDF"}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 font-medium text-slate-600">
                                                {formatFileSize(resume.fileSize)}
                                            </td>

                                            <td className="py-4 px-6 text-slate-500">
                                                {formatDate(resume.createdAt)}
                                            </td>

                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span>{resume.status || "Uploaded"}</span>
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAnalysisTarget(resume)}
                                                        className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                                        title="AI Resume Analysis"
                                                    >
                                                        <Sparkles size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTextExtractTarget(resume)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                                        title={isDocx ? "Extract DOCX Text" : "Extract PDF Text"}
                                                    >
                                                        <FileSearch size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewTarget(resume)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        title={isDocx ? "View Details" : "Preview PDF"}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(resume)}
                                                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                                        title="Download Document"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(resume)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        title="Delete Resume"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 text-xs">
                            <span className="text-slate-500">
                                Showing Page <span className="font-bold text-slate-700">{pagination.page}</span> of{" "}
                                <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.total} documents)
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => loadResumes(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => loadResumes(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <PdfPreviewModal
                isOpen={!!previewTarget}
                onClose={() => setPreviewTarget(null)}
                resume={previewTarget}
            />

            <DeleteResumeDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                resume={deleteTarget}
                isDeleting={isDeleting}
            />

            <ExtractedTextModal
                isOpen={!!textExtractTarget}
                onClose={() => setTextExtractTarget(null)}
                resume={textExtractTarget}
            />

            <ResumeAnalysisModal
                isOpen={!!analysisTarget}
                onClose={() => setAnalysisTarget(null)}
                resume={analysisTarget}
            />
        </div>
    );
};

export default MyResumes;

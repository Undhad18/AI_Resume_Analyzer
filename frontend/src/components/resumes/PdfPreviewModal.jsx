import { useState, useEffect } from "react";
import { X, Download, AlertTriangle, Loader2, FileText } from "lucide-react";
import { previewResumePdf, downloadResume } from "../../services/resumeService";

const PdfPreviewModal = ({ isOpen, onClose, resume }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !resume) {
            return;
        }

        // If DOCX, browsers cannot natively preview it
        if (resume.fileType === "docx" || resume.originalFilename?.toLowerCase().endsWith(".docx")) {
            return;
        }

        let isMounted = true;
        let objectUrl = null;
        setIsLoading(true);
        setError(null);

        previewResumePdf(resume.id)
            .then((blob) => {
                if (!isMounted) return;
                objectUrl = window.URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Preview error:", err);
                setError(
                    err?.message ||
                    err?.response?.data?.message ||
                    "Unable to load document preview."
                );
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
            if (objectUrl) {
                window.URL.revokeObjectURL(objectUrl);
            }
            setBlobUrl(null);
            setError(null);
        };
    }, [isOpen, resume]);

    if (!isOpen || !resume) return null;

    const isDocx =
        resume.fileType === "docx" ||
        resume.originalFilename?.toLowerCase().endsWith(".docx");

    const handleDownload = () => {
        downloadResume(resume.id, resume.originalFilename || "resume.docx");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText size={18} />
                        </div>
                        <div className="truncate">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {resume.originalFilename || "Resume Document"}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isDocx ? "Microsoft Word Document" : "PDF Document Preview"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                        >
                            <Download size={14} />
                            <span>Download</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            aria-label="Close Preview"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    {isLoading && (
                        <div className="flex flex-col items-center gap-3 text-slate-500">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                            <p className="text-xs font-medium">Securing document preview stream...</p>
                        </div>
                    )}

                    {!isLoading && isDocx && (
                        <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-xs border border-slate-200 mx-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-1">
                                Direct In-Browser Preview Not Supported
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                                Modern web browsers do not natively render Microsoft Word (.docx) files. You can safely download and open this document with Word or LibreOffice.
                            </p>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                            >
                                <Download size={15} />
                                <span>Download Document Now</span>
                            </button>
                        </div>
                    )}

                    {!isLoading && !isDocx && error && (
                        <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-xs border border-slate-200 mx-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={24} />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-1">Preview Unavailable</h4>
                            <p className="text-xs text-slate-500 mb-4">{error}</p>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-2 py-2 px-4 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition"
                            >
                                <Download size={14} />
                                <span>Download Instead</span>
                            </button>
                        </div>
                    )}

                    {!isLoading && !isDocx && !error && blobUrl && (
                        <iframe
                            src={`${blobUrl}#toolbar=0`}
                            title="Resume PDF Preview"
                            className="w-full h-full border-0 bg-white"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewModal;

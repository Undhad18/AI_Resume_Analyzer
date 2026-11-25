import { useState, useEffect } from "react";
import { X, Copy, Check, FileText, Loader2, AlertTriangle, Info } from "lucide-react";
import { extractResumeText, extractDocxResumeText } from "../../services/resumeService";

const ExtractedTextModal = ({ isOpen, onClose, resume }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen || !resume) {
            setExtractedData(null);
            setError(null);
            setCopied(false);
            return;
        }

        const isDocx =
            resume.fileType === "docx" ||
            resume.originalFilename?.toLowerCase().endsWith(".docx");

        let isMounted = true;
        setIsLoading(true);
        setError(null);
        setExtractedData(null);

        const extractionCall = isDocx
            ? extractDocxResumeText(resume.id)
            : extractResumeText(resume.id);

        extractionCall
            .then((res) => {
                if (!isMounted) return;
                const payload = res?.data || res;
                setExtractedData(payload);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Text extraction failed:", err);
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    `Failed to extract text from this ${isDocx ? "DOCX" : "PDF"} document.`;
                setError(msg);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, resume]);

    if (!isOpen || !resume) return null;

    const isDocx =
        resume.fileType === "docx" ||
        resume.originalFilename?.toLowerCase().endsWith(".docx");

    const handleCopy = () => {
        if (!extractedData?.extractedText) return;
        navigator.clipboard.writeText(extractedData.extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-3 truncate">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isDocx ? "bg-sky-50 text-sky-600" : "bg-blue-50 text-blue-600"
                        }`}>
                            <FileText size={20} />
                        </div>
                        <div className="truncate">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 truncate">
                                    Extracted Resume Text
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isDocx ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                    {isDocx ? "DOCX" : "PDF"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                                {resume.originalFilename || resume.title || "Resume Document"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {extractedData?.extractedText && (
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                                title="Copy Extracted Text to Clipboard"
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} className="text-emerald-600" />
                                        <span className="text-emerald-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        <span>Copy Text</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Metadata Pills */}
                {extractedData && (
                    <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">Characters:</span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-blue-600">
                                {extractedData.characterCount?.toLocaleString() || extractedData.extractedText?.length || 0}
                            </span>
                        </div>
                        {extractedData.wordCount !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700">Words:</span>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                                    {extractedData.wordCount?.toLocaleString()}
                                </span>
                            </div>
                        )}
                        {extractedData.pageCount !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-700">Pages:</span>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                                    {extractedData.pageCount}
                                </span>
                            </div>
                        )}
                        <div className="ml-auto text-[11px] text-slate-400 hidden sm:block">
                            Plain text representation (ready for ATS & AI analysis)
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                            <p className="text-sm font-medium">
                                Extracting readable text from {isDocx ? "Word (DOCX)" : "PDF"}...
                            </p>
                            <p className="text-xs text-slate-400">Parsing layout, fonts, and document structure securely</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-900 mb-1">Text Extraction Notice</h4>
                                <p className="leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {extractedData?.warnings?.length > 0 && (
                        <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-start gap-2.5">
                            <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold">Parser Notice:</span> {extractedData.warnings.join(", ")}
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && extractedData?.extractedText && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 overflow-x-auto">
                            {/* Rendered strictly as preformatted text (NEVER as raw HTML) */}
                            <pre className="text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed select-text">
                                {extractedData.extractedText}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        {extractedData ? "Text parsed directly from document streams without OCR." : ""}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtractedTextModal;

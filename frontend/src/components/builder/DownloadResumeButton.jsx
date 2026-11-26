import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { downloadResumePdf } from "../../services/resumeBuilderService";

/**
 * Enhanced Resume PDF Download Button Component (Lesson 8.5)
 * Handles PDF generation, loading states, error handling, and browser download triggers.
 */
export const DownloadResumeButton = ({
  resumeData = {},
  selectedTemplate = "modern",
  className = "",
  variant = "primary",
  onDownloadStart = null,
  onDownloadSuccess = null,
  onDownloadError = null
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setStatusMessage(null);
    if (onDownloadStart) onDownloadStart();

    try {
      const result = await downloadResumePdf(resumeData, selectedTemplate);

      setStatusMessage({
        type: "success",
        text: `Downloaded ${result.filename}`
      });

      if (onDownloadSuccess) onDownloadSuccess(result);

      // Auto-clear success notice
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      const message = err.message || "Failed to generate resume PDF. Please check required fields.";
      setStatusMessage({
        type: "error",
        text: message
      });

      if (onDownloadError) onDownloadError(err);

      // Auto-clear error notice
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonStyles = () => {
    const base =
      "inline-flex items-center justify-center gap-1.5 font-bold transition shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

    if (variant === "compact") {
      return `${base} px-3 py-1.5 text-xs rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white ${className}`;
    }

    if (variant === "secondary") {
      return `${base} px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 ${className}`;
    }

    // Default primary variant
    return `${base} px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white ${className}`;
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className={getButtonStyles()}
        title={`Download resume as ${selectedTemplate.toUpperCase()} PDF`}
      >
        {isDownloading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <Download size={13} />
            <span>Download PDF</span>
          </>
        )}
      </button>

      {/* Floating Status Toast Notice */}
      {statusMessage && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium shadow-md border flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={12} className="text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};

export default DownloadResumeButton;

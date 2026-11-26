import { useState } from "react";
import { FileText, Trash2, Loader2, Sparkles, Zap } from "lucide-react";

/**
 * JobDescriptionInput Component
 * Allows pasting a job description to trigger job-specific skills and keyword matching
 */
export const JobDescriptionInput = ({
  onCompare,
  isLoading = false,
  initialText = ""
}) => {
  const [jobText, setJobText] = useState(initialText || "");
  const [isOpen, setIsOpen] = useState(Boolean(initialText));

  const handleRun = (analysisMode = "free") => {
    if (!jobText.trim() || isLoading) return;
    onCompare({
      mode: "job_specific",
      jobDescription: jobText.trim(),
      analysisMode
    });
  };

  const handleClear = () => {
    setJobText("");
  };

  if (!isOpen) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800">Target a Specific Job Description?</h5>
            <p className="text-[11px] text-slate-500">
              Paste job requirements to detect missing skills and matching keywords for a specific role.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs transition shrink-0"
        >
          Compare with Job
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-white shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-indigo-600" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            Compare Against Job Description
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          Close
        </button>
      </div>

      <textarea
        rows={4}
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        placeholder="Paste target job requirements, required technologies, and qualification bullet points here..."
        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed text-slate-800 resize-y"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-slate-400">
          {jobText.length} characters (Max: 50,000)
        </span>

        <div className="flex items-center gap-2">
          {jobText.trim() && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleRun("free")}
            disabled={!jobText.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50 transition"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            <span>Compare (Free)</span>
          </button>

          <button
            type="button"
            onClick={() => handleRun("ai")}
            disabled={!jobText.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs disabled:opacity-50 transition"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>AI Compare</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionInput;

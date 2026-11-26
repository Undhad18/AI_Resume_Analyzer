import { Loader2, Sparkles, Zap, Check, RotateCcw, X } from "lucide-react";

/**
 * Action Controls for Generated Content (Lesson 8.3)
 */
export const GeneratedContentActions = ({
  mode = "free",
  isLoading = false,
  hasGeneratedContent = false,
  onGenerate,
  onAccept,
  onCancel,
  canAccept = true
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
      <button
        type="button"
        disabled={isLoading}
        onClick={onCancel}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
      >
        <X size={14} />
        <span>Cancel</span>
      </button>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {/* Generate / Regenerate Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onGenerate}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-60 ${
            mode === "advanced"
              ? "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"
              : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>{mode === "advanced" ? "AI Generating..." : "Formatting Content..."}</span>
            </>
          ) : hasGeneratedContent ? (
            <>
              <RotateCcw size={13} />
              <span>Regenerate Content</span>
            </>
          ) : (
            <>
              {mode === "advanced" ? <Sparkles size={14} /> : <Zap size={14} />}
              <span>{mode === "advanced" ? "Generate with AI" : "Generate Free Content"}</span>
            </>
          )}
        </button>

        {/* Accept Content Button */}
        {hasGeneratedContent && (
          <button
            type="button"
            disabled={isLoading || !canAccept}
            onClick={onAccept}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Check size={14} />
            <span>Accept & Insert</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default GeneratedContentActions;

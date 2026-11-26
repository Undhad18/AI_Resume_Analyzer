import { Check, Trash2, Save, Sparkles, RefreshCw } from "lucide-react";

export const EnhancementActions = ({
  status = "draft",
  isSaving = false,
  isApproving = false,
  isDiscarding = false,
  onSaveEdits,
  onApprove,
  onDiscard,
  onRegenerate,
  hasUnsavedEdits = false
}) => {
  if (status === "approved") {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Check size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-900 block">
              Draft Approved & Registered
            </span>
            <span className="text-[11px] text-emerald-700">
              This enhanced version is officially saved in your resume version history.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
        >
          <RefreshCw size={13} />
          <span>Create New Enhancement</span>
        </button>
      </div>
    );
  }

  if (status === "discarded") {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span className="text-xs text-slate-600 font-medium">
            This enhancement draft was discarded.
          </span>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
        >
          <Sparkles size={13} />
          <span>Enhance Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {hasUnsavedEdits ? (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Unsaved Candidate Edits
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Review changes, customize sections, or approve to register a new improved version.
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        {hasUnsavedEdits && (
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveEdits}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
          >
            <Save size={13} />
            <span>{isSaving ? "Saving..." : "Save Draft Edits"}</span>
          </button>
        )}

        <button
          type="button"
          disabled={isDiscarding}
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          <Trash2 size={13} />
          <span>{isDiscarding ? "Discarding..." : "Discard Draft"}</span>
        </button>

        <button
          type="button"
          disabled={isApproving}
          onClick={onApprove}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
        >
          <Check size={14} />
          <span>{isApproving ? "Approving..." : "Approve & Register Version"}</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancementActions;

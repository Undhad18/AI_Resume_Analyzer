import { CheckCircle2, XCircle } from "lucide-react";

/**
 * SuggestionExample Component (Lesson 7.3)
 * Displays Before / After visual transformation comparison
 */
export const SuggestionExample = ({ example }) => {
  if (!example || (!example.before && !example.after)) {
    return null;
  }

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
        <span>Concrete Improvement Example</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {example.before && (
          <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/70 text-rose-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[10px] uppercase tracking-wider">
              <XCircle size={12} className="text-rose-600" />
              <span>Before (Weak Phrasing)</span>
            </div>
            <p className="leading-relaxed italic text-[11px]">"{example.before}"</p>
          </div>
        )}

        {example.after && (
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/70 text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[10px] uppercase tracking-wider">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>After (Action & Impact)</span>
            </div>
            <p className="leading-relaxed font-medium text-[11px]">"{example.after}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionExample;

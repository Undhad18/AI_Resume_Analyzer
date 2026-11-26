import { Zap, Sparkles } from "lucide-react";

/**
 * Generation Mode Selector (Lesson 8.3)
 * Allows toggling between 100% Free Rule-Based and Advanced AI Mode
 */
export const GenerationModeSelector = ({ mode = "free", onChange, disabled = false }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
        Generation Engine
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("free")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer disabled:opacity-50 ${
            mode === "free"
              ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500/30 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              mode === "free" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            <Zap size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold leading-tight">100% Free Mode</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                Zero Cost
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
              Deterministic rule templates • No API key needed
            </p>
          </div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("advanced")}
          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer disabled:opacity-50 ${
            mode === "advanced"
              ? "border-purple-500 bg-purple-50/70 text-purple-950 ring-1 ring-purple-500/30 shadow-xs"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              mode === "advanced" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            <Sparkles size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold leading-tight">Advanced AI</span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800">
                GPT-4o-mini
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
              Semantic clarity & strict fact preservation
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GenerationModeSelector;

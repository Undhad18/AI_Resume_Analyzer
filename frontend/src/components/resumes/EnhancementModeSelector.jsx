export const EnhancementModeSelector = ({ mode, onChange, disabled = false }) => {
  return (
    <div className="bg-[#3e4856] border border-slate-600/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center justify-between gap-3">
      <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase shrink-0">
        ENHANCEMENT ENGINE:
      </span>

      <div className="inline-flex items-center bg-[#101827] rounded-xl p-1 gap-1 border border-slate-800">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("free")}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === "free"
              ? "bg-[#0b1329] text-white shadow-inner"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span>
          <span>100% Free Mode</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("advanced")}
          className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === "advanced"
              ? "bg-[#0b1329] text-white shadow-inner"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block shrink-0"></span>
          <span>Advanced AI</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancementModeSelector;

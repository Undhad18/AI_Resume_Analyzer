const SECTION_OPTIONS = [
  { id: "professionalSummary", label: "Professional Summary" },
  { id: "skills", label: "Skills Section" },
  { id: "experience", label: "Work Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "achievements", label: "Key Achievements" }
];

export const EnhancementScopeSelector = ({
  scope,
  section,
  onScopeChange,
  onSectionChange,
  disabled = false
}) => {
  return (
    <div className="bg-[#3e4856] border border-slate-600/40 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-center gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase shrink-0">
          SCOPE:
        </span>

        <div className="inline-flex items-center bg-[#101827] rounded-xl p-1 gap-1 border border-slate-800">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onScopeChange("full_resume")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              scope === "full_resume"
                ? "bg-[#0b1329] text-white shadow-inner"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Full Resume
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onScopeChange("single_section")}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              scope === "single_section"
                ? "bg-[#0b1329] text-white shadow-inner"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Single Section
          </button>
        </div>
      </div>

      {scope === "single_section" && (
        <div className="mt-1 pt-2 border-t border-slate-500/40 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-300 font-medium">Select Section:</span>
          <select
            value={section || "professionalSummary"}
            onChange={(e) => onSectionChange(e.target.value)}
            disabled={disabled}
            className="bg-[#0b1329] text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {SECTION_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default EnhancementScopeSelector;

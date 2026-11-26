import { AlertCircle, Lightbulb } from "lucide-react";

/**
 * MissingSkillsList Component
 * Displays required or preferred skills not detected in the provided resume
 */
export const MissingSkillsList = ({ missingSkills = [] }) => {
  if (!missingSkills || missingSkills.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50/60 rounded-xl border border-emerald-200">
        All required and preferred skills from the target job description were detected in your resume!
      </div>
    );
  }

  const importanceBadge = (imp) => {
    if (imp === "required") {
      return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
    } else if (imp === "preferred") {
      return "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
    }
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-700">Skills Not Detected in Resume ({missingSkills.length})</span>
        <span className="text-[11px] text-slate-400">Target role requirements</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {missingSkills.map((m, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/30 to-white flex flex-col justify-between space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-slate-900">{m.normalizedName}</h5>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {m.category.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-md border uppercase tracking-wider ${importanceBadge(m.importance)}`}>
                {m.importance}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              {m.reason}
            </p>

            {m.suggestion && (
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-950 flex items-start gap-1.5">
                <Lightbulb size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <span>{m.suggestion}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissingSkillsList;

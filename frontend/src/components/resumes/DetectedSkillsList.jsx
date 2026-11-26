import { useState } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";

/**
 * DetectedSkillsList Component
 * Displays verified skills with evidence pills and expandable citations
 */
export const DetectedSkillsList = ({ skills = [] }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!skills || skills.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        No specific technical skills detected in the parsed text.
      </div>
    );
  }

  const statusConfig = {
    explicit_and_applied: {
      label: "Verified & Applied",
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500"
    },
    explicit_only: {
      label: "Listed Only",
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500"
    },
    applied_only: {
      label: "Applied in Projects",
      badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dot: "bg-indigo-500"
    },
    inferred: {
      label: "Contextual Citation",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400"
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-700">Detected Skills ({skills.length})</span>
        <span className="text-[11px]">Click a skill to view citations</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {skills.map((s, idx) => {
          const cfg = statusConfig[s.evidenceStatus] || statusConfig.inferred;
          const isExpanded = expandedId === idx;
          const hasEvidence = s.evidence && s.evidence.length > 0;

          return (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="font-bold text-xs text-slate-900">{s.normalizedName}</span>
                    {s.skill.toLowerCase() !== s.normalizedName.toLowerCase() && (
                      <span className="text-[10px] text-slate-400 font-mono">({s.skill})</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5 capitalize">
                    {s.category.replace(/_/g, " ")} • Source: {s.sourceSection}
                  </span>
                </div>

                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold shrink-0 ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {hasEvidence && (
                <div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : idx)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer pt-1"
                  >
                    <Quote size={10} />
                    <span>{isExpanded ? "Hide Evidence" : `View Evidence (${s.evidence.length})`}</span>
                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 mt-1.5 pt-1.5 border-t border-slate-100">
                      {s.evidence.map((ev, evIdx) => (
                        <div key={evIdx} className="p-1.5 rounded-md bg-slate-50 text-[10px] font-mono text-slate-600 leading-relaxed border border-slate-100">
                          {ev}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetectedSkillsList;

import { ArrowUpRight, AlertCircle, HelpCircle } from "lucide-react";

/**
 * ImprovementAreas Component (Lesson 9.3)
 * Displays actionable resume suggestions to improve job match relevance.
 */
export const ImprovementAreas = ({ improvementAreas = [] }) => {
  if (!Array.isArray(improvementAreas) || improvementAreas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="space-y-0.5 border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ArrowUpRight size={16} className="text-amber-600" />
          <span>Areas for Improvement ({improvementAreas.length})</span>
        </h4>
        <p className="text-xs text-slate-500">
          Actionable opportunities to enhance alignment with this job posting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {improvementAreas.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                {item.description}
              </p>
            </div>

            {item.suggestedAction && (
              <div className="pl-5.5 pt-2 border-t border-amber-200/50 text-[11px] text-amber-950 flex items-start gap-1.5">
                <HelpCircle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Recommendation:</strong> {item.suggestedAction}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImprovementAreas;

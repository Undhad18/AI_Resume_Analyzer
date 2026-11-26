import { CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

/**
 * MatchingStrengths Component (Lesson 9.3)
 * Displays evidence-backed candidate strengths matching the target job.
 */
export const MatchingStrengths = ({ strengths = [] }) => {
  if (!Array.isArray(strengths) || strengths.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="space-y-0.5 border-b border-slate-100 pb-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-600" />
          <span>Demonstrated Strengths ({strengths.length})</span>
        </h4>
        <p className="text-xs text-slate-500">
          Areas where your resume provides concrete evidence matching the job requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {strengths.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-5.5">
                {item.description}
              </p>
            </div>

            {item.evidence && (
              <div className="pl-5.5 pt-2 border-t border-emerald-200/50 text-[11px] text-emerald-900 italic font-medium">
                "{item.evidence}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchingStrengths;

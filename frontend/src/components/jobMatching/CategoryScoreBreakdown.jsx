import {
  Award,
  Briefcase,
  GraduationCap,
  FolderGit2,
  CheckCircle2,
  Sliders,
  AlertCircle,
  HelpCircle
} from "lucide-react";

const CATEGORY_META = {
  skills: { label: "Skills Match", icon: Award, baseWeight: 35 },
  experience: { label: "Experience Match", icon: Briefcase, baseWeight: 25 },
  education: { label: "Education Match", icon: GraduationCap, baseWeight: 10 },
  projects: { label: "Projects Match", icon: FolderGit2, baseWeight: 15 },
  responsibilities: { label: "Responsibilities Match", icon: CheckCircle2, baseWeight: 10 },
  certifications: { label: "Certifications Match", icon: Award, baseWeight: 5 }
};

/**
 * CategoryScoreBreakdown Component (Lesson 9.3)
 * Displays transparent category-wise scores, normalized weights,
 * and applicable/non-applicable badges.
 */
export const CategoryScoreBreakdown = ({
  categoryScores = {},
  categoryWeights = {},
  categoryDetails = {}
}) => {
  const categoryKeys = ["skills", "experience", "education", "projects", "responsibilities", "certifications"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders size={16} className="text-blue-600" />
            <span>Category Scoring & Dynamic Weights</span>
          </h4>
          <p className="text-xs text-slate-500">
            Initial weights total 100%. Unspecified job requirements are transparently normalized out.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryKeys.map((key) => {
          const meta = CATEGORY_META[key] || { label: key, icon: Award, baseWeight: 10 };
          const Icon = meta.icon;
          const score = categoryScores[key] ?? 0;
          const detail = categoryDetails[key] || {};
          const isApplicable = detail.isApplicable !== false;
          const normalizedWeight = categoryWeights[key] ?? detail.normalizedWeight ?? meta.baseWeight;

          // Color based on score
          let barColor = "bg-rose-500";
          let scoreColor = "text-rose-600";
          if (score >= 80) {
            barColor = "bg-emerald-500";
            scoreColor = "text-emerald-600";
          } else if (score >= 60) {
            barColor = "bg-blue-500";
            scoreColor = "text-blue-600";
          } else if (score >= 40) {
            barColor = "bg-amber-500";
            scoreColor = "text-amber-600";
          }

          return (
            <div
              key={key}
              className={`p-4 rounded-xl border transition-all ${
                isApplicable
                  ? "bg-slate-50/70 border-slate-200/90"
                  : "bg-slate-50/40 border-dashed border-slate-200 opacity-80"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <Icon size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {meta.label}
                  </span>
                </div>

                {isApplicable ? (
                  <span className={`text-base font-black ${scoreColor}`}>
                    {score}%
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    N/A
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 mb-2">
                <div
                  className={`h-full ${isApplicable ? barColor : "bg-slate-300"} transition-all duration-500`}
                  style={{ width: `${isApplicable ? score : 0}%` }}
                />
              </div>

              {/* Weight Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Weight: <strong>{normalizedWeight}%</strong>
                  {normalizedWeight !== meta.baseWeight && (
                    <span className="text-[10px] text-blue-600 font-semibold ml-1">
                      (Norm.)
                    </span>
                  )}
                </span>

                {isApplicable ? (
                  <span className="text-slate-500">
                    <span className="text-emerald-600 font-bold">{detail.matchedCount || 0}</span> matched
                    {detail.partiallyMatchedCount > 0 && (
                      <span className="text-blue-600 ml-1">({detail.partiallyMatchedCount} part.)</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Not specified in JD
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryScoreBreakdown;

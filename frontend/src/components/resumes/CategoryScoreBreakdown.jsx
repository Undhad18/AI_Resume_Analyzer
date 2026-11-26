import { Award, Zap } from "lucide-react";

/**
 * 6-Category Integrated Score Breakdown Card (Total = 100 Points)
 */
export const CategoryScoreBreakdown = ({ breakdown = {}, overallScore = 0 }) => {
    const categories = [
        { key: "contentQuality", label: "Content Quality", weight: 25, earned: breakdown.contentQuality || 0, color: "bg-emerald-500", textColor: "text-emerald-700" },
        { key: "skills", label: "Skills Relevance & Evidence", weight: 20, earned: breakdown.skills || 0, color: "bg-indigo-500", textColor: "text-indigo-700" },
        { key: "experience", label: "Work & Practical Experience", weight: 20, earned: breakdown.experience || 0, color: "bg-purple-500", textColor: "text-purple-700" },
        { key: "projects", label: "Projects Quality", weight: 15, earned: breakdown.projects || 0, color: "bg-amber-500", textColor: "text-amber-700" },
        { key: "education", label: "Education Information", weight: 10, earned: breakdown.education || 0, color: "bg-sky-500", textColor: "text-sky-700" },
        { key: "clarity", label: "Resume Clarity & Completeness", weight: 10, earned: breakdown.clarity || 0, color: "bg-teal-500", textColor: "text-teal-700" }
    ];

    const displayTotal = overallScore !== undefined && overallScore !== null ? overallScore : breakdown.totalScore || 0;

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center">
                        <Award size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">
                            Comprehensive Score Breakdown
                        </h4>
                        <p className="text-xs text-slate-500">
                            Deterministic 100-Point Composite Model (Lesson 6.1 &amp; 6.3)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:text-right">
                    {breakdown.isNormalized && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Zap size={10} /> Fresher Normalized
                        </span>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{displayTotal}</span>
                        <span className="text-xs font-bold text-slate-400">/ 100 pts</span>
                    </div>
                </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {categories.map((c) => {
                    const pct = (c.earned / 100) * 100;
                    return (
                        <div
                            key={c.key}
                            className={`h-full ${c.color} transition-all duration-300`}
                            style={{ width: `${pct}%` }}
                            title={`${c.label}: ${c.earned}/${c.weight} pts`}
                        />
                    );
                })}
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {categories.map((c) => (
                    <div key={c.key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-medium text-slate-600 truncate">{c.label}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className={`text-sm font-bold ${c.textColor}`}>
                                {c.earned} <span className="text-[10px] font-normal text-slate-400">/ {c.weight}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {Math.round((c.earned / c.weight) * 100)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryScoreBreakdown;

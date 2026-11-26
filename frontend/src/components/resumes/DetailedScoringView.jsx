import { useState } from "react";
import { Loader2, RefreshCw, Layers, CheckCircle } from "lucide-react";
import SkillsScoreCard from "./SkillsScoreCard";
import EducationScoreCard from "./EducationScoreCard";
import ExperienceScoreCard from "./ExperienceScoreCard";
import CategoryScoreBreakdown from "./CategoryScoreBreakdown";

export const DetailedScoringView = ({
    detailedData,
    isCalculating = false,
    onCalculateDetailed
}) => {
    const [subTab, setSubTab] = useState("all"); // 'all' | 'skills' | 'education' | 'experience'

    if (isCalculating) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-pulse">
                    <Loader2 size={28} className="animate-spin" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">
                        Evaluating Skills, Education &amp; Experience...
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                        Calculating 15 internal parameters, verifying project evidence, checking qualification structure, and applying fair fresher policies.
                    </p>
                </div>
            </div>
        );
    }

    if (!detailedData) {
        return (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <Layers size={22} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">
                        Detailed Resume Scoring Ready
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Analyze detailed skills taxonomy with practical evidence verification, objective education qualification checks, and fresher-friendly experience scoring.
                    </p>
                </div>
                {onCalculateDetailed && (
                    <button
                        type="button"
                        onClick={onCalculateDetailed}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                    >
                        <Layers size={14} />
                        <span>Run Detailed Evaluation Now</span>
                    </button>
                )}
            </div>
        );
    }

    const {
        categories = {},
        integratedOverallBreakdown = {},
        overallScore = 0
    } = detailedData;

    return (
        <div className="space-y-6">
            {/* Top Bar: Subtabs & Recalculate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: "all", label: "Full Breakdown" },
                        { id: "skills", label: `Skills (${categories.skills?.rating || 0}/100)` },
                        { id: "experience", label: `Experience (${categories.experience?.rating || 0}/100)` },
                        { id: "education", label: `Education (${categories.education?.rating || 0}/100)` }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSubTab(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                                subTab === tab.id
                                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {onCalculateDetailed && (
                    <button
                        type="button"
                        onClick={onCalculateDetailed}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
                        title="Re-run detailed scoring calculation"
                    >
                        <RefreshCw size={12} />
                        <span>Recalculate</span>
                    </button>
                )}
            </div>

            {/* Overall Category Breakdown Overview */}
            {(subTab === "all") && (
                <CategoryScoreBreakdown
                    breakdown={integratedOverallBreakdown}
                    overallScore={overallScore}
                />
            )}

            {/* Category Cards according to Active Subtab */}
            {(subTab === "all" || subTab === "skills") && (
                <SkillsScoreCard skillsData={categories.skills} />
            )}

            {(subTab === "all" || subTab === "experience") && (
                <ExperienceScoreCard experienceData={categories.experience} />
            )}

            {(subTab === "all" || subTab === "education") && (
                <EducationScoreCard educationData={categories.education} />
            )}

            {/* Scoring Methodology Note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Explainable &amp; Deterministic Scoring Model</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                    Evaluated across 15 internal parameters: Skills (20 pts), Education (10 pts), and Experience (20 pts).
                    Skills are evaluated against practical projects and work evidence. Education is assessed objectively without institution prestige bias. Freshers receive fair assessment via practical engineering project evidence or weight normalization.
                </p>
            </div>
        </div>
    );
};

export default DetailedScoringView;

import { Briefcase, CheckCircle2, AlertTriangle, Layers, Calendar, Building2, Award, Zap, Code } from "lucide-react";

/**
 * Renders employment or project engineering timeline
 */
export const ExperienceTimeline = ({ roles = [], isFresher = false }) => {
    if (!roles.length) {
        return (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                No formal work experience records found.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>{isFresher ? "Project Engineering Experience" : "Professional Work History"} ({roles.length})</span>
                <span className="text-[10px] text-slate-500">
                    {isFresher ? "Hands-on project deliverables" : "Chronological employment"}
                </span>
            </h5>

            <div className="space-y-3">
                {roles.map((r, idx) => (
                    <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h6 className="text-xs sm:text-sm font-bold text-slate-800">
                                        {r.title || "Role Title Unstated"}
                                    </h6>
                                    {r.isInternship && (
                                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                                            Internship
                                        </span>
                                    )}
                                    {r.isCurrent && (
                                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                            Active Role
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                                    <Building2 size={13} className="text-slate-400" />
                                    <span>{r.company || "Company Not Stated"}</span>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span>{r.duration || "Timeline Not Specified"}</span>
                                </span>
                            </div>
                        </div>

                        {/* Badges for Responsibilities & Achievements */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                                <span>Responsibilities: {r.responsibilitiesCount} points</span>
                            </span>

                            {r.achievementsCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                                    <Award size={11} className="text-emerald-600" />
                                    <span>Quantified Impact Detected</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-[10px] text-slate-500 px-2 py-0.5 rounded-md bg-slate-100">
                                    Descriptive tasks (no metrics)
                                </span>
                            )}
                        </div>

                        {/* Technologies */}
                        {r.technologies && r.technologies.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
                                    <Code size={10} /> Tech:
                                </span>
                                {r.technologies.map((t, tidx) => (
                                    <span
                                        key={tidx}
                                        className="text-[10px] px-1.5 py-0.2 bg-white border border-slate-200 text-slate-700 rounded-sm"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Detailed Experience Score Card (Weight: 20 pts)
 */
export const ExperienceScoreCard = ({ experienceData }) => {
    if (!experienceData) return null;

    const {
        rating = 0,
        weight = 20,
        earnedPoints = 0,
        fresherPolicyApplied = false,
        fresherPolicyDetails = {},
        parameters = {},
        roles = [],
        findings = [],
        limitations = []
    } = experienceData;

    const paramList = [
        { key: "roleResponsibilityClarity", label: "Role & Responsibility Clarity", weight: 25, data: parameters.roleResponsibilityClarity },
        { key: "achievementImpactEvidence", label: "Achievement & Impact Evidence", weight: 25, data: parameters.achievementImpactEvidence },
        { key: "descriptionQuality", label: "Experience Description Quality", weight: 20, data: parameters.descriptionQuality },
        { key: "relevantTechnologies", label: "Relevant Technologies & Skills", weight: 15, data: parameters.relevantTechnologies },
        { key: "timelineClarity", label: "Employment Timeline Clarity", weight: 15, data: parameters.timelineClarity }
    ];

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">Experience Evaluation</h4>
                            {fresherPolicyApplied && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                    <Zap size={10} /> Fresher Friendly
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            Overall Category Weight: {weight} Points
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-black text-purple-600">{earnedPoints}</span>
                        <span className="text-xs font-bold text-slate-400">/ {weight} pts</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        Rating: {rating}/100
                    </span>
                </div>
            </div>

            {/* Fresher Policy Notice Banner */}
            {fresherPolicyApplied && fresherPolicyDetails?.policyNote && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                    <Zap size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Fresher Experience Policy Active: </span>
                        <span>{fresherPolicyDetails.policyNote}</span>
                    </div>
                </div>
            )}

            {/* 5-Parameter Internal Breakdown */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-purple-600" />
                    <span>Internal Evaluation Parameters</span>
                </h5>

                <div className="space-y-2.5">
                    {paramList.map((p) => {
                        const score = p.data?.rating || 0;
                        const earned = p.data?.earnedPoints || 0;
                        return (
                            <div key={p.key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-800">
                                        {p.label} <span className="text-[10px] font-normal text-slate-500">({p.weight}%)</span>
                                    </span>
                                    <span className="font-bold text-slate-700">
                                        {score}/100 <span className="text-purple-600 font-semibold">({earned} pts)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                {p.data?.explanation && (
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        {p.data.explanation}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Roles / Projects Timeline */}
            <ExperienceTimeline
                roles={roles}
                isFresher={Boolean(fresherPolicyDetails?.isFresher && !roles.some(r => !r.company?.includes("Project")))}
            />

            {/* Findings & Limitations */}
            {(findings.length > 0 || limitations.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {findings.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Key Findings</span>
                            </span>
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                                {findings.map((f, i) => (
                                    <li key={i}>{f}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {limitations.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-amber-800 flex items-center gap-1">
                                <AlertTriangle size={13} className="text-amber-600" />
                                <span>Areas for Improvement</span>
                            </span>
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                                {limitations.map((l, i) => (
                                    <li key={i}>{l}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExperienceScoreCard;

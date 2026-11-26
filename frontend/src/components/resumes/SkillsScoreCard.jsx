import { CheckCircle2, AlertTriangle, Layers, Code2, Check, HelpCircle } from "lucide-react";

/**
 * Renders evidence-supported vs listed-only skills
 */
export const SkillsEvidenceList = ({ evidenceSkills = [], listedOnlySkills = [] }) => {
    return (
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Skill Verification & Practical Evidence</span>
                <span className="text-[10px] font-normal text-slate-500">
                    {evidenceSkills.length} supported • {listedOnlySkills.length} listed only
                </span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Evidence-Supported Skills */}
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Backed by Projects / Experience</span>
                    </div>
                    {evidenceSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {evidenceSkills.map((s, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-900 text-[11px] font-medium shadow-2xs"
                                >
                                    <Check size={10} className="text-emerald-600" />
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-500 italic">
                            No skills currently backed by explicit project or experience bullet points.
                        </p>
                    )}
                </div>

                {/* Listed-Only Skills */}
                <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <HelpCircle size={14} className="text-amber-600" />
                        <span>Listed Only (No Project Backing)</span>
                    </div>
                    {listedOnlySkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {listedOnlySkills.map((s, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900 text-[11px] font-medium shadow-2xs"
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[11px] text-emerald-700 font-medium">
                            All detected skills are reinforced with practical project or experience evidence!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Detailed Skills Score Card (Weight: 20 pts)
 */
export const SkillsScoreCard = ({ skillsData }) => {
    if (!skillsData) return null;

    const {
        rating = 0,
        weight = 20,
        earnedPoints = 0,
        parameters = {},
        categorizedSkills = {},
        evidenceSupportedSkills = [],
        listedOnlySkills = [],
        findings = [],
        limitations = []
    } = skillsData;

    const paramList = [
        { key: "identification", label: "Skills Identification", weight: 25, data: parameters.identification },
        { key: "organization", label: "Skills Organization", weight: 15, data: parameters.organization },
        { key: "evidence", label: "Evidence in Projects & Experience", weight: 30, data: parameters.evidence },
        { key: "clarity", label: "Skills Description & Clarity", weight: 15, data: parameters.clarity },
        { key: "coverage", label: "Relevant Skills Coverage", weight: 15, data: parameters.coverage }
    ];

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Code2 size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Skills Evaluation</h4>
                        <p className="text-xs text-slate-500">
                            Overall Category Weight: {weight} Points
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-black text-indigo-600">{earnedPoints}</span>
                        <span className="text-xs font-bold text-slate-400">/ {weight} pts</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        Rating: {rating}/100
                    </span>
                </div>
            </div>

            {/* 5-Parameter Internal Breakdown */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-indigo-600" />
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
                                        {score}/100 <span className="text-indigo-600 font-semibold">({earned} pts)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
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

            {/* Categorized Skills Breakdown */}
            {Object.keys(categorizedSkills).length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Domain Taxonomy
                    </h5>
                    <div className="space-y-2">
                        {Object.entries(categorizedSkills).map(([cat, list]) => (
                            <div key={cat} className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-[11px] font-semibold text-slate-500 min-w-32">
                                    {cat}:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {list.map((s, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-medium"
                                        >
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Evidence List */}
            <SkillsEvidenceList
                evidenceSkills={evidenceSupportedSkills}
                listedOnlySkills={listedOnlySkills}
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

export default SkillsScoreCard;

import { Layout, CheckCircle2, AlertTriangle, Layers, BookOpen, AlertCircle } from "lucide-react";

/**
 * Readability and Text Density Report
 */
export const ReadabilityReport = ({ readabilityParam }) => {
    if (!readabilityParam) return null;
    const score = readabilityParam.rating || 0;
    const isGood = score >= 80;

    return (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={16} className={isGood ? "text-emerald-600" : "text-amber-600"} />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Document Readability &amp; Structure Density
                    </h5>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isGood ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                    Score: {score}/100
                </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
                {readabilityParam.explanation}
            </p>
        </div>
    );
};

/**
 * Detailed Findings List for Formatting
 */
export const FormattingFindings = ({ findings = [] }) => {
    if (!findings.length) {
        return (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>No formatting or structural issues detected. Excellent layout consistency!</span>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Formatting Findings ({findings.length})</span>
            </h5>

            <div className="space-y-2">
                {findings.map((f, idx) => {
                    const isHigh = f.severity === "high";
                    const isMed = f.severity === "medium";
                    const badgeColor = isHigh
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : isMed
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-blue-100 text-blue-800 border-blue-200";

                    return (
                        <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                    {isHigh ? <AlertCircle size={14} className="text-rose-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                                    <span>{f.issue}</span>
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                    {f.severity}
                                </span>
                            </div>

                            <p className="text-slate-600 text-[11px] leading-relaxed">
                                {f.explanation}
                            </p>

                            {f.evidence && (
                                <div className="p-2 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-mono">
                                    <span className="text-slate-400 select-none mr-1.5">Excerpt:</span>
                                    <span>"{f.evidence}"</span>
                                </div>
                            )}

                            {f.suggestion && (
                                <p className="text-[11px] text-indigo-700 font-medium">
                                    Recommendation: {f.suggestion}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * Formatting Score Card (0–100)
 */
export const FormattingScoreCard = ({ formattingData }) => {
    if (!formattingData) return null;

    const {
        rating = 0,
        status = "evaluated",
        parameters = {},
        findings = []
    } = formattingData;

    const paramList = [
        { key: "headingConsistency", label: "Heading Consistency", weight: 20, data: parameters.headingConsistency },
        { key: "sectionOrganization", label: "Section Organization", weight: 20, data: parameters.sectionOrganization },
        { key: "bulletStructure", label: "Bullet Point Structure", weight: 15, data: parameters.bulletStructure },
        { key: "dateConsistency", label: "Date & Spacing Consistency", weight: 15, data: parameters.dateConsistency },
        { key: "readability", label: "Readability & Density", weight: 20, data: parameters.readability },
        { key: "specialCharacters", label: "Special Characters & Artifacts", weight: 10, data: parameters.specialCharacters }
    ];

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Layout size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Formatting &amp; Layout Evaluation</h4>
                        <p className="text-xs text-slate-500">
                            Deterministic Text-Based Formatting Heuristics
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-2xl font-black text-teal-600">{rating}</span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        rating >= 80 ? "bg-emerald-100 text-emerald-800" : rating >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* 6-Parameter Progress Bars */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-teal-600" />
                    <span>Evaluation Parameters (6 Dimensions)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {paramList.map((p) => {
                        const score = p.data?.rating || 0;
                        const earned = p.data?.earnedPoints || 0;

                        return (
                            <div key={p.key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-800 text-[11px] truncate">
                                        {p.label} <span className="text-[10px] text-slate-400">({p.weight}%)</span>
                                    </span>
                                    <span className="font-bold text-slate-700 text-[11px]">
                                        {score}/100 <span className="text-teal-600 font-semibold">({earned} pts)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Readability Report Component */}
            <ReadabilityReport readabilityParam={parameters.readability} />

            {/* Findings List */}
            <FormattingFindings findings={findings} />
        </div>
    );
};

export default FormattingScoreCard;

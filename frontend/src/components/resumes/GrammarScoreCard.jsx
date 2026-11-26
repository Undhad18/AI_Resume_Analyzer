import { FileCheck, CheckCircle2, AlertTriangle, Layers, SpellCheck, AlertCircle } from "lucide-react";

/**
 * Spelling Corrections Component
 */
export const SpellingSuggestions = ({ spellingParam }) => {
    if (!spellingParam) return null;
    const findings = spellingParam.findings || [];

    return (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SpellCheck size={16} className="text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Spelling Accuracy &amp; Technical Vocabulary
                    </h5>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                    Technical terms protected
                </span>
            </div>

            {findings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {findings.map((f, idx) => (
                        <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs space-y-1 shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-800 line-through">"{f.evidence}"</span>
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {f.suggestion?.replace('Replace with ', '')}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                                {f.explanation}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>No spelling errors detected. Technical vocabulary and proper nouns fully verified.</span>
                </p>
            )}
        </div>
    );
};

/**
 * Detailed Findings List for Grammar, Tone, and Structure
 */
export const GrammarFindings = ({ findings = [] }) => {
    const nonSpellingFindings = findings.filter(f => f.type !== "spelling");

    if (!nonSpellingFindings.length) {
        return (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>No grammatical errors, agreement mismatches, or informal phrasing detected. Excellent language quality!</span>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Grammar &amp; Language Findings ({nonSpellingFindings.length})</span>
            </h5>

            <div className="space-y-2">
                {nonSpellingFindings.map((f, idx) => {
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
                                    <span className="text-slate-400 select-none mr-1.5">Found:</span>
                                    <span>"{f.evidence}"</span>
                                </div>
                            )}

                            {f.suggestion && (
                                <p className="text-[11px] text-indigo-700 font-medium">
                                    Suggested Improvement: {f.suggestion}
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
 * Grammar Score Card (0–100)
 */
export const GrammarScoreCard = ({ grammarData }) => {
    if (!grammarData) return null;

    const {
        rating = 0,
        status = "evaluated",
        parameters = {},
        findings = []
    } = grammarData;

    const paramList = [
        { key: "spelling", label: "Spelling Accuracy", weight: 25, data: parameters.spelling },
        { key: "grammar", label: "Grammar Correctness", weight: 25, data: parameters.grammar },
        { key: "sentenceStructure", label: "Sentence Structure & Flow", weight: 20, data: parameters.sentenceStructure },
        { key: "professionalLanguage", label: "Executive Polish & Tone", weight: 15, data: parameters.professionalLanguage },
        { key: "clarity", label: "Clarity & Conciseness", weight: 15, data: parameters.clarity }
    ];

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <FileCheck size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Grammar &amp; Writing Quality</h4>
                        <p className="text-xs text-slate-500">
                            Evaluated with Technical Terminology Protection
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-2xl font-black text-purple-600">{rating}</span>
                        <span className="text-xs font-bold text-slate-400">/ 100</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        rating >= 80 ? "bg-emerald-100 text-emerald-800" : rating >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                    }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* 5-Parameter Progress Bars */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-purple-600" />
                    <span>Language Dimensions</span>
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
                                        {score}/100 <span className="text-purple-600 font-semibold">({earned} pts)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-600 rounded-full transition-all duration-300"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Spelling Suggestions Component */}
            <SpellingSuggestions spellingParam={parameters.spelling} />

            {/* Grammar and Style Findings */}
            <GrammarFindings findings={findings} />
        </div>
    );
};

export default GrammarScoreCard;

import { useState } from "react";
import { Loader2, RefreshCw, Layout, Info } from "lucide-react";
import FormattingScoreCard from "./FormattingScoreCard";
import GrammarScoreCard from "./GrammarScoreCard";

/**
 * Technical Scoring Limitations Notice
 */
export const ScoringLimitations = ({ limitations = [] }) => {
    return (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Info size={14} className="text-teal-600" />
                <span>Text-Based Evaluation Scope &amp; Layout Limitations</span>
            </div>
            <p className="text-[11px] leading-relaxed">
                Formatting and grammar scoring is performed via deterministic text-based heuristics. Plain extracted text from PDF and DOCX documents cannot reliably expose visual layout elements such as font sizes, margins, multi-column rendering, or styling colors. Technical vocabulary and candidate identities are strictly protected from erroneous typo flagging.
            </p>
            {limitations.length > 0 && (
                <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                    {limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/**
 * Complete Combined Formatting & Grammar Report View
 */
export const FormattingGrammarReportView = ({
    scoreData,
    isCalculating = false,
    onCalculate
}) => {
    const [activeSubTab, setActiveSubTab] = useState("all"); // 'all' | 'formatting' | 'grammar'

    if (isCalculating) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center animate-pulse">
                    <Loader2 size={28} className="animate-spin" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">
                        Analyzing Formatting &amp; Language Quality...
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                        Checking 6 formatting parameters (headings, bullets, dates, readability) and 5 language dimensions (spelling, grammar, conciseness).
                    </p>
                </div>
            </div>
        );
    }

    if (!scoreData) {
        return (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
                    <Layout size={22} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">
                        Formatting &amp; Grammar Scoring
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Evaluate heading structure, bullet points, date consistency, spelling typos with technical term protection, and professional language polish.
                    </p>
                </div>
                {onCalculate && (
                    <button
                        type="button"
                        onClick={onCalculate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
                    >
                        <Layout size={14} />
                        <span>Run Formatting &amp; Grammar Check</span>
                    </button>
                )}
            </div>
        );
    }

    const {
        formattingScore = 0,
        grammarScore = 0,
        formatting = {},
        grammar = {},
        analysisMode = "free"
    } = scoreData;

    return (
        <div className="space-y-6">
            {/* Top Navigation & Recalculate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                        { id: "all", label: "Full Report" },
                        { id: "formatting", label: `Formatting (${formattingScore}/100)` },
                        { id: "grammar", label: `Grammar (${grammarScore}/100)` }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                                activeSubTab === tab.id
                                    ? "bg-white text-teal-700 shadow-2xs font-bold"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {analysisMode === "ai" ? "AI Mode" : "100% Free Mode"}
                    </span>
                    {onCalculate && (
                        <button
                            type="button"
                            onClick={onCalculate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
                            title="Re-run formatting and grammar check"
                        >
                            <RefreshCw size={12} />
                            <span>Recalculate</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Formatting Score Card */}
            {(activeSubTab === "all" || activeSubTab === "formatting") && (
                <FormattingScoreCard formattingData={formatting} />
            )}

            {/* Grammar Score Card */}
            {(activeSubTab === "all" || activeSubTab === "grammar") && (
                <GrammarScoreCard grammarData={grammar} />
            )}

            {/* Technical Limitations Notice */}
            <ScoringLimitations limitations={formatting.limitations} />
        </div>
    );
};

export default FormattingGrammarReportView;

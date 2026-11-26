import { useState } from "react";
import {
    CheckCircle2,
    Layers,
    FileText,
    Target,
    Zap,
    Loader2,
    Search,
    ArrowUpRight,
    HelpCircle,
    ChevronDown,
    ChevronUp
} from "lucide-react";

/**
 * Color mapping for ATS ratings
 */
const getScoreColor = (score) => {
    if (score >= 90) return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", badge: "bg-emerald-100 text-emerald-800" };
    if (score >= 80) return { bg: "bg-teal-500", text: "text-teal-700", border: "border-teal-300", badge: "bg-teal-100 text-teal-800" };
    if (score >= 70) return { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-300", badge: "bg-blue-100 text-blue-800" };
    if (score >= 60) return { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-300", badge: "bg-amber-100 text-amber-800" };
    if (score >= 40) return { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-300", badge: "bg-orange-100 text-orange-800" };
    return { bg: "bg-rose-500", text: "text-rose-700", border: "border-rose-300", badge: "bg-rose-100 text-rose-800" };
};

const ATSReportView = ({ atsData, isCalculating, onCalculateAts }) => {
    const [jobDescription, setJobDescription] = useState("");
    const [showJdInput, setShowJdInput] = useState(false);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onCalculateAts(jobDescription.trim() || null);
    };

    if (!atsData && !isCalculating) {
        return (
            <div className="py-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
                    <Zap size={28} />
                </div>
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                        <Zap size={11} /> 100% Free • Rule-Based
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                        Calculate ATS Compatibility Score
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Evaluate document format, section headings, contact information, keyword density, structure, and text extraction quality against modern Applicant Tracking Systems.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onCalculateAts(null)}
                    disabled={isCalculating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition cursor-pointer"
                >
                    <Zap size={14} />
                    <span>Run ATS Score Calculation</span>
                </button>
            </div>
        );
    }

    if (isCalculating) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-pulse">
                    <Loader2 size={24} className="animate-spin" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                    Computing ATS Compatibility Score...
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                    Evaluating file headers, parsing keywords, and checking section structures using deterministic ATS rules.
                </p>
            </div>
        );
    }

    const {
        atsScore = 0,
        ratingLabel = "Moderate Compatibility",
        categories = {},
        detectedSections = [],
        missingSections = [],
        keywordFindings = {},
        textExtractionQuality = {},
        improvementSuggestions = [],
        limitations = []
    } = atsData || {};

    const colorScheme = getScoreColor(atsScore);

    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Score Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                            <Zap size={12} />
                            FREE / RULE-BASED ATS ANALYSIS
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Version 1.0.0
                        </span>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-white">
                            ATS Compatibility: {ratingLabel}
                        </h3>
                        <p className="text-xs text-slate-300 max-w-xl leading-relaxed mt-0.5">
                            Deterministic evaluation across 6 key ATS categories: format, sections, contact, keywords, layout consistency, and machine text clarity.
                        </p>
                    </div>
                </div>

                {/* Score Dial */}
                <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        ATS Score
                    </span>
                    <span className="text-4xl font-black text-white">
                        {atsScore}<span className="text-sm font-normal text-slate-300">/100</span>
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${colorScheme.badge}`}>
                        {ratingLabel}
                    </span>
                </div>
            </div>

            {/* Optional Job Description Matching Bar */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <Target size={16} className="text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Job-Specific Keyword Match (Optional)
                        </h4>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowJdInput(!showJdInput)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                        <span>{showJdInput ? "Hide Job Matcher" : "Match Against a Job Description"}</span>
                        {showJdInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {showJdInput && (
                    <form onSubmit={handleFormSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            Paste the target job description below to check keyword match percentage against employer requirements.
                        </p>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste job description text here (e.g., requirements, required technologies, job responsibilities)..."
                            rows={3}
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => { setJobDescription(""); onCalculateAts(null); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Clear & Reset to General
                            </button>
                            <button
                                type="submit"
                                disabled={isCalculating || !jobDescription.trim()}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                            >
                                Re-Calculate with Job Keywords
                            </button>
                        </div>
                    </form>
                )}

                {keywordFindings?.jobSpecificMatching?.enabled && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                Job Description Match Rate
                            </span>
                            <p className="text-xs text-emerald-950">
                                Matched <span className="font-bold">{keywordFindings.jobSpecificMatching.matchedKeywords?.length || 0}</span> keywords from the job description.
                            </p>
                        </div>
                        <span className="text-lg font-black text-emerald-800">
                            {keywordFindings.jobSpecificMatching.matchPercentage}%
                        </span>
                    </div>
                )}
            </div>

            {/* 6 Category Breakdown Table */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={15} className="text-emerald-600" />
                        <span>ATS Category Breakdown (100-Point Model)</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                        Total Applicable Weight: 100 pts
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {Object.entries(categories).map(([key, cat]) => {
                        const pct = cat.rating || 0;
                        const catColor = getScoreColor(pct);
                        return (
                            <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <h5 className="font-bold text-xs text-slate-800">
                                            {cat.category}
                                        </h5>
                                        <span className="text-[10px] text-slate-500">
                                            Weight: {cat.weight} pts
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-slate-800">
                                            {cat.earnedPoints} <span className="text-[10px] text-slate-400">/ {cat.weight}</span>
                                        </span>
                                        <div className="text-[10px] font-bold text-slate-500">
                                            {cat.rating}%
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${catColor.bg}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>

                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    {cat.explanation}
                                </p>

                                {cat.limitations?.length > 0 && (
                                    <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                        ⚠️ {cat.limitations[0]}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sections Detection & Keyword Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Standard Sections */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={15} className="text-emerald-600" />
                        <span>Section Header Parsing</span>
                    </h4>

                    <div className="space-y-2">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                            Detected Sections ({detectedSections.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {detectedSections.map((sec, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-medium">
                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                    {sec}
                                </span>
                            ))}
                        </div>
                    </div>

                    {missingSections.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Unidentified / Missing Sections
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {missingSections.map((sec, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                                        • {sec}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Keyword Readability */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Search size={15} className="text-emerald-600" />
                            <span>ATS Keyword Readability</span>
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {keywordFindings?.generalKeywordsCount || 0} Terms Found
                        </span>
                    </div>

                    <p className="text-xs text-slate-600">
                        High-frequency ATS action verbs and technical keywords recognized in your resume:
                    </p>

                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {(keywordFindings?.detectedGeneralKeywords || []).map((kw, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-medium">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Improvement Suggestions */}
            {improvementSuggestions.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ArrowUpRight size={15} className="text-emerald-600" />
                        <span>Prioritized ATS Optimization Suggestions</span>
                    </h4>

                    <div className="space-y-2">
                        {improvementSuggestions.map((item, idx) => {
                            const isHigh = item.priority === "high";
                            const isMed = item.priority === "medium";
                            return (
                                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                                        isHigh ? "bg-rose-100 text-rose-800" : isMed ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                    }`}>
                                        {item.priority}
                                    </span>
                                    <div className="space-y-0.5">
                                        <h5 className="font-bold text-xs text-slate-900">{item.area}</h5>
                                        <p className="text-xs text-slate-600 leading-relaxed">{item.suggestion}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Limitations & Extraction Quality Notice */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <HelpCircle size={14} />
                        <span>ATS Scoring Limitations & Notes</span>
                    </div>
                    {textExtractionQuality && (
                        <span className="text-[10px] text-slate-400 font-medium">
                            Parser density: {textExtractionQuality.wordCount || 0} words • {textExtractionQuality.characterCount || 0} chars
                        </span>
                    )}
                </div>
                {limitations.length > 0 && (
                    <ul className="space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
                        {limitations.map((lim, idx) => (
                            <li key={idx}>{lim}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ATSReportView;

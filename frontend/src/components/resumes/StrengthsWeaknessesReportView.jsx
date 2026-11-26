import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Filter,
  RefreshCw,
  Zap,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import StrengthCard from "./StrengthCard";
import WeaknessCard from "./WeaknessCard";
import MissingInformationList from "./MissingInformationList";

/**
 * Master Strengths & Weaknesses Report View (Lesson 7.1)
 */
export const StrengthsWeaknessesReportView = ({
  data,
  isRecalculating = false,
  onRecalculate
}) => {
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'strengths' | 'weaknesses' | 'missing'
  const [selectedCategory, setSelectedCategory] = useState("all");

  if (!data) {
    return (
      <div className="p-8 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <Layers className="mx-auto text-slate-400" size={32} />
        <h4 className="text-sm font-bold text-slate-700">No Strengths & Weaknesses Data Available</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Run strengths and weaknesses detection to receive an evidence-based assessment of your qualifications.
        </p>
        {onRecalculate && (
          <button
            type="button"
            onClick={() => onRecalculate("free")}
            disabled={isRecalculating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Zap size={13} />
            <span>Analyze Strengths & Weaknesses</span>
          </button>
        )}
      </div>
    );
  }

  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const weaknesses = Array.isArray(data.weaknesses) ? data.weaknesses : [];
  const missingInformation = Array.isArray(data.missingInformation) ? data.missingInformation : [];
  const isRuleBased = data.analysisMode === "free";

  // Categories present across all findings
  const allCategories = [
    ...new Set([
      ...strengths.map(s => s.category),
      ...weaknesses.map(w => w.category)
    ].filter(Boolean))
  ];

  // Filtered lists
  const filteredStrengths = strengths.filter(s => {
    if (filterMode === "weaknesses" || filterMode === "missing") return false;
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    return true;
  });

  const filteredWeaknesses = weaknesses.filter(w => {
    if (filterMode === "strengths" || filterMode === "missing") return false;
    if (selectedCategory !== "all" && w.category !== selectedCategory) return false;
    return true;
  });

  const showMissing = filterMode === "all" || filterMode === "missing";

  return (
    <div className="space-y-6">
      {/* Header Summary & Recalculate Controls */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Resume Strengths & Constructive Weaknesses
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isRuleBased ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
              }`}>
                {isRuleBased ? "100% Free Rule-Based" : "AI-Assisted Engine"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Every finding is grounded in explicit textual citations from your structured resume.
            </p>
          </div>

          {onRecalculate && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRecalculate("free")}
                disabled={isRecalculating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
                title="Re-run instant rule-based detection"
              >
                <RefreshCw size={12} className={isRecalculating ? "animate-spin" : ""} />
                <span>Re-check Free</span>
              </button>
              <button
                type="button"
                onClick={() => onRecalculate("ai")}
                disabled={isRecalculating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer border border-purple-200 disabled:opacity-50"
                title="Run Advanced AI detection"
              >
                <Sparkles size={12} />
                <span>AI Re-check</span>
              </button>
            </div>
          )}
        </div>

        {/* Metric Counter Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">Verified Strengths</span>
                <span className="text-[10px] text-emerald-700">Supported by direct evidence</span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-800">{strengths.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900 block">Areas for Enhancement</span>
                <span className="text-[10px] text-amber-700">Actionable improvements</span>
              </div>
            </div>
            <span className="text-lg font-black text-amber-800">{weaknesses.length}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <HelpCircle size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-sky-900 block">Missing Information</span>
                <span className="text-[10px] text-sky-700">Optional or omitted details</span>
              </div>
            </div>
            <span className="text-lg font-black text-sky-800">{missingInformation.length}</span>
          </div>
        </div>

        {/* Analysis Summary Text */}
        {data.analysisSummary && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Executive Summary: </span>
            {data.analysisSummary}
          </div>
        )}
      </div>

      {/* Filter and Category Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs max-w-full">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              filterMode === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Findings ({strengths.length + weaknesses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("strengths")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              filterMode === "strengths" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Strengths Only ({strengths.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("weaknesses")}
            className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
              filterMode === "weaknesses" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Weaknesses Only ({weaknesses.length})
          </button>
          {missingInformation.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode("missing")}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                filterMode === "missing" ? "bg-white text-sky-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Missing Info ({missingInformation.length})
            </button>
          )}
        </div>

        {allCategories.length > 0 && filterMode !== "missing" && (
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Strengths Section */}
      {filteredStrengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Verified Candidate Strengths ({filteredStrengths.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredStrengths.map((str) => (
              <StrengthCard key={str.id} strength={str} />
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses Section */}
      {filteredWeaknesses.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>Constructive Improvement Areas ({filteredWeaknesses.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredWeaknesses.map((w) => (
              <WeaknessCard key={w.id} weakness={w} />
            ))}
          </div>
        </div>
      )}

      {/* Missing Information Section */}
      {showMissing && missingInformation.length > 0 && (
        <MissingInformationList missingInformation={missingInformation} />
      )}

      {/* Limitations Disclosure */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info size={13} className="text-slate-400" />
          <span>Analysis Scope & Layout Disclosure</span>
        </div>
        <p>
          Detection is evidence-based and performed on structured textual contents extracted from your document.
          Plain-text processing cannot evaluate graphical styling, margins, colors, or page columns. Unlisted skills or achievements are not inferred.
        </p>
      </div>
    </div>
  );
};

export default StrengthsWeaknessesReportView;

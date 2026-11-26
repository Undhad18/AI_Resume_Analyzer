import { useState } from "react";
import {
  Cpu,
  Sparkles,
  Zap,
  Info,
  RefreshCw
} from "lucide-react";
import DetectedSkillsList from "./DetectedSkillsList";
import MissingSkillsList from "./MissingSkillsList";
import MatchedKeywordsList from "./MatchedKeywordsList";
import MissingKeywordsList from "./MissingKeywordsList";
import PartialMatchesList from "./PartialMatchesList";
import SkillCategoryGroup from "./SkillCategoryGroup";
import JobDescriptionInput from "./JobDescriptionInput";

/**
 * SkillsDetectionReport Component (Lesson 7.2)
 * Master dashboard for General Skills Analysis and Job-Specific Comparison
 */
export const SkillsDetectionReport = ({
  data,
  isLoading = false,
  onRunAnalysis
}) => {
  const [activeSubTab, setActiveSubTab] = useState("detected"); // 'detected' | 'categories' | 'missing' | 'keywords'

  if (!data) {
    return (
      <div className="space-y-6">
        <JobDescriptionInput
          onCompare={(params) => onRunAnalysis(params)}
          isLoading={isLoading}
        />

        <div className="p-8 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Cpu className="mx-auto text-slate-400" size={32} />
          <h4 className="text-sm font-bold text-slate-700">No Skills Analysis Data Available</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Extract technical competencies, verify hands-on project citations, or compare against target job requirements.
          </p>
          {onRunAnalysis && (
            <button
              type="button"
              onClick={() => onRunAnalysis({ mode: "general", analysisMode: "free" })}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs disabled:opacity-50 transition"
            >
              <Zap size={13} />
              <span>Run General Skills Detection (Free)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const detectedSkills = Array.isArray(data.detectedSkills) ? data.detectedSkills : [];
  const missingSkills = Array.isArray(data.missingSkills) ? data.missingSkills : [];
  const matchedKeywords = Array.isArray(data.matchedKeywords) ? data.matchedKeywords : [];
  const missingKeywords = Array.isArray(data.missingKeywords) ? data.missingKeywords : [];
  const partialMatches = Array.isArray(data.partialMatches) ? data.partialMatches : [];
  const skillCategories = data.skillCategories || {};
  const isRuleBased = data.analysisMode === "free";
  const isJobSpecific = data.detectionMode === "job_specific";

  const verifiedCount = detectedSkills.filter(s => s.evidenceStatus === "explicit_and_applied" || s.evidenceStatus === "applied_only").length;

  return (
    <div className="space-y-6">
      {/* Target Job Description Input Form */}
      <JobDescriptionInput
        onCompare={(params) => onRunAnalysis(params)}
        isLoading={isLoading}
        initialText={data.jobDescriptionSnippet || ""}
      />

      {/* Header Summary Stats */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isJobSpecific ? "Job-Specific Skills & Keyword Match" : "General Resume Skills Inventory"}
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isRuleBased ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
              }`}>
                {isRuleBased ? "100% Free Rule-Based" : "AI-Assisted Engine"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isJobSpecific
                ? "Direct comparison against target job requirements with safe word-boundary matching."
                : "Comprehensive breakdown of technical and collaborative competencies found in your resume."}
            </p>
          </div>

          {onRunAnalysis && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRunAnalysis({ mode: isJobSpecific ? "job_specific" : "general", jobDescription: data.jobDescriptionSnippet || "", analysisMode: "free" })}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                <span>Re-run Free</span>
              </button>
              <button
                type="button"
                onClick={() => onRunAnalysis({ mode: isJobSpecific ? "job_specific" : "general", jobDescription: data.jobDescriptionSnippet || "", analysisMode: "ai" })}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer border border-purple-200 disabled:opacity-50"
              >
                <Sparkles size={12} />
                <span>AI Re-run</span>
              </button>
            </div>
          )}
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Detected</span>
            <span className="text-lg font-black text-slate-900">{detectedSkills.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Applied in Projects</span>
            <span className="text-lg font-black text-emerald-800">{verifiedCount}</span>
          </div>

          {isJobSpecific ? (
            <>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Not Detected</span>
                <span className="text-lg font-black text-amber-800">{missingSkills.length}</span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/70">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block">Partial Matches</span>
                <span className="text-lg font-black text-indigo-800">{partialMatches.length}</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200/70">
                <span className="text-[10px] font-bold uppercase text-sky-700 block">Active Domains</span>
                <span className="text-lg font-black text-sky-800">
                  {Object.values(skillCategories).filter(arr => arr.length > 0).length}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70">
                <span className="text-[10px] font-bold uppercase text-purple-700 block">Listed Only</span>
                <span className="text-lg font-black text-purple-800">
                  {detectedSkills.filter(s => s.evidenceStatus === "explicit_only").length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Executive Summary */}
        {data.summary && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Analysis Summary: </span>
            {data.summary}
          </div>
        )}
      </div>

      {/* Subtabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs max-w-full">
        <button
          type="button"
          onClick={() => setActiveSubTab("detected")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
            activeSubTab === "detected" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Detected Skills ({detectedSkills.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("categories")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
            activeSubTab === "categories" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Categories ({Object.values(skillCategories).filter(arr => arr.length > 0).length})
        </button>

        {isJobSpecific && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab("missing")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeSubTab === "missing" ? "bg-white text-amber-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Missing Requirements ({missingSkills.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("keywords")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                activeSubTab === "keywords" ? "bg-white text-indigo-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Keywords & Partial ({matchedKeywords.length + partialMatches.length})
            </button>
          </>
        )}
      </div>

      {/* SUBTAB 1: DETECTED SKILLS */}
      {activeSubTab === "detected" && (
        <DetectedSkillsList skills={detectedSkills} />
      )}

      {/* SUBTAB 2: CATEGORIES BREAKDOWN */}
      {activeSubTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(skillCategories).map(([cat, list]) => (
            <SkillCategoryGroup key={cat} category={cat} skills={list} />
          ))}
        </div>
      )}

      {/* SUBTAB 3: MISSING REQUIREMENTS (JOB-SPECIFIC) */}
      {activeSubTab === "missing" && (
        <div className="space-y-4">
          <MissingSkillsList missingSkills={missingSkills} />
          {missingKeywords.length > 0 && (
            <MissingKeywordsList missingKeywords={missingKeywords} />
          )}
        </div>
      )}

      {/* SUBTAB 4: KEYWORDS & PARTIAL MATCHES */}
      {activeSubTab === "keywords" && (
        <div className="space-y-6">
          <PartialMatchesList partialMatches={partialMatches} />
          <MatchedKeywordsList matchedKeywords={matchedKeywords} />
        </div>
      )}

      {/* Limitations Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info size={13} className="text-slate-400" />
          <span>Evaluation Scope & Job Matching Disclosure</span>
        </div>
        <p>
          This module performs textual skills inventory and keyword extraction.
          Complete multi-factor job compatibility scoring and ATS profile ranking belong to Module 9.
          Skills not detected in the document reflect text omissions rather than verified lack of personal ability.
        </p>
      </div>
    </div>
  );
};

export default SkillsDetectionReport;

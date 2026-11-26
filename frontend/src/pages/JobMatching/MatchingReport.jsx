import { useState } from "react";
import {
  Briefcase,
  FileText,
  Building2,
  MapPin,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Award
} from "lucide-react";
import JobMatchScoreCard from "../../components/jobMatching/JobMatchScoreCard";
import CategoryScoreBreakdown from "../../components/jobMatching/CategoryScoreBreakdown";
import KeywordMatchList from "../../components/jobMatching/KeywordMatchList";
import MissingKeywords from "../../components/jobMatching/MissingKeywords";
import MatchingStrengths from "../../components/jobMatching/MatchingStrengths";
import ImprovementAreas from "../../components/jobMatching/ImprovementAreas";
import MatchingResult from "./MatchingResult";
import { calculateJobMatchScore } from "../../services/jobMatchingService";

/**
 * MatchingReport Dashboard Component (Lesson 9.3)
 * Full interactive report presenting overall score, category breakdown,
 * keyword detection, strengths, improvement areas, and requirement citations.
 */
export const MatchingReport = ({ reportData = {}, onReset = null }) => {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "keywords" | "requirements"
  const [currentReport, setCurrentReport] = useState(reportData);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [notice, setNotice] = useState(null);

  const {
    matchId,
    overallScore = 0,
    scoreLabel = "Good Match",
    scoreExplanation = "",
    categoryScores = {},
    categoryWeights = {},
    categoryDetails = {},
    keywords = { matched: [], partiallyMatched: [], notDetected: [] },
    strengths = [],
    improvementAreas = [],
    analysisLimitations = [],
    resumeInfo = {},
    jobInfo = {},
    matchingDetails = {}
  } = currentReport;

  const handleRecalculate = async () => {
    if (!matchId || isRecalculating) return;
    try {
      setIsRecalculating(true);
      setNotice(null);
      const res = await calculateJobMatchScore(matchId);
      if (res?.data) {
        setCurrentReport(res.data);
        setNotice({ type: "success", message: "Job match scores recalculated successfully!" });
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.response?.data?.message || err?.message || "Failed to recalculate score."
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Context & Metadata Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={12} />
              <span>Job Match Report • Module 9.3</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles size={11} />
              <span>Transparent Weighted Scoring</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Resume Info */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText size={11} />
                <span>Selected Resume</span>
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {resumeInfo.resumeTitle || "Resume"}
              </p>
              {resumeInfo.candidateName && (
                <p className="text-xs text-slate-500 truncate">
                  Candidate: <strong className="text-slate-700">{resumeInfo.candidateName}</strong>
                </p>
              )}
            </div>

            {/* Target Job Info */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Briefcase size={11} />
                <span>Target Job Posting</span>
              </span>
              <p className="text-sm font-bold text-slate-900 truncate">
                {jobInfo.jobTitle || "Job Listing"}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                {jobInfo.companyName && (
                  <span className="flex items-center gap-1">
                    <Building2 size={11} />
                    <span>{jobInfo.companyName}</span>
                  </span>
                )}
                {jobInfo.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    <span>{jobInfo.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isRecalculating}
            onClick={handleRecalculate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
            title="Recalculate score and refresh matching report"
          >
            <RefreshCw size={13} className={isRecalculating ? "animate-spin text-blue-600" : ""} />
            <span>{isRecalculating ? "Scoring..." : "Refresh Score"}</span>
          </button>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Match Another</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          className={`p-3.5 text-xs rounded-xl flex items-center gap-2 ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{notice.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "overview"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award size={14} />
          <span>Match Score Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("keywords")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "keywords"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles size={14} />
          <span>Keywords & Missing Skills ({keywords.notDetected?.length || 0} missing)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requirements")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "requirements"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layers size={14} />
          <span>Detailed Evidence & Citations</span>
        </button>
      </div>

      {/* Tab 1: Match Score Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Overall Score Card */}
          <JobMatchScoreCard
            score={overallScore}
            scoreLabel={scoreLabel}
            scoreExplanation={scoreExplanation}
          />

          {/* Category Scores Breakdown */}
          <CategoryScoreBreakdown
            categoryScores={categoryScores}
            categoryWeights={categoryWeights}
            categoryDetails={categoryDetails}
          />

          {/* Strengths & Improvement Areas */}
          <div className="space-y-4">
            <MatchingStrengths strengths={strengths} />
            <ImprovementAreas improvementAreas={improvementAreas} />
          </div>

          {/* Analysis Limitations if any */}
          {analysisLimitations.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5 text-xs text-amber-900">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Analysis Limitations:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px] pl-1">
                {analysisLimitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Keywords & Missing Skills */}
      {activeTab === "keywords" && (
        <div className="space-y-6">
          <MissingKeywords notDetected={keywords.notDetected || []} />
          <KeywordMatchList
            matched={keywords.matched || []}
            partiallyMatched={keywords.partiallyMatched || []}
          />
        </div>
      )}

      {/* Tab 3: Detailed Evidence & Citations (Lesson 9.2 component) */}
      {activeTab === "requirements" && (
        <div className="pt-2">
          <MatchingResult
            matchResult={{
              resumeInfo,
              jobInfo,
              matchingDetails,
              analysisLimitations
            }}
            onReset={null}
          />
        </div>
      )}
    </div>
  );
};

export default MatchingReport;

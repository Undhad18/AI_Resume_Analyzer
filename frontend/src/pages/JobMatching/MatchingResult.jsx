import { useState } from "react";
import {
  Briefcase,
  FileText,
  Building2,
  MapPin,
  Calendar,
  RotateCcw,
  Sparkles,
  Award,
  GraduationCap,
  FolderGit2,
  CheckCircle2,
  Clock
} from "lucide-react";
import MatchingSummary from "../../components/jobMatching/MatchingSummary";
import RequirementItemCard from "../../components/jobMatching/RequirementItemCard";

/**
 * Detailed Matching Report Page Component (Lesson 9.2)
 */
export const MatchingResult = ({ matchResult = {}, onReset = null }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    resumeInfo = {},
    jobInfo = {},
    matchingDetails = {},
    matchingMode = "rule_based",
    analysisLimitations = []
  } = matchResult;

  const categories = [
    { id: "all", label: "All Requirements", icon: Sparkles },
    { id: "skills", label: `Skills (${matchingDetails.skills?.length || 0})`, icon: Award },
    { id: "experience", label: `Experience (${matchingDetails.experience?.length || 0})`, icon: Briefcase },
    { id: "education", label: `Education (${matchingDetails.education?.length || 0})`, icon: GraduationCap },
    { id: "projects", label: `Projects (${matchingDetails.projects?.length || 0})`, icon: FolderGit2 },
    { id: "responsibilities", label: `Responsibilities (${matchingDetails.responsibilities?.length || 0})`, icon: CheckCircle2 },
    { id: "certifications", label: `Certifications (${matchingDetails.certifications?.length || 0})`, icon: Award }
  ];

  // Aggregate items according to active tab
  let displayedItems = [];
  if (activeCategory === "all") {
    displayedItems = [
      ...(matchingDetails.skills || []),
      ...(matchingDetails.experience || []),
      ...(matchingDetails.education || []),
      ...(matchingDetails.projects || []),
      ...(matchingDetails.responsibilities || []),
      ...(matchingDetails.certifications || [])
    ];
  } else {
    displayedItems = matchingDetails[activeCategory] || [];
  }

  // Filter by status
  if (statusFilter !== "all") {
    displayedItems = displayedItems.filter((item) => item.status === statusFilter);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={12} />
              <span>Job Match Analysis • Module 9.2</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                matchingMode === "ai"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <Sparkles size={11} />
              <span>{matchingMode === "ai" ? "Advanced AI Engine" : "Deterministic Engine (Free Mode)"}</span>
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

        {/* Action Button */}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shrink-0"
          >
            <RotateCcw size={13} />
            <span>Match Another</span>
          </button>
        )}
      </div>

      {/* Summary Statistics */}
      <MatchingSummary
        matchingDetails={matchingDetails}
        analysisLimitations={analysisLimitations}
      />

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon size={13} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Filter Row */}
      <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-2xl p-3 text-xs">
        <span className="text-slate-500 font-medium">Filter by match status:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {["all", "matched", "partially_matched", "not_detected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all"
                ? "All"
                : st === "matched"
                ? "Matched"
                : st === "partially_matched"
                ? "Partially Matched"
                : "Not Detected"}
            </button>
          ))}
        </div>
      </div>

      {/* Requirement List */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white border border-slate-200 space-y-1">
            <p className="text-xs font-bold text-slate-700">No requirements found in this filter.</p>
            <p className="text-[11px] text-slate-400">Try choosing a different category or clearing the status filter.</p>
          </div>
        ) : (
          displayedItems.map((item, idx) => (
            <RequirementItemCard key={idx} item={item} />
          ))
        )}
      </div>
    </div>
  );
};

export default MatchingResult;

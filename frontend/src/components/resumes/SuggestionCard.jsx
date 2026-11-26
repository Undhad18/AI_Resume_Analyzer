import { useState } from "react";
import {
  Sparkles,
  Zap,
  Check,
  X,
  Clock,
  ShieldCheck,
  Quote,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Key,
  Layout,
  Type
} from "lucide-react";
import SuggestionPriorityBadge from "./SuggestionPriorityBadge";
import SuggestionExample from "./SuggestionExample";

/**
 * Category icons renderer
 */
const renderCategoryIcon = (category) => {
  switch (category) {
    case "professional_summary":
      return <FileText size={12} className="text-slate-500" />;
    case "skills":
      return <Layers size={12} className="text-slate-500" />;
    case "work_experience":
      return <Briefcase size={12} className="text-slate-500" />;
    case "education":
      return <GraduationCap size={12} className="text-slate-500" />;
    case "projects":
      return <FolderGit2 size={12} className="text-slate-500" />;
    case "certifications":
      return <Award size={12} className="text-slate-500" />;
    case "keywords":
      return <Key size={12} className="text-slate-500" />;
    case "formatting":
      return <Layout size={12} className="text-slate-500" />;
    case "grammar":
      return <Type size={12} className="text-slate-500" />;
    case "completeness":
    default:
      return <HelpCircle size={12} className="text-slate-500" />;
  }
};

/**
 * SuggestionCard Component (Lesson 7.3)
 */
export const SuggestionCard = ({ suggestion, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState(suggestion?.status || "pending");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!suggestion) return null;

  const isAi = suggestion.source === "ai_generated";

  const handleUpdateStatus = async (newStatus) => {
    if (isUpdating || currentStatus === newStatus) return;
    setIsUpdating(true);
    setCurrentStatus(newStatus);
    try {
      if (onStatusChange) {
        await onStatusChange(suggestion.id, newStatus);
      }
    } catch {
      // Revert on error
      setCurrentStatus(suggestion.status || "pending");
    } finally {
      setIsUpdating(false);
    }
  };

  const evidenceList = Array.isArray(suggestion.evidence)
    ? suggestion.evidence
    : suggestion.evidence
      ? [suggestion.evidence]
      : [];

  return (
    <div className={`p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
      currentStatus === "completed"
        ? "bg-emerald-50/20 border-emerald-200/60"
        : currentStatus === "dismissed"
          ? "bg-slate-50/40 border-slate-200/50 opacity-60"
          : "bg-white border-slate-200/90 hover:border-slate-300"
    }`}>
      <div className="space-y-3">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
              {renderCategoryIcon(suggestion.category)}
              <span>{suggestion.category?.replace(/_/g, " ")}</span>
            </span>

            <SuggestionPriorityBadge priority={suggestion.priority} />

            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAi ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isAi ? <Sparkles size={10} /> : <Zap size={10} />}
              <span>{isAi ? "AI Engine" : "Rule-Based"}</span>
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
              currentStatus === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : currentStatus === "accepted"
                  ? "bg-blue-100 text-blue-800"
                  : currentStatus === "dismissed"
                    ? "bg-slate-200 text-slate-700"
                    : "bg-amber-100 text-amber-800"
            }`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Suggestion Title */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {suggestion.title}
        </h4>

        {/* Problem Statement */}
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
            <AlertCircle size={13} className="text-amber-600 shrink-0" />
            <span>Problem Identified</span>
          </div>
          <p className="leading-relaxed">{suggestion.problem}</p>
        </div>

        {/* Why It Matters */}
        {suggestion.whyItMatters && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
              Why This Matters
            </span>
            <p className="leading-relaxed">{suggestion.whyItMatters}</p>
          </div>
        )}

        {/* Recommended Action */}
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-emerald-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
            <Lightbulb size={13} className="text-emerald-600 shrink-0" />
            <span>Recommended Action</span>
          </div>
          <p className="leading-relaxed font-medium">{suggestion.recommendedAction}</p>
        </div>

        {/* Evidence Citations */}
        {evidenceList.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Quote size={10} />
              <span>Resume Evidence & Basis</span>
            </span>
            <div className="space-y-1">
              {evidenceList.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 text-[11px] leading-relaxed italic"
                >
                  "{ev}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concrete Before/After Example */}
        {suggestion.example && (
          <SuggestionExample example={suggestion.example} />
        )}
      </div>

      {/* Footer Controls & Status Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>Confidence: <strong className="text-slate-700">{Math.round((suggestion.confidence || 0.9) * 100)}%</strong></span>
        </div>

        {/* Status Actions: Accept, Mark Completed, Dismiss */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleUpdateStatus("accepted")}
            disabled={isUpdating || currentStatus === "accepted"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              currentStatus === "accepted"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
            }`}
            title="Mark suggestion as accepted to work on"
          >
            <Clock size={12} />
            <span>Accept</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus("completed")}
            disabled={isUpdating || currentStatus === "completed"}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              currentStatus === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
            title="Mark suggestion as successfully resolved in your resume"
          >
            <Check size={12} />
            <span>Completed</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus(currentStatus === "dismissed" ? "pending" : "dismissed")}
            disabled={isUpdating}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-xs ${
              currentStatus === "dismissed"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title="Dismiss suggestion if not applicable"
          >
            <X size={12} />
            <span>{currentStatus === "dismissed" ? "Restore" : "Dismiss"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;

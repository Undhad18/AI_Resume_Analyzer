import { useState } from "react";
import {
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Lightbulb,
  Info
} from "lucide-react";
import SuggestionCard from "./SuggestionCard";
import ImprovementSuggestionsSummary from "./ImprovementSuggestionsSummary";
import { updateResumeSuggestionStatus } from "../../services/resumeService";

/**
 * Master Resume Improvement Suggestions Component (Lesson 7.3)
 */
export const ImprovementSuggestions = ({
  data,
  resumeId,
  isLoading = false,
  onGenerate
}) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all"); // 'all' | 'high' | 'medium' | 'low'
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'pending' | 'accepted' | 'completed' | 'dismissed'
  const [searchQuery, setSearchQuery] = useState("");
  const [localSuggestions, setLocalSuggestions] = useState(data?.suggestions || []);

  // Sync suggestions when data prop changes
  const suggestions = data?.suggestions || [];

  const isRuleBased = data?.generationMode === "free";

  const handleStatusChange = async (suggestionId, newStatus) => {
    try {
      if (resumeId) {
        await updateResumeSuggestionStatus(resumeId, suggestionId, newStatus);
      }
      setLocalSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      console.error("Failed to update suggestion status:", err);
      throw err;
    }
  };

  if (!data && !isLoading) {
    return (
      <div className="p-8 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <Lightbulb size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">No Improvement Suggestions Generated Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Generate grounded, actionable recommendations across summary, skills, experience impact, formatting, and keywords.
          </p>
        </div>
        {onGenerate && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => onGenerate("free")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition"
            >
              <Zap size={13} />
              <span>Generate Free Suggestions</span>
            </button>
            <button
              type="button"
              onClick={() => onGenerate("advanced")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs transition"
            >
              <Sparkles size={13} />
              <span>Advanced AI Mode</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active suggestions list (combining prop + local updates)
  const currentList = localSuggestions.length > 0 ? localSuggestions : suggestions;

  // Filtered suggestions
  const filteredSuggestions = currentList.filter(s => {
    // Category filter
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    // Priority filter
    if (selectedPriority !== "all" && s.priority !== selectedPriority) return false;
    // Status filter
    if (selectedStatus !== "all" && (s.status || "pending") !== selectedStatus) return false;
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchProblem = s.problem?.toLowerCase().includes(q);
      const matchAction = s.recommendedAction?.toLowerCase().includes(q);
      if (!matchTitle && !matchProblem && !matchAction) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Re-run Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              AI Resume Improvement Suggestions
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isRuleBased ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
            }`}>
              {isRuleBased ? "100% Free Mode" : "OpenAI Powered"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized recommendations grounded in your structured resume, scoring metrics, and target requirements.
          </p>
        </div>

        {onGenerate && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onGenerate("free")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Re-run deterministic Free Mode suggestions"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Re-run Free</span>
            </button>
            <button
              type="button"
              onClick={() => onGenerate("advanced")}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer border border-purple-200 disabled:opacity-50"
              title="Run Advanced AI semantic analysis"
            >
              <Sparkles size={12} />
              <span>AI Re-check</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Metrics Component */}
      {data && (
        <ImprovementSuggestionsSummary
          totalSuggestions={data.totalSuggestions || currentList.length}
          highPriorityCount={data.highPriorityCount || currentList.filter(s => s.priority === "high").length}
          mediumPriorityCount={data.mediumPriorityCount || currentList.filter(s => s.priority === "medium").length}
          lowPriorityCount={data.lowPriorityCount || currentList.filter(s => s.priority === "low").length}
          categoryCounts={data.categoryCounts || {}}
          summary={data.summary || ""}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search suggestions or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Priority & Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            {["all", "high", "medium", "low"].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPriority(p)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  selectedPriority === p ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={12} className="text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestion Cards Grid / List */}
      {filteredSuggestions.length > 0 ? (
        <div className="space-y-4">
          {filteredSuggestions.map((sug) => (
            <SuggestionCard
              key={sug.id}
              suggestion={sug}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
          <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
          <h5 className="text-xs font-bold text-slate-800">No suggestions matching your selected filters</h5>
          <p className="text-[11px] text-slate-500">
            Try adjusting your search query, priority filter, or category selection.
          </p>
        </div>
      )}

      {/* Safety & Grounding Disclosure */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Info size={13} className="text-slate-400" />
          <span>Suggestion Policy & Anti-Hallucination Guidelines</span>
        </div>
        <p className="leading-relaxed">
          Recommendations never fabricate work experience, achievements, or skills. Missing keywords are flagged only as areas to incorporate if you have genuine experience. Freshers are evaluated fairly without employment penalties.
        </p>
      </div>
    </div>
  );
};

export default ImprovementSuggestions;

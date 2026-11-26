import { AlertCircle, AlertTriangle, ArrowDown, CheckCircle2 } from "lucide-react";

/**
 * ImprovementSuggestionsSummary Component (Lesson 7.3)
 * Displays top-level metrics, priority counters, and category pills
 */
export const ImprovementSuggestionsSummary = ({
  totalSuggestions = 0,
  highPriorityCount = 0,
  mediumPriorityCount = 0,
  lowPriorityCount = 0,
  categoryCounts = {},
  summary = "",
  selectedCategory = "all",
  onSelectCategory
}) => {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
      {/* 4 Metric Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-500">Total Insights</span>
            <CheckCircle2 size={14} className="text-slate-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalSuggestions}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-800">High Priority</span>
            <AlertCircle size={14} className="text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-800 mt-1 block">
            {highPriorityCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800">Medium</span>
            <AlertTriangle size={14} className="text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-800 mt-1 block">
            {mediumPriorityCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-sky-800">Low Priority</span>
            <ArrowDown size={14} className="text-sky-600" />
          </div>
          <span className="text-2xl font-black text-sky-800 mt-1 block">
            {lowPriorityCount}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Executive Summary: </span>
          {summary}
        </div>
      )}

      {/* Category Pills Navigation */}
      {categoryCounts && Object.keys(categoryCounts).length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Filter by Section Area
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Sections ({totalSuggestions})
            </button>
            {Object.entries(categoryCounts)
              .filter(([, count]) => count > 0)
              .map(([cat, count]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory && onSelectCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.replace(/_/g, " ")} ({count})
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementSuggestionsSummary;

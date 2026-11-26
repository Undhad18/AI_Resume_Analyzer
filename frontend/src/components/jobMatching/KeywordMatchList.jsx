import { useState } from "react";
import { CheckCircle2, AlertCircle, Search, Filter, Tag } from "lucide-react";

/**
 * KeywordMatchList Component (Lesson 9.3)
 * Displays matched and partially matched keywords with supporting citations.
 */
export const KeywordMatchList = ({
  matched = [],
  partiallyMatched = []
}) => {
  const [filter, setFilter] = useState("all"); // "all" | "matched" | "partially_matched"
  const [searchTerm, setSearchTerm] = useState("");

  const allItems = [
    ...matched.map((m) => ({ ...m, status: "matched" })),
    ...partiallyMatched.map((p) => ({ ...p, status: "partially_matched" }))
  ];

  const filteredItems = allItems.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.keyword.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Evidenced Skills & Keywords ({allItems.length})</span>
          </h4>
          <p className="text-xs text-slate-500">
            Target job requirements verified with direct or related textual citations.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("matched")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === "matched"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Matched ({matched.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("partially_matched")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              filter === "partially_matched"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Partial ({partiallyMatched.length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      {allItems.length > 5 && (
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search verified keywords by name or category..."
            className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      )}

      {/* Keywords Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No matching keywords found for the current search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item, idx) => {
            const isMatched = item.status === "matched";
            return (
              <div
                key={`${item.keyword}-${idx}`}
                className={`p-3.5 rounded-xl border transition ${
                  isMatched
                    ? "bg-emerald-50/40 border-emerald-200/80"
                    : "bg-blue-50/40 border-blue-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {item.keyword}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <Tag size={10} />
                      <span>{item.category?.replace(/_/g, " ") || "skill"}</span>
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                      isMatched
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                    }`}
                  >
                    {isMatched ? "Matched" : "Partial"}
                  </span>
                </div>

                {item.evidence && (
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 italic border-t border-slate-200/60 pt-1.5">
                    {item.evidence}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeywordMatchList;

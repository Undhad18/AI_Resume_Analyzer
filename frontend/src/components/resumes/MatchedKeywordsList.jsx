import { CheckCheck } from "lucide-react";

/**
 * MatchedKeywordsList Component
 * Displays matching technical terms with evidence citations
 */
export const MatchedKeywordsList = ({ matchedKeywords = [] }) => {
  if (!matchedKeywords || matchedKeywords.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        No specific technical keyword matches found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-700">Matched Technical Keywords ({matchedKeywords.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {matchedKeywords.map((kw, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck size={13} className="text-emerald-600" />
            <span className="font-bold text-slate-900">{kw.normalizedTerm}</span>
            <span className="text-[10px] text-emerald-800 font-mono capitalize">({kw.category.replace(/_/g, " ")})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchedKeywordsList;

import { AlertTriangle } from "lucide-react";

/**
 * MissingKeywordsList Component
 * Displays target keywords not detected in the resume
 */
export const MissingKeywordsList = ({ missingKeywords = [] }) => {
  if (!missingKeywords || missingKeywords.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-700">Keywords Not Detected in Resume ({missingKeywords.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {missingKeywords.map((kw, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg border border-amber-200 bg-amber-50/40 text-xs flex items-center gap-1.5 shadow-2xs"
          >
            <AlertTriangle size={13} className="text-amber-600" />
            <span className="font-semibold text-slate-900">{kw.normalizedTerm}</span>
            <span className="text-[10px] text-amber-800 capitalize">({kw.category.replace(/_/g, " ")})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissingKeywordsList;

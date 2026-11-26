import { Shuffle, ArrowRight } from "lucide-react";

/**
 * PartialMatchesList Component
 * Displays partial skill matches (e.g., candidate has React when Next.js was requested)
 */
export const PartialMatchesList = ({ partialMatches = [] }) => {
  if (!partialMatches || partialMatches.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-bold text-slate-700">Partial Skill Matches ({partialMatches.length})</span>
        <span className="text-[11px] text-slate-400">Related competencies with transferrable bridge</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {partialMatches.map((p, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Shuffle size={14} className="text-indigo-600 shrink-0" />
                <span className="font-bold text-xs text-slate-900">{p.normalizedTerm}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold capitalize">
                {p.importance}
              </span>
            </div>

            {p.partialEvidence && p.partialEvidence.length > 0 && (
              <p className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-indigo-100 leading-relaxed">
                {p.partialEvidence[0]}
              </p>
            )}

            <div className="text-[11px] text-indigo-950 flex items-start gap-1">
              <ArrowRight size={12} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>{p.suggestion}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartialMatchesList;

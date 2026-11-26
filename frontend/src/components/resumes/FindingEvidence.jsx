import { useState } from "react";
import { Quote, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Finding Evidence Component
 * Displays citations and quotes supporting a detected strength or weakness
 */
export const FindingEvidence = ({ evidence = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!evidence || evidence.length === 0) {
    return null;
  }

  const items = Array.isArray(evidence) ? evidence : [evidence];
  const displayItems = isExpanded ? items : items.slice(0, 2);

  return (
    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Quote size={11} className="text-slate-400" />
          <span>Supporting Evidence ({items.length})</span>
        </span>
        {items.length > 2 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isExpanded ? "Show Less" : `+${items.length - 2} More`}</span>
            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      <div className="space-y-1">
        {displayItems.map((item, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-mono leading-relaxed"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindingEvidence;

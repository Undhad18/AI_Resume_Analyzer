import { FileText, Layers } from "lucide-react";

/**
 * EvidenceCard Component (Lesson 9.2)
 * Renders verified resume citations with source section badges.
 */
export const EvidenceCard = ({ evidence = [] }) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="space-y-1.5 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        <FileText size={11} className="text-slate-400" />
        <span>Verified Resume Evidence</span>
      </span>

      <div className="space-y-1.5">
        {evidence.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-0.5"
          >
            {item.sourceSection && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 uppercase tracking-wider">
                <Layers size={10} />
                <span>Section: {item.sourceSection}</span>
              </span>
            )}
            <p className="font-sans text-slate-800 leading-relaxed italic pl-1 border-l-2 border-blue-400">
              "{item.text}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceCard;

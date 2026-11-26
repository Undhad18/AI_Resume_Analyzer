import { FileText, CheckCircle2, AlertTriangle, HelpCircle, Layers } from "lucide-react";

/**
 * Supporting Evidence Citation Card Component (Lesson 9.2)
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

/**
 * Requirement Match Item Card (Lesson 9.2)
 */
export const RequirementItemCard = ({ item = {} }) => {
  const status = item.status || "not_detected";

  const getStatusBadge = () => {
    switch (status) {
      case "matched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Matched</span>
          </span>
        );
      case "partially_matched":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            <AlertTriangle size={12} className="text-amber-600" />
            <span>Partially Matched</span>
          </span>
        );
      case "not_detected":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            <HelpCircle size={12} className="text-slate-400" />
            <span>Not Detected</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all space-y-2 bg-white ${
        status === "matched"
          ? "border-emerald-200 hover:border-emerald-300"
          : status === "partially_matched"
          ? "border-amber-200 hover:border-amber-300"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              {item.requirement}
            </h4>
            {item.category && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {item.category}
              </span>
            )}
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {item.explanation && (
        <p className="text-xs text-slate-600 leading-relaxed">
          {item.explanation}
        </p>
      )}

      {item.evidence && item.evidence.length > 0 && (
        <EvidenceCard evidence={item.evidence} />
      )}
    </div>
  );
};

export default RequirementItemCard;

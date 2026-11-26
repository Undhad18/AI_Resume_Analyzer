import { AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";
import FindingImportance from "./FindingImportance";
import FindingEvidence from "./FindingEvidence";

/**
 * WeaknessCard Component
 * Displays constructive improvement area with evidence and actionable suggestion
 */
export const WeaknessCard = ({ weakness }) => {
  if (!weakness) return null;

  return (
    <div className="p-4 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white hover:border-amber-300 transition shadow-xs flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <h5 className="font-bold text-xs sm:text-sm text-amber-950">
              {weakness.title}
            </h5>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
              {weakness.category?.replace(/_/g, " ")}
            </span>
            <FindingImportance level={weakness.impact} labelPrefix="Impact" />
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {weakness.description}
        </p>

        {weakness.suggestion && (
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2">
            <Lightbulb size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-900">Recommendation: </span>
              <span>{weakness.suggestion}</span>
            </div>
          </div>
        )}
      </div>

      <FindingEvidence evidence={weakness.evidence} />

      {weakness.confidence && (
        <div className="flex items-center justify-end text-[10px] text-slate-400 gap-1 pt-1">
          <ShieldAlert size={11} className="text-amber-600" />
          <span>Confidence: <strong className="text-slate-600 capitalize">{weakness.confidence}</strong></span>
        </div>
      )}
    </div>
  );
};

export default WeaknessCard;

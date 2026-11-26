import { CheckCircle2, ShieldCheck } from "lucide-react";
import FindingImportance from "./FindingImportance";
import FindingEvidence from "./FindingEvidence";

/**
 * StrengthCard Component
 * Displays verified strength with evidence citations
 */
export const StrengthCard = ({ strength }) => {
  if (!strength) return null;

  return (
    <div className="p-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-300 transition shadow-xs flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <h5 className="font-bold text-xs sm:text-sm text-emerald-950">
              {strength.title}
            </h5>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
              {strength.category?.replace(/_/g, " ")}
            </span>
            <FindingImportance level={strength.importance} labelPrefix="Value" />
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {strength.description}
        </p>
      </div>

      <FindingEvidence evidence={strength.evidence} />

      {strength.confidence && (
        <div className="flex items-center justify-end text-[10px] text-slate-400 gap-1 pt-1">
          <ShieldCheck size={11} className="text-emerald-600" />
          <span>Confidence: <strong className="text-slate-600 capitalize">{strength.confidence}</strong></span>
        </div>
      )}
    </div>
  );
};

export default StrengthCard;

import { HelpCircle, AlertCircle } from "lucide-react";
import FindingImportance from "./FindingImportance";

/**
 * MissingInformationList Component
 * Displays identified gaps or missing optional fields with importance levels
 */
export const MissingInformationList = ({ missingInformation = [] }) => {
  if (!missingInformation || missingInformation.length === 0) {
    return null;
  }

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle size={15} className="text-sky-600" />
          <span>Identified Gaps & Missing Information ({missingInformation.length})</span>
        </h4>
        <span className="text-[11px] text-slate-400">
          Non-critical omissions or optional fields
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {missingInformation.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-slate-800 capitalize">
                  {item.field?.replace(/_/g, " ")}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.reason}
                </p>
              </div>
            </div>
            <FindingImportance level={item.importance} labelPrefix="Priority" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissingInformationList;

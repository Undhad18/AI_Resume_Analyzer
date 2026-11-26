import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert } from "lucide-react";

/**
 * Matching Summary Statistics Component (Lesson 9.2)
 * Summarizes match status counts without displaying premature final scores.
 */
export const MatchingSummary = ({ matchingDetails = {}, analysisLimitations = [] }) => {
  const allItems = [
    ...(matchingDetails.skills || []),
    ...(matchingDetails.experience || []),
    ...(matchingDetails.education || []),
    ...(matchingDetails.projects || []),
    ...(matchingDetails.responsibilities || []),
    ...(matchingDetails.certifications || [])
  ];

  const matchedCount = allItems.filter((i) => i.status === "matched").length;
  const partialCount = allItems.filter((i) => i.status === "partially_matched").length;
  const notDetectedCount = allItems.filter((i) => i.status === "not_detected").length;
  const totalCount = allItems.length;

  return (
    <div className="space-y-4">
      {/* 3-Column Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Matched */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Directly Matched</span>
            </span>
            <p className="text-[11px] text-emerald-700">Supported by resume evidence</p>
          </div>
          <span className="text-2xl font-black text-emerald-800">{matchedCount}</span>
        </div>

        {/* Partially Matched */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Partially Matched</span>
            </span>
            <p className="text-[11px] text-amber-700">Adjacent or related evidence</p>
          </div>
          <span className="text-2xl font-black text-amber-800">{partialCount}</span>
        </div>

        {/* Not Detected */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-slate-500" />
              <span>Not Detected</span>
            </span>
            <p className="text-[11px] text-slate-500">Unverified in resume text</p>
          </div>
          <span className="text-2xl font-black text-slate-700">{notDetectedCount}</span>
        </div>
      </div>

      {/* Analysis Disclaimer & Limitations */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-blue-800">
          <ShieldAlert size={14} />
          <span>Evidence-Based Analysis Notice</span>
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          {totalCount} total target requirements evaluated. "Not Detected" indicates that specific requirement terminology was not found in the resume, but does not definitively prove the candidate lacks the skill.
        </p>

        {analysisLimitations && analysisLimitations.length > 0 && (
          <ul className="list-disc pl-4 text-[10px] text-blue-600/90 space-y-0.5 pt-1">
            {analysisLimitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MatchingSummary;

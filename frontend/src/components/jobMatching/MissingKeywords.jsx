import { AlertCircle, HelpCircle, ShieldCheck, Tag, Info } from "lucide-react";

/**
 * MissingKeywords Component (Lesson 9.3)
 * Displays target requirements not detected in the resume text,
 * with strictly ethical, non-fabrication suggestions.
 */
export const MissingKeywords = ({ notDetected = [] }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span>Missing Keywords & Undetected Skills ({notDetected.length})</span>
          </h4>
          <p className="text-xs text-slate-500">
            Terms requested by the job description that were not detected in your resume.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Ethical Transparency Policy</span>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Important Notice on Missing Keywords:</span>
          <p className="text-amber-800/90 leading-relaxed text-[11px]">
            A status of <em>"Not Detected"</em> indicates only that this keyword was not found in your submitted document text.
            It is <strong>not proof</strong> that you lack this skill. If you genuinely possess this background,
            consider documenting truthful, measurable achievements in your resume. Never fabricate credentials.
          </p>
        </div>
      </div>

      {/* Keywords Cards */}
      {notDetected.length === 0 ? (
        <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-200">
          All key job description requirements were detected in your resume!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notDetected.map((item, idx) => {
            const isRequired = item.importance === "required";
            return (
              <div
                key={`${item.keyword}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {item.keyword}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <Tag size={10} />
                      <span>{item.category?.replace(/_/g, " ") || "technical skill"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isRequired
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isRequired ? "Must Have" : "Preferred"}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                      Not Detected
                    </span>
                  </div>
                </div>

                {/* Suggested Action */}
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-1.5">
                  <HelpCircle size={12} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {item.suggestedAction ||
                      "If you genuinely have this skill or experience, consider adding relevant evidence to your resume."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MissingKeywords;

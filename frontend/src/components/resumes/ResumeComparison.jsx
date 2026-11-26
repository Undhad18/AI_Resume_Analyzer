import { Sparkles, CheckCircle2 } from "lucide-react";

export const ResumeComparison = ({
  originalContent = {},
  enhancedContent = {},
  sectionsDiff = []
}) => {
  const renderContentValue = (val) => {
    if (!val) return <span className="italic text-slate-400">Section omitted or empty in original</span>;
    if (typeof val === "string") return <p className="whitespace-pre-wrap">{val}</p>;
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc pl-4 space-y-1.5">
          {val.map((item, idx) => (
            <li key={idx}>
              {typeof item === "string" ? item : item.name || item.title || item.degree || JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }
    return <pre className="font-mono text-xs overflow-x-auto bg-slate-50 p-2 rounded-lg">{JSON.stringify(val, null, 2)}</pre>;
  };

  const modifiedSections = sectionsDiff.filter(d => d.isModified);

  return (
    <div className="space-y-4">
      {/* Header Metric Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Side-by-Side Resume Comparison</span>
          </h3>
          <p className="text-xs text-slate-500">
            Compare original text with enhanced professional phrasing side by side.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>{modifiedSections.length} Section(s) Polished & Improved</span>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sectionsDiff.map((diff) => {
          const { sectionName, isModified, changes = [] } = diff;
          const orig = originalContent[sectionName];
          const enh = enhancedContent[sectionName];

          const formattedTitle = sectionName.replace(/([A-Z])/g, " $1");

          return (
            <div
              key={sectionName}
              className={`rounded-2xl border transition-all overflow-hidden bg-white shadow-xs ${
                isModified ? "border-slate-200" : "border-slate-100 opacity-90"
              }`}
            >
              {/* Card Header */}
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {formattedTitle}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isModified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isModified ? "Polished & Enhanced" : "Unchanged"}
                </span>
              </div>

              {/* Polish Notes Pill */}
              {changes.length > 0 && isModified && (
                <div className="px-5 py-2.5 bg-blue-50/40 border-b border-blue-100/60 text-xs text-blue-900 flex items-start gap-2">
                  <Sparkles size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  <div className="leading-snug">
                    <span className="font-bold">Applied Polish: </span>
                    <span className="text-blue-800">{changes.join(" • ")}</span>
                  </div>
                </div>
              )}

              {/* Split Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs p-5 gap-5">
                {/* Original Column */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <span>Original Text</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 leading-relaxed max-h-64 overflow-y-auto">
                    {renderContentValue(orig)}
                  </div>
                </div>

                {/* Enhanced Column */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-600" />
                    <span>Polished & Enhanced</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold ml-1">
                      Fact-Preserved
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-100 text-slate-800 leading-relaxed max-h-64 overflow-y-auto font-medium">
                    {renderContentValue(enh)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResumeComparison;

import { ShieldAlert, CheckCircle, Edit3, Sparkles, Zap, ListFilter } from "lucide-react";

/**
 * Generated Content Preview & Editor (Lesson 8.3)
 */
export const GeneratedContentPreview = ({
  content = "",
  onChangeContent,
  mode = "free",
  generationType = "rule_based",
  isUserEdited = false,
  keyChangesMade = [],
  disabled = false
}) => {
  const getBadge = () => {
    if (isUserEdited) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Edit3 size={11} />
          <span>User-Edited</span>
        </span>
      );
    }
    if (generationType === "ai_generated" || mode === "ai_generated") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Sparkles size={11} />
          <span>AI-Generated (GPT-4o-mini)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Zap size={11} />
        <span>Template-Based / Rule-Based</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Generated Resume Content</span>
          {getBadge()}
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Click text to edit</span>
      </div>

      {/* Editable Content Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          disabled={disabled}
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Generated content will appear here..."
          className="w-full text-xs font-normal leading-relaxed p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
        />
      </div>

      {/* Accuracy Warning (Mandatory Requirement) */}
      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <span className="font-bold">Accuracy Notice: </span>
          Review generated content carefully. Do not include claims that do not accurately describe your experience.
        </div>
      </div>

      {/* Key Improvements Made */}
      {keyChangesMade.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ListFilter size={12} />
            <span>Applied Polish & Fact Preservation Summary</span>
          </span>
          <ul className="text-[11px] text-slate-600 space-y-0.5">
            {keyChangesMade.map((change, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-600 shrink-0" />
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GeneratedContentPreview;

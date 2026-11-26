import { FileText, Lightbulb, Sparkles } from "lucide-react";

export const SummaryForm = ({ value = "", onChange, onOpenGenerator }) => {
  const MAX_CHARS = 600;
  const currentLength = (value || "").length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Professional Summary
            </h3>
            <p className="text-[11px] text-slate-500">A concise, 2-4 sentence introduction highlighting your expertise</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGenerator && (
            <button
              type="button"
              onClick={() => onOpenGenerator("professionalSummary")}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
              title="Open AI Content Generator for summary"
            >
              <Sparkles size={12} />
              <span>Generate with AI</span>
            </button>
          )}

          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              currentLength > MAX_CHARS
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {currentLength} / {MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Ambitious and results-driven Full Stack Software Developer with solid experience in building responsive web applications using React.js, Node.js, and modern cloud databases. Proven ability to architect clean components and optimize performance..."
          className="w-full text-xs p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
        />

        <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-indigo-50/40 border border-indigo-100/60 text-[11px] text-indigo-900">
          <Lightbulb size={13} className="text-indigo-600 mt-0.5 shrink-0" />
          <span>
            <strong>Writing Tip:</strong> Lead with your career title, key technology stack, and primary technical accomplishments. Keep it under 4 sentences for optimal ATS parsing.
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryForm;

import { useState } from "react";
import { Sparkles, Eye, ShieldCheck } from "lucide-react";
import {
  DEFAULT_TEMPLATE,
  getTemplateConfig,
  extractValidResumeSections
} from "./templates/templateConfig";
import TemplateRenderer from "./templates/TemplateRenderer";
import TemplateSelector from "./templates/TemplateSelector";
import DownloadResumeButton from "./DownloadResumeButton";

/**
 * Master Resume Preview Component (Lesson 8.4)
 * Provides multi-template rendering, paper-sheet simulation, and live synchronization.
 */
export const ResumePreview = ({
  resumeData = {},
  selectedTemplate = DEFAULT_TEMPLATE,
  onSelectTemplate = null
}) => {
  // Support both controlled (parent-provided) and uncontrolled template state
  const [localTemplate, setLocalTemplate] = useState(selectedTemplate || DEFAULT_TEMPLATE);

  const activeTemplateId = onSelectTemplate ? selectedTemplate : localTemplate;
  const handleTemplateChange = (tplId) => {
    if (onSelectTemplate) {
      onSelectTemplate(tplId);
    } else {
      setLocalTemplate(tplId);
    }
  };

  const { isCompletelyEmpty } = extractValidResumeSections(resumeData);
  const activeConfig = getTemplateConfig(activeTemplateId);

  return (
    <div className="space-y-4">
      {/* Top Template Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <TemplateSelector
          selectedTemplate={activeTemplateId}
          onSelectTemplate={handleTemplateChange}
        />
      </div>

      {/* Paper Frame Header Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Eye size={13} className="text-blue-600" />
            <span>Live Sheet Preview</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {activeConfig.displayName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTemplateId === "ats" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck size={11} className="text-emerald-600" />
              <span>ATS-Optimized Single-Column</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Live Synchronized</span>
          )}

          <DownloadResumeButton
            resumeData={resumeData}
            selectedTemplate={activeTemplateId}
            variant="compact"
          />
        </div>
      </div>

      {/* Paper Sheet Frame */}
      {isCompletelyEmpty ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3 min-h-[500px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-sm font-bold text-slate-800">Your Resume is Ready to Build</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fill out your details on the left, or use the <strong>AI Content Generator</strong> to craft professional summaries, bullet points, and skills.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-lg min-h-[700px] transition-all">
          <TemplateRenderer
            resumeData={resumeData}
            selectedTemplate={activeTemplateId}
          />
        </div>
      )}
    </div>
  );
};

export default ResumePreview;

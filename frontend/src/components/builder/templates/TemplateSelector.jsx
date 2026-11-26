import { Check, Layout } from "lucide-react";
import { TEMPLATE_CONFIGS, DEFAULT_TEMPLATE } from "./templateConfig";

/**
 * Thumbnail wireframe graphic for template cards
 */
const TemplateWireframe = ({ type }) => {
  switch (type) {
    case "modern":
      return (
        <div className="w-full h-14 bg-slate-50 border border-slate-200/80 rounded-md p-1.5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="h-1.5 w-1/2 bg-blue-600 rounded-xs" />
            <div className="h-1 w-3/4 bg-slate-300 rounded-xs" />
          </div>
          <div className="space-y-0.5">
            <div className="flex gap-1">
              <div className="h-1 w-1/4 bg-blue-400 rounded-xs" />
              <div className="h-1 w-2/4 bg-slate-200 rounded-xs" />
            </div>
            <div className="flex gap-1">
              <div className="h-1 w-2/5 bg-slate-300 rounded-xs" />
              <div className="h-1 w-2/5 bg-slate-200 rounded-xs" />
            </div>
          </div>
        </div>
      );

    case "classic":
      return (
        <div className="w-full h-14 bg-slate-50 border border-slate-200/80 rounded-md p-1.5 flex flex-col items-center justify-between">
          <div className="space-y-0.5 text-center w-full flex flex-col items-center">
            <div className="h-1.5 w-2/5 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-3/5 bg-slate-400 rounded-xs mt-0.5" />
            <div className="w-full border-b border-slate-700 my-0.5" />
          </div>
          <div className="w-full space-y-1">
            <div className="h-0.5 w-1/3 bg-slate-800 rounded-xs" />
            <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    case "minimal":
      return (
        <div className="w-full h-14 bg-slate-50 border border-slate-200/80 rounded-md p-1.5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="h-1 w-1/3 bg-slate-700 rounded-xs" />
            <div className="h-0.5 w-1/2 bg-slate-300 rounded-xs" />
          </div>
          <div className="space-y-1">
            <div className="h-0.5 w-1/4 bg-slate-400 rounded-xs" />
            <div className="h-0.5 w-4/5 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    case "ats":
      return (
        <div className="w-full h-14 bg-slate-50 border border-slate-200/80 rounded-md p-1.5 flex flex-col justify-between">
          <div className="space-y-0.5">
            <div className="h-1.5 w-1/2 bg-slate-900 rounded-xs" />
            <div className="h-0.5 w-3/4 bg-slate-400 rounded-xs" />
          </div>
          <div className="space-y-0.5">
            <div className="h-0.5 w-1/3 bg-emerald-700 rounded-xs" />
            <div className="h-0.5 w-full bg-slate-300 rounded-xs" />
            <div className="h-0.5 w-5/6 bg-slate-200 rounded-xs" />
          </div>
        </div>
      );

    default:
      return <div className="w-full h-14 bg-slate-100 rounded-md" />;
  }
};

/**
 * Template Selector Component (Lesson 8.4)
 */
export const TemplateSelector = ({
  selectedTemplate = DEFAULT_TEMPLATE,
  onSelectTemplate,
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layout size={13} className="text-blue-600" />
          <span>Resume Template</span>
        </label>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          Select layout to preview
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TEMPLATE_CONFIGS.map((tpl) => {
          const isSelected = selectedTemplate === tpl.id;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate && onSelectTemplate(tpl.id)}
              className={`relative flex flex-col justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300"
              }`}
            >
              {/* Visual Mini Wireframe */}
              <TemplateWireframe type={tpl.previewThumbnail} />

              <div className="mt-2 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {tpl.name}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                      tpl.accent === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : tpl.accent === "slate"
                        ? "bg-slate-100 text-slate-800"
                        : tpl.accent === "emerald"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {tpl.badge}
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 pt-0.5">
                  {tpl.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;

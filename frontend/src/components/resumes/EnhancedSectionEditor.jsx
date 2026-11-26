import { useState } from "react";
import { Edit3, Check, X, FileText } from "lucide-react";

export const EnhancedSectionEditor = ({
  sectionName,
  content,
  onSave,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(() => {
    if (typeof content === "string") return content;
    return JSON.stringify(content, null, 2);
  });

  const handleSave = () => {
    let parsed = textValue;
    if (typeof content !== "string") {
      try {
        parsed = JSON.parse(textValue);
      } catch {
        // Fallback
      }
    }
    onSave(sectionName, parsed);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTextValue(typeof content === "string" ? content : JSON.stringify(content, null, 2));
    setIsEditing(false);
  };

  const formattedTitle = sectionName.replace(/([A-Z])/g, " $1");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <FileText size={14} />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {formattedTitle}
          </h4>
        </div>

        <div>
          {!isEditing ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Section</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
              >
                <X size={13} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xs transition cursor-pointer"
              >
                <Check size={13} />
                <span>Apply Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            rows={6}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
          />
          <p className="text-[11px] text-slate-400">
            Edit text directly. Format changes are applied to your active draft.
          </p>
        </div>
      ) : (
        <div className="text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
          {typeof content === "string" ? (
            content || <span className="italic text-slate-400">Empty section</span>
          ) : Array.isArray(content) ? (
            <ul className="list-disc pl-4 space-y-1.5">
              {content.map((item, idx) => (
                <li key={idx}>
                  {typeof item === "string" ? item : item.name || item.title || item.degree || JSON.stringify(item)}
                </li>
              ))}
            </ul>
          ) : (
            <pre className="text-xs font-mono">{JSON.stringify(content, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSectionEditor;

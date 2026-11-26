import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle
} from "lucide-react";

export const EntryCard = ({
  index,
  total,
  title,
  subtitle,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      // Auto-cancel confirmation after 4 seconds
      setTimeout(() => setConfirmDelete(false), 4000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer group"
        >
          <span className="w-5 h-5 rounded-md bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-800 truncate">
              {title || `Entry #${index + 1}`}
            </h4>
            {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
          </div>
          {isExpanded ? (
            <ChevronUp size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
          )}
        </button>

        {/* Action Controls: Reorder + Delete */}
        <div className="flex items-center gap-1 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              title="Move Up"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ArrowUp size={13} />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveDown}
              title="Move Down"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ArrowDown size={13} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              title={confirmDelete ? "Click to confirm deletion" : "Delete entry"}
              className={`p-1 rounded-md transition cursor-pointer flex items-center gap-1 text-xs ${
                confirmDelete
                  ? "bg-red-600 text-white px-2 py-0.5 font-bold"
                  : "text-slate-400 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              {confirmDelete ? (
                <>
                  <AlertTriangle size={12} />
                  <span>Confirm?</span>
                </>
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Form Body */}
      {isExpanded && <div className="p-4 space-y-3.5 bg-white">{children}</div>}
    </div>
  );
};

export default EntryCard;

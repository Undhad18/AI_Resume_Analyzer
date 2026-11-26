import { AlertCircle, AlertTriangle, ArrowDown } from "lucide-react";

/**
 * SuggestionPriorityBadge Component (Lesson 7.3)
 */
export const SuggestionPriorityBadge = ({ priority = "medium" }) => {
  const norm = (priority || "medium").toLowerCase();

  if (norm === "high") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
        <AlertCircle size={11} className="shrink-0" />
        <span>High Priority</span>
      </span>
    );
  }

  if (norm === "medium") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
        <AlertTriangle size={11} className="shrink-0" />
        <span>Medium</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
      <ArrowDown size={11} className="shrink-0" />
      <span>Low Priority</span>
    </span>
  );
};

export default SuggestionPriorityBadge;

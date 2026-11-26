import { Award } from "lucide-react";
import RequirementItemCard from "./RequirementItemCard";

export const SkillsMatching = ({ items = [] }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Award size={16} className="text-blue-600" />
          <span>Technical & Domain Skills ({items.length})</span>
        </h4>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No skills criteria specified in this job description.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <RequirementItemCard key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsMatching;

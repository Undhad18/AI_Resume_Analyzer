import { Briefcase } from "lucide-react";
import RequirementItemCard from "./RequirementItemCard";

export const ExperienceMatching = ({ items = [] }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-600" />
          <span>Work Experience & Seniority ({items.length})</span>
        </h4>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          No experience duration or role requirements specified.
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

export default ExperienceMatching;

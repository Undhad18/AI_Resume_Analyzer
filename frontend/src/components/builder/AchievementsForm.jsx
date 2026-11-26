import { Trophy, Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";
import EntryCard from "./EntryCard";

export const AchievementsForm = ({
  achievements = [],
  onAdd,
  onUpdate,
  onDelete,
  onOpenGenerator
}) => {
  return (
    <SectionCard
      icon={Trophy}
      iconBg="bg-emerald-50 text-emerald-600"
      title="Key Honors & Achievements"
      subtitle="Awards, hackathons, academic distinctions, and recognitions"
      count={achievements.length}
      onAdd={onAdd}
      addLabel="Add Achievement"
    >
      {achievements.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">
            No achievements added yet. Click &quot;Add Achievement&quot; to showcase your awards.
          </p>
        </div>
      ) : (
        achievements.map((ach, idx) => (
          <EntryCard
            key={ach.id || idx}
            index={idx}
            total={achievements.length}
            title={ach.title || "Untitled Achievement"}
            subtitle={ach.date || "Date not specified"}
            onDelete={() => onDelete(ach.id)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Achievement Title */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700">
                  Achievement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ach.title || ""}
                  onChange={(e) => onUpdate(ach.id, "title", e.target.value)}
                  placeholder="e.g. 1st Place - University Hackathon 2023"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Date / Year (Optional)</label>
                <input
                  type="text"
                  value={ach.date || ""}
                  onChange={(e) => onUpdate(ach.id, "date", e.target.value)}
                  placeholder="e.g. Oct 2023 or 2023"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Description</label>
                  {onOpenGenerator && (
                    <button
                      type="button"
                      onClick={() => onOpenGenerator("achievement", ach.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
                      title="Format achievement impact description"
                    >
                      <Sparkles size={11} />
                      <span>Polish with AI</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={ach.description || ""}
                  onChange={(e) => onUpdate(ach.id, "description", e.target.value)}
                  placeholder="e.g. Awarded first place among 45 teams for developing an automated accessibility testing tool."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
                />
              </div>
            </div>
          </EntryCard>
        ))
      )}
    </SectionCard>
  );
};

export default AchievementsForm;

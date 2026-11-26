import { Briefcase, AlertCircle, Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";
import EntryCard from "./EntryCard";
import { validateDateRange } from "../../utils/resumeBuilderValidation";

export const ExperienceForm = ({
  experience = [],
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onOpenGenerator
}) => {
  return (
    <SectionCard
      icon={Briefcase}
      iconBg="bg-blue-50 text-blue-600"
      title="Work Experience"
      subtitle="Employment history, achievements, and impact"
      count={experience.length}
      onAdd={onAdd}
      addLabel="Add Experience"
    >
      {experience.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">
            No work experience added yet. Click &quot;Add Experience&quot; to add your employment history.
          </p>
        </div>
      ) : (
        experience.map((exp, idx) => {
          const dateValidation = validateDateRange(exp.startDate, exp.endDate, exp.currentlyWorking);

          return (
            <EntryCard
              key={exp.id || idx}
              index={idx}
              total={experience.length}
              title={exp.jobTitle || "Untitled Position"}
              subtitle={exp.company ? `${exp.company}${exp.location ? ` • ${exp.location}` : ""}` : "Company not set"}
              onMoveUp={idx > 0 ? () => onReorder(idx, idx - 1) : null}
              onMoveDown={idx < experience.length - 1 ? () => onReorder(idx, idx + 1) : null}
              onDelete={() => onDelete(exp.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Job Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.jobTitle || ""}
                    onChange={(e) => onUpdate(exp.id, "jobTitle", e.target.value)}
                    placeholder="e.g. Senior Full Stack Developer"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Company / Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exp.company || ""}
                    onChange={(e) => onUpdate(exp.id, "company", e.target.value)}
                    placeholder="e.g. Acme Tech Solutions"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Location (Optional)</label>
                  <input
                    type="text"
                    value={exp.location || ""}
                    onChange={(e) => onUpdate(exp.id, "location", e.target.value)}
                    placeholder="e.g. New York, NY or Remote"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate || ""}
                    onChange={(e) => onUpdate(exp.id, "startDate", e.target.value)}
                    placeholder="e.g. Jan 2022 or 2022-01"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* End Date & Currently Working */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">End Date</label>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(exp.currentlyWorking)}
                        onChange={(e) => onUpdate(exp.id, "currentlyWorking", e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Currently Working Here</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={Boolean(exp.currentlyWorking)}
                    value={exp.currentlyWorking ? "Present" : exp.endDate || ""}
                    onChange={(e) => onUpdate(exp.id, "endDate", e.target.value)}
                    placeholder="e.g. Dec 2023 or 2023-12"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border transition ${
                      exp.currentlyWorking
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed italic"
                        : "bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                </div>

                {/* Date range error */}
                {!dateValidation.isValid && (
                  <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{dateValidation.error}</span>
                  </div>
                )}

                {/* Responsibilities */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Responsibilities</label>
                    {onOpenGenerator && (
                      <button
                        type="button"
                        onClick={() => onOpenGenerator("experience", exp.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
                        title="Polish bullet points with AI / Free Mode"
                      >
                        <Sparkles size={11} />
                        <span>Polish with AI</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={exp.responsibilities || ""}
                    onChange={(e) => onUpdate(exp.id, "responsibilities", e.target.value)}
                    placeholder="• Built reactive dashboard features using React.js and Tailwind CSS&#10;• Designed high-throughput REST APIs and database queries"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
                  />
                </div>

                {/* Achievements */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Key Achievements (Optional)</label>
                  <textarea
                    rows={2}
                    value={exp.achievements || ""}
                    onChange={(e) => onUpdate(exp.id, "achievements", e.target.value)}
                    placeholder="e.g. Spearheaded frontend refactoring that lowered initial client load times."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
                  />
                </div>
              </div>
            </EntryCard>
          );
        })
      )}
    </SectionCard>
  );
};

export default ExperienceForm;

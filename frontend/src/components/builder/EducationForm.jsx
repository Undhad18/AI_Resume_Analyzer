import { GraduationCap, Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";
import EntryCard from "./EntryCard";

export const EducationForm = ({
  education = [],
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onOpenGenerator
}) => {
  return (
    <SectionCard
      icon={GraduationCap}
      iconBg="bg-indigo-50 text-indigo-600"
      title="Education"
      subtitle="Degrees, majors, institutions, and academic honors"
      count={education.length}
      onAdd={onAdd}
      addLabel="Add Education"
    >
      {education.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">
            No education records added yet. Click &quot;Add Education&quot; to add your academic background.
          </p>
        </div>
      ) : (
        education.map((edu, idx) => (
          <EntryCard
            key={edu.id || idx}
            index={idx}
            total={education.length}
            title={edu.degree ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}` : "Degree not specified"}
            subtitle={edu.institution || "Institution not set"}
            onMoveUp={idx > 0 ? () => onReorder(idx, idx - 1) : null}
            onMoveDown={idx < education.length - 1 ? () => onReorder(idx, idx + 1) : null}
            onDelete={() => onDelete(edu.id)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Institution */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700">
                  Institution / University <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={edu.institution || ""}
                  onChange={(e) => onUpdate(edu.id, "institution", e.target.value)}
                  placeholder="e.g. Gujarat Technological University"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Degree */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Degree <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={edu.degree || ""}
                  onChange={(e) => onUpdate(edu.id, "degree", e.target.value)}
                  placeholder="e.g. Bachelor of Technology (B.Tech)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Field of Study */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Field of Study / Major</label>
                <input
                  type="text"
                  value={edu.fieldOfStudy || ""}
                  onChange={(e) => onUpdate(edu.id, "fieldOfStudy", e.target.value)}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Start Date (Optional)</label>
                <input
                  type="text"
                  value={edu.startDate || ""}
                  onChange={(e) => onUpdate(edu.id, "startDate", e.target.value)}
                  placeholder="e.g. 2020 or Aug 2020"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Graduation Year / End Date */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Graduation Year / End Date</label>
                <input
                  type="text"
                  value={edu.graduationYear || edu.endDate || ""}
                  onChange={(e) => {
                    onUpdate(edu.id, "graduationYear", e.target.value);
                    onUpdate(edu.id, "endDate", e.target.value);
                  }}
                  placeholder="e.g. 2024 or May 2024"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* GPA / Grade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">GPA / Percentage (Optional)</label>
                <input
                  type="text"
                  value={edu.grade || ""}
                  onChange={(e) => onUpdate(edu.id, "grade", e.target.value)}
                  placeholder="e.g. 8.8 CGPA or First Class"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Academic Honors / Coursework (Optional)</label>
                  {onOpenGenerator && (
                    <button
                      type="button"
                      onClick={() => onOpenGenerator("education", edu.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
                      title="Format academic summary & coursework"
                    >
                      <Sparkles size={11} />
                      <span>Format with AI</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={edu.description || ""}
                  onChange={(e) => onUpdate(edu.id, "description", e.target.value)}
                  placeholder="e.g. Dean's Honor Roll, Coursework: Data Structures, Distributed Systems, Cloud Architecture"
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

export default EducationForm;

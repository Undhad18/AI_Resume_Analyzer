import {
  FileText,
  Briefcase,
  FolderGit2,
  Wrench,
  GraduationCap,
  Award
} from "lucide-react";

const SECTIONS = [
  { id: "professionalSummary", label: "Professional Summary", icon: FileText },
  { id: "experience", label: "Work Experience", icon: Briefcase },
  { id: "project", label: "Project Description", icon: FolderGit2 },
  { id: "skills", label: "Skills Presentation", icon: Wrench },
  { id: "education", label: "Education Description", icon: GraduationCap },
  { id: "achievement", label: "Achievement Description", icon: Award }
];

/**
 * Content Section Selector (Lesson 8.3)
 */
export const ContentSectionSelector = ({
  selectedSection,
  onSelectSection,
  entries = [],
  selectedEntryId = null,
  onSelectEntryId = null,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Target Resume Section
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectSection(sec.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer text-xs font-semibold disabled:opacity-50 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Icon size={14} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Entry Picker when section contains multiple dynamic entries */}
      {entries.length > 1 && onSelectEntryId && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Select Specific Entry to Optimize
          </label>
          <select
            value={selectedEntryId || entries[0]?.id || ""}
            onChange={(e) => onSelectEntryId(e.target.value)}
            disabled={disabled}
            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {entries.map((entry, idx) => {
              const label =
                entry.position ||
                entry.jobTitle ||
                entry.projectName ||
                entry.title ||
                entry.degree ||
                entry.name ||
                `Entry #${idx + 1}`;
              const sub = entry.company || entry.institution || entry.organization || "";
              return (
                <option key={entry.id || idx} value={entry.id || idx}>
                  #{idx + 1}: {label} {sub ? `(${sub})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
};

export default ContentSectionSelector;

import { FolderGit2, Sparkles } from "lucide-react";
import SectionCard from "./SectionCard";
import EntryCard from "./EntryCard";
import { isValidUrl } from "../../utils/resumeBuilderValidation";

export const ProjectsForm = ({
  projects = [],
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onOpenGenerator
}) => {
  return (
    <SectionCard
      icon={FolderGit2}
      iconBg="bg-purple-50 text-purple-600"
      title="Featured Projects"
      subtitle="Applications, technical initiatives, and open-source contributions"
      count={projects.length}
      onAdd={onAdd}
      addLabel="Add Project"
    >
      {projects.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">
            No projects added yet. Click &quot;Add Project&quot; to showcase your technical builds.
          </p>
        </div>
      ) : (
        projects.map((proj, idx) => {
          const projectTitle = proj.projectName || proj.name || "Untitled Project";
          const isUrlValid = isValidUrl(proj.projectUrl);

          return (
            <EntryCard
              key={proj.id || idx}
              index={idx}
              total={projects.length}
              title={projectTitle}
              subtitle={proj.technologies ? `Tech: ${proj.technologies}` : "Technologies not specified"}
              onMoveUp={idx > 0 ? () => onReorder(idx, idx - 1) : null}
              onMoveDown={idx < projects.length - 1 ? () => onReorder(idx, idx + 1) : null}
              onDelete={() => onDelete(proj.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Project Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={proj.projectName || proj.name || ""}
                    onChange={(e) => {
                      onUpdate(proj.id, "projectName", e.target.value);
                      onUpdate(proj.id, "name", e.target.value);
                    }}
                    placeholder="e.g. AI Resume Analyzer & Scoring Platform"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Project URL */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Live URL / Repository (Optional)</label>
                  <input
                    type="url"
                    value={proj.projectUrl || ""}
                    onChange={(e) => onUpdate(proj.id, "projectUrl", e.target.value)}
                    placeholder="e.g. https://github.com/username/project"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      !isUrlValid
                        ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                  {!isUrlValid && (
                    <p className="text-[11px] text-red-600 font-medium">Please enter a valid URL.</p>
                  )}
                </div>

                {/* Technologies */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Technologies Used</label>
                  <input
                    type="text"
                    value={proj.technologies || ""}
                    onChange={(e) => onUpdate(proj.id, "technologies", e.target.value)}
                    placeholder="e.g. React.js, Vite, Node.js, Express, MySQL, Tailwind CSS"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Dates */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date (Optional)</label>
                  <input
                    type="text"
                    value={proj.startDate || ""}
                    onChange={(e) => onUpdate(proj.id, "startDate", e.target.value)}
                    placeholder="e.g. Jan 2024"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date (Optional)</label>
                  <input
                    type="text"
                    value={proj.endDate || ""}
                    onChange={(e) => onUpdate(proj.id, "endDate", e.target.value)}
                    placeholder="e.g. Mar 2024 or Present"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Description & Key Contributions</label>
                    {onOpenGenerator && (
                      <button
                        type="button"
                        onClick={() => onOpenGenerator("project", proj.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition cursor-pointer"
                        title="Generate project overview and contributions"
                      >
                        <Sparkles size={11} />
                        <span>Generate with AI</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={proj.description || ""}
                    onChange={(e) => onUpdate(proj.id, "description", e.target.value)}
                    placeholder="• Built responsive dashboard UI with real-time preview synchronization&#10;• Designed deterministic scoring algorithms analyzing keyword matching and formatting"
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

export default ProjectsForm;

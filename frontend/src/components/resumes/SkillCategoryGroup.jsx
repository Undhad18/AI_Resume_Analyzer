/**
 * SkillCategoryGroup Component
 * Renders categorized skills with count and color-coded badges
 */
export const SkillCategoryGroup = ({
  category,
  skills = [],
  onSelectSkill
}) => {
  if (!skills || skills.length === 0) return null;

  const categoryLabels = {
    programming_languages: "Programming Languages",
    frontend: "Frontend Technologies",
    backend: "Backend Technologies",
    database: "Databases & Storage",
    tools: "Developer Tools",
    cloud: "Cloud Infrastructure",
    devops: "DevOps & CI/CD",
    testing: "Quality & Testing",
    soft_skills: "Professional & Soft Skills",
    domain_skills: "Domain & Architecture"
  };

  const displayName = categoryLabels[category] || category.replace(/_/g, " ").toUpperCase();

  return (
    <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
        <span>{displayName}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
          {skills.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((skillName, idx) => (
          <span
            key={idx}
            onClick={() => onSelectSkill && onSelectSkill(skillName)}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-white border border-slate-200/80 text-slate-800 shadow-2xs hover:border-indigo-300 transition"
          >
            {skillName}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillCategoryGroup;

import { FileText, CheckCircle2 } from "lucide-react";

export const EnhancedResumePreview = ({ enhancedContent = {} }) => {
  const {
    professionalSummary = "",
    skills = [],
    experience = [],
    projects = [],
    education = [],
    certifications = [],
    achievements = []
  } = enhancedContent;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Enhanced Resume Document Preview</h2>
          </div>
          <p className="text-xs text-slate-500">
            Clean, standardized, action-oriented resume format with verified credentials.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>Polished Document</span>
        </div>
      </div>

      {professionalSummary && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Professional Summary
          </h3>
          <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {professionalSummary}
            </p>
          </div>
        </section>
      )}

      {skills && skills.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Skills & Competencies
          </h3>
          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs"
              >
                {typeof skill === "string" ? skill : skill.name || JSON.stringify(skill)}
              </span>
            ))}
          </div>
        </section>
      )}

      {experience && experience.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Work Experience
          </h3>
          <div className="space-y-3">
            {experience.map((exp, idx) => (
              <div key={idx} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="font-bold text-slate-900">
                    {exp.jobTitle || exp.title || "Position"} — <span className="text-slate-600 font-semibold">{exp.company || exp.employer || "Company"}</span>
                  </span>
                  <span className="text-slate-400 font-medium">
                    {exp.startDate || exp.dateRange || ""} {exp.endDate ? `– ${exp.endDate}` : ""}
                  </span>
                </div>
                {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 ? (
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                    {exp.responsibilities.map((r, rIdx) => (
                      <li key={rIdx} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                ) : exp.description ? (
                  <p className="text-xs text-slate-700 leading-relaxed">{exp.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Projects
          </h3>
          <div className="space-y-3">
            {projects.map((proj, idx) => (
              <div key={idx} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900">
                  {proj.name || proj.title || "Project"}
                </div>
                {proj.description && (
                  <p className="text-slate-600 leading-relaxed">{proj.description}</p>
                )}
                {Array.isArray(proj.highlights) && proj.highlights.length > 0 && (
                  <ul className="list-disc pl-4 text-slate-700 space-y-1 mt-1">
                    {proj.highlights.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {education && education.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Education
          </h3>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">
                    {edu.degree || "Degree"}
                  </span>
                  {edu.institution && (
                    <span className="text-slate-600">, {edu.institution}</span>
                  )}
                </div>
                <span className="text-slate-500 font-medium">{edu.graduationYear || edu.year || ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Certifications
          </h3>
          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            {certifications.map((c, idx) => (
              <li key={idx} className="font-medium">{typeof c === "string" ? c : c.name || JSON.stringify(c)}</li>
            ))}
          </ul>
        </section>
      )}

      {achievements && achievements.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Key Achievements
          </h3>
          <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 p-3 bg-slate-50/60 rounded-xl border border-slate-100">
            {achievements.map((a, idx) => (
              <li key={idx} className="font-medium">{typeof a === "string" ? a : a.title || JSON.stringify(a)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default EnhancedResumePreview;

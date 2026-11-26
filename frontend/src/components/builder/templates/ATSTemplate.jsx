import { extractValidResumeSections } from "./templateConfig";

/**
 * ATS-Friendly Resume Template (Lesson 8.4)
 * Strict single-column layout with standardized headings, plain text bullets, and zero parsing obstacles.
 * Avoids tables, multi-columns, icons, and decorative graphics to maximize machine readability.
 */
export const ATSTemplate = ({ resumeData = {} }) => {
  const {
    personalInfo,
    hasPersonalInfo,
    hasLinks,
    professionalSummary,
    hasSummary,
    skills,
    hasSkills,
    validExperience,
    validEducation,
    validProjects,
    validCertifications,
    validAchievements
  } = extractValidResumeSections(resumeData);

  return (
    <div className="space-y-4 text-slate-900 font-sans break-words transition-all text-xs leading-normal">
      {/* ATS Header (Single-column, text-only contact details) */}
      {hasPersonalInfo && (
        <header className="space-y-1 pb-2 border-b border-slate-300">
          {personalInfo.fullName && (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {personalInfo.fullName}
            </h1>
          )}

          <div className="text-xs text-slate-800 space-y-0.5">
            <div>
              {[personalInfo.email, personalInfo.phone, personalInfo.location]
                .filter(Boolean)
                .join(" | ")}
            </div>

            {hasLinks && (
              <div className="text-[11px] text-slate-700">
                {[
                  personalInfo.linkedIn ? `LinkedIn: ${personalInfo.linkedIn}` : "",
                  personalInfo.gitHub ? `GitHub: ${personalInfo.gitHub}` : "",
                  personalInfo.portfolio ? `Portfolio: ${personalInfo.portfolio}` : ""
                ]
                  .filter(Boolean)
                  .join(" | ")}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Professional Summary */}
      {hasSummary && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
            {professionalSummary}
          </p>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Skills
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed">
            {skills.join(", ")}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {validExperience.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Work Experience
          </h2>
          <div className="space-y-3">
            {validExperience.map((exp, idx) => {
              const title = exp.jobTitle || exp.position || "Job Title";
              const displayDate = exp.currentlyWorking
                ? `${exp.startDate || ""} - Present`
                : exp.startDate && exp.endDate
                ? `${exp.startDate} - ${exp.endDate}`
                : exp.startDate || exp.endDate || "";

              // Split responsibilities into plain text bullets if applicable
              const responsibilityLines = exp.responsibilities
                ? exp.responsibilities
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                : [];

              return (
                <div key={exp.id || idx} className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {title} {exp.company ? `| ${exp.company}` : ""} {exp.location ? `| ${exp.location}` : ""}
                  </div>
                  {displayDate && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      {displayDate}
                    </div>
                  )}

                  {responsibilityLines.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-800 text-xs">
                      {responsibilityLines.map((line, lIdx) => (
                        <li key={lIdx}>
                          {line.replace(/^[-*•\s]+/, "")}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {exp.achievements && (
                    <div className="text-slate-800 pl-5">
                      <span className="font-semibold">Key Achievement: </span>
                      <span>{exp.achievements}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Education */}
      {validEducation.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Education
          </h2>
          <div className="space-y-2">
            {validEducation.map((edu, idx) => {
              const dateRange = edu.startDate && (edu.endDate || edu.graduationYear)
                ? `${edu.startDate} - ${edu.endDate || edu.graduationYear}`
                : edu.graduationYear || edu.endDate || edu.startDate || "";

              return (
                <div key={edu.id || idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {edu.degree || "Degree"}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                    {edu.institution ? ` | ${edu.institution}` : ""}
                  </div>
                  {dateRange && (
                    <div className="text-[11px] text-slate-600 font-medium">
                      {dateRange}
                    </div>
                  )}
                  {edu.grade && (
                    <div className="text-[11px] text-slate-700">
                      Grade / GPA: {edu.grade}
                    </div>
                  )}
                  {edu.description && (
                    <p className="text-slate-800 text-xs pl-5">
                      {edu.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {validProjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Projects
          </h2>
          <div className="space-y-2">
            {validProjects.map((proj, idx) => {
              const projectTitle = proj.projectName || proj.title || proj.name || "Project";
              const dateRange = proj.startDate && proj.endDate
                ? `${proj.startDate} - ${proj.endDate}`
                : proj.startDate || proj.endDate || "";

              const descLines = proj.description
                ? proj.description
                    .split(/\r?\n/)
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0)
                : [];

              return (
                <div key={proj.id || idx} className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {projectTitle}
                    {dateRange ? ` (${dateRange})` : ""}
                    {proj.projectUrl ? ` | ${proj.projectUrl}` : ""}
                  </div>

                  {proj.technologies && (
                    <div className="text-[11px] text-slate-700">
                      Technologies: {proj.technologies}
                    </div>
                  )}

                  {descLines.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-800 text-xs">
                      {descLines.map((line, lIdx) => (
                        <li key={lIdx}>
                          {line.replace(/^[-*•\s]+/, "")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Certifications */}
      {validCertifications.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Certifications
          </h2>
          <div className="space-y-1 text-slate-800">
            {validCertifications.map((cert, idx) => {
              const certTitle = cert.certificationName || cert.name || "Certification";
              const issuer = cert.issuingOrganization || cert.issuer || "";
              return (
                <div key={cert.id || idx}>
                  <span className="font-bold text-slate-900">{certTitle}</span>
                  {issuer ? ` - ${issuer}` : ""}
                  {cert.issueDate ? ` (${cert.issueDate})` : ""}
                  {cert.credentialUrl ? ` | Link: ${cert.credentialUrl}` : ""}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievements */}
      {validAchievements.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
            Achievements
          </h2>
          <div className="space-y-1 text-slate-800">
            {validAchievements.map((ach, idx) => (
              <div key={ach.id || idx} className="space-y-0.5">
                <div className="font-bold text-slate-900">
                  {ach.title} {ach.date ? `(${ach.date})` : ""}
                </div>
                {ach.description && (
                  <p className="text-slate-800 pl-5">{ach.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ATSTemplate;

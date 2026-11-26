import { extractValidResumeSections } from "./templateConfig";

/**
 * Minimalist Resume Template (Lesson 8.4)
 * Scandinavian-inspired ultra-clean design with generous whitespace and refined typography.
 */
export const MinimalTemplate = ({ resumeData = {} }) => {
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
    <div className="space-y-7 text-slate-800 font-sans break-words transition-all">
      {/* Minimal Understated Header */}
      {hasPersonalInfo && (
        <header className="space-y-2 pb-2">
          {personalInfo.fullName && (
            <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-slate-900 leading-tight">
              {personalInfo.fullName}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-normal">
            {personalInfo.email && (
              <a href={`mailto:${personalInfo.email}`} className="hover:text-slate-900 transition">
                {personalInfo.email}
              </a>
            )}

            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>

          {hasLinks && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
              {personalInfo.linkedIn && (
                <a
                  href={personalInfo.linkedIn.startsWith("http") ? personalInfo.linkedIn : `https://${personalInfo.linkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 underline underline-offset-2"
                >
                  linkedin
                </a>
              )}

              {personalInfo.gitHub && (
                <a
                  href={personalInfo.gitHub.startsWith("http") ? personalInfo.gitHub : `https://${personalInfo.gitHub}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 underline underline-offset-2"
                >
                  github
                </a>
              )}

              {personalInfo.portfolio && (
                <a
                  href={personalInfo.portfolio.startsWith("http") ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 underline underline-offset-2"
                >
                  portfolio
                </a>
              )}
            </div>
          )}
        </header>
      )}

      {/* Professional Summary */}
      {hasSummary && (
        <section className="space-y-1.5">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            About
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-w-2xl">
            {professionalSummary}
          </p>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section className="space-y-1.5">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Capabilities
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 rounded text-xs font-normal bg-slate-50 text-slate-700 border border-slate-200/60"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {validExperience.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Experience
          </h2>
          <div className="space-y-4">
            {validExperience.map((exp, idx) => {
              const title = exp.jobTitle || exp.position || "Role";
              const displayDate = exp.currentlyWorking
                ? `${exp.startDate || ""} – Present`
                : exp.startDate && exp.endDate
                ? `${exp.startDate} – ${exp.endDate}`
                : exp.startDate || exp.endDate || "";

              return (
                <div key={exp.id || idx} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="font-medium text-slate-900 text-xs">
                      {title}
                      {exp.company && <span className="font-normal text-slate-600"> / {exp.company}</span>}
                      {exp.location && <span className="font-light text-slate-400"> ({exp.location})</span>}
                    </span>
                    {displayDate && (
                      <span className="text-slate-400 text-[11px] font-normal shrink-0">
                        {displayDate}
                      </span>
                    )}
                  </div>

                  {exp.responsibilities && (
                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-[11.5px] pl-1">
                      {exp.responsibilities}
                    </p>
                  )}

                  {exp.achievements && (
                    <p className="text-slate-500 text-[11px] pl-1 pt-0.5">
                      <span className="text-slate-700 font-medium">Impact: </span>
                      {exp.achievements}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Education */}
      {validEducation.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Education
          </h2>
          <div className="space-y-3">
            {validEducation.map((edu, idx) => {
              const dateRange = edu.startDate && (edu.endDate || edu.graduationYear)
                ? `${edu.startDate} – ${edu.endDate || edu.graduationYear}`
                : edu.graduationYear || edu.endDate || edu.startDate || "";

              return (
                <div key={edu.id || idx} className="space-y-0.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div>
                      <span className="font-medium text-slate-900">
                        {edu.degree || "Degree"}
                        {edu.fieldOfStudy && <span className="font-normal text-slate-600">, {edu.fieldOfStudy}</span>}
                      </span>
                      {edu.institution && (
                        <span className="text-slate-500 block sm:inline sm:ml-1 font-light">
                          — {edu.institution}
                        </span>
                      )}
                    </div>
                    {dateRange && (
                      <span className="text-slate-400 text-[11px] shrink-0 font-normal">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {edu.grade && (
                    <div className="text-[11px] text-slate-500">
                      GPA: {edu.grade}
                    </div>
                  )}

                  {edu.description && (
                    <p className="text-slate-600 text-xs whitespace-pre-wrap pl-1 mt-0.5">
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
        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Projects
          </h2>
          <div className="space-y-3">
            {validProjects.map((proj, idx) => {
              const projectTitle = proj.projectName || proj.title || proj.name || "Project";
              const dateRange = proj.startDate && proj.endDate
                ? `${proj.startDate} – ${proj.endDate}`
                : proj.startDate || proj.endDate || "";

              return (
                <div key={proj.id || idx} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="font-medium text-slate-900">{projectTitle}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {dateRange && <span>{dateRange}</span>}
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl.startsWith("http") ? proj.projectUrl : `https://${proj.projectUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-700 underline hover:text-slate-900"
                        >
                          link
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.technologies && (
                    <div className="text-[11px] text-slate-500">
                      Stack: {proj.technologies}
                    </div>
                  )}

                  {proj.description && (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[11.5px] pl-1">
                      {proj.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Certifications */}
      {validCertifications.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Certifications
          </h2>
          <div className="space-y-1 text-xs">
            {validCertifications.map((cert, idx) => {
              const certTitle = cert.certificationName || cert.name || "Certification";
              const issuer = cert.issuingOrganization || cert.issuer || "";

              return (
                <div key={cert.id || idx} className="flex justify-between items-baseline gap-2">
                  <div>
                    <span className="font-medium text-slate-900">{certTitle}</span>
                    {issuer && <span className="text-slate-500"> — {issuer}</span>}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 underline text-[11px] ml-1.5"
                      >
                        view
                      </a>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-slate-400 text-[11px] shrink-0">{cert.issueDate}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievements */}
      {validAchievements.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
            Achievements
          </h2>
          <div className="space-y-1.5 text-xs">
            {validAchievements.map((ach, idx) => (
              <div key={ach.id || idx} className="space-y-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-900">{ach.title}</span>
                  {ach.date && <span className="text-slate-400 text-[11px]">{ach.date}</span>}
                </div>
                {ach.description && (
                  <p className="text-slate-600 leading-relaxed text-[11.5px] pl-1">{ach.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;

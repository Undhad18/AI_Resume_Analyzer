import { extractValidResumeSections } from "./templateConfig";

/**
 * Professional / Classic Resume Template (Lesson 8.4)
 * Traditional corporate design with formal serif typography, neutral palette, and classic horizontal rules.
 */
export const ClassicTemplate = ({ resumeData = {} }) => {
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
    <div className="space-y-5 text-slate-900 font-serif break-words transition-all">
      {/* Formal Centered Header */}
      {hasPersonalInfo && (
        <header className="text-center pb-3 border-b-2 border-slate-900 space-y-1.5">
          {personalInfo.fullName && (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-normal uppercase text-slate-900">
              {personalInfo.fullName}
            </h1>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-slate-700 font-sans">
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.location && (personalInfo.phone || personalInfo.email) && <span>•</span>}

            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.phone && personalInfo.email && <span>•</span>}

            {personalInfo.email && (
              <a href={`mailto:${personalInfo.email}`} className="hover:underline">
                {personalInfo.email}
              </a>
            )}
          </div>

          {hasLinks && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 text-xs text-slate-800 font-sans pt-0.5">
              {personalInfo.linkedIn && (
                <a
                  href={personalInfo.linkedIn.startsWith("http") ? personalInfo.linkedIn : `https://${personalInfo.linkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {personalInfo.linkedIn && personalInfo.gitHub && <span>|</span>}

              {personalInfo.gitHub && (
                <a
                  href={personalInfo.gitHub.startsWith("http") ? personalInfo.gitHub : `https://${personalInfo.gitHub}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  GitHub
                </a>
              )}
              {personalInfo.gitHub && personalInfo.portfolio && <span>|</span>}

              {personalInfo.portfolio && (
                <a
                  href={personalInfo.portfolio.startsWith("http") ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  Portfolio
                </a>
              )}
            </div>
          )}
        </header>
      )}

      {/* Professional Summary */}
      {hasSummary && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Executive Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap text-justify">
            {professionalSummary}
          </p>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Core Competencies & Skills
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed font-sans">
            {skills.join(" • ")}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {validExperience.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Professional Experience
          </h2>
          <div className="space-y-3.5">
            {validExperience.map((exp, idx) => {
              const title = exp.jobTitle || exp.position || "Position";
              const displayDate = exp.currentlyWorking
                ? `${exp.startDate || ""} – Present`
                : exp.startDate && exp.endDate
                ? `${exp.startDate} – ${exp.endDate}`
                : exp.startDate || exp.endDate || "";

              return (
                <div key={exp.id || idx} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{title}</span>
                      {exp.company && <span className="italic text-slate-800">, {exp.company}</span>}
                      {exp.location && <span className="text-slate-600 text-[11px]"> — {exp.location}</span>}
                    </div>
                    {displayDate && (
                      <span className="text-slate-700 text-[11px] font-sans shrink-0">
                        {displayDate}
                      </span>
                    )}
                  </div>

                  {exp.responsibilities && (
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-3 font-sans text-[11.5px]">
                      {exp.responsibilities}
                    </p>
                  )}

                  {exp.achievements && (
                    <p className="text-slate-800 pl-3 font-sans text-[11.5px] italic">
                      Key Contribution: <span className="not-italic">{exp.achievements}</span>
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
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Education
          </h2>
          <div className="space-y-2.5">
            {validEducation.map((edu, idx) => {
              const dateRange = edu.startDate && (edu.endDate || edu.graduationYear)
                ? `${edu.startDate} – ${edu.endDate || edu.graduationYear}`
                : edu.graduationYear || edu.endDate || edu.startDate || "";

              return (
                <div key={edu.id || idx} className="space-y-0.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div>
                      <span className="font-bold text-slate-900">
                        {edu.degree || "Degree"}
                        {edu.fieldOfStudy && <span> in {edu.fieldOfStudy}</span>}
                      </span>
                      {edu.institution && (
                        <span className="italic text-slate-800 block sm:inline sm:ml-1.5">
                          , {edu.institution}
                        </span>
                      )}
                    </div>
                    {dateRange && (
                      <span className="text-slate-700 text-[11px] font-sans shrink-0">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {edu.grade && (
                    <div className="text-[11px] text-slate-600 font-sans">
                      Honors / Grade: {edu.grade}
                    </div>
                  )}

                  {edu.description && (
                    <p className="text-slate-800 text-[11.5px] font-sans pl-3 mt-0.5">
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
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Key Projects
          </h2>
          <div className="space-y-2.5">
            {validProjects.map((proj, idx) => {
              const projectTitle = proj.projectName || proj.title || proj.name || "Project";
              const dateRange = proj.startDate && proj.endDate
                ? `${proj.startDate} – ${proj.endDate}`
                : proj.startDate || proj.endDate || "";

              return (
                <div key={proj.id || idx} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="font-bold text-slate-900">{projectTitle}</span>
                    <div className="flex items-center gap-2 text-[11px] font-sans text-slate-700">
                      {dateRange && <span>{dateRange}</span>}
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl.startsWith("http") ? proj.projectUrl : `https://${proj.projectUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          View Project
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.technologies && (
                    <div className="text-[11px] text-slate-700 italic font-sans">
                      Tools: {proj.technologies}
                    </div>
                  )}

                  {proj.description && (
                    <p className="text-slate-800 leading-relaxed font-sans text-[11.5px] pl-3">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Certifications & Licenses
          </h2>
          <div className="space-y-1 text-xs font-sans">
            {validCertifications.map((cert, idx) => {
              const certTitle = cert.certificationName || cert.name || "Certification";
              const issuer = cert.issuingOrganization || cert.issuer || "";

              return (
                <div key={cert.id || idx} className="flex justify-between items-baseline gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{certTitle}</span>
                    {issuer && <span className="text-slate-700">, {issuer}</span>}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-[11px] ml-2 text-slate-600"
                      >
                        [Verify]
                      </a>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-slate-600 text-[11px] shrink-0">{cert.issueDate}</span>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-800 pb-0.5">
            Honors & Awards
          </h2>
          <div className="space-y-1.5 text-xs font-sans">
            {validAchievements.map((ach, idx) => (
              <div key={ach.id || idx} className="space-y-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-900">{ach.title}</span>
                  {ach.date && <span className="text-slate-600 text-[11px]">{ach.date}</span>}
                </div>
                {ach.description && (
                  <p className="text-slate-800 leading-relaxed text-[11.5px] pl-3">{ach.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;

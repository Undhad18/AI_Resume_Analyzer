import {
  Mail,
  Phone,
  MapPin,
  Link2,
  ExternalLink,
  Globe,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Award,
  Trophy
} from "lucide-react";
import { extractValidResumeSections } from "./templateConfig";

/**
 * Modern Resume Template (Lesson 8.4)
 * Clean, contemporary aesthetic with subtle blue/indigo accents, crisp headings, and badge tags.
 */
export const ModernTemplate = ({ resumeData = {} }) => {
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
    <div className="space-y-6 text-slate-800 font-sans break-words transition-all">
      {/* Header */}
      {hasPersonalInfo && (
        <header className="border-b-2 border-blue-600 pb-5 space-y-2">
          {personalInfo.fullName && (
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {personalInfo.fullName}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {personalInfo.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-blue-600 shrink-0" />
                <a href={`mailto:${personalInfo.email}`} className="hover:text-blue-600 transition">
                  {personalInfo.email}
                </a>
              </span>
            )}

            {personalInfo.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={13} className="text-blue-600 shrink-0" />
                <span>{personalInfo.phone}</span>
              </span>
            )}

            {personalInfo.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-600 shrink-0" />
                <span>{personalInfo.location}</span>
              </span>
            )}
          </div>

          {/* Social Links */}
          {hasLinks && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-600 pt-1 font-medium">
              {personalInfo.linkedIn && (
                <a
                  href={personalInfo.linkedIn.startsWith("http") ? personalInfo.linkedIn : `https://${personalInfo.linkedIn}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <Link2 size={12} className="shrink-0" />
                  <span>LinkedIn</span>
                </a>
              )}

              {personalInfo.gitHub && (
                <a
                  href={personalInfo.gitHub.startsWith("http") ? personalInfo.gitHub : `https://${personalInfo.gitHub}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <ExternalLink size={12} className="shrink-0" />
                  <span>GitHub</span>
                </a>
              )}

              {personalInfo.portfolio && (
                <a
                  href={personalInfo.portfolio.startsWith("http") ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:underline"
                >
                  <Globe size={12} className="shrink-0" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          )}
        </header>
      )}

      {/* Professional Summary */}
      {hasSummary && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">
            {professionalSummary}
          </p>
        </section>
      )}

      {/* Skills */}
      {hasSkills && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5">
            Technical & Professional Skills
          </h2>
          <div className="flex flex-wrap gap-1.5 pl-1 pt-1">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50/80 text-blue-900 border border-blue-200/80 shadow-2xs"
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5 flex items-center gap-1.5">
            <Briefcase size={13} className="text-blue-600" />
            <span>Work Experience</span>
          </h2>
          <div className="space-y-4 pl-1">
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
                    <span className="font-bold text-slate-900 text-xs">
                      {title}
                      {exp.company && <span className="font-semibold text-blue-700"> — {exp.company}</span>}
                      {exp.location && <span className="font-normal text-slate-400"> ({exp.location})</span>}
                    </span>
                    {displayDate && (
                      <span className="text-slate-500 text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        {displayDate}
                      </span>
                    )}
                  </div>

                  {exp.responsibilities && (
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-2.5 border-l-2 border-slate-200">
                      {exp.responsibilities}
                    </p>
                  )}

                  {exp.achievements && (
                    <div className="text-slate-700 pl-2.5 border-l-2 border-blue-200 pt-0.5">
                      <span className="font-semibold text-slate-900">Key Achievements: </span>
                      <span className="whitespace-pre-wrap">{exp.achievements}</span>
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
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-blue-600" />
            <span>Education</span>
          </h2>
          <div className="space-y-3 pl-1">
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
                        <span className="text-blue-700 block sm:inline sm:ml-1.5 font-medium">
                          {edu.institution}
                        </span>
                      )}
                    </div>
                    {dateRange && (
                      <span className="text-slate-500 text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        {dateRange}
                      </span>
                    )}
                  </div>

                  {edu.grade && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      <span className="font-semibold text-slate-700">Grade / GPA: </span>
                      {edu.grade}
                    </div>
                  )}

                  {edu.description && (
                    <p className="text-slate-600 text-xs whitespace-pre-wrap pl-2.5 border-l-2 border-slate-200 mt-1">
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5 flex items-center gap-1.5">
            <FolderGit2 size={13} className="text-blue-600" />
            <span>Projects</span>
          </h2>
          <div className="space-y-3 pl-1">
            {validProjects.map((proj, idx) => {
              const projectTitle = proj.projectName || proj.title || proj.name || "Project Name";
              const dateRange = proj.startDate && proj.endDate
                ? `${proj.startDate} – ${proj.endDate}`
                : proj.startDate || proj.endDate || "";

              return (
                <div key={proj.id || idx} className="space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <span className="font-bold text-slate-900">{projectTitle}</span>
                    <div className="flex items-center gap-2">
                      {dateRange && <span className="text-[11px] text-slate-400">{dateRange}</span>}
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl.startsWith("http") ? proj.projectUrl : `https://${proj.projectUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-[11px] flex items-center gap-0.5 font-medium"
                        >
                          <span>Live Demo</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.technologies && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      <span className="font-bold text-blue-700">Technologies: </span>
                      {proj.technologies}
                    </div>
                  )}

                  {proj.description && (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-2.5 border-l-2 border-slate-200">
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
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5 flex items-center gap-1.5">
            <Award size={13} className="text-blue-600" />
            <span>Certifications</span>
          </h2>
          <div className="space-y-1.5 text-xs pl-1">
            {validCertifications.map((cert, idx) => {
              const certTitle = cert.certificationName || cert.name || "Certification";
              const issuer = cert.issuingOrganization || cert.issuer || "";

              return (
                <div key={cert.id || idx} className="flex justify-between items-baseline gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{certTitle}</span>
                    {issuer && <span className="text-slate-600"> — {issuer}</span>}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl.startsWith("http") ? cert.credentialUrl : `https://${cert.credentialUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-[11px] ml-2 inline-flex items-center gap-0.5 font-medium"
                      >
                        <span>Verify</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-slate-500 text-[11px] shrink-0">{cert.issueDate}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Achievements */}
      {validAchievements.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-l-4 border-blue-600 pl-2.5 py-0.5 flex items-center gap-1.5">
            <Trophy size={13} className="text-blue-600" />
            <span>Honors & Achievements</span>
          </h2>
          <div className="space-y-2 text-xs pl-1">
            {validAchievements.map((ach, idx) => (
              <div key={ach.id || idx} className="space-y-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-slate-900">{ach.title}</span>
                  {ach.date && <span className="text-slate-400 text-[11px]">{ach.date}</span>}
                </div>
                {ach.description && (
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{ach.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplate;

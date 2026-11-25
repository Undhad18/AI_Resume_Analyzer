import { useState, useEffect } from "react";
import {
    X,
    Copy,
    Check,
    Layers,
    User,
    Briefcase,
    GraduationCap,
    Wrench,
    FolderGit2,
    Award,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    Loader2,
    AlertTriangle,
    Code2
} from "lucide-react";
import { getStructuredResume } from "../../services/resumeService";

const StructuredResumeModal = ({ isOpen, onClose, resume }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [structuredData, setStructuredData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("sections"); // "sections" | "json"
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen || !resume) {
            setStructuredData(null);
            setError(null);
            setCopied(false);
            setActiveTab("sections");
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);
        setStructuredData(null);

        getStructuredResume(resume.id)
            .then((res) => {
                if (!isMounted) return;
                const payload = res?.data?.structuredResume || res?.data || res;
                setStructuredData(payload);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Structuring failed:", err);
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to structure resume content.";
                setError(msg);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, resume]);

    if (!isOpen || !resume) return null;

    const handleCopyJson = () => {
        if (!structuredData) return;
        navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pInfo = structuredData?.personalInfo || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Layers size={20} />
                        </div>
                        <div className="truncate">
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 truncate">
                                    Structured Resume Content
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                                    JSON Schema v1.0
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                                {resume.originalFilename || resume.title || "Resume Document"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {structuredData && (
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("sections")}
                                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                                        activeTab === "sections"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    Sections
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("json")}
                                    className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                                        activeTab === "json"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <Code2 size={13} />
                                    <span>Raw JSON</span>
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleCopyJson}
                            disabled={!structuredData}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            title="Copy Structured JSON"
                        >
                            {copied ? (
                                <>
                                    <Check size={14} className="text-emerald-600" />
                                    <span className="text-emerald-600">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    <span>Copy JSON</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Loader2 size={34} className="animate-spin text-indigo-600" />
                            <p className="text-sm font-medium">Extracting and structuring resume content...</p>
                            <p className="text-xs text-slate-400">Classifying sections, entities, and skills</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-3">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-900 mb-1">Structuring Error</h4>
                                <p className="leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && structuredData && activeTab === "json" && (
                        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 overflow-x-auto">
                            <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap leading-relaxed select-text">
                                {JSON.stringify(structuredData, null, 2)}
                            </pre>
                        </div>
                    )}

                    {!isLoading && !error && structuredData && activeTab === "sections" && (
                        <div className="space-y-6">
                            {/* Personal Info Banner */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 shadow-xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <User size={18} className="text-indigo-600" />
                                            <h2 className="text-lg font-bold text-slate-900">
                                                {pInfo.fullName || "Candidate Profile"}
                                            </h2>
                                        </div>
                                        {structuredData.professionalSummary && (
                                            <p className="text-xs text-slate-600 mt-2 max-w-2xl leading-relaxed">
                                                {structuredData.professionalSummary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {pInfo.email && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                                <Mail size={13} className="text-slate-400" />
                                                <span>{pInfo.email}</span>
                                            </span>
                                        )}
                                        {pInfo.phone && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                                <Phone size={13} className="text-slate-400" />
                                                <span>{pInfo.phone}</span>
                                            </span>
                                        )}
                                        {pInfo.location && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                                <MapPin size={13} className="text-slate-400" />
                                                <span>{pInfo.location}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* External Links */}
                                {(pInfo.linkedin || pInfo.github || pInfo.portfolio) && (
                                    <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-indigo-100/60 text-xs">
                                        {pInfo.linkedin && (
                                            <a
                                                href={pInfo.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                                <span>LinkedIn Profile</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {pInfo.github && (
                                            <a
                                                href={pInfo.github}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                                <span>GitHub Profile</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                        {pInfo.portfolio && (
                                            <a
                                                href={pInfo.portfolio}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                                <span>Portfolio Website</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Skills Section */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Wrench size={16} className="text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Skills ({structuredData.skills?.length || 0})
                                    </h3>
                                </div>
                                {structuredData.skills?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {structuredData.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No skills extracted.</p>
                                )}
                            </div>

                            {/* Work Experience */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Briefcase size={16} className="text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Experience ({structuredData.experience?.length || 0})
                                    </h3>
                                </div>
                                {structuredData.experience?.length > 0 ? (
                                    <div className="space-y-4">
                                        {structuredData.experience.map((exp, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2 text-xs"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                                    <div>
                                                        <span className="font-bold text-slate-900 text-sm">
                                                            {exp.jobTitle || "Role"}
                                                        </span>
                                                        {exp.company && (
                                                            <span className="text-slate-600 ml-1.5 font-medium">
                                                                at {exp.company}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(exp.startDate || exp.endDate) && (
                                                            <span className="text-slate-500 font-mono text-[11px]">
                                                                {exp.startDate || ""} - {exp.endDate || (exp.isCurrent ? "Present" : "")}
                                                            </span>
                                                        )}
                                                        {exp.isCurrent && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {exp.description && (
                                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pt-1">
                                                        {exp.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No work experience entries extracted.</p>
                                )}
                            </div>

                            {/* Education */}
                            <div className="p-5 rounded-2xl bg-white border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <GraduationCap size={16} className="text-indigo-600" />
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Education ({structuredData.education?.length || 0})
                                    </h3>
                                </div>
                                {structuredData.education?.length > 0 ? (
                                    <div className="space-y-3">
                                        {structuredData.education.map((edu, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                                        {edu.degree || "Degree"}
                                                    </span>
                                                    {edu.fieldOfStudy && (
                                                        <span className="text-slate-600 ml-1">
                                                            in {edu.fieldOfStudy}
                                                        </span>
                                                    )}
                                                    {edu.institution && (
                                                        <p className="text-slate-500 mt-0.5 font-medium">
                                                            {edu.institution}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {(edu.startDate || edu.endDate) && (
                                                        <span className="text-slate-500 font-mono text-[11px] block">
                                                            {edu.startDate ? `${edu.startDate} - ` : ""}{edu.endDate || ""}
                                                        </span>
                                                    )}
                                                    {edu.grade && (
                                                        <span className="text-indigo-600 font-semibold text-[11px]">
                                                            {edu.grade}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No education entries extracted.</p>
                                )}
                            </div>

                            {/* Projects & Certifications (Two-Column) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Projects */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FolderGit2 size={16} className="text-indigo-600" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Projects ({structuredData.projects?.length || 0})
                                        </h3>
                                    </div>
                                    {structuredData.projects?.length > 0 ? (
                                        <div className="space-y-3">
                                            {structuredData.projects.map((proj, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-900">{proj.projectName || "Project"}</span>
                                                        {proj.projectUrl && (
                                                            <a href={proj.projectUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                                                <ExternalLink size={12} />
                                                            </a>
                                                        )}
                                                    </div>
                                                    {proj.description && <p className="text-slate-600 text-[11px] leading-relaxed">{proj.description}</p>}
                                                    {proj.technologies?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                            {proj.technologies.map((t, tidx) => (
                                                                <span key={tidx} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700">
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No projects extracted.</p>
                                    )}
                                </div>

                                {/* Certifications */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Award size={16} className="text-indigo-600" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Certifications ({structuredData.certifications?.length || 0})
                                        </h3>
                                    </div>
                                    {structuredData.certifications?.length > 0 ? (
                                        <div className="space-y-2.5">
                                            {structuredData.certifications.map((cert, idx) => (
                                                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                                                    <span className="font-bold text-slate-900 block">{cert.name}</span>
                                                    <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                                                        <span>{cert.issuingOrganization || ""}</span>
                                                        <span>{cert.issueDate || ""}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No certifications extracted.</p>
                                    )}
                                </div>
                            </div>

                            {/* Additional Sections */}
                            {structuredData.additionalSections?.length > 0 && (
                                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Additional Sections ({structuredData.additionalSections.length})
                                    </h3>
                                    {structuredData.additionalSections.map((sec, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                            <span className="font-bold text-indigo-700 block uppercase tracking-wide text-[11px]">
                                                {sec.heading}
                                            </span>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {sec.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                        {structuredData ? "Deterministic regex and boundary parsing verified with Zod schema." : ""}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StructuredResumeModal;

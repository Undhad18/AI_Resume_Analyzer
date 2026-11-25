import { useState, useEffect } from "react";
import {
    X,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Briefcase,
    GraduationCap,
    Award,
    FolderGit2,
    AlertTriangle,
    Target,
    Layers,
    ArrowUpRight,
    TrendingUp,
    ShieldAlert
} from "lucide-react";
import { analyzeResume, getResumeAnalysis } from "../../services/resumeService";

const ResumeAnalysisModal = ({ isOpen, onClose, resume }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!isOpen || !resume) {
            setAnalysisData(null);
            setError(null);
            setIsLoading(false);
            setIsAnalyzing(false);
            return;
        }

        let isMounted = true;

        const fetchExistingAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await getResumeAnalysis(resume.id);
                if (isMounted) {
                    const data = response?.data || response;
                    if (data && (data.analysisResult || data.analysis)) {
                        setAnalysisData(data);
                    }
                }
            } catch (err) {
                // If 404 (not yet analyzed), that is normal; user can click "Run AI Analysis"
                if (err?.status !== 404) {
                    console.log("No previous analysis found or error loading:", err?.message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchExistingAnalysis();

        return () => {
            isMounted = false;
        };
    }, [isOpen, resume]);

    if (!isOpen || !resume) return null;

    const handleRunAnalysis = async () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await analyzeResume(resume.id);
            const data = response?.data || response;
            setAnalysisData(data);
        } catch (err) {
            console.error("AI Analysis error:", err);
            setError(
                err?.message ||
                err?.errors?.[0]?.message ||
                "Failed to complete AI resume analysis. Please try again."
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    const analysis = analysisData?.analysisResult || analysisData?.analysis;
    const overallScore = analysisData?.overallScore;
    const isDocx = resume.fileType === "docx" || resume.originalFilename?.toLowerCase().endsWith(".docx");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    AI Resume Analysis Engine
                                </h3>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    isDocx ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"
                                }`}>
                                    {isDocx ? "DOCX" : "PDF"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-md">
                                {resume.resumeTitle || resume.originalFilename} {resume.candidateName ? `• ${resume.candidateName}` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={13} />
                                    <span>{analysis ? "Re-Analyze" : "Run AI Analysis"}</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Subnav Tabs */}
                {analysis && !isAnalyzing && (
                    <div className="flex items-center gap-1 px-6 border-b border-slate-100 bg-white overflow-x-auto text-xs font-medium">
                        {[
                            { id: "overview", label: "Overview", icon: Layers },
                            { id: "skills", label: "Skills Analysis", icon: Target },
                            { id: "experience", label: "Experience & Education", icon: Briefcase },
                            { id: "strengths", label: "Strengths & Weaknesses", icon: TrendingUp },
                            { id: "improvements", label: "Suggestions", icon: ArrowUpRight }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-2 py-3 px-3 border-b-2 font-semibold transition cursor-pointer shrink-0 ${
                                        isActive
                                            ? "border-purple-600 text-purple-700"
                                            : "border-transparent text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span className="font-semibold">Analysis Notice:</span> {error}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {(isLoading || isAnalyzing) && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center animate-pulse">
                                <Loader2 size={28} className="animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-slate-800">
                                    {isAnalyzing ? "AI Resume Analysis in Progress..." : "Loading Saved Analysis..."}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    Extracting text, structuring sections, and querying the OpenAI Responses API with structured JSON schemas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Empty State when no analysis exists yet */}
                    {!isLoading && !isAnalyzing && !analysis && (
                        <div className="py-16 text-center max-w-md mx-auto space-y-4">
                            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                                <Sparkles size={28} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-slate-900">
                                    Ready for AI Resume Analysis
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Run a comprehensive 10-point analysis including skill verification, experience evaluation, career trajectory, strengths, weaknesses, and prioritized improvement suggestions.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleRunAnalysis}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition cursor-pointer"
                            >
                                <Sparkles size={14} />
                                <span>Launch Analysis Now</span>
                            </button>
                        </div>
                    )}

                    {/* Main Analysis Display */}
                    {!isLoading && !isAnalyzing && analysis && (
                        <div className="space-y-6 animate-in fade-in duration-150">
                            {/* Score & Profile Banner */}
                            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 text-xs font-medium">
                                        <span>Career Tier:</span>
                                        <span className="font-bold text-white">{analysis.resumeOverview?.detectedCareerLevel || "Mid-Level"}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">
                                        {analysis.resumeOverview?.professionalProfile || "Professional Candidate Profile"}
                                    </h3>
                                    <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
                                        {analysis.resumeOverview?.summary}
                                    </p>
                                </div>

                                {overallScore !== null && overallScore !== undefined && (
                                    <div className="flex flex-col items-center justify-center px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shrink-0">
                                        <span className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                                            Overall Score
                                        </span>
                                        <span className="text-3xl font-extrabold text-white">
                                            {overallScore}<span className="text-xs font-normal text-purple-200">/100</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* TAB 1: OVERVIEW */}
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    {/* Target Roles */}
                                    {analysis.resumeOverview?.targetRoles?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Target size={14} className="text-purple-600" />
                                                <span>Recommended Target Roles</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.resumeOverview.targetRoles.map((role, idx) => (
                                                    <span key={idx} className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-100 text-xs font-semibold">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Strengths & Weaknesses Quick Highlights */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                                                <CheckCircle2 size={15} className="text-emerald-600" />
                                                <span>Key Strengths ({analysis.strengths?.length || 0})</span>
                                            </h4>
                                            <ul className="space-y-2 text-xs text-emerald-950">
                                                {analysis.strengths?.slice(0, 3).map((s, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="font-bold text-emerald-700">•</span>
                                                        <div>
                                                            <span className="font-semibold">{s.title}:</span> {s.description}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                                                <AlertTriangle size={15} className="text-amber-600" />
                                                <span>Areas for Growth ({analysis.weaknesses?.length || 0})</span>
                                            </h4>
                                            <ul className="space-y-2 text-xs text-amber-950">
                                                {analysis.weaknesses?.slice(0, 3).map((w, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="font-bold text-amber-700">•</span>
                                                        <div>
                                                            <span className="font-semibold">{w.title}:</span> {w.suggestion || w.description}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: SKILLS ANALYSIS */}
                            {activeTab === "skills" && (
                                <div className="space-y-6">
                                    {analysis.skillsAnalysis?.skillsSummary && (
                                        <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                                            {analysis.skillsAnalysis.skillsSummary}
                                        </p>
                                    )}

                                    {/* Verified Skills with Evidence */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Verified Found Skills ({analysis.skillsAnalysis?.foundSkills?.length || 0})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {analysis.skillsAnalysis?.foundSkills?.map((s, idx) => (
                                                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-xs text-slate-900 truncate">{s.skill}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                                            {s.category || "General"}
                                                        </span>
                                                    </div>
                                                    {s.evidence && (
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                                                            "{s.evidence}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skill Gaps */}
                                    {analysis.skillsAnalysis?.skillGaps?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                                            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                                                <ShieldAlert size={14} className="text-rose-600" />
                                                <span>Identified Skill Gaps</span>
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.skillsAnalysis.skillGaps.map((gap, idx) => (
                                                    <div key={idx} className="text-xs text-rose-950 flex items-start gap-2">
                                                        <span className="font-bold text-rose-600">•</span>
                                                        <div>
                                                            <span className="font-bold">{gap.skill}:</span> {gap.reason}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: EXPERIENCE & EDUCATION & PROJECTS */}
                            {activeTab === "experience" && (
                                <div className="space-y-6">
                                    {/* Experience Analysis */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <Briefcase size={15} className="text-purple-600" />
                                            <span>Work Experience Evaluation</span>
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {analysis.experienceAnalysis?.summary || "Experience entries evaluated."}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                                                <span className="text-[11px] font-bold text-emerald-800">Experience Highlights</span>
                                                <ul className="text-xs text-emerald-950 space-y-1">
                                                    {analysis.experienceAnalysis?.strengths?.map((item, idx) => (
                                                        <li key={idx}>• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                                                <span className="text-[11px] font-bold text-amber-800">Growth Opportunities</span>
                                                <ul className="text-xs text-amber-950 space-y-1">
                                                    {analysis.experienceAnalysis?.improvements?.map((item, idx) => (
                                                        <li key={idx}>• {item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Projects Analysis */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <FolderGit2 size={15} className="text-indigo-600" />
                                            <span>Projects & Portfolio Evaluation</span>
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {analysis.projectsAnalysis?.summary || "Projects inspected."}
                                        </p>
                                    </div>

                                    {/* Education Analysis */}
                                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <GraduationCap size={15} className="text-sky-600" />
                                            <span>Education & Credentials Evaluation</span>
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {analysis.educationAnalysis?.summary || "Education records inspected."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: STRENGTHS & WEAKNESSES */}
                            {activeTab === "strengths" && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Documented Strengths ({analysis.strengths?.length || 0})
                                        </h4>
                                        <div className="space-y-3">
                                            {analysis.strengths?.map((s, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                                        <span className="font-bold text-xs text-emerald-950">{s.title}</span>
                                                    </div>
                                                    <p className="text-xs text-emerald-900 pl-5">{s.description}</p>
                                                    {s.evidence && (
                                                        <p className="text-[11px] text-emerald-700/80 italic pl-5">Evidence: "{s.evidence}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Identified Weaknesses & Mitigation ({analysis.weaknesses?.length || 0})
                                        </h4>
                                        <div className="space-y-3">
                                            {analysis.weaknesses?.map((w, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                                        <span className="font-bold text-xs text-amber-950">{w.title}</span>
                                                    </div>
                                                    <p className="text-xs text-amber-900 pl-5">{w.description}</p>
                                                    {w.suggestion && (
                                                        <p className="text-xs text-amber-800 font-medium pl-5">
                                                            <span className="font-bold">Recommendation:</span> {w.suggestion}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: ACTIONABLE SUGGESTIONS */}
                            {activeTab === "improvements" && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <Award size={14} className="text-purple-600" />
                                            <span>Prioritized Resume Improvements ({analysis.improvementSuggestions?.length || 0})</span>
                                        </h4>
                                        <div className="space-y-2.5">
                                            {analysis.improvementSuggestions?.map((item, idx) => {
                                                const isHigh = item.priority === "high";
                                                const isMed = item.priority === "medium";
                                                return (
                                                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-2xs">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                                                            isHigh ? "bg-rose-100 text-rose-800" : isMed ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                                                        }`}>
                                                            {item.priority}
                                                        </span>
                                                        <div className="space-y-0.5">
                                                            <h5 className="font-bold text-xs text-slate-900">{item.area}</h5>
                                                            <p className="text-xs text-slate-600 leading-relaxed">{item.suggestion}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Missing Information Callouts */}
                                    {analysis.missingInformation?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Missing Information & Verification Notice
                                            </h4>
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                {analysis.missingInformation.map((info, idx) => (
                                                    <li key={idx}>• <span className="font-semibold">{info.field}:</span> {info.reason}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span>
                        AI Model: <span className="font-semibold text-slate-700">{analysisData?.aiModel || analysisData?.metadata?.aiModel || "gpt-4o-mini"}</span>
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold transition cursor-pointer"
                    >
                        Close Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeAnalysisModal;

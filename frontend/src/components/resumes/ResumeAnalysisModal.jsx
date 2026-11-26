import { useState, useEffect } from "react";
import {
    X,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Briefcase,
    GraduationCap,
    FolderGit2,
    AlertTriangle,
    Target,
    Layers,
    ArrowUpRight,
    TrendingUp,
    Zap,
    CheckCheck,
    Cpu,
    Award,
    Layout,
    Wand2
} from "lucide-react";
import {
    analyzeResume,
    analyzeResumeFree,
    getResumeAnalysis,
    calculateAtsScore,
    getAtsScore,
    calculateDetailedScore,
    getDetailedScore,
    calculateFormattingGrammarScore,
    getFormattingGrammarScore,
    calculateResumeStrengthsWeaknesses,
    getResumeStrengthsWeaknesses,
    detectResumeSkillsKeywords,
    getResumeSkillsKeywords,
    generateResumeImprovementSuggestions,
    getResumeImprovementSuggestions
} from "../../services/resumeService";
import ATSReportView from "./ATSReportView";
import DetailedScoringView from "./DetailedScoringView";
import FormattingGrammarReportView from "./FormattingGrammarReportView";
import StrengthsWeaknessesReportView from "./StrengthsWeaknessesReportView";
import SkillsDetectionReport from "./SkillsDetectionReport";
import ImprovementSuggestions from "./ImprovementSuggestions";
import ResumeEnhancement from "./ResumeEnhancement";

const ResumeAnalysisModal = ({ isOpen, onClose, resume }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analyzingMode, setAnalyzingMode] = useState(null); // 'free' | 'ai' | null
    const [isCalculatingAts, setIsCalculatingAts] = useState(false);
    const [detailedData, setDetailedData] = useState(null);
    const [isCalculatingDetailed, setIsCalculatingDetailed] = useState(false);
    const [formattingGrammarData, setFormattingGrammarData] = useState(null);
    const [isCalculatingFormattingGrammar, setIsCalculatingFormattingGrammar] = useState(false);
    const [strengthsWeaknessesData, setStrengthsWeaknessesData] = useState(null);
    const [isCalculatingStrengthsWeaknesses, setIsCalculatingStrengthsWeaknesses] = useState(false);
    const [skillsKeywordsData, setSkillsKeywordsData] = useState(null);
    const [isCalculatingSkillsKeywords, setIsCalculatingSkillsKeywords] = useState(false);
    const [suggestionsData, setSuggestionsData] = useState(null);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [error, setError] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [atsData, setAtsData] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!isOpen || !resume) {
            setAnalysisData(null);
            setAtsData(null);
            setDetailedData(null);
            setFormattingGrammarData(null);
            setStrengthsWeaknessesData(null);
            setSkillsKeywordsData(null);
            setSuggestionsData(null);
            setError(null);
            setIsLoading(false);
            setAnalyzingMode(null);
            setIsCalculatingAts(false);
            setIsCalculatingDetailed(false);
            setIsCalculatingFormattingGrammar(false);
            setIsCalculatingStrengthsWeaknesses(false);
            setIsCalculatingSkillsKeywords(false);
            setIsGeneratingSuggestions(false);
            return;
        }

        let isMounted = true;

        const fetchExistingAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [analysisRes, atsRes, detailedRes, fgRes, swRes, skRes, sugRes] = await Promise.allSettled([
                    getResumeAnalysis(resume.id),
                    getAtsScore(resume.id),
                    getDetailedScore(resume.id),
                    getFormattingGrammarScore(resume.id),
                    getResumeStrengthsWeaknesses(resume.id),
                    getResumeSkillsKeywords(resume.id),
                    getResumeImprovementSuggestions(resume.id)
                ]);

                if (isMounted) {
                    if (analysisRes.status === "fulfilled") {
                        const data = analysisRes.value?.data || analysisRes.value;
                        if (data && (data.analysisResult || data.analysis)) {
                            setAnalysisData(data);
                        } else if (data?.status === "failed") {
                            setError(data.errorMessage || "Previous analysis attempt failed. You can re-run analysis below.");
                        }
                    }

                    if (atsRes.status === "fulfilled") {
                        const atsResultData = atsRes.value?.data?.atsResult || atsRes.value?.atsResult || atsRes.value?.data;
                        if (atsResultData) {
                            setAtsData(atsResultData);
                        }
                    }

                    if (detailedRes.status === "fulfilled") {
                        const detailedResultData = detailedRes.value?.data?.detailedResult || detailedRes.value?.detailedResult || detailedRes.value?.data;
                        if (detailedResultData) {
                            setDetailedData(detailedResultData);
                        }
                    }

                    if (fgRes.status === "fulfilled") {
                        const fgResultData = fgRes.value?.data || fgRes.value;
                        if (fgResultData && (fgResultData.formatting || fgResultData.formattingScore !== undefined)) {
                            setFormattingGrammarData(fgResultData);
                        }
                    }

                    if (swRes.status === "fulfilled") {
                        const swResultData = swRes.value?.data || swRes.value;
                        if (swResultData && (swResultData.strengths || swResultData.weaknesses)) {
                            setStrengthsWeaknessesData(swResultData);
                        }
                    }

                    if (skRes.status === "fulfilled") {
                        const skResultData = skRes.value?.data || skRes.value;
                        if (skResultData && (skResultData.detectedSkills || skResultData.missingSkills)) {
                            setSkillsKeywordsData(skResultData);
                        }
                    }

                    if (sugRes.status === "fulfilled") {
                        const sugResultData = sugRes.value?.data || sugRes.value;
                        if (sugResultData && (sugResultData.suggestions || sugResultData.totalSuggestions)) {
                            setSuggestionsData(sugResultData);
                        }
                    }
                }
            } catch (err) {
                // If 404 (not yet analyzed), that is normal; user can run analysis
                if (err?.status !== 404) {
                    console.log("No previous analysis found or error loading:", err?.message);
                    if (err?.status === 403) {
                        setError("Access denied: you do not own this resume.");
                    }
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

    const isAnalyzing = Boolean(analyzingMode);

    const handleRunFreeAnalysis = async () => {
        if (isAnalyzing) return;
        setAnalyzingMode("free");
        setError(null);

        try {
            const response = await analyzeResumeFree(resume.id);
            const data = response?.data || response;
            setAnalysisData(data);

            // Also silently fetch or compute ATS, detailed, and formatting/grammar scores if not present
            try {
                const [atsRes, detailedRes, fgRes] = await Promise.allSettled([
                    calculateAtsScore(resume.id),
                    calculateDetailedScore(resume.id),
                    calculateFormattingGrammarScore(resume.id)
                ]);
                if (atsRes.status === "fulfilled") {
                    const atsPayload = atsRes.value?.data?.atsResult || atsRes.value?.atsResult || atsRes.value?.data;
                    if (atsPayload) setAtsData(atsPayload);
                }
                if (detailedRes.status === "fulfilled") {
                    const detailedPayload = detailedRes.value?.data || detailedRes.value;
                    if (detailedPayload) setDetailedData(detailedPayload);
                }
                if (fgRes.status === "fulfilled") {
                    const fgPayload = fgRes.value?.data || fgRes.value;
                    if (fgPayload) setFormattingGrammarData(fgPayload);
                }
            } catch {
                // Non-critical
            }
        } catch (err) {
            console.error("Free Analysis error:", err);
            setError(
                err?.message ||
                err?.errors?.[0]?.message ||
                "Failed to complete free rule-based resume analysis."
            );
        } finally {
            setAnalyzingMode(null);
        }
    };

    const handleCalculateFormattingGrammar = async () => {
        setIsCalculatingFormattingGrammar(true);
        setError(null);
        try {
            const res = await calculateFormattingGrammarScore(resume.id);
            const data = res?.data || res;
            setFormattingGrammarData(data);
        } catch (err) {
            console.error("Formatting & Grammar calculation error:", err);
            setError(err?.message || "Failed to calculate formatting and grammar score.");
        } finally {
            setIsCalculatingFormattingGrammar(false);
        }
    };

    const handleCalculateStrengthsWeaknesses = async (mode = "free") => {
        setIsCalculatingStrengthsWeaknesses(true);
        setError(null);
        try {
            const res = await calculateResumeStrengthsWeaknesses(resume.id, { analysisMode: mode });
            const data = res?.data || res;
            setStrengthsWeaknessesData(data);
        } catch (err) {
            console.error("Strengths & Weaknesses calculation error:", err);
            setError(err?.message || "Failed to analyze strengths and weaknesses.");
        } finally {
            setIsCalculatingStrengthsWeaknesses(false);
        }
    };

    const handleRunSkillsKeywordsAnalysis = async (params = {}) => {
        setIsCalculatingSkillsKeywords(true);
        setError(null);
        try {
            const res = await detectResumeSkillsKeywords(resume.id, params);
            const data = res?.data || res;
            setSkillsKeywordsData(data);
        } catch (err) {
            console.error("Skills & Keywords analysis error:", err);
            setError(err?.message || "Failed to analyze skills and keywords.");
        } finally {
            setIsCalculatingSkillsKeywords(false);
        }
    };

    const handleGenerateSuggestions = async (mode = "free") => {
        setIsGeneratingSuggestions(true);
        setError(null);
        try {
            const res = await generateResumeImprovementSuggestions(resume.id, { mode });
            const data = res?.data || res;
            setSuggestionsData(data);
        } catch (err) {
            console.error("Suggestions generation error:", err);
            setError(err?.message || "Failed to generate improvement suggestions.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleCalculateDetailed = async () => {
        setIsCalculatingDetailed(true);
        setError(null);
        try {
            const res = await calculateDetailedScore(resume.id);
            const data = res?.data || res;
            setDetailedData(data);
        } catch (err) {
            console.error("Detailed Scoring error:", err);
            setError(err?.message || "Failed to calculate detailed score.");
        } finally {
            setIsCalculatingDetailed(false);
        }
    };

    const handleCalculateAts = async (jobDesc = null) => {
        setIsCalculatingAts(true);
        setError(null);
        try {
            const res = await calculateAtsScore(resume.id, { jobDescription: jobDesc });
            const data = res?.data || res;
            const atsPayload = data?.atsResult || data;
            setAtsData(atsPayload);
        } catch (err) {
            console.error("ATS calculation error:", err);
            setError(err?.message || "Failed to calculate ATS compatibility score.");
        } finally {
            setIsCalculatingAts(false);
        }
    };

    const handleRunAiAnalysis = async () => {
        if (isAnalyzing) return;
        setAnalyzingMode("ai");
        setError(null);

        try {
            const response = await analyzeResume(resume.id);
            const data = response?.data || response;
            setAnalysisData(data);
        } catch (err) {
            console.error("AI Analysis error:", err);
            const errorMsg =
                err?.message?.includes("timeout") || err?.raw?.code === "ECONNABORTED"
                    ? "Analysis request timed out. The AI model is taking longer than expected. Please verify your connection or try again."
                    : err?.message ||
                    err?.errors?.[0]?.message ||
                    "Failed to complete AI resume analysis. Please try again.";
            setError(errorMsg);
        } finally {
            setAnalyzingMode(null);
        }
    };

    const analysis = analysisData?.analysisResult || analysisData?.analysis;
    const overallScore = analysisData?.overallScore !== undefined ? analysisData.overallScore : analysis?.scoringDetails?.overallScore;
    const isDocx = resume.fileType === "docx" || resume.originalFilename?.toLowerCase().endsWith(".docx");
    const isRuleBased = analysisData?.analysisType === "rule_based" || analysis?.isRuleBased || analysisData?.aiModel === "rule-based-engine";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-6xl xl:max-w-7xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[94vh] max-h-[94vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-xs ${isRuleBased ? "bg-gradient-to-tr from-emerald-600 to-teal-600" : "bg-gradient-to-tr from-purple-600 to-indigo-600"
                            }`}>
                            {isRuleBased ? <CheckCheck size={20} /> : <Sparkles size={20} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    {isRuleBased ? "Free Rule-Based Resume Analysis" : "AI Resume Analysis Engine"}
                                </h3>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDocx ? "bg-sky-100 text-sky-800" : "bg-rose-100 text-rose-800"
                                    }`}>
                                    {isDocx ? "DOCX" : "PDF"}
                                </span>
                                {analysis && (
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isRuleBased ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
                                        }`}>
                                        {isRuleBased ? "100% Free Mode" : "OpenAI Powered"}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-md">
                                {resume.resumeTitle || resume.originalFilename} {resume.candidateName ? `• ${resume.candidateName}` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Free Analysis Trigger Button */}
                        <button
                            type="button"
                            onClick={handleRunFreeAnalysis}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                            title="Instant deterministic rule-based analysis (Zero OpenAI API calls)"
                        >
                            {analyzingMode === "free" ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Zap size={13} />
                                    <span>{analysis && isRuleBased ? "Re-Run Free" : "Free Analysis"}</span>
                                </>
                            )}
                        </button>

                        {/* Advanced AI Analysis Trigger Button */}
                        <button
                            type="button"
                            onClick={handleRunAiAnalysis}
                            disabled={isAnalyzing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs transition cursor-pointer disabled:opacity-60"
                            title="Advanced semantic AI analysis powered by OpenAI"
                        >
                            {analyzingMode === "ai" ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" />
                                    <span>Analyzing AI...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={13} />
                                    <span>{analysis && !isRuleBased ? "Re-Run AI" : "AI Analysis"}</span>
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

                {/* Subnav Tabs - Wrapped and clearly visible with zero horizontal clipping */}
                {analysis && !isAnalyzing && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 border-b border-slate-200/90 bg-slate-50/80 text-xs font-medium shrink-0">
                        {[
                            { id: "overview", label: "Overview", icon: Layers },
                            { id: "strengths", label: "Strengths & Weaknesses", icon: TrendingUp },
                            { id: "skills", label: "Skills & Keywords", icon: Target },
                            { id: "ats", label: "ATS Score", icon: Zap },
                            { id: "detailed", label: "Category Scoring", icon: Award },
                            { id: "formatting", label: "Formatting & Grammar", icon: Layout },
                            { id: "experience", label: "Experience & Education", icon: Briefcase },
                            { id: "improvements", label: "Suggestions", icon: ArrowUpRight },
                            { id: "enhancement", label: "Enhance & Rewrite", icon: Wand2 }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-semibold transition-all duration-150 cursor-pointer text-xs ${isActive
                                        ? isRuleBased
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-purple-600 text-white shadow-xs"
                                        : "bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs"
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
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse ${analyzingMode === "free" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                                }`}>
                                <Loader2 size={28} className="animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-bold text-slate-800">
                                    {analyzingMode === "free"
                                        ? "Running Free Rule-Based Analysis..."
                                        : isAnalyzing
                                            ? "AI Resume Analysis in Progress..."
                                            : "Loading Saved Analysis..."}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    {analyzingMode === "free"
                                        ? "Extracting document text, structuring sections, and applying deterministic scoring heuristics (Zero OpenAI calls)."
                                        : "Extracting text, structuring sections, and querying the OpenAI Responses API with structured JSON schemas."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Empty State when no analysis exists yet - Offer both options */}
                    {!isLoading && !isAnalyzing && !analysis && (
                        <div className="py-8 max-w-2xl mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">
                                    Select Resume Analysis Mode
                                </h4>
                                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                    Choose between our instant, free rule-based evaluator or deep semantic analysis powered by OpenAI.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Option 1: Free Rule-Based Analysis */}
                                <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition flex flex-col justify-between space-y-4 shadow-xs">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                            <Zap size={11} />
                                            <span>100% Free • No API Key</span>
                                        </div>
                                        <h5 className="text-base font-bold text-slate-900">
                                            Free Rule-Based Analysis
                                        </h5>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Instant, deterministic analysis checking contact details, skills, work experience, projects, education completeness, and calculating an overall score (0-100).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRunFreeAnalysis}
                                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Zap size={14} />
                                        <span>Run Free Analysis</span>
                                    </button>
                                </div>

                                {/* Option 2: Advanced AI Analysis */}
                                <div className="p-5 rounded-2xl border-2 border-purple-200 bg-purple-50/40 hover:bg-purple-50/70 transition flex flex-col justify-between space-y-4 shadow-xs">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                                            <Sparkles size={11} />
                                            <span>OpenAI GPT-4o-mini</span>
                                        </div>
                                        <h5 className="text-base font-bold text-slate-900">
                                            Advanced AI Analysis
                                        </h5>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Deep semantic evaluation generating tailored strengths, contextual weaknesses, prioritized career advice, and 10-point comprehensive report.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRunAiAnalysis}
                                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles size={14} />
                                        <span>Run Advanced AI</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Analysis Display */}
                    {!isLoading && !isAnalyzing && analysis && (
                        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
                            {/* Score & Profile Header: Full Banner on Overview, Compact Bar on Sub-tabs */}
                            {activeTab === "overview" ? (
                                <div className={`p-5 sm:p-6 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRuleBased
                                    ? "bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900"
                                    : "bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900"
                                    }`}>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isRuleBased
                                                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                                                : "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                                                }`}>
                                                {isRuleBased ? <CheckCheck size={12} /> : <Sparkles size={12} />}
                                                {isRuleBased ? "Free Rule-Based Analysis" : "Advanced AI Analysis"}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                                                <span>Tier:</span>
                                                <span className="font-bold">{analysis.resumeOverview?.detectedCareerLevel || "Entry-Level"}</span>
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white">
                                            {analysis.resumeOverview?.professionalProfile || "Professional Candidate Profile"}
                                        </h3>
                                        <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
                                            {analysis.resumeOverview?.summary}
                                        </p>
                                    </div>

                                    {overallScore !== null && overallScore !== undefined && (
                                        <div className="flex flex-col items-center justify-center px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shrink-0">
                                            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                                                Overall Score
                                            </span>
                                            <span className="text-3xl font-extrabold text-white">
                                                {overallScore}<span className="text-xs font-normal text-white/70">/100</span>
                                            </span>
                                            {analysis.scoringDetails?.ratingLabel && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                                    {analysis.scoringDetails.ratingLabel}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${isRuleBased
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-purple-100 text-purple-800"
                                            }`}>
                                            {isRuleBased ? <CheckCheck size={11} /> : <Sparkles size={11} />}
                                            {isRuleBased ? "Free Analysis" : "AI Engine"}
                                        </span>
                                        <span className="font-bold text-slate-800 truncate">
                                            {analysis.resumeOverview?.professionalProfile || "Candidate Profile"}
                                        </span>
                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                        <span className="text-slate-500 hidden sm:inline font-medium">
                                            Tier: {analysis.resumeOverview?.detectedCareerLevel || "Entry-Level"}
                                        </span>
                                    </div>
                                    {overallScore !== null && overallScore !== undefined && (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                            <span className="text-[10px] uppercase font-bold text-slate-500">Overall Score:</span>
                                            <span className="text-xs font-black text-slate-900">{overallScore}/100</span>
                                            {analysis.scoringDetails?.ratingLabel && (
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                                    ({analysis.scoringDetails.ratingLabel})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 1: OVERVIEW */}
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    {/* 6-Category Score Breakdown for Rule-Based Scoring */}
                                    {analysis.scoringDetails?.categories && (
                                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                    <Cpu size={14} className="text-emerald-600" />
                                                    <span>Weighted Score Breakdown (Lesson 6.1 Rubric)</span>
                                                </h4>
                                                {analysis.scoringDetails.isFresher && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                        Fresher Policy Applied (Normalized)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {Object.entries(analysis.scoringDetails.categories).map(([key, cat]) => (
                                                    <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                                        <span className="text-[11px] font-semibold text-slate-500 capitalize">
                                                            {key.replace(/([A-Z])/g, " $1")}
                                                        </span>
                                                        <div className="flex items-baseline gap-1 mt-1">
                                                            <span className="text-lg font-bold text-slate-800">
                                                                {cat.status === "not_applicable_fresher" ? "N/A" : cat.earned}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {cat.status === "not_applicable_fresher" ? "(Fresher)" : `/${cat.weight} pts`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Target Roles */}
                                    {analysis.resumeOverview?.targetRoles?.length > 0 && (
                                        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <Target size={14} className="text-purple-600" />
                                                <span>Recommended Target Roles</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.resumeOverview.targetRoles.map((role, idx) => (
                                                    <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
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

                            {/* TAB: DETAILED SKILLS & EXPERIENCE SCORING */}
                            {activeTab === "detailed" && (
                                <DetailedScoringView
                                    detailedData={detailedData}
                                    isCalculating={isCalculatingDetailed}
                                    onCalculateDetailed={handleCalculateDetailed}
                                />
                            )}

                            {/* TAB: FORMATTING & GRAMMAR REPORT */}
                            {activeTab === "formatting" && (
                                <FormattingGrammarReportView
                                    scoreData={formattingGrammarData}
                                    isCalculating={isCalculatingFormattingGrammar}
                                    onCalculate={handleCalculateFormattingGrammar}
                                />
                            )}

                            {/* TAB: ATS COMPATIBILITY REPORT */}
                            {activeTab === "ats" && (
                                <ATSReportView
                                    atsData={atsData}
                                    isCalculating={isCalculatingAts}
                                    onCalculateAts={handleCalculateAts}
                                />
                            )}

                            {/* TAB 2: SKILLS ANALYSIS */}
                            {activeTab === "skills" && (
                                <SkillsDetectionReport
                                    data={skillsKeywordsData || (analysis ? {
                                        detectedSkills: (analysis.skillsAnalysis?.foundSkills || []).map(s => ({
                                            skill: s.skill,
                                            normalizedName: s.skill,
                                            category: "domain_skills",
                                            sourceSection: "skills",
                                            evidence: s.evidence ? [s.evidence] : ["Identified in resume content."],
                                            evidenceStatus: "explicit_only"
                                        })),
                                        missingSkills: (analysis.skillsAnalysis?.skillGaps || []).map(g => ({
                                            skill: g.skill,
                                            normalizedName: g.skill,
                                            category: "domain_skills",
                                            importance: "required",
                                            reason: g.reason || "Not detected in the provided resume",
                                            suggestion: "Consider documenting practical experience if applicable."
                                        })),
                                        matchedKeywords: [],
                                        missingKeywords: [],
                                        partialMatches: [],
                                        skillCategories: {},
                                        summary: analysis.skillsAnalysis?.skillsSummary || "Skills extracted from resume.",
                                        detectionMode: "general",
                                        analysisMode: isRuleBased ? "free" : "ai"
                                    } : null)}
                                    isLoading={isCalculatingSkillsKeywords}
                                    onRunAnalysis={handleRunSkillsKeywordsAnalysis}
                                />
                            )}

                            {/* TAB 3: EXPERIENCE & EDUCATION */}
                            {activeTab === "experience" && (
                                <div className="space-y-6">
                                    {/* Experience Section */}
                                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <Briefcase size={15} className="text-indigo-600" />
                                            <span>Work Experience Evaluation</span>
                                        </h4>
                                        {analysis.experienceAnalysis?.summary && (
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {analysis.experienceAnalysis.summary}
                                            </p>
                                        )}
                                        {analysis.experienceAnalysis?.strengths?.length > 0 && (
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Experience Strengths</span>
                                                <ul className="text-xs text-slate-600 space-y-1">
                                                    {analysis.experienceAnalysis.strengths.map((str, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-emerald-600 font-bold">•</span>
                                                            <span>{str}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {analysis.experienceAnalysis?.improvements?.length > 0 && (
                                            <div className="space-y-1.5">
                                                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Recommended Enhancements</span>
                                                <ul className="text-xs text-slate-600 space-y-1">
                                                    {analysis.experienceAnalysis.improvements.map((imp, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-amber-600 font-bold">•</span>
                                                            <span>{imp}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Education Section */}
                                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                            <GraduationCap size={15} className="text-indigo-600" />
                                            <span>Academic Background & Qualifications</span>
                                        </h4>
                                        {analysis.educationAnalysis?.summary && (
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {analysis.educationAnalysis.summary}
                                            </p>
                                        )}
                                        {analysis.educationAnalysis?.observations?.length > 0 && (
                                            <ul className="text-xs text-slate-600 space-y-1">
                                                {analysis.educationAnalysis.observations.map((obs, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <span className="text-indigo-600 font-bold">•</span>
                                                        <span>{obs}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Projects Section */}
                                    {analysis.projectsAnalysis && (
                                        <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                                <FolderGit2 size={15} className="text-indigo-600" />
                                                <span>Technical Projects Review</span>
                                            </h4>
                                            {analysis.projectsAnalysis.summary && (
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    {analysis.projectsAnalysis.summary}
                                                </p>
                                            )}
                                            {analysis.projectsAnalysis.strengths?.length > 0 && (
                                                <ul className="text-xs text-slate-600 space-y-1">
                                                    {analysis.projectsAnalysis.strengths.map((str, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="text-emerald-600 font-bold">•</span>
                                                            <span>{str}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 4: STRENGTHS & WEAKNESSES */}
                            {activeTab === "strengths" && (
                                <StrengthsWeaknessesReportView
                                    data={strengthsWeaknessesData || (analysis ? {
                                        strengths: analysis.strengths?.map((str, idx) => ({
                                            id: `strength_${idx + 1}`,
                                            title: str.title || "Demonstrated Strength",
                                            description: str.description || "",
                                            category: "skills",
                                            evidence: [str.evidence || "Identified in resume content."],
                                            importance: "high",
                                            confidence: "high"
                                        })) || [],
                                        weaknesses: analysis.weaknesses?.map((w, idx) => ({
                                            id: `weakness_${idx + 1}`,
                                            title: w.title || "Constructive Improvement Area",
                                            description: w.description || "",
                                            category: "experience",
                                            evidence: ["Identified in resume evaluation."],
                                            impact: "medium",
                                            confidence: "high",
                                            suggestion: w.suggestion || "Consider refining this section for improved clarity."
                                        })) || [],
                                        missingInformation: analysis.skillsAnalysis?.skillGaps?.map(g => ({
                                            field: g.skill || "Skill",
                                            reason: g.reason || "Not clearly documented",
                                            importance: "medium"
                                        })) || [],
                                        analysisSummary: analysis.summary || "Strengths and weaknesses analyzed from resume contents.",
                                        analysisMode: isRuleBased ? "free" : "ai"
                                    } : null)}
                                    isRecalculating={isCalculatingStrengthsWeaknesses}
                                    onRecalculate={handleCalculateStrengthsWeaknesses}
                                />
                            )}

                            {/* TAB 5: SUGGESTIONS */}
                            {activeTab === "improvements" && (
                                <ImprovementSuggestions
                                    data={suggestionsData || (analysis ? {
                                        suggestions: (analysis.improvementSuggestions || []).map((s, idx) => ({
                                            id: `sug_${idx + 1}`,
                                            title: s.area || "Resume Improvement Area",
                                            category: "completeness",
                                            priority: s.priority || "medium",
                                            problem: s.suggestion || "Area identified for refinement.",
                                            whyItMatters: "Directly enhances recruiter scan rates and clarity.",
                                            recommendedAction: s.suggestion || "Refine this section.",
                                            evidence: ["Identified in resume evaluation."],
                                            example: null,
                                            source: isRuleBased ? "rule_based" : "ai_generated",
                                            confidence: 0.9,
                                            status: "pending"
                                        })),
                                        totalSuggestions: analysis.improvementSuggestions?.length || 0,
                                        highPriorityCount: analysis.improvementSuggestions?.filter(s => s.priority === "high").length || 0,
                                        mediumPriorityCount: analysis.improvementSuggestions?.filter(s => s.priority === "medium").length || 0,
                                        lowPriorityCount: analysis.improvementSuggestions?.filter(s => s.priority === "low").length || 0,
                                        categoryCounts: {},
                                        summary: analysis.summary || "Prioritized improvement suggestions for your resume.",
                                        generationMode: isRuleBased ? "free" : "advanced"
                                    } : null)}
                                    resumeId={resume.id}
                                    isLoading={isGeneratingSuggestions}
                                    onGenerate={handleGenerateSuggestions}
                                />
                            )}

                            {/* TAB 9: RESUME ENHANCEMENT & REWRITING (Lesson 7.4) */}
                            {activeTab === "enhancement" && (
                                <ResumeEnhancement resumeId={resume.id} />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">Analysis Mode:</span>
                        {isRuleBased ? (
                            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                                <Zap size={11} /> Free Deterministic Engine (No AI / Zero Cost)
                            </span>
                        ) : (
                            <span className="text-purple-700 font-semibold inline-flex items-center gap-1">
                                <Sparkles size={11} /> {analysisData?.aiModel || analysisData?.metadata?.aiModel || "gpt-4o-mini"}
                            </span>
                        )}
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

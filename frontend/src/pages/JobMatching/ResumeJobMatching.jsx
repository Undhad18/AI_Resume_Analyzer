import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  FileText,
  Building2,
  MapPin,
  Sparkles,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  ChevronRight,
  Plus,
  Upload,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  Info,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { getAllResumes } from "../../services/resumeService";
import { getJobDescriptions } from "../../services/jobDescriptionService";
import { createJobMatch, listJobMatches, getJobMatchReport } from "../../services/jobMatchingService";
import MatchingReport from "./MatchingReport";

export const ResumeJobMatching = () => {
  const [resumes, setResumes] = useState([]);
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJdId, setSelectedJdId] = useState("");
  const [matchingMode, setMatchingMode] = useState("free"); // "free" | "advanced"

  const [isLoading, setIsLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [activeReport, setActiveReport] = useState(null);

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setErrorNotice(null);
      try {
        const [resumesRes, jdsRes, matchesRes] = await Promise.allSettled([
          getAllResumes({ limit: 50 }),
          getJobDescriptions({ limit: 50 }),
          listJobMatches(10)
        ]);

        if (!isMounted) return;

        if (resumesRes.status === "fulfilled") {
          const list = resumesRes.value?.data?.resumes || resumesRes.value?.resumes || resumesRes.value?.data || [];
          setResumes(Array.isArray(list) ? list : []);
          if (list.length > 0) setSelectedResumeId(String(list[0].id || list[0].resume_id));
        }

        if (jdsRes.status === "fulfilled") {
          const list = jdsRes.value?.data?.jobDescriptions || jdsRes.value?.jobDescriptions || jdsRes.value?.data || [];
          setJobDescriptions(Array.isArray(list) ? list : []);
          if (list.length > 0) setSelectedJdId(String(list[0].id || list[0].job_id));
        }

        if (matchesRes.status === "fulfilled") {
          const list = matchesRes.value?.data?.data || matchesRes.value?.data || [];
          setRecentMatches(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (isMounted) setErrorNotice("Failed to load initial resume or job description lists.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartMatching = async () => {
    if (!selectedResumeId || !selectedJdId) {
      setErrorNotice("Please select both a resume and a target job description to match.");
      return;
    }

    try {
      setIsMatching(true);
      setErrorNotice(null);
      const res = await createJobMatch({
        resumeId: Number(selectedResumeId),
        jobDescriptionId: Number(selectedJdId),
        mode: matchingMode
      });

      const reportPayload = res?.data?.data || res?.data;
      if (reportPayload) {
        setActiveReport(reportPayload);
        // Refresh recent matches in background
        listJobMatches(10)
          .then((mRes) => {
            const list = mRes?.data?.data || mRes?.data || [];
            if (Array.isArray(list)) setRecentMatches(list);
          })
          .catch(() => {});
      }
    } catch (err) {
      setErrorNotice(
        err?.response?.data?.message || err?.message || "Failed to complete resume and job matching."
      );
    } finally {
      setIsMatching(false);
    }
  };

  const handleOpenExistingReport = async (matchId) => {
    try {
      setIsMatching(true);
      setErrorNotice(null);
      const res = await getJobMatchReport(matchId);
      const reportPayload = res?.data?.data || res?.data;
      if (reportPayload) {
        setActiveReport(reportPayload);
      }
    } catch (err) {
      setErrorNotice("Unable to open saved matching report.");
    } finally {
      setIsMatching(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score === null || score === undefined) return "bg-slate-100 text-slate-700 border-slate-200";
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 60) return "bg-blue-50 text-blue-700 border-blue-200";
    if (score >= 40) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const selectedResume = resumes.find(
    (r) => String(r.id || r.resume_id) === String(selectedResumeId)
  );

  const selectedJd = jobDescriptions.find(
    (j) => String(j.id || j.job_id) === String(selectedJdId)
  );

  // If a report is currently active, render it
  if (activeReport) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <MatchingReport
          reportData={activeReport}
          onReset={() => setActiveReport(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={12} />
              <span>Job Matching</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>Smart Analysis</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Job Description Matching
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Compare candidate qualifications against targeted job requirements, calculate weighted category scores, and discover missing keywords without fabricating claims.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/job-descriptions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition"
          >
            <Briefcase size={14} className="text-blue-600" />
            <span>Manage Job Postings</span>
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>Upload Resume</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Available Resumes</span>
            <div className="text-2xl font-bold text-slate-900">{resumes.length}</div>
            <p className="text-[11px] text-slate-400">Ready for requirement matching</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Target Job Postings</span>
            <div className="text-2xl font-bold text-slate-900">{jobDescriptions.length}</div>
            <p className="text-[11px] text-slate-400">Saved role specifications</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500">Completed Scans</span>
            <div className="text-2xl font-bold text-slate-900">{recentMatches.length}</div>
            <p className="text-[11px] text-slate-400">Past match evaluations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorNotice && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-600">Loading your resumes and saved job descriptions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Matching Configuration Card (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Configure Match Analysis
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Select a candidate resume and target job description to evaluate fit
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Resume Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-600" />
                      <span>Select Resume Document</span>
                    </label>
                    <Link
                      to="/upload"
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <Upload size={12} />
                      <span>Upload New</span>
                    </Link>
                  </div>

                  {resumes.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                      <p className="text-xs text-slate-500">No resumes found in your account.</p>
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition"
                      >
                        <Upload size={13} />
                        <span>Upload Resume</span>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                      >
                        {resumes.map((r) => (
                          <option key={r.id || r.resume_id} value={r.id || r.resume_id}>
                            {r.resume_title || r.resumeTitle || r.original_filename || "Resume"}{" "}
                            {r.candidate_name || r.candidateName ? `(${r.candidate_name || r.candidateName})` : ""}
                          </option>
                        ))}
                      </select>

                      {/* Selected Resume Meta Card */}
                      {selectedResume && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <FileText size={15} />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-slate-900 truncate block">
                                {selectedResume.candidate_name || selectedResume.candidateName || selectedResume.resume_title || "Candidate Resume"}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {selectedResume.original_filename || "Uploaded resume file"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            {selectedResume.file_type || selectedResume.fileType || "PDF"}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 2. Target Job Description Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-600" />
                      <span>Select Target Job Posting</span>
                    </label>
                    <Link
                      to="/job-descriptions"
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 transition"
                    >
                      <Plus size={12} />
                      <span>Add New Job</span>
                    </Link>
                  </div>

                  {jobDescriptions.length === 0 ? (
                    <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                      <p className="text-xs text-slate-500">No job descriptions saved yet.</p>
                      <Link
                        to="/job-descriptions"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition"
                      >
                        <Plus size={13} />
                        <span>Add Job Description</span>
                      </Link>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedJdId}
                        onChange={(e) => setSelectedJdId(e.target.value)}
                        className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                      >
                        {jobDescriptions.map((j) => (
                          <option key={j.id || j.job_id} value={j.id || j.job_id}>
                            {j.job_title || j.title || "Job Listing"}
                            {j.company_name || j.company ? ` • ${j.company_name || j.company}` : ""}
                            {j.location ? ` (${j.location})` : ""}
                          </option>
                        ))}
                      </select>

                      {/* Selected Job Description Meta Card */}
                      {selectedJd && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Building2 size={15} />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-slate-900 truncate block">
                                {selectedJd.job_title || selectedJd.title}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {[selectedJd.company_name || selectedJd.company, selectedJd.location].filter(Boolean).join(" • ") || "Target Role"}
                              </span>
                            </div>
                          </div>
                          {selectedJd.experience_required && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              {selectedJd.experience_required}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 3. Engine Mode Selector */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    <span>Matching Analysis Engine</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMatchingMode("free")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                        matchingMode === "free"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          matchingMode === "free" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Zap size={16} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          matchingMode === "free" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          Instant & Free
                        </span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">Deterministic Matcher</div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        High-speed rule engine with keyword normalization, requirement mapping, and zero token costs.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMatchingMode("advanced")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                        matchingMode === "advanced"
                          ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          matchingMode === "advanced" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Sparkles size={16} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          matchingMode === "advanced" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          OpenAI AI
                        </span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">Deep AI Engine</div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        In-depth semantic reasoning with verbatim citations and nuanced contextual evaluation.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Action Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isMatching || resumes.length === 0 || jobDescriptions.length === 0}
                    onClick={handleStartMatching}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMatching ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Analyzing Job Match & Missing Keywords...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Start Matching Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Matches & Helpful Guidance (Right 1 col) */}
          <div className="space-y-6">
            {/* Recent Match Scans Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Recent Matches</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Your past matching evaluations</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {recentMatches.length}
                </span>
              </div>

              <div className="p-4 flex-1">
                {recentMatches.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <Clock size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No Match Scans Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Execute your first analysis using the form on the left.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentMatches.map((m) => (
                      <button
                        key={m.matchId || m.match_id}
                        type="button"
                        onClick={() => handleOpenExistingReport(m.matchId || m.match_id)}
                        className="w-full p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition text-left space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700 transition">
                            {m.jobTitle || m.job_title || "Job Listing"}
                          </span>
                          {m.matchScore !== null && m.matchScore !== undefined ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getScoreBadgeClass(m.matchScore)}`}>
                              {Math.round(m.matchScore)}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 shrink-0">Scan</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[140px]">
                            {m.resumeTitle || m.resume_title || "Resume"}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDate(m.createdAt || m.created_at)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Matching Methodology / Help Box */}
            <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-100 p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-900">
                <Sparkles size={16} className="text-blue-600" />
                <span className="text-xs font-bold">Matching Methodology</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The engine evaluates requirements across 6 categories: Skills, Experience, Education, Projects, Duties, and Certifications.
              </p>
              <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>Direct textual evidence citations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span>Fair project scoring for freshers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span>Identifies missing keywords ethically</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeJobMatching;

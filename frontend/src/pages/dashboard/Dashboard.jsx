import {
    FileText,
    Upload,
    Sparkles,
    Target,
    ShieldCheck,
    ArrowRight,
    Server,
    CheckCircle2,
    AlertCircle,
    Award,
    Briefcase,
    RefreshCw
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { checkServerHealth } from "../../services/healthService";
import { getDashboardSummary } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";

import StatCard from "../../components/dashboard/StatCard";
import RecentResumes from "../../components/dashboard/RecentResumes";
import RecentAnalyses from "../../components/dashboard/RecentAnalyses";
import QuickActions from "../../components/dashboard/QuickActions";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";

const Dashboard = () => {
    const { user } = useAuth();

    // Data and UI states
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Health check state
    const [serverStatus, setServerStatus] = useState("Checking...");
    const [isServerHealthy, setIsServerHealthy] = useState(null);

    // Fetch dashboard summary from backend
    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getDashboardSummary();
            setSummary(data);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
            setError(err?.message || "Failed to load dashboard metrics. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkConnection = async () => {
            try {
                const response = await checkServerHealth();
                if (isMounted) {
                    if (response?.success) {
                        setServerStatus("Backend Connected");
                        setIsServerHealthy(true);
                    } else {
                        setServerStatus("Connection Degraded");
                        setIsServerHealthy(false);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setServerStatus("Backend Disconnected");
                    setIsServerHealthy(false);
                    console.error("Health check error:", err);
                }
            }
        };

        checkConnection();
        loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, [loadDashboardData]);

    const features = [
        {
            icon: Sparkles,
            title: "Smart ATS Scoring",
            description: "Evaluate your resume format, keyword density, and structural clarity against industry-standard ATS parsers."
        },
        {
            icon: Target,
            title: "Targeted AI Feedback",
            description: "Receive bullet-by-bullet actionable recommendations and rewrite suggestions powered by advanced language models."
        },
        {
            icon: ShieldCheck,
            title: "Job Description Matching",
            description: "Compare your resume directly against specific job postings to identify critical skill gaps and keyword alignments."
        }
    ];

    if (isLoading && !summary) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        {user?.fullName ? `Welcome back, ${user.fullName}!` : "Welcome to Your Dashboard!"}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">
                        Optimize, analyze, and supercharge your resume for applicant tracking systems and hiring managers.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadDashboardData}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-xs transition-colors text-sm disabled:opacity-60"
                        title="Refresh dashboard metrics"
                    >
                        <RefreshCw size={15} className={isLoading ? "animate-spin text-blue-600" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <Link
                        to="/upload"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                    >
                        <Upload size={16} />
                        <span>Upload Resume</span>
                    </Link>
                </div>
            </div>

            {/* Error Notification Banner if data fetch fails */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 text-rose-800">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-rose-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">Unable to load dashboard data</p>
                            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        className="text-xs font-bold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Real Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    title="Total Resumes"
                    value={summary?.totalResumes ?? 0}
                    description="Active resumes in your library"
                    icon={FileText}
                    color="blue"
                    isLoading={isLoading}
                />

                <StatCard
                    title="Completed Analyses"
                    value={summary?.totalAnalyses ?? 0}
                    description="Scored and processed with AI"
                    icon={Sparkles}
                    color="emerald"
                    isLoading={isLoading}
                />

                <StatCard
                    title="Average ATS Score"
                    value={
                        summary?.averageScore !== null && summary?.averageScore !== undefined
                            ? `${summary.averageScore}/100`
                            : "—"
                    }
                    description={
                        summary?.averageScore !== null && summary?.averageScore !== undefined
                            ? "Average across completed analyses"
                            : "No completed analyses yet"
                    }
                    icon={Award}
                    color="indigo"
                    isLoading={isLoading}
                />

                <StatCard
                    title="Job Matches"
                    value={summary?.totalJobMatches ?? 0}
                    description="Evaluations against job postings"
                    icon={Briefcase}
                    color="amber"
                    badge="Available"
                    isLoading={isLoading}
                />
            </div>

            {/* Server Connection Status Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2.5 rounded-lg ${
                            isServerHealthy === true
                                ? "bg-emerald-50 text-emerald-600"
                                : isServerHealthy === false
                                ? "bg-rose-50 text-rose-600"
                                : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        <Server size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                            Backend API System
                        </h2>
                        <p className="text-xs text-slate-500">
                            Real-time connection status with Express.js & MySQL service
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isServerHealthy === true ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            {serverStatus}
                        </span>
                    ) : isServerHealthy === false ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            <AlertCircle size={14} className="text-rose-600" />
                            {serverStatus}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                            {serverStatus}
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Actions Component */}
            <QuickActions />

            {/* Empty State Banner (Shown for users with 0 uploaded resumes to guide them) */}
            {summary?.totalResumes === 0 && (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 sm:p-10 text-center shadow-xs">
                    <div className="max-w-md mx-auto">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <FileText size={28} />
                        </div>

                        <h2 className="text-xl font-bold text-slate-900">
                            Get Started by Uploading Your Resume
                        </h2>

                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Upload your resume in PDF or DOCX format to calculate your ATS compatibility score and receive targeted improvement suggestions.
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/upload"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm"
                            >
                                <Upload size={16} />
                                <span>Upload Your First Resume</span>
                            </Link>

                            <Link
                                to="/resume-analysis"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
                            >
                                <span>Learn How Analysis Works</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Dual Section: Recent Resumes & Recent Analyses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <RecentResumes
                    resumes={summary?.recentResumes || []}
                    isLoading={isLoading}
                />

                <RecentAnalyses
                    analyses={summary?.recentAnalyses || []}
                    isLoading={isLoading}
                />
            </div>

            {/* Platform Capabilities / Overview Cards */}
            <div>
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-900">
                        AI Resume Optimization Suite
                    </h2>
                    <p className="text-sm text-slate-500">
                        Everything you need to turn your experience into job interview invitations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                    <Icon size={20} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

import { Link } from "react-router-dom";
import {
    Upload,
    Sparkles,
    Briefcase,
    FileEdit,
    ArrowRight
} from "lucide-react";

/**
 * QuickActions Component
 * Provides immediate navigation to primary platform workflows
 */
const QuickActions = () => {
    const actions = [
        {
            title: "Upload Resume",
            description: "Upload a PDF or DOCX file to start parsing and ATS evaluation.",
            icon: Upload,
            to: "/upload",
            color: "blue",
            buttonText: "Upload Now"
        },
        {
            title: "Analyze Resume",
            description: "Review detailed feedback, keyword gaps, and ATS scoring breakdown.",
            icon: Sparkles,
            to: "/resume-analysis",
            color: "purple",
            buttonText: "Start Analysis"
        },
        {
            title: "Job Matching",
            description: "Compare your resume directly against specific job description requirements.",
            icon: Briefcase,
            to: "/job-matching",
            color: "emerald",
            buttonText: "Match Jobs",
            badge: "Available"
        },
        {
            title: "Resume Builder",
            description: "Craft an optimized, ATS-friendly resume format directly in the browser.",
            icon: FileEdit,
            to: "/builder",
            color: "amber",
            buttonText: "Launch Builder"
        }
    ];

    const colorVariants = {
        blue: {
            bg: "bg-blue-50 text-blue-600",
            border: "hover:border-blue-300",
            button: "text-blue-600 group-hover:text-blue-700"
        },
        purple: {
            bg: "bg-purple-50 text-purple-600",
            border: "hover:border-purple-300",
            button: "text-purple-600 group-hover:text-purple-700"
        },
        emerald: {
            bg: "bg-emerald-50 text-emerald-600",
            border: "hover:border-emerald-300",
            button: "text-emerald-600 group-hover:text-emerald-700"
        },
        amber: {
            bg: "bg-amber-50 text-amber-600",
            border: "hover:border-amber-300",
            button: "text-amber-600 group-hover:text-amber-700"
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Quick Actions
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Launch your resume optimization workflows
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    const style = colorVariants[action.color] || colorVariants.blue;

                    return (
                        <Link
                            key={idx}
                            to={action.to}
                            className={`group bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200 ${style.border} flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-3 rounded-xl ${style.bg}`}>
                                        <Icon size={20} />
                                    </div>
                                    {action.badge && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                            {action.badge}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {action.title}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                    {action.description}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className={`text-xs font-bold flex items-center gap-1 ${style.button}`}>
                                    {action.buttonText}
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;

import { Award, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

/**
 * JobMatchScoreCard Component (Lesson 9.3)
 * Displays overall match score (0-100), qualitative label,
 * and clear ethical non-ATS disclaimer.
 */
export const JobMatchScoreCard = ({
  score = 0,
  scoreLabel = "Match Pending",
  scoreExplanation = ""
}) => {
  const numericScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

  // Color theme based on score tier
  let badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
  let ringColor = "stroke-rose-500";
  let textColor = "text-rose-600";
  let bgGradient = "from-rose-50/50 to-white";

  if (numericScore >= 80) {
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    ringColor = "stroke-emerald-500";
    textColor = "text-emerald-600";
    bgGradient = "from-emerald-50/50 to-white";
  } else if (numericScore >= 60) {
    badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
    ringColor = "stroke-blue-500";
    textColor = "text-blue-600";
    bgGradient = "from-blue-50/50 to-white";
  } else if (numericScore >= 40) {
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
    ringColor = "stroke-amber-500";
    textColor = "text-amber-600";
    bgGradient = "from-amber-50/50 to-white";
  }

  // Circular progress calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className={`p-6 rounded-2xl border border-slate-200 bg-gradient-to-br ${bgGradient} shadow-xs flex flex-col md:flex-row items-center justify-between gap-6`}>
      {/* Left Details */}
      <div className="space-y-2 flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 bg-white/80 text-slate-700 shadow-2xs">
          <Award size={14} className={textColor} />
          <span>Overall Job Match Score</span>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
          <span className={`text-2xl sm:text-3xl font-black ${textColor}`}>
            {numericScore}<span className="text-sm font-semibold text-slate-400">/100</span>
          </span>
          <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wide border shadow-2xs ${badgeColor}`}>
            {scoreLabel}
          </span>
        </div>

        <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
          {scoreExplanation ||
            "Estimated resume-to-job relevance based strictly on validated textual evidence in your resume."}
        </p>

        {/* Ethical Safety Notice */}
        <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 max-w-xl">
          <ShieldAlert size={14} className="text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Transparency Notice:</strong> This score represents candidate qualification alignment.
            It is not an official ATS score, and does not guarantee interview selection or hiring decisions.
          </span>
        </div>
      </div>

      {/* Right Circular Gauge */}
      <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="9"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={`${ringColor} transition-all duration-700 ease-out`}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-xl font-black ${textColor}`}>{numericScore}%</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Match</span>
        </div>
      </div>
    </div>
  );
};

export default JobMatchScoreCard;

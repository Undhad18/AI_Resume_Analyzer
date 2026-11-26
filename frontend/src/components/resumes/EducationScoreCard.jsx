import { GraduationCap, CheckCircle2, AlertTriangle, Layers, Calendar, School, BookOpen } from "lucide-react";

/**
 * Renders individual educational qualifications
 */
export const EducationDetails = ({ qualifications = [] }) => {
    if (!qualifications.length) {
        return (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                No formal educational records found.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Academic Records ({qualifications.length})</span>
                <span className="text-[10px] text-slate-500">Evaluated without university prestige bias</span>
            </h5>

            <div className="space-y-2.5">
                {qualifications.map((q, idx) => (
                    <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h6 className="text-xs sm:text-sm font-bold text-slate-800">
                                    {q.degree || "Degree Unstated"}
                                </h6>
                                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                    q.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                }`}>
                                    {q.isComplete ? "Verified Structure" : "Incomplete Details"}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <School size={13} className="text-slate-400" />
                                    <span>{q.institution || "Institution Not Specified"}</span>
                                </span>
                                {q.fieldOfStudy && (
                                    <span className="flex items-center gap-1">
                                        <BookOpen size={13} className="text-slate-400" />
                                        <span>{q.fieldOfStudy}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">
                                <Calendar size={12} className="text-slate-400" />
                                <span>
                                    {q.startDate ? `${q.startDate} - ` : ""}
                                    {q.endDate || "Date Unspecified"}
                                </span>
                            </span>
                            {q.grade && (
                                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                                    Grade/GPA: {q.grade}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Detailed Education Score Card (Weight: 10 pts)
 */
export const EducationScoreCard = ({ educationData }) => {
    if (!educationData) return null;

    const {
        rating = 0,
        weight = 10,
        earnedPoints = 0,
        parameters = {},
        qualifications = [],
        findings = [],
        limitations = []
    } = educationData;

    const paramList = [
        { key: "qualificationDetails", label: "Qualification Details", weight: 30, data: parameters.qualificationDetails },
        { key: "institutionInformation", label: "Institution Information", weight: 20, data: parameters.institutionInformation },
        { key: "fieldOrSpecialization", label: "Field or Specialization", weight: 20, data: parameters.fieldOrSpecialization },
        { key: "graduationDates", label: "Graduation Year or Dates", weight: 15, data: parameters.graduationDates },
        { key: "sectionClarity", label: "Education Section Clarity", weight: 15, data: parameters.sectionClarity }
    ];

    return (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <GraduationCap size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Education Evaluation</h4>
                        <p className="text-xs text-slate-500">
                            Overall Category Weight: {weight} Points
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xl font-black text-sky-600">{earnedPoints}</span>
                        <span className="text-xs font-bold text-slate-400">/ {weight} pts</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                        Rating: {rating}/100
                    </span>
                </div>
            </div>

            {/* 5-Parameter Internal Breakdown */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-sky-600" />
                    <span>Internal Evaluation Parameters</span>
                </h5>

                <div className="space-y-2.5">
                    {paramList.map((p) => {
                        const score = p.data?.rating || 0;
                        const earned = p.data?.earnedPoints || 0;
                        return (
                            <div key={p.key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-800">
                                        {p.label} <span className="text-[10px] font-normal text-slate-500">({p.weight}%)</span>
                                    </span>
                                    <span className="font-bold text-slate-700">
                                        {score}/100 <span className="text-sky-600 font-semibold">({earned} pts)</span>
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-600 rounded-full transition-all duration-300"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                {p.data?.explanation && (
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        {p.data.explanation}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Academic Records List */}
            <EducationDetails qualifications={qualifications} />

            {/* Findings & Limitations */}
            {(findings.length > 0 || limitations.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    {findings.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Key Findings</span>
                            </span>
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                                {findings.map((f, i) => (
                                    <li key={i}>{f}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {limitations.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="font-semibold text-amber-800 flex items-center gap-1">
                                <AlertTriangle size={13} className="text-amber-600" />
                                <span>Areas for Improvement</span>
                            </span>
                            <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                                {limitations.map((l, i) => (
                                    <li key={i}>{l}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EducationScoreCard;

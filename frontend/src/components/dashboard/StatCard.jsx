/**
 * Reusable StatCard component for dashboard metrics
 * 
 * @param {object} props
 * @param {string} props.title - Metric title (e.g. "Total Resumes")
 * @param {string|number} props.value - Display value (e.g. 5, "84.5%", or "N/A")
 * @param {string} [props.description] - Subtext or context explanation
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} [props.color="blue"] - Theme color accent: 'blue' | 'emerald' | 'indigo' | 'amber' | 'slate'
 * @param {boolean} [props.isLoading=false] - Whether data is loading
 * @param {string} [props.badge] - Optional badge text (e.g. "Coming Soon" or "Active")
 */
const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    color = "blue",
    isLoading = false,
    badge
}) => {
    const colorStyles = {
        blue: {
            bg: "bg-blue-50 text-blue-600",
            border: "border-blue-100",
            hover: "hover:border-blue-200"
        },
        emerald: {
            bg: "bg-emerald-50 text-emerald-600",
            border: "border-emerald-100",
            hover: "hover:border-emerald-200"
        },
        indigo: {
            bg: "bg-indigo-50 text-indigo-600",
            border: "border-indigo-100",
            hover: "hover:border-indigo-200"
        },
        amber: {
            bg: "bg-amber-50 text-amber-600",
            border: "border-amber-100",
            hover: "hover:border-amber-200"
        },
        slate: {
            bg: "bg-slate-100 text-slate-600",
            border: "border-slate-200",
            hover: "hover:border-slate-300"
        }
    };

    const activeColor = colorStyles[color] || colorStyles.blue;

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-3/4">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all duration-200 ${activeColor.hover} flex flex-col justify-between`}
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <p className="text-sm font-medium text-slate-600 tracking-tight">
                        {title}
                    </p>
                    {badge && (
                        <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {badge}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-1">
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {value !== null && value !== undefined ? value : "—"}
                    </h3>

                    <div className={`p-3 rounded-xl ${activeColor.bg} shrink-0`}>
                        {Icon && <Icon size={24} />}
                    </div>
                </div>
            </div>

            {description && (
                <p className="text-xs text-slate-500 mt-4 leading-relaxed border-t border-slate-100 pt-3">
                    {description}
                </p>
            )}
        </div>
    );
};

export default StatCard;

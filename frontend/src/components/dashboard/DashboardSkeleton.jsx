/**
 * Skeleton Loader Component matching the Dashboard layout
 */
const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 rounded w-64"></div>
                    <div className="h-4 bg-slate-100 rounded w-96"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded-lg w-36"></div>
            </div>

            {/* Stat cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                        </div>
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    </div>
                ))}
            </div>

            {/* Quick Actions skeleton */}
            <div className="space-y-4">
                <div className="h-5 bg-slate-200 rounded w-36"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dual tables skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((card) => (
                    <div key={card} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="space-y-1.5">
                                <div className="h-5 bg-slate-200 rounded w-32"></div>
                                <div className="h-3 bg-slate-100 rounded w-48"></div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded w-16"></div>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((row) => (
                                <div key={row} className="flex items-center gap-3 py-2">
                                    <div className="w-9 h-9 bg-slate-200 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                        <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                                    </div>
                                    <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardSkeleton;

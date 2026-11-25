import {
    User,
    Mail,
    Calendar,
    ShieldCheck,
    Edit3,
    CheckCircle2
} from "lucide-react";

/**
 * ProfileDetails Component
 * Full-screen responsive card displaying current user profile information
 * 
 * @param {object} props
 * @param {object} props.profile - User profile data from backend
 * @param {Function} props.onEdit - Callback to switch to edit mode
 */
const ProfileDetails = ({ profile, onEdit }) => {
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Not available";
            return date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return "Not available";
        }
    };

    const initials = profile?.fullName
        ? profile.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : profile?.email
        ? profile.email.slice(0, 2).toUpperCase()
        : "AI";

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Full width header banner */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 h-36 px-6 sm:px-10 relative">
                <div className="absolute -bottom-12 left-6 sm:left-10">
                    <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg">
                        <div className="w-full h-full rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-3xl shadow-inner">
                            {initials}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile body spanning full width */}
            <div className="pt-16 pb-8 px-6 sm:px-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            {profile?.fullName || "User Profile"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {profile?.email}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onEdit}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                        <Edit3 size={16} />
                        <span>Edit Profile</span>
                    </button>
                </div>

                {/* Account Details Responsive Grid spanning full width */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
                    {/* Full Name */}
                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                            <User size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Full Name
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 truncate">
                                {profile?.fullName || "Not set"}
                            </p>
                        </div>
                    </div>

                    {/* Email Address */}
                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Mail size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Email Address
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 truncate" title={profile?.email}>
                                {profile?.email || "Not set"}
                            </p>
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Account Status
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span className="capitalize">{profile?.accountStatus || "Active"}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-start gap-3.5 p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Member Since
                            </p>
                            <p className="text-sm sm:text-base font-semibold text-slate-900 mt-0.5 truncate">
                                {formatDate(profile?.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetails;

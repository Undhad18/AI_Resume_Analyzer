import { useState } from "react";
import {
    Save,
    X,
    AlertCircle,
    User,
    Mail,
    Loader2
} from "lucide-react";

/**
 * EditProfileForm Component
 * Full-width form to modify authenticated user's name and email
 * 
 * @param {object} props
 * @param {object} props.profile - Current profile values
 * @param {Function} props.onSave - Callback receiving updated profile payload
 * @param {Function} props.onCancel - Callback to exit edit mode
 */
const EditProfileForm = ({ profile, onSave, onCancel }) => {
    const [fullName, setFullName] = useState(profile?.fullName || "");
    const [email, setEmail] = useState(profile?.email || "");
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        } else if (fullName.trim().length > 150) {
            newErrors.fullName = "Full name must not exceed 150 characters";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(email.trim())) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                fullName: fullName.trim(),
                email: email.trim().toLowerCase()
            });
        } catch (err) {
            setServerError(
                err?.message ||
                err?.errors?.[0]?.message ||
                "Failed to update profile. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10">
            <div className="pb-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Edit Profile Information
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Update your public profile name and account email address
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Cancel"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Server Error Alert */}
            {serverError && (
                <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-semibold">Unable to save changes:</span> {serverError}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name Field */}
                    <div>
                        <label
                            htmlFor="fullName"
                            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                        >
                            Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <User size={18} />
                            </div>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value);
                                    if (errors.fullName) {
                                        setErrors((prev) => ({ ...prev, fullName: null }));
                                    }
                                }}
                                disabled={isSubmitting}
                                placeholder="John Doe"
                                className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border ${
                                    errors.fullName
                                        ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                                        : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                } focus:outline-none focus:ring-2 bg-slate-50/50 transition-colors disabled:opacity-60`}
                            />
                        </div>
                        {errors.fullName && (
                            <p className="text-xs text-rose-600 mt-1 font-medium">
                                {errors.fullName}
                            </p>
                        )}
                    </div>

                    {/* Email Address Field */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                        >
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) {
                                        setErrors((prev) => ({ ...prev, email: null }));
                                    }
                                }}
                                disabled={isSubmitting}
                                placeholder="user@example.com"
                                className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border ${
                                    errors.email
                                        ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                                        : "border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                                } focus:outline-none focus:ring-2 bg-slate-50/50 transition-colors disabled:opacity-60`}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-rose-600 mt-1 font-medium">
                                {errors.email}
                            </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Changing your email updates your account credentials for next login.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfileForm;

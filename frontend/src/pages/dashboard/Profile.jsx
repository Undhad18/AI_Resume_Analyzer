import { useState, useEffect, useCallback } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import { getProfile, updateProfile } from "../../services/profileService";
import { useAuth } from "../../context/AuthContext";

import ProfileDetails from "../../components/dashboard/ProfileDetails";
import EditProfileForm from "../../components/dashboard/EditProfileForm";

const Profile = () => {
    const { user, updateUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProfile();
            if (data) {
                setProfile(data);
                // Sync AuthContext if needed
                updateUser({
                    fullName: data.fullName,
                    email: data.email
                });
            }
        } catch (err) {
            console.error("Failed to load profile:", err);
            setError(err?.message || "Failed to load profile details.");
        } finally {
            setIsLoading(false);
        }
    }, [updateUser]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSaveProfile = async (formData) => {
        const updatedData = await updateProfile(formData);
        if (updatedData) {
            setProfile(updatedData);
            // Propagate updated name/email to global AuthContext immediately
            updateUser({
                fullName: updatedData.fullName,
                email: updatedData.email
            });
            setIsEditing(false);
            setSuccessMessage("Your profile information was updated successfully.");

            // Clear success banner after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        }
    };

    if (isLoading && !profile) {
        return (
            <div className="w-full py-16 flex flex-col items-center justify-center space-y-3">
                <Loader2 size={32} className="text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading profile details...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Success notification banner */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Error notification banner */}
            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle size={18} className="text-rose-600 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                    <button
                        onClick={loadProfile}
                        className="text-xs font-semibold px-2.5 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Full-Screen Profile Content Switcher */}
            {isEditing ? (
                <EditProfileForm
                    profile={profile || { fullName: user?.fullName, email: user?.email }}
                    onSave={handleSaveProfile}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <ProfileDetails
                    profile={profile || { fullName: user?.fullName, email: user?.email }}
                    onEdit={() => setIsEditing(true)}
                />
            )}
        </div>
    );
};

export default Profile;

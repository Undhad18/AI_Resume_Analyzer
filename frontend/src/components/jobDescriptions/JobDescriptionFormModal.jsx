import { useState, useEffect } from "react";
import { X, Briefcase, Building2, MapPin, Globe, Clock, Loader2, AlertCircle } from "lucide-react";
import { createJobDescription, updateJobDescription } from "../../services/jobDescriptionService";

/**
 * Job Description Add / Edit Modal (Lesson 9.1)
 */
export const JobDescriptionFormModal = ({
  isOpen = false,
  onClose = null,
  onSuccess = null,
  initialData = null // if provided, modal operates in Edit mode
}) => {
  const isEditMode = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    experienceRequired: "",
    location: "",
    description: "",
    sourceUrl: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        jobTitle: initialData.job_title || "",
        companyName: initialData.company_name || "",
        experienceRequired: initialData.experience_required || "",
        location: initialData.location || "",
        description: initialData.description || "",
        sourceUrl: initialData.source_url || ""
      });
    } else {
      setFormData({
        jobTitle: "",
        companyName: "",
        experienceRequired: "",
        location: "",
        description: "",
        sourceUrl: ""
      });
    }
    setErrors({});
    setServerError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = "Job title is required.";
    } else if (formData.jobTitle.trim().length < 2) {
      newErrors.jobTitle = "Job title must be at least 2 characters.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required.";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Please paste or enter at least 10 characters of job details.";
    }

    if (formData.sourceUrl && formData.sourceUrl.trim().length > 0) {
      const urlPattern = /^(https?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?(\?.*)?$/i;
      if (!urlPattern.test(formData.sourceUrl.trim())) {
        newErrors.sourceUrl = "Please enter a valid URL beginning with http:// or https://";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      let saved;
      if (isEditMode) {
        saved = await updateJobDescription(initialData.id, formData);
      } else {
        saved = await createJobDescription(formData);
      }

      if (onSuccess) onSuccess(saved.data || saved);
      if (onClose) onClose();
    } catch (err) {
      const msg = err.message || "Failed to save job description. Please review your inputs.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditMode ? "Edit Job Description" : "Add Job Description"}
              </h2>
              <p className="text-xs text-slate-500">
                Paste job details to store and later match against your resumes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="m-5 sm:m-6 mb-0 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Job Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Job Title <span className="text-red-500">*</span></span>
              {errors.jobTitle && <span className="text-red-500 font-normal">{errors.jobTitle}</span>}
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white focus:outline-none transition ${
                errors.jobTitle ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
              }`}
            />
          </div>

          {/* Row: Company Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Google, Stripe, or Remote Corp"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA / Remote"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Row: Experience Required & Posting URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                <span>Experience Required</span>
              </label>
              <input
                type="text"
                value={formData.experienceRequired}
                onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
                placeholder="e.g. 3+ years / Mid-Senior"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Globe size={13} className="text-slate-400" />
                  <span>Job Posting URL</span>
                </span>
                {errors.sourceUrl && <span className="text-red-500 font-normal">{errors.sourceUrl}</span>}
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://company.com/careers/role"
                className={`w-full px-3.5 py-2 text-xs rounded-xl border bg-white focus:outline-none transition ${
                  errors.sourceUrl ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                }`}
              />
            </div>
          </div>

          {/* Full Job Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Full Job Description <span className="text-red-500">*</span></span>
              {errors.description && <span className="text-red-500 font-normal">{errors.description}</span>}
            </label>
            <textarea
              rows={8}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Paste the full job requirements, qualifications, and responsibilities here..."
              className={`w-full p-3.5 text-xs rounded-xl border bg-white focus:outline-none transition leading-relaxed ${
                errors.description ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
              }`}
            />
            <p className="text-[11px] text-slate-400">
              Preserves line breaks and structure. Text is safely rendered and never executed as HTML.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Save Job Description"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobDescriptionFormModal;

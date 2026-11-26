import { X, Building2, MapPin, Briefcase, Calendar, ExternalLink, Edit3, Trash2 } from "lucide-react";

/**
 * Job Description Full Details View Modal (Lesson 9.1)
 * Renders complete job description safely without dangerouslySetInnerHTML.
 */
export const JobDescriptionDetailsModal = ({
  job = null,
  isOpen = false,
  onClose = null,
  onEdit = null,
  onDelete = null
}) => {
  if (!isOpen || !job) return null;

  const createdDate = job.created_at
    ? new Date(job.created_at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  const updatedDate = job.updated_at
    ? new Date(job.updated_at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="space-y-1.5 min-w-0 pr-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={11} />
              <span>Job Description Details</span>
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-words">
              {job.job_title}
            </h2>
            {job.company_name && (
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Building2 size={13} className="text-slate-400" />
                <span>{job.company_name}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="px-5 sm:px-6 py-3 bg-slate-100/60 border-b border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              <span>{job.location}</span>
            </span>
          )}

          {job.experience_required && (
            <span className="flex items-center gap-1">
              <Briefcase size={12} className="text-slate-400" />
              <span className="font-medium text-blue-700">{job.experience_required}</span>
            </span>
          )}

          {createdDate && (
            <span className="flex items-center gap-1 text-slate-400">
              <Calendar size={12} />
              <span>Created {createdDate}</span>
            </span>
          )}

          {updatedDate && updatedDate !== createdDate && (
            <span className="text-[11px] text-slate-400">
              (Updated {updatedDate})
            </span>
          )}

          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:underline font-medium text-xs"
            >
              <span>View Source Listing</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Description Text Container (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-2 flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Requirements & Responsibilities
          </h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans select-text">
            {job.description}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit && onEdit(job)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(job)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionDetailsModal;

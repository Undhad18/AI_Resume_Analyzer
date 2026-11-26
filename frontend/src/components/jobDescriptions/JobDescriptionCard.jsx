import { Building2, MapPin, Briefcase, Calendar, ExternalLink, Eye, Edit3, Trash2 } from "lucide-react";

/**
 * Job Description Card Component (Lesson 9.1)
 * Displays job metadata, description snippet, and direct actions.
 */
export const JobDescriptionCard = ({
  job = {},
  onView = null,
  onEdit = null,
  onDelete = null
}) => {
  const formattedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "";

  return (
    <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div className="space-y-3">
        {/* Header row: Job Title and External Link */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate" title={job.job_title}>
              {job.job_title}
            </h3>
            {job.company_name && (
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <span>{job.company_name}</span>
              </p>
            )}
          </div>

          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-50 transition shrink-0"
              title="Open original job posting"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
          {job.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200">
              <MapPin size={11} className="text-slate-500" />
              <span className="truncate max-w-[140px]">{job.location}</span>
            </span>
          )}

          {job.experience_required && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={11} className="text-blue-600" />
              <span>{job.experience_required}</span>
            </span>
          )}

          {formattedDate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-500">
              <Calendar size={11} />
              <span>{formattedDate}</span>
            </span>
          )}
        </div>

        {/* Description Snippet */}
        {job.description && (
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line pt-1">
            {job.description}
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onView && onView(job)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
        >
          <Eye size={13} />
          <span>View Details</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit && onEdit(job)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
            title="Edit Job Description"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete && onDelete(job)}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Delete Job Description"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionCard;

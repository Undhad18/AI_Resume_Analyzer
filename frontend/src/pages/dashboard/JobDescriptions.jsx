import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Building2
} from "lucide-react";
import {
  getJobDescriptions,
  deleteJobDescription
} from "../../services/jobDescriptionService";
import JobDescriptionCard from "../../components/jobDescriptions/JobDescriptionCard";
import JobDescriptionFormModal from "../../components/jobDescriptions/JobDescriptionFormModal";
import JobDescriptionDetailsModal from "../../components/jobDescriptions/JobDescriptionDetailsModal";
import DeleteConfirmationModal from "../../components/jobDescriptions/DeleteConfirmationModal";

export const JobDescriptions = () => {
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch job descriptions
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getJobDescriptions({
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit
      });

      setJobDescriptions(response.data || []);
      if (response.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
          page: response.pagination.page
        }));
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to load job descriptions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Handlers for Add/Edit
  const handleOpenAdd = () => {
    setEditingJob(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setIsDetailsModalOpen(false); // Close details modal if open
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = (savedJob) => {
    fetchJobs();
    setNotification({
      type: "success",
      message: editingJob
        ? `Updated "${savedJob.job_title || "Job Description"}" successfully.`
        : `Added "${savedJob.job_title || "Job Description"}" successfully.`
    });
  };

  // Handlers for View
  const handleOpenView = (job) => {
    setViewingJob(job);
    setIsDetailsModalOpen(true);
  };

  // Handlers for Delete
  const handleOpenDelete = (job) => {
    setDeletingJob(job);
    setIsDetailsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingJob || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteJobDescription(deletingJob.id);
      setIsDeleteModalOpen(false);
      setNotification({
        type: "success",
        message: `Deleted "${deletingJob.job_title}" successfully.`
      });
      fetchJobs();
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Failed to delete job description."
      });
    } finally {
      setIsDeleting(false);
      setDeletingJob(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              to="/job-matching"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft size={13} />
              <span>Back to Job Matching</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Briefcase size={12} />
              <span>Job Descriptions</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Target Job Descriptions
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Store and manage target job listings to evaluate candidate resumes, identify required skills, and discover missing keywords.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/job-matching"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Add Job Description</span>
          </button>
        </div>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in transition ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-red-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Search Bar & Metadata Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company, location, or keyword..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-end sm:self-center">
          <Building2 size={14} className="text-slate-400" />
          <span>{pagination.total === 1 ? "1 saved job listing" : `${pagination.total} saved job listings`}</span>
        </div>
      </div>

      {/* Content Grid / States */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-3 min-h-[300px] flex flex-col items-center justify-center">
          <Loader2 size={28} className="text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500">Loading your job descriptions...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-white border border-red-200 rounded-2xl p-10 text-center space-y-3">
          <AlertCircle size={28} className="text-red-600 mx-auto" />
          <p className="text-xs text-red-700 font-semibold">{errorMessage}</p>
          <button
            type="button"
            onClick={fetchJobs}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : jobDescriptions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3 min-h-[350px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={26} />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-bold text-slate-900">
              {debouncedSearch ? "No matching job descriptions found" : "No Job Descriptions Added Yet"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {debouncedSearch
                ? `No job descriptions match "${debouncedSearch}". Try searching with a different term.`
                : "Add target job postings by copying their requirements and responsibilities to prepare for resume matching."}
            </p>
          </div>

          <button
            type="button"
            onClick={debouncedSearch ? () => setSearchQuery("") : handleOpenAdd}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
          >
            {debouncedSearch ? (
              <span>Clear Search</span>
            ) : (
              <>
                <Plus size={13} />
                <span>Add Your First Job Description</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobDescriptions.map((job) => (
              <JobDescriptionCard
                key={job.id}
                job={job}
                onView={handleOpenView}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-xs">
              <span className="text-slate-500 font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <JobDescriptionFormModal
        isOpen={isFormModalOpen}
        initialData={editingJob}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingJob(null);
        }}
        onSuccess={handleFormSuccess}
      />

      <JobDescriptionDetailsModal
        isOpen={isDetailsModalOpen}
        job={viewingJob}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setViewingJob(null);
        }}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        job={deletingJob}
        isDeleting={isDeleting}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingJob(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default JobDescriptions;

import { Trash2, Loader2 } from "lucide-react";

const DeleteResumeDialog = ({ isOpen, onClose, onConfirm, resume, isDeleting }) => {
    if (!isOpen || !resume) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Delete Resume</h3>
                        <p className="text-xs text-slate-500">This action cannot be undone.</p>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 mb-5">
                    <p className="text-xs text-slate-500 mb-1">Document to be removed:</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                        {resume.originalFilename || resume.title || "Resume Document"}
                    </p>
                </div>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Are you sure you want to delete this resume? It will be removed from your dashboard and private storage.
                </p>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                        {isDeleting && <Loader2 size={14} className="animate-spin" />}
                        <span>{isDeleting ? "Deleting..." : "Delete Document"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteResumeDialog;

import {
    FileText,
    FileSpreadsheet,
    Trash2,
    RefreshCw,
    CheckCircle2
} from "lucide-react";
import { formatFileSize, getFileExtension } from "../../utils/resumeValidation";

/**
 * SelectedFileCard Component
 * Displays the verified file metadata with remove and change actions
 * 
 * @param {object} props
 * @param {File} props.file - Validated File object
 * @param {Function} props.onRemove - Callback to remove the selected file
 * @param {Function} props.onChangeFile - Callback to trigger new file picker
 * @param {boolean} [props.disabled=false] - Disable actions during upload
 */
const SelectedFileCard = ({ file, onRemove, onChangeFile, disabled = false }) => {
    if (!file) return null;

    const extension = getFileExtension(file.name);
    const isPdf = extension === "pdf";

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* File Details (Left) */}
                <div className="flex items-center gap-4 min-w-0">
                    {/* File Icon */}
                    <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${isPdf
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}
                    >
                        {isPdf ? <FileText size={26} /> : <FileSpreadsheet size={26} />}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4
                                className="text-sm sm:text-base font-bold text-slate-900 truncate"
                                title={file.name}
                            >
                                {file.name}
                            </h4>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${isPdf
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                            >
                                {extension}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="font-medium text-slate-700">
                                {formatFileSize(file.size)}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle2 size={13} />
                                Ready for Upload
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions (Right) */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={onChangeFile}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Select a different resume"
                    >
                        <RefreshCw size={13} />
                        <span>Change</span>
                    </button>

                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove selected file"
                    >
                        <Trash2 size={13} />
                        <span>Remove</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectedFileCard;

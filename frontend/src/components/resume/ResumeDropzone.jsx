import { useState, useRef } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { MAX_FILE_SIZE_MB } from "../../utils/resumeValidation";

/**
 * ResumeDropzone Component
 * Drag-and-drop file upload zone with browse button and keyboard accessibility
 * 
 * @param {object} props
 * @param {Function} props.onFileSelect - Callback when a file is dropped or selected
 * @param {boolean} [props.disabled=false] - Whether file selection is disabled
 * @param {React.RefObject} props.fileInputRef - Ref to the hidden file input
 */
const ResumeDropzone = ({ onFileSelect, disabled = false, fileInputRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const localInputRef = useRef(null);

    const activeInputRef = fileInputRef || localInputRef;

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Select the first file dropped
            onFileSelect(files[0]);
        }
    };

    const handleInputChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const triggerBrowse = () => {
        if (!disabled && activeInputRef.current) {
            activeInputRef.current.click();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerBrowse();
        }
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerBrowse}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Upload resume dropzone. Drag and drop file or press enter to browse."
            className={`w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isDragging
                    ? "border-blue-500 bg-blue-50/80 scale-[1.01] shadow-md"
                    : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50 shadow-xs"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
            {/* Hidden native file input */}
            <input
                ref={activeInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleInputChange}
                disabled={disabled}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
            />

            {/* Icon */}
            <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 ${
                    isDragging
                        ? "bg-blue-600 text-white scale-110 shadow-lg animate-bounce"
                        : "bg-blue-50 text-blue-600 group-hover:scale-105"
                }`}
            >
                <UploadCloud size={36} className="sm:size-10" />
            </div>

            {/* Main Title & Prompt */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {isDragging ? "Drop your resume right here" : "Drag and drop your resume here"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm">
                Upload your existing resume to calculate ATS scores and get AI optimization feedback.
            </p>

            {/* Browse Button */}
            <div className="mt-5">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        triggerBrowse();
                    }}
                    disabled={disabled}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                    <FileText size={16} />
                    <span>Browse Files</span>
                </button>
            </div>

            {/* Format & Size Information */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-600">Supported formats:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border border-slate-200">
                    PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border border-slate-200">
                    DOCX
                </span>
                <span className="mx-1 text-slate-300">•</span>
                <span>Max size: {MAX_FILE_SIZE_MB} MB</span>
            </div>
        </div>
    );
};

export default ResumeDropzone;

import { useState, useRef } from "react";
import {
    Upload,
    AlertCircle,
    Info,
    Sparkles,
    CheckCircle2,
    Loader2,
    FileCheck,
    RotateCcw
} from "lucide-react";

import ResumeDropzone from "../../components/resume/ResumeDropzone";
import SelectedFileCard from "../../components/resume/SelectedFileCard";
import UploadInstructions from "../../components/resume/UploadInstructions";
import { validateResumeFile, formatFileSize } from "../../utils/resumeValidation";
import { uploadResume } from "../../services/resumeService";

/**
 * UploadResume Page Component
 * Module 4 Lesson 4.2: Real Backend File Upload using Multer
 */
const UploadResume = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationError, setValidationError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const [uploadError, setUploadError] = useState(null);

    const fileInputRef = useRef(null);

    /**
     * Handle file selection from dropzone or browse dialog
     * @param {File} file 
     */
    const handleFileSelect = (file) => {
        setValidationError(null);
        setUploadError(null);
        setUploadSuccess(null);

        const validation = validateResumeFile(file);

        if (!validation.isValid) {
            setValidationError(validation.error);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setSelectedFile(file);
    };

    /**
     * Remove currently selected file and reset input
     */
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setValidationError(null);
        setUploadError(null);
        setUploadSuccess(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /**
     * Trigger file dialog to choose a different file
     */
    const handleChangeFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    /**
     * Action handler for Upload button - communicates with POST /api/resumes/upload
     */
    const handleUploadClick = async () => {
        if (!selectedFile || isUploading) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            const response = await uploadResume(selectedFile);
            const stagedData = response?.data || response;
            setUploadSuccess(stagedData);
        } catch (err) {
            console.error("Upload error:", err);
            setUploadError(
                err?.message ||
                err?.errors?.[0]?.message ||
                "Failed to upload resume. Please check file format and try again."
            );
        } finally {
            setIsUploading(false);
        }
    };

    const handleResetAll = () => {
        setSelectedFile(null);
        setValidationError(null);
        setUploadError(null);
        setUploadSuccess(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* Page Header */}
            <div className="pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    <Sparkles size={14} />
                    <span>Resume Intake Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Upload Your Resume
                </h1>
                <p className="text-slate-500 mt-1.5 text-sm sm:text-base max-w-2xl leading-relaxed">
                    Upload your resume in PDF or DOCX format to calculate ATS scores, extract key qualifications, and receive tailored AI improvement suggestions.
                </p>
            </div>

            {/* Validation Error Alert Banner */}
            {validationError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-150">
                    <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-semibold">Validation Notice:</span> {validationError}
                    </div>
                    <button
                        type="button"
                        onClick={() => setValidationError(null)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Server Upload Error Banner */}
            {uploadError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in duration-150">
                    <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-semibold">Upload Failed:</span> {uploadError}
                    </div>
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        className="text-xs font-bold px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer shrink-0"
                    >
                        Retry Upload
                    </button>
                </div>
            )}

            {/* Staged Upload Success Card */}
            {uploadSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <FileCheck size={22} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-emerald-950">
                                    Resume Uploaded & Stored Successfully
                                </h3>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    File secured in private server storage and registered in MySQL database.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 bg-white hover:bg-emerald-100/50 text-xs font-semibold transition cursor-pointer"
                        >
                            <RotateCcw size={13} />
                            <span>Upload Another</span>
                        </button>
                    </div>

                    <div className="p-4 rounded-xl bg-white/80 border border-emerald-100 text-xs space-y-2">
                        <div className="flex justify-between py-1 border-b border-emerald-100/60">
                            <span className="text-slate-500 font-medium">Resume Record ID:</span>
                            <span className="font-bold text-emerald-800">#{uploadSuccess.resume?.id || uploadSuccess.id || uploadSuccess.resumeId}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-emerald-100/60">
                            <span className="text-slate-500 font-medium">Original File:</span>
                            <span className="font-bold text-slate-800 truncate max-w-xs">{uploadSuccess.originalFilename || uploadSuccess.originalName || selectedFile?.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-emerald-100/60">
                            <span className="text-slate-500 font-medium">File Size:</span>
                            <span className="font-bold text-slate-800">{formatFileSize(uploadSuccess.fileSize || selectedFile?.size)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-slate-500 font-medium">Database Status:</span>
                            <span className="font-semibold text-emerald-700">Stored in MySQL (Status: {uploadSuccess.status || "uploaded"}) • Ready for AI Analysis</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid: Dropzone/Card (Left 2 cols) & Instructions (Right 1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Area: Dropzone & Selected File Details */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedFile ? (
                        <div className="space-y-4">
                            <SelectedFileCard
                                file={selectedFile}
                                onRemove={handleRemoveFile}
                                onChangeFile={handleChangeFile}
                                disabled={isUploading}
                            />

                            {/* Hidden file input for "Change" action */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileSelect(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                                tabIndex={-1}
                                aria-hidden="true"
                            />
                        </div>
                    ) : (
                        <ResumeDropzone
                            onFileSelect={handleFileSelect}
                            fileInputRef={fileInputRef}
                            disabled={isUploading}
                        />
                    )}

                    {/* Action Footer */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Info size={16} className="text-slate-400 shrink-0" />
                            <span>
                                {isUploading
                                    ? "Streaming document to secure storage..."
                                    : uploadSuccess
                                    ? "Resume file uploaded to server"
                                    : selectedFile
                                    ? "Document verified and ready for transmission"
                                    : "Select a PDF or DOCX file to enable upload"}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={!selectedFile || isUploading || Boolean(uploadSuccess)}
                            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all ${
                                selectedFile && !isUploading && !uploadSuccess
                                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer hover:shadow-md"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                            }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Uploading Resume...</span>
                                </>
                            ) : uploadSuccess ? (
                                <>
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span>Upload Complete</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span>Upload & Stage Resume</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Area: Instructions & Best Practices */}
                <div className="lg:col-span-1">
                    <UploadInstructions />
                </div>
            </div>
        </div>
    );
};

export default UploadResume;

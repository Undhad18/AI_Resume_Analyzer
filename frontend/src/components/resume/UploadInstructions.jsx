import {
    FileCheck2,
    Shield,
    CheckCircle
} from "lucide-react";
import { MAX_FILE_SIZE_MB } from "../../utils/resumeValidation";

/**
 * UploadInstructions Component
 * Side panel providing format guidelines and upload instructions
 */
const UploadInstructions = () => {
    const guidelines = [
        {
            title: "Supported File Formats",
            description: "Upload your resume in PDF (.pdf) or Microsoft Word (.docx) format."
        },
        {
            title: `Maximum Size: ${MAX_FILE_SIZE_MB} MB`,
            description: "Keep file size under 5 MB to ensure fast parsing and low latency."
        },
        {
            title: "Selectable Text",
            description: "For accurate ATS scoring, use text-based resumes rather than image-only scans."
        },
        {
            title: "Privacy & Data Isolation",
            description: "Your document is strictly scoped to your authenticated account and processed privately."
        }
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 size={18} className="text-blue-600" />
                    <span>Upload Guidelines</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Follow these standards for optimal parsing and feedback
                </p>
            </div>

            <div className="space-y-4">
                {guidelines.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle size={13} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-800">
                                {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Security note based on verified architecture */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2.5">
                <Shield size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    Uploaded resumes are stored securely and protected with strict user-tenant isolation.
                </p>
            </div>
        </div>
    );
};

export default UploadInstructions;

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Zap,
  Target,
  FileText,
  Edit3,
  Columns,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import {
  enhanceResume,
  getEnhancementDraft,
  updateEnhancementDraft,
  approveEnhancementDraft,
  discardEnhancementDraft
} from "../../services/resumeService";
import EnhancementModeSelector from "./EnhancementModeSelector";
import EnhancementScopeSelector from "./EnhancementScopeSelector";
import ResumeComparison from "./ResumeComparison";
import EnhancedSectionEditor from "./EnhancedSectionEditor";
import EnhancedResumePreview from "./EnhancedResumePreview";
import EnhancementActions from "./EnhancementActions";

export const ResumeEnhancement = ({ resumeId }) => {
  const [mode, setMode] = useState("free");
  const [scope, setScope] = useState("full_resume");
  const [section, setSection] = useState("professionalSummary");
  const [targetJobDescription, setTargetJobDescription] = useState("");
  const [activeView, setActiveView] = useState("comparison"); // "comparison" | "edit" | "preview"

  const [draft, setDraft] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const fetchDraft = useCallback(async () => {
    if (!resumeId) return;
    try {
      setIsLoading(true);
      setErrorNotice(null);
      const res = await getEnhancementDraft(resumeId);
      if (res?.data) {
        setDraft(res.data);
      } else {
        setDraft(null);
      }
    } catch {
      // Expected when no draft exists initially
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setErrorNotice(null);
      setSuccessNotice(null);
      const res = await enhanceResume(resumeId, {
        mode,
        scope,
        section: scope === "single_section" ? section : undefined,
        targetJobDescription
      });

      if (res?.data) {
        setDraft(res.data);
        setHasUnsavedEdits(false);
        setSuccessNotice("Resume enhancement draft generated successfully!");
      }
    } catch (err) {
      setErrorNotice(err?.response?.data?.message || err?.message || "Enhancement failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionSave = (sectionName, updatedValue) => {
    if (!draft) return;
    const newEnhanced = {
      ...draft.enhancedContent,
      [sectionName]: updatedValue
    };
    setDraft({
      ...draft,
      enhancedContent: newEnhanced
    });
    setHasUnsavedEdits(true);
  };

  const handleSaveDraftEdits = async () => {
    if (!draft || !draft.draftId) return;
    try {
      setIsSaving(true);
      setErrorNotice(null);
      const res = await updateEnhancementDraft(resumeId, draft.draftId, {
        enhancedContent: draft.enhancedContent,
        changesSummary: draft.changesSummary
      });

      if (res?.data) {
        setDraft(res.data);
        setHasUnsavedEdits(false);
        setSuccessNotice("Draft changes saved successfully.");
      }
    } catch (err) {
      setErrorNotice(err?.response?.data?.message || err?.message || "Failed to save draft edits.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!draft || !draft.draftId) return;
    try {
      setIsApproving(true);
      setErrorNotice(null);
      const res = await approveEnhancementDraft(resumeId, draft.draftId);
      if (res?.data) {
        setDraft({
          ...draft,
          status: "approved"
        });
        setSuccessNotice("Enhanced resume approved and recorded as a new improved version in version history!");
      }
    } catch (err) {
      setErrorNotice(err?.response?.data?.message || err?.message || "Failed to approve draft.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDiscard = async () => {
    if (!draft || !draft.draftId) return;
    try {
      setIsDiscarding(true);
      setErrorNotice(null);
      const res = await discardEnhancementDraft(resumeId, draft.draftId);
      if (res?.data) {
        setDraft({
          ...draft,
          status: "discarded"
        });
        setSuccessNotice("Enhancement draft discarded.");
      }
    } catch (err) {
      setErrorNotice(err?.response?.data?.message || err?.message || "Failed to discard draft.");
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Configuration Controls: Mode + Scope */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancementModeSelector
          mode={mode}
          onChange={setMode}
          disabled={isLoading}
        />
        <EnhancementScopeSelector
          scope={scope}
          section={section}
          onScopeChange={setScope}
          onSectionChange={setSection}
          disabled={isLoading}
        />
      </div>

      {/* Target Job Description Card */}
      <div className="bg-[#3e4856] border border-slate-600/40 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-bold text-slate-200">
            Target Job Description (Optional Alignment)
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Strictly preserves facts; tailors action verbs & emphasis
          </span>
        </div>

        <textarea
          rows={3}
          value={targetJobDescription}
          onChange={(e) => setTargetJobDescription(e.target.value)}
          placeholder="Paste target job requirements or description to align phrasing and keyword relevance without adding unverified claims..."
          className="w-full text-xs p-3.5 rounded-xl border border-slate-800 bg-[#0b1329] text-slate-200 placeholder-slate-500 focus:bg-[#0b1329] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition leading-relaxed"
        />
      </div>

      {/* Primary Action Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#131d33] border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm sm:text-base font-bold text-white">
            Generate Polished Resume Enhancement
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            100% Fact-Preserving Rewriting: Never fabricates metrics, numbers, or experiences.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleGenerate}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin text-white" />
              <span>Polishing Resume...</span>
            </>
          ) : (
            <>
              <span className="text-white text-base leading-none">✦</span>
              <span>Run Enhancement</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Alerts */}
      {errorNotice && (
        <div className="p-3.5 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 shadow-2xs">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}
      {successNotice && (
        <div className="p-3.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 shadow-2xs font-medium">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Draft Views */}
      {draft && (
        <div className="space-y-4 pt-1">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveView("comparison")}
              className={`inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl font-bold transition cursor-pointer ${
                activeView === "comparison"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Columns size={13} />
              <span>Side-by-Side Diff</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("edit")}
              className={`inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl font-bold transition cursor-pointer ${
                activeView === "edit"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Edit3 size={13} />
              <span>Candidate Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("preview")}
              className={`inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl font-bold transition cursor-pointer ${
                activeView === "preview"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileText size={13} />
              <span>Clean Document Preview</span>
            </button>
          </div>

          {/* Active View Container */}
          {activeView === "comparison" && (
            <ResumeComparison
              originalContent={draft.originalContent}
              enhancedContent={draft.enhancedContent}
              sectionsDiff={draft.sectionsDiff}
            />
          )}

          {activeView === "edit" && (
            <div className="space-y-3">
              {Object.keys(draft.enhancedContent || {}).map((secKey) => (
                <EnhancedSectionEditor
                  key={secKey}
                  sectionName={secKey}
                  content={draft.enhancedContent[secKey]}
                  onSave={handleSectionSave}
                  disabled={draft.status !== "draft"}
                />
              ))}
            </div>
          )}

          {activeView === "preview" && (
            <EnhancedResumePreview enhancedContent={draft.enhancedContent} />
          )}

          {/* Enhancement Workflow Action Bar */}
          <EnhancementActions
            status={draft.status}
            isSaving={isSaving}
            isApproving={isApproving}
            isDiscarding={isDiscarding}
            hasUnsavedEdits={hasUnsavedEdits}
            onSaveEdits={handleSaveDraftEdits}
            onApprove={handleApprove}
            onDiscard={handleDiscard}
            onRegenerate={handleGenerate}
          />
        </div>
      )}
    </div>
  );
};

export default ResumeEnhancement;

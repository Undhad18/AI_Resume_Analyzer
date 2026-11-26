import { useState, useEffect, useMemo } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import GenerationModeSelector from "./GenerationModeSelector";
import ContentSectionSelector from "./ContentSectionSelector";
import ContentToneSelector from "./ContentToneSelector";
import GeneratedContentPreview from "./GeneratedContentPreview";
import GeneratedContentActions from "./GeneratedContentActions";
import { generateBuilderContent } from "../../services/resumeService";

/**
 * AI Content Generator Modal (Lesson 8.3)
 */
export const AIContentGenerator = ({
  isOpen,
  onClose,
  resumeData,
  initialSection = "professionalSummary",
  initialEntryId = null,
  onAccept
}) => {
  const [mode, setMode] = useState("free"); // 'free' | 'advanced'
  const [section, setSection] = useState(initialSection);
  const [tone, setTone] = useState("professional");
  const [selectedEntryId, setSelectedEntryId] = useState(initialEntryId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [generatedContent, setGeneratedContent] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isUserEdited, setIsUserEdited] = useState(false);
  const [keyChangesMade, setKeyChangesMade] = useState([]);
  const [generationType, setGenerationType] = useState("rule_based");

  // Sync state whenever dialog opens with new initialSection or entry
  useEffect(() => {
    if (isOpen) {
      setSection(initialSection);
      setSelectedEntryId(initialEntryId);
      setError(null);
      setGeneratedContent("");
      setEditedContent("");
      setIsUserEdited(false);
      setKeyChangesMade([]);
    }
  }, [isOpen, initialSection, initialEntryId]);

  // Determine available entries for dynamic sections
  const dynamicEntries = useMemo(() => {
    if (!resumeData) return [];
    switch (section) {
      case "experience":
        return resumeData.experience || [];
      case "project":
        return resumeData.projects || [];
      case "education":
        return resumeData.education || [];
      case "achievement":
        return resumeData.achievements || [];
      default:
        return [];
    }
  }, [resumeData, section]);

  // Keep selectedEntryId valid
  useEffect(() => {
    if (dynamicEntries.length > 0) {
      const exists = dynamicEntries.some((e) => (e.id || "") === selectedEntryId);
      if (!exists) {
        setSelectedEntryId(dynamicEntries[0]?.id || null);
      }
    } else {
      setSelectedEntryId(null);
    }
  }, [dynamicEntries, selectedEntryId]);

  if (!isOpen) return null;

  // Extract payload from resumeData for chosen section
  const preparePayload = () => {
    switch (section) {
      case "professionalSummary":
        return {
          targetRole: resumeData.resumeTitle || "Software Professional",
          experienceLevel: (resumeData.experience || []).length === 0 ? "Fresher" : "Experienced",
          skills: resumeData.skills || [],
          currentSummary: resumeData.professionalSummary || "",
          experience: resumeData.experience || []
        };

      case "experience": {
        const entry = dynamicEntries.find((e) => e.id === selectedEntryId) || dynamicEntries[0] || {};
        return {
          position: entry.position || "",
          company: entry.company || "",
          responsibilities: entry.responsibilities || "",
          achievements: entry.achievements || ""
        };
      }

      case "project": {
        const entry = dynamicEntries.find((e) => e.id === selectedEntryId) || dynamicEntries[0] || {};
        return {
          projectName: entry.title || "",
          technologies: entry.technologies || "",
          description: entry.description || ""
        };
      }

      case "skills":
        return {
          skills: resumeData.skills || []
        };

      case "education": {
        const entry = dynamicEntries.find((e) => e.id === selectedEntryId) || dynamicEntries[0] || {};
        return {
          degree: entry.degree || "",
          institution: entry.institution || "",
          fieldOfStudy: entry.fieldOfStudy || "",
          graduationYear: entry.graduationYear || "",
          grade: entry.grade || "",
          honors: entry.honors || ""
        };
      }

      case "achievement": {
        const entry = dynamicEntries.find((e) => e.id === selectedEntryId) || dynamicEntries[0] || {};
        return {
          title: entry.title || "",
          organization: entry.organization || "",
          date: entry.date || "",
          description: entry.description || ""
        };
      }

      default:
        return {};
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payloadData = preparePayload();
      const response = await generateBuilderContent({
        mode,
        section,
        tone,
        data: payloadData
      });

      const resData = response?.data || response;
      const text = resData?.generatedContent || "";

      setGeneratedContent(text);
      setEditedContent(text);
      setIsUserEdited(false);
      setKeyChangesMade(resData?.keyChangesMade || []);
      setGenerationType(resData?.generationType || (mode === "advanced" ? "ai_generated" : "rule_based"));
    } catch (err) {
      console.error("Content generation error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Content generation failed. Please verify your input or switch to Free Mode.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentEdit = (updatedText) => {
    setEditedContent(updatedText);
    setIsUserEdited(updatedText !== generatedContent);
  };

  const handleAcceptContent = () => {
    if (!editedContent.trim()) return;
    onAccept(section, editedContent, selectedEntryId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                AI & Smart Resume Content Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Module 8.3 • Formulate truthful, high-impact phrasing without fabrication
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span className="font-bold">Generation Notice: </span>
                {error}
                {mode === "advanced" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("free");
                      setError(null);
                    }}
                    className="block font-bold text-purple-700 hover:underline mt-1 cursor-pointer"
                  >
                    Switch to 100% Free Mode (No OpenAI Quota Required)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Engine Mode Selector */}
          <GenerationModeSelector
            mode={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
            disabled={isLoading}
          />

          {/* Section Selector */}
          <ContentSectionSelector
            selectedSection={section}
            onSelectSection={(s) => {
              setSection(s);
              setGeneratedContent("");
              setEditedContent("");
              setError(null);
            }}
            entries={dynamicEntries}
            selectedEntryId={selectedEntryId}
            onSelectEntryId={setSelectedEntryId}
            disabled={isLoading}
          />

          {/* Tone Selector */}
          <ContentToneSelector
            selectedTone={tone}
            onSelectTone={setTone}
            disabled={isLoading}
          />

          {/* Generated Preview & Editor */}
          {editedContent ? (
            <GeneratedContentPreview
              content={editedContent}
              onChangeContent={handleContentEdit}
              mode={mode}
              generationType={generationType}
              isUserEdited={isUserEdited}
              keyChangesMade={keyChangesMade}
              disabled={isLoading}
            />
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
              <Sparkles className="mx-auto text-slate-400" size={24} />
              <p className="text-xs font-semibold text-slate-700">
                Ready to generate tailored content for your {section.replace(/([A-Z])/g, " $1").toLowerCase()}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Uses only the qualifications and notes already entered in your resume builder. Never fabricates claims.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100">
          <GeneratedContentActions
            mode={mode}
            isLoading={isLoading}
            hasGeneratedContent={Boolean(editedContent)}
            onGenerate={handleGenerate}
            onAccept={handleAcceptContent}
            onCancel={onClose}
            canAccept={Boolean(editedContent.trim())}
          />
        </div>
      </div>
    </div>
  );
};

export default AIContentGenerator;

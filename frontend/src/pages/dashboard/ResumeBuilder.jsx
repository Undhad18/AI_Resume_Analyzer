import { useState, useEffect } from "react";
import {
  Wand2,
  Save,
  RotateCcw,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react";

import { useResumeForm } from "../../hooks/useResumeForm";
import {
  INITIAL_RESUME_DATA,
  validatePersonalInfo
} from "../../utils/resumeBuilderValidation";

import PersonalInfoForm from "../../components/builder/PersonalInfoForm";
import SummaryForm from "../../components/builder/SummaryForm";
import SkillsForm from "../../components/builder/SkillsForm";
import ExperienceForm from "../../components/builder/ExperienceForm";
import EducationForm from "../../components/builder/EducationForm";
import ProjectsForm from "../../components/builder/ProjectsForm";
import CertificationsForm from "../../components/builder/CertificationsForm";
import AchievementsForm from "../../components/builder/AchievementsForm";
import ResumePreview from "../../components/builder/ResumePreview";
import AIContentGenerator from "../../components/builder/AIContentGenerator";
import DownloadResumeButton from "../../components/builder/DownloadResumeButton";

const DRAFT_STORAGE_KEY = "ai_resume_builder_draft";

export const ResumeBuilder = () => {
  const {
    resumeData,
    setEntireResume,
    updateResumeTitle,
    setPersonalInfo,
    updateProfessionalSummary,
    addSkill,
    removeSkill,
    editSkill,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperience,
    addEducation,
    updateEducation,
    removeEducation,
    reorderEducation,
    addProject,
    updateProject,
    removeProject,
    reorderProject,
    addCertification,
    updateCertification,
    removeCertification,
    addAchievement,
    updateAchievement,
    removeAchievement,
    resetResume
  } = useResumeForm();

  const [activeTab, setActiveTab] = useState("all"); // For section navigation
  const [mobileView, setMobileView] = useState("editor"); // "editor" | "preview" on small screens
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Active Presentation Template state (Lesson 8.4 - isolated from resumeData)
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  // AI Content Generator state (Lesson 8.3)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorSection, setGeneratorSection] = useState("professionalSummary");
  const [generatorEntryId, setGeneratorEntryId] = useState(null);

  const handleOpenGenerator = (section = "professionalSummary", entryId = null) => {
    setGeneratorSection(section);
    setGeneratorEntryId(entryId);
    setIsGeneratorOpen(true);
  };

  const handleAcceptGeneratedContent = (section, content, targetEntryId) => {
    if (!content || !content.trim()) return;

    switch (section) {
      case "professionalSummary":
        updateProfessionalSummary(content.trim());
        break;

      case "experience":
        if (targetEntryId) {
          updateExperience(targetEntryId, "responsibilities", content.trim());
        } else if (resumeData.experience.length > 0) {
          updateExperience(resumeData.experience[0].id, "responsibilities", content.trim());
        }
        break;

      case "project":
        if (targetEntryId) {
          updateProject(targetEntryId, "description", content.trim());
        } else if (resumeData.projects.length > 0) {
          updateProject(resumeData.projects[0].id, "description", content.trim());
        }
        break;

      case "skills": {
        const rawItems = content
          .split(/[\n,•]+/)
          .map((s) => s.replace(/^[-*•\s]+/, "").trim())
          .filter((s) => s.length > 1 && !s.includes(":"));
        if (rawItems.length > 0) {
          rawItems.forEach((skill) => addSkill(skill));
        }
        break;
      }

      case "education":
        if (targetEntryId) {
          updateEducation(targetEntryId, "description", content.trim());
        } else if (resumeData.education.length > 0) {
          updateEducation(resumeData.education[0].id, "description", content.trim());
        }
        break;

      case "achievement":
        if (targetEntryId) {
          updateAchievement(targetEntryId, "description", content.trim());
        } else if (resumeData.achievements.length > 0) {
          updateAchievement(resumeData.achievements[0].id, "description", content.trim());
        }
        break;

      default:
        break;
    }

    setSaveStatus({
      type: "success",
      message: `Tailored content applied to ${section.replace(/([A-Z])/g, " $1").toLowerCase()} and synchronized with live preview.`
    });
  };

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setEntireResume(parsed);
        }
      }
    } catch {
      // Fallback
    }
  }, [setEntireResume]);

  // Auto-clear notice after 4 seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handlePersonalInfoChange = (personalInfo) => {
    setPersonalInfo(personalInfo);
    if (Object.keys(validationErrors).length > 0) {
      const val = validatePersonalInfo(personalInfo);
      setValidationErrors(val.errors);
    }
  };

  const handleSaveDraft = () => {
    const val = validatePersonalInfo(resumeData.personalInfo);
    if (!val.isValid) {
      setValidationErrors(val.errors);
      setSaveStatus({
        type: "error",
        message: "Please correct the required fields in Personal Information before saving."
      });
      return;
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(resumeData));
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSaveStatus({
        type: "success",
        message: `Draft saved locally at ${now}. (UI ready; full backend cloud sync scheduled for Module 8.4).`
      });
    } catch {
      setSaveStatus({
        type: "error",
        message: "Failed to save draft to browser storage."
      });
    }
  };

  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset the form? All unsaved inputs will be cleared.")) {
      resetResume(INITIAL_RESUME_DATA);
      setValidationErrors({});
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSaveStatus({
        type: "info",
        message: "Resume form reset to default template."
      });
    }
  };

  const sectionTabs = [
    { id: "all", label: "All Sections" },
    { id: "personal", label: "Personal Info" },
    { id: "summary", label: "Summary" },
    { id: "skills", label: `Skills (${resumeData.skills.length})` },
    { id: "experience", label: `Experience (${resumeData.experience.length})` },
    { id: "education", label: `Education (${resumeData.education.length})` },
    { id: "projects", label: `Projects (${resumeData.projects.length})` },
    { id: "certifications", label: `Certifications (${resumeData.certifications.length})` },
    { id: "achievements", label: `Achievements (${resumeData.achievements.length})` }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Wand2 size={12} />
              <span>Resume Builder • Module 8.5</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles size={11} />
              <span>4 Templates & Enhanced PDF Download</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={resumeData.resumeTitle || ""}
              onChange={(e) => updateResumeTitle(e.target.value)}
              placeholder="e.g. Full Stack Developer Resume"
              className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition py-0.5 max-w-md truncate"
              title="Click to rename resume title"
            />
          </div>
          <p className="text-xs text-slate-500">
            Add multiple positions, degrees, projects, and certifications with instant reordering and live preview.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Mobile view toggle (hidden on lg screens) */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mobileView === "editor"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 size={13} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mobileView === "preview"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenGenerator("professionalSummary")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-xs transition cursor-pointer"
            title="Open AI Content Generator (Free Mode & Advanced AI)"
          >
            <Sparkles size={13} />
            <span>AI Generator</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Reset form fields"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition cursor-pointer"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          <DownloadResumeButton
            resumeData={resumeData}
            selectedTemplate={selectedTemplate}
          />
        </div>
      </div>

      {/* Save / Feedback Status Notice */}
      {saveStatus && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
            saveStatus.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : saveStatus.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {saveStatus.type === "success" ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : saveStatus.type === "error" ? (
            <AlertCircle size={15} className="text-red-600 shrink-0" />
          ) : (
            <Info size={15} className="text-blue-600 shrink-0" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {/* Section Quick Jump Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Editing Forms */}
        <div
          className={`lg:col-span-6 space-y-5 ${
            mobileView === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {(activeTab === "all" || activeTab === "personal") && (
            <PersonalInfoForm
              data={resumeData.personalInfo}
              onChange={handlePersonalInfoChange}
              errors={validationErrors}
            />
          )}

          {(activeTab === "all" || activeTab === "summary") && (
            <SummaryForm
              value={resumeData.professionalSummary}
              onChange={updateProfessionalSummary}
              onOpenGenerator={handleOpenGenerator}
            />
          )}

          {(activeTab === "all" || activeTab === "skills") && (
            <SkillsForm
              skills={resumeData.skills}
              onAdd={addSkill}
              onRemove={removeSkill}
              onEdit={editSkill}
              onOpenGenerator={handleOpenGenerator}
            />
          )}

          {(activeTab === "all" || activeTab === "experience") && (
            <ExperienceForm
              experience={resumeData.experience}
              onAdd={() => addExperience()}
              onUpdate={updateExperience}
              onDelete={removeExperience}
              onReorder={reorderExperience}
              onOpenGenerator={handleOpenGenerator}
            />
          )}

          {(activeTab === "all" || activeTab === "education") && (
            <EducationForm
              education={resumeData.education}
              onAdd={() => addEducation()}
              onUpdate={updateEducation}
              onDelete={removeEducation}
              onReorder={reorderEducation}
              onOpenGenerator={handleOpenGenerator}
            />
          )}

          {(activeTab === "all" || activeTab === "projects") && (
            <ProjectsForm
              projects={resumeData.projects}
              onAdd={() => addProject()}
              onUpdate={updateProject}
              onDelete={removeProject}
              onReorder={reorderProject}
              onOpenGenerator={handleOpenGenerator}
            />
          )}

          {(activeTab === "all" || activeTab === "certifications") && (
            <CertificationsForm
              certifications={resumeData.certifications}
              onAdd={() => addCertification()}
              onUpdate={updateCertification}
              onDelete={removeCertification}
            />
          )}

          {(activeTab === "all" || activeTab === "achievements") && (
            <AchievementsForm
              achievements={resumeData.achievements}
              onAdd={() => addAchievement()}
              onUpdate={updateAchievement}
              onDelete={removeAchievement}
              onOpenGenerator={handleOpenGenerator}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Live Resume Preview */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-6 space-y-3 ${
            mobileView === "editor" ? "hidden lg:block" : "block"
          }`}
        >
          <ResumePreview
            resumeData={resumeData}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        </div>
      </div>

      {/* AI & Smart Content Generator Modal */}
      <AIContentGenerator
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        resumeData={resumeData}
        initialSection={generatorSection}
        initialEntryId={generatorEntryId}
        onAccept={handleAcceptGeneratedContent}
      />
    </div>
  );
};

export default ResumeBuilder;

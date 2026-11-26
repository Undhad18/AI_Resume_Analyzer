import { useState, useCallback } from "react";
import {
  INITIAL_RESUME_DATA,
  createEmptyExperience,
  createEmptyEducation,
  createEmptyProject,
  createEmptyCertification,
  createEmptyAchievement
} from "../utils/resumeBuilderValidation";

/**
 * Custom React Hook: Central State Management for Resume Builder (Lesson 8.2)
 * Enforces immutable updates, stable unique keys, and single-source-of-truth state.
 */
export const useResumeForm = (initialState = null) => {
  const [resumeData, setResumeData] = useState(() => {
    if (initialState) return initialState;
    return INITIAL_RESUME_DATA;
  });

  // Reorder utility
  const reorderArray = (list, fromIndex, toIndex) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
      return list;
    }
    const result = Array.from(list);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  };

  // Resume Title
  const updateResumeTitle = useCallback((resumeTitle) => {
    setResumeData((prev) => ({ ...prev, resumeTitle }));
  }, []);

  // Personal Info
  const updatePersonalInfo = useCallback((field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  }, []);

  const setPersonalInfo = useCallback((personalInfo) => {
    setResumeData((prev) => ({ ...prev, personalInfo }));
  }, []);

  // Summary
  const updateProfessionalSummary = useCallback((professionalSummary) => {
    setResumeData((prev) => ({ ...prev, professionalSummary }));
  }, []);

  // Skills
  const addSkill = useCallback((skillName) => {
    if (!skillName || typeof skillName !== "string") return false;
    const trimmed = skillName.trim();
    if (!trimmed) return false;

    let wasAdded = false;
    setResumeData((prev) => {
      const isDuplicate = prev.skills.some(
        (s) => (typeof s === "string" ? s : s.name || "").toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) return prev;
      wasAdded = true;
      return {
        ...prev,
        skills: [...prev.skills, trimmed]
      };
    });
    return wasAdded;
  }, []);

  const removeSkill = useCallback((indexToRemove) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove)
    }));
  }, []);

  const editSkill = useCallback((index, newSkillName) => {
    const trimmed = (newSkillName || "").trim();
    if (!trimmed) return;
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.map((s, idx) => (idx === index ? trimmed : s))
    }));
  }, []);

  // Work Experience
  const addExperience = useCallback((customData = {}) => {
    const newEntry = { ...createEmptyExperience(), ...customData };
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newEntry]
    }));
    return newEntry.id;
  }, []);

  const updateExperience = useCallback((id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "currentlyWorking" && value === true) {
          updated.endDate = "";
        }
        return updated;
      })
    }));
  }, []);

  const removeExperience = useCallback((id) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((item) => item.id !== id)
    }));
  }, []);

  const reorderExperience = useCallback((fromIndex, toIndex) => {
    setResumeData((prev) => ({
      ...prev,
      experience: reorderArray(prev.experience, fromIndex, toIndex)
    }));
  }, []);

  // Education
  const addEducation = useCallback((customData = {}) => {
    const newEntry = { ...createEmptyEducation(), ...customData };
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEntry]
    }));
    return newEntry.id;
  }, []);

  const updateEducation = useCallback((id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    }));
  }, []);

  const removeEducation = useCallback((id) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((item) => item.id !== id)
    }));
  }, []);

  const reorderEducation = useCallback((fromIndex, toIndex) => {
    setResumeData((prev) => ({
      ...prev,
      education: reorderArray(prev.education, fromIndex, toIndex)
    }));
  }, []);

  // Projects
  const addProject = useCallback((customData = {}) => {
    const newEntry = { ...createEmptyProject(), ...customData };
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, newEntry]
    }));
    return newEntry.id;
  }, []);

  const updateProject = useCallback((id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Sync name and projectName for backward compatibility
        if (field === "name") updated.projectName = value;
        if (field === "projectName") updated.name = value;
        return updated;
      })
    }));
  }, []);

  const removeProject = useCallback((id) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((item) => item.id !== id)
    }));
  }, []);

  const reorderProject = useCallback((fromIndex, toIndex) => {
    setResumeData((prev) => ({
      ...prev,
      projects: reorderArray(prev.projects, fromIndex, toIndex)
    }));
  }, []);

  // Certifications
  const addCertification = useCallback((customData = {}) => {
    const newEntry = { ...createEmptyCertification(), ...customData };
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, newEntry]
    }));
    return newEntry.id;
  }, []);

  const updateCertification = useCallback((id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // Sync certificationName and name, and issuingOrganization and issuer
        if (field === "name") updated.certificationName = value;
        if (field === "certificationName") updated.name = value;
        if (field === "issuer") updated.issuingOrganization = value;
        if (field === "issuingOrganization") updated.issuer = value;
        return updated;
      })
    }));
  }, []);

  const removeCertification = useCallback((id) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((item) => item.id !== id)
    }));
  }, []);

  // Achievements
  const addAchievement = useCallback((customData = {}) => {
    const newEntry = { ...createEmptyAchievement(), ...customData };
    setResumeData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, newEntry]
    }));
    return newEntry.id;
  }, []);

  const updateAchievement = useCallback((id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      achievements: prev.achievements.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    }));
  }, []);

  const removeAchievement = useCallback((id) => {
    setResumeData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((item) => item.id !== id)
    }));
  }, []);

  // Reset and batch setters
  const resetResume = useCallback((template = null) => {
    setResumeData(template || INITIAL_RESUME_DATA);
  }, []);

  const setEntireResume = useCallback((data) => {
    if (data && typeof data === "object") {
      setResumeData(data);
    }
  }, []);

  return {
    resumeData,
    setEntireResume,
    updateResumeTitle,
    updatePersonalInfo,
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
  };
};

export default useResumeForm;

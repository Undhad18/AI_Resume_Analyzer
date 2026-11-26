/**
 * Missing Keyword Detection Service (Lesson 9.3)
 * Extracts meaningful technical keywords, skills, and qualifications from the target JD,
 * cross-references them against all resume sections, normalizes aliases,
 * classifies them as matched / partially_matched / not_detected,
 * and attaches ethical, non-fabricating advice.
 */

import {
  SKILL_DICTIONARY,
  normalizeSkillName,
  buildSkillRegex
} from "./skillNormalizationService.js";

/**
 * Standard missing keyword ethical advisory notice
 */
export const MISSING_KEYWORD_SAFE_ADVICE =
  "If you genuinely have this skill or experience, consider adding relevant evidence to your resume.";

/**
 * Extract distinct keywords and domain terms from target job description
 */
export const extractKeywordsFromJd = (jdText = "", jdRequirements = null) => {
  if (!jdText || typeof jdText !== "string") {
    return [];
  }

  const keywordsMap = new Map();

  // 1. Dictionary-backed Technical Skills & Tools Matching
  for (const [key, meta] of Object.entries(SKILL_DICTIONARY)) {
    let matched = buildSkillRegex(key).test(jdText);
    if (!matched && Array.isArray(meta.aliases)) {
      for (const alias of meta.aliases) {
        if (buildSkillRegex(alias).test(jdText)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      keywordsMap.set(meta.normalized.toLowerCase(), {
        keyword: meta.normalized,
        category: meta.category || "skills",
        importance: "required",
        source: "Job Description Technical Requirements"
      });
    }
  }

  // 2. Requirements-derived keywords from Lesson 9.2 parser
  if (jdRequirements) {
    if (Array.isArray(jdRequirements.skills)) {
      for (const item of jdRequirements.skills) {
        const norm = normalizeSkillName(item.requirement);
        const mapKey = norm.toLowerCase();
        if (!keywordsMap.has(mapKey)) {
          keywordsMap.set(mapKey, {
            keyword: norm,
            category: "skills",
            importance: item.category || "required",
            source: item.requirement
          });
        }
      }
    }

    if (Array.isArray(jdRequirements.certifications)) {
      for (const item of jdRequirements.certifications) {
        const clean = item.requirement.trim();
        if (clean.length > 2) {
          const mapKey = clean.toLowerCase();
          if (!keywordsMap.has(mapKey)) {
            keywordsMap.set(mapKey, {
              keyword: clean,
              category: "certifications",
              importance: item.category || "required",
              source: clean
            });
          }
        }
      }
    }
  }

  return Array.from(keywordsMap.values());
};

/**
 * Compares extracted JD keywords against all structured resume sections.
 * Returns { matched: [], partiallyMatched: [], notDetected: [] }
 */
export const detectMissingKeywords = (jdKeywords = [], structuredResume = {}) => {
  const matched = [];
  const partiallyMatched = [];
  const notDetected = [];

  if (!Array.isArray(jdKeywords) || jdKeywords.length === 0) {
    return { matched, partiallyMatched, notDetected };
  }

  // Prepare searchable textual representations of each resume section
  const skillsList = (structuredResume.skills || []).map((s) =>
    typeof s === "string" ? s : s?.name || s?.skill || ""
  );
  const skillsText = skillsList.join(" ").toLowerCase();

  const summaryText = [
    structuredResume.personalInfo?.summary,
    structuredResume.personalInfo?.headline,
    structuredResume.professionalSummary,
    structuredResume.summary
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const experienceText = (structuredResume.workExperience || structuredResume.experience || [])
    .map((e) =>
      [
        e.jobTitle || e.title,
        e.company || e.employer,
        e.description,
        Array.isArray(e.responsibilities) ? e.responsibilities.join(" ") : "",
        Array.isArray(e.technologies) ? e.technologies.join(" ") : ""
      ].join(" ")
    )
    .join(" ")
    .toLowerCase();

  const projectsText = (structuredResume.projects || [])
    .map((p) =>
      [
        p.name || p.title,
        p.description,
        Array.isArray(p.technologies) ? p.technologies.join(" ") : ""
      ].join(" ")
    )
    .join(" ")
    .toLowerCase();

  const educationText = (structuredResume.education || [])
    .map((ed) => [ed.degree, ed.fieldOfStudy || ed.field, ed.institution || ed.school].join(" "))
    .join(" ")
    .toLowerCase();

  const certificationsText = (structuredResume.certifications || [])
    .map((c) => (typeof c === "string" ? c : c?.name || c?.title || ""))
    .join(" ")
    .toLowerCase();

  const achievementsText = (structuredResume.achievements || [])
    .map((a) => (typeof a === "string" ? a : a?.title || a?.description || ""))
    .join(" ")
    .toLowerCase();

  const allResumeText = [
    skillsText,
    summaryText,
    experienceText,
    projectsText,
    educationText,
    certificationsText,
    achievementsText
  ].join(" ");

  for (const item of jdKeywords) {
    const keyword = item.keyword;
    const lowerKey = keyword.toLowerCase();

    // Check dictionary metadata for aliases and category
    const dictMeta = SKILL_DICTIONARY[lowerKey];
    const testMatchInText = (text) => {
      if (!text) return false;
      if (buildSkillRegex(lowerKey).test(text)) return true;
      if (dictMeta && Array.isArray(dictMeta.aliases)) {
        for (const alias of dictMeta.aliases) {
          if (buildSkillRegex(alias).test(text)) return true;
        }
      }
      return false;
    };

    let matchStatus = "not_detected";
    let sourceSection = "none";
    let evidence = "";

    // Priority 1: Explicit Skills Section
    if (testMatchInText(skillsText)) {
      matchStatus = "matched";
      sourceSection = "skills";
      evidence = `Listed explicitly in skills section.`;
    }
    // Priority 2: Work Experience
    else if (testMatchInText(experienceText)) {
      matchStatus = "matched";
      sourceSection = "experience";
      evidence = `Demonstrated in work experience.`;
    }
    // Priority 3: Projects
    else if (testMatchInText(projectsText)) {
      matchStatus = "matched";
      sourceSection = "projects";
      evidence = `Applied in technical project descriptions.`;
    }
    // Priority 4: Summary / Headline
    else if (testMatchInText(summaryText)) {
      matchStatus = "matched";
      sourceSection = "summary";
      evidence = `Mentioned in candidate professional summary.`;
    }
    // Priority 5: Certifications
    else if (testMatchInText(certificationsText)) {
      matchStatus = "matched";
      sourceSection = "certifications";
      evidence = `Validated in candidate certifications.`;
    }
    // Priority 6: Education
    else if (testMatchInText(educationText)) {
      matchStatus = "matched";
      sourceSection = "education";
      evidence = `Referenced in academic coursework or degree.`;
    }
    // Priority 7: Achievements
    else if (testMatchInText(achievementsText)) {
      matchStatus = "matched";
      sourceSection = "achievements";
      evidence = `Referenced in key achievements.`;
    }
    // Check partial / related technology match
    else {
      // Avoid false partial matches like Java matching JavaScript
      if (lowerKey === "java" && /\bjavascript\b/i.test(allResumeText) && !/\bjava\b(?!\s*script)/i.test(allResumeText)) {
        matchStatus = "not_detected";
      } else if (lowerKey === "c" && /\b(c\+\+|c#)\b/i.test(allResumeText) && !/\bc\b(?!\s*[\+#])/i.test(allResumeText)) {
        matchStatus = "not_detected";
      } else {
        // Check related tech partial match (e.g., React vs Next.js, Node.js vs Express.js)
        if (dictMeta?.category === "frontend" && /\b(react|vue|angular|frontend)\b/i.test(allResumeText)) {
          matchStatus = "partially_matched";
          sourceSection = "skills";
          evidence = `Related frontend framework demonstrated in resume.`;
        } else if (dictMeta?.category === "backend" && /\b(node|express|api|backend)\b/i.test(allResumeText)) {
          matchStatus = "partially_matched";
          sourceSection = "skills";
          evidence = `Related backend service experience found.`;
        } else if (dictMeta?.category === "database" && /\b(sql|database|db)\b/i.test(allResumeText)) {
          matchStatus = "partially_matched";
          sourceSection = "skills";
          evidence = `Database experience demonstrated.`;
        } else if (dictMeta?.category === "cloud" && /\b(cloud|aws|azure|gcp)\b/i.test(allResumeText)) {
          matchStatus = "partially_matched";
          sourceSection = "skills";
          evidence = `Cloud platform experience demonstrated.`;
        }
      }
    }

    const keywordRecord = {
      keyword,
      category: dictMeta?.category || item.category || "skills",
      status: matchStatus,
      sourceSection: sourceSection !== "none" ? sourceSection : undefined,
      evidence: evidence || undefined,
      importance: item.importance || "required"
    };

    if (matchStatus === "matched") {
      matched.push(keywordRecord);
    } else if (matchStatus === "partially_matched") {
      partiallyMatched.push(keywordRecord);
    } else {
      keywordRecord.suggestedAction = MISSING_KEYWORD_SAFE_ADVICE;
      notDetected.push(keywordRecord);
    }
  }

  return {
    matched,
    partiallyMatched,
    notDetected
  };
};

export default {
  MISSING_KEYWORD_SAFE_ADVICE,
  extractKeywordsFromJd,
  detectMissingKeywords
};

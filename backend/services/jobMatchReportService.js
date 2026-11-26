/**
 * Job Match Report Service (Lesson 9.3)
 * Orchestrates scoring, missing keyword analysis, insights generation,
 * validation against Zod schemas, and persistence into MySQL database.
 */

import db from "../config/db.js";
import { calculateJobMatchScores } from "./jobMatchScoringService.js";
import { extractKeywordsFromJd, detectMissingKeywords } from "./missingKeywordService.js";
import { jobMatchReportSchema } from "../validators/jobMatchingSchema.js";
import { JobMatchingError } from "./resumeJobMatchingService.js";

/**
 * Generate evidence-based strengths from matching and keyword results
 */
export const generateReportStrengths = ({ matchingDetails = {}, keywords = {} }) => {
  const strengths = [];

  // 1. Core Technical Skills demonstrated
  const matchedSkills = (keywords.matched || []).filter((k) => k.category !== "certifications");
  if (matchedSkills.length > 0) {
    const topSkills = matchedSkills.slice(0, 4).map((s) => s.keyword).join(", ");
    strengths.push({
      title: "Demonstrated Core Technical Skills",
      description: `Resume provides direct evidence for required skills: ${topSkills}.`,
      category: "skills",
      evidence: matchedSkills[0].evidence || "Demonstrated in resume content."
    });
  }

  // 2. Project Alignment
  const matchedProjects = (matchingDetails.projects || []).filter((p) => p.status === "matched");
  if (matchedProjects.length > 0) {
    strengths.push({
      title: "Strong Project Evidence",
      description: `Candidate projects showcase relevant technologies and domain alignment.`,
      category: "projects",
      evidence: matchedProjects[0].evidence?.[0]?.text || "Demonstrated in technical projects."
    });
  }

  // 3. Experience Match
  const matchedExp = (matchingDetails.experience || []).filter((e) => e.status === "matched");
  if (matchedExp.length > 0) {
    strengths.push({
      title: "Relevant Professional Experience",
      description: `Documented work history demonstrates target job requirements.`,
      category: "experience",
      evidence: matchedExp[0].evidence?.[0]?.text || "Demonstrated in work experience."
    });
  }

  // 4. Education Alignment
  const matchedEdu = (matchingDetails.education || []).filter((ed) => ed.status === "matched");
  if (matchedEdu.length > 0) {
    strengths.push({
      title: "Educational Qualification Match",
      description: `Academic background satisfies the qualifications requested in the job description.`,
      category: "education",
      evidence: matchedEdu[0].evidence?.[0]?.text || "Verified in education section."
    });
  }

  // Default fallback if no explicit items matched
  if (strengths.length === 0) {
    strengths.push({
      title: "Candidate Profile Captured",
      description: "Candidate qualifications successfully extracted and evaluated against target job description.",
      category: "general",
      evidence: "Resume structure evaluated."
    });
  }

  return strengths;
};

/**
 * Generate actionable, ethical improvement areas from missing and partial items
 */
export const generateReportImprovementAreas = ({ matchingDetails = {}, keywords = {} }) => {
  const improvements = [];

  // 1. Missing Required Technical Keywords
  const missingRequired = (keywords.notDetected || []).filter((k) => k.importance === "required");
  if (missingRequired.length > 0) {
    const list = missingRequired.slice(0, 3).map((k) => k.keyword).join(", ");
    improvements.push({
      title: `Undetected Technical Requirements: ${list}`,
      description: `These required skills were not detected in the resume text.`,
      category: "skills",
      suggestedAction: "If you genuinely have this skill or experience, consider adding relevant evidence to your resume."
    });
  }

  // 2. Partially Demonstrated Responsibilities
  const partialResp = (matchingDetails.responsibilities || []).filter((r) => r.status === "partially_matched");
  if (partialResp.length > 0) {
    improvements.push({
      title: "Clarify Key Job Responsibilities",
      description: `Some job responsibilities are only partially demonstrated in your documented achievements.`,
      category: "responsibilities",
      suggestedAction: "Consider highlighting specific project contributions that demonstrate direct ownership of these tasks."
    });
  }

  // 3. Certifications Not Detected
  const missingCerts = (matchingDetails.certifications || []).filter((c) => c.status === "not_detected");
  if (missingCerts.length > 0) {
    improvements.push({
      title: "Target Certifications Not Evidenced",
      description: `The job description specifies certifications that were not identified in your resume.`,
      category: "certifications",
      suggestedAction: "If you have earned these or equivalent certifications, clearly list them in your Certifications section."
    });
  }

  // Default fallback
  if (improvements.length === 0) {
    improvements.push({
      title: "Resume Phrasing Alignment",
      description: "All core job criteria are evidenced; fine-tune action verbs to emphasize quantifiable project impact.",
      category: "general",
      suggestedAction: "Review bullet points for measurable outcomes and technical depth."
    });
  }

  return improvements;
};

/**
 * Generate complete Job Match Report from matchingDetails and JD
 */
export const generateJobMatchReport = async ({
  matchId,
  userId,
  matchingDetails = {},
  structuredResume = {},
  jobDescriptionText = "",
  jdRequirements = null,
  analysisLimitations = []
}) => {
  // 1. Transparent category scoring and weight normalization
  const scoringResult = calculateJobMatchScores(matchingDetails);

  // 2. Extract and detect missing keywords
  const jdKeywords = extractKeywordsFromJd(jobDescriptionText, jdRequirements);
  const keywordsResult = detectMissingKeywords(jdKeywords, structuredResume);

  // 3. Generate evidence-backed strengths and improvement areas
  const strengths = generateReportStrengths({
    matchingDetails,
    keywords: keywordsResult
  });

  const improvementAreas = generateReportImprovementAreas({
    matchingDetails,
    keywords: keywordsResult
  });

  // 4. Construct complete report object
  const report = {
    matchId: Number(matchId),
    status: "completed",
    overallScore: scoringResult.overallScore,
    scoreLabel: scoringResult.scoreLabel,
    scoreExplanation: scoringResult.scoreExplanation,
    categoryScores: scoringResult.categoryScores,
    categoryWeights: scoringResult.categoryWeights,
    categoryDetails: scoringResult.categoryDetails,
    keywords: keywordsResult,
    strengths,
    improvementAreas,
    analysisLimitations: Array.isArray(analysisLimitations) ? analysisLimitations : []
  };

  // 5. Validate with Zod schema
  const parsed = jobMatchReportSchema.safeParse(report);
  if (!parsed.success) {
    console.error("Report schema validation errors:", parsed.error.issues);
  }

  const validatedReport = parsed.success ? parsed.data : report;

  // 6. Persist to MySQL database in `job_matches`
  await db.execute(
    `UPDATE job_matches
     SET
       match_score = ?,
       matched_skills = ?,
       missing_skills = ?,
       match_analysis = ?,
       updated_at = NOW()
     WHERE match_id = ?`,
    [
      validatedReport.overallScore,
      JSON.stringify(validatedReport.keywords.matched),
      JSON.stringify(validatedReport.keywords.notDetected),
      JSON.stringify(validatedReport),
      matchId
    ]
  );

  return validatedReport;
};

/**
 * Get or recalculate job match report by matchId for authenticated user
 */
export const getJobMatchReportById = async ({ matchId, userId, recalculate = false }) => {
  const [rows] = await db.execute(
    `SELECT
       jm.match_id,
       jm.user_id,
       jm.resume_id,
       jm.job_id,
       jm.status,
       jm.match_score,
       jm.matched_skills,
       jm.missing_skills,
       jm.match_analysis,
       jm.matching_details,
       jm.error_message,
       jm.created_at,
       jm.updated_at,
       r.user_id AS resume_user_id,
       r.resume_title,
       r.candidate_name,
       jd.job_title,
       jd.company_name,
       jd.job_description,
       jd.location,
       jd.experience_required,
       jd.source_url
     FROM job_matches jm
     INNER JOIN resumes r ON jm.resume_id = r.resume_id
     INNER JOIN job_descriptions jd ON jm.job_id = jd.job_id
     WHERE jm.match_id = ?`,
    [matchId]
  );

  if (!rows.length) {
    throw new JobMatchingError("Matching record not found.", 404, "MATCH_NOT_FOUND");
  }

  const row = rows[0];

  // Multi-tenant authorization check: user must own the record or the resume
  if (row.user_id !== userId && row.resume_user_id !== userId) {
    throw new JobMatchingError("Access denied: You do not own this matching record.", 403, "FORBIDDEN");
  }

  let matchingDetails = {};
  try {
    matchingDetails = typeof row.matching_details === "string" ? JSON.parse(row.matching_details) : row.matching_details || {};
  } catch {
    matchingDetails = {};
  }

  // If already scored and recalculate is false, return cached report
  if (!recalculate && row.match_analysis) {
    try {
      const parsedAnalysis = typeof row.match_analysis === "string" ? JSON.parse(row.match_analysis) : row.match_analysis;
      if (parsedAnalysis && parsedAnalysis.overallScore !== undefined) {
        return {
          ...parsedAnalysis,
          matchId: row.match_id,
          resumeInfo: {
            resumeId: row.resume_id,
            resumeTitle: row.resume_title,
            candidateName: row.candidate_name
          },
          jobInfo: {
            jobId: row.job_id,
            jobTitle: row.job_title,
            companyName: row.company_name,
            location: row.location,
            experienceRequired: row.experience_required,
            sourceUrl: row.source_url
          },
          matchingDetails,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch {
      // Fall through to recalculate
    }
  }

  // Otherwise, compute and persist report
  const report = await generateJobMatchReport({
    matchId: row.match_id,
    userId,
    matchingDetails,
    jobDescriptionText: row.job_description || "",
    analysisLimitations: []
  });

  return {
    ...report,
    resumeInfo: {
      resumeId: row.resume_id,
      resumeTitle: row.resume_title,
      candidateName: row.candidate_name
    },
    jobInfo: {
      jobId: row.job_id,
      jobTitle: row.job_title,
      companyName: row.company_name,
      location: row.location,
      experienceRequired: row.experience_required,
      sourceUrl: row.source_url
    },
    matchingDetails,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export default {
  generateReportStrengths,
  generateReportImprovementAreas,
  generateJobMatchReport,
  getJobMatchReportById
};

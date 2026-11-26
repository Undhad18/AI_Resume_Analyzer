/**
 * Transparent Weighted Job Match Scoring Service (Lesson 9.3)
 * Calculates category scores, dynamic weight normalization for non-applicable categories,
 * overall score, and score interpretations.
 */

export const BASE_CATEGORY_WEIGHTS = {
  skills: 35,
  experience: 25,
  education: 10,
  projects: 15,
  responsibilities: 10,
  certifications: 5
};

export const SCORE_LABELS = {
  EXCELLENT: "Excellent Match",
  VERY_GOOD: "Very Good Match",
  GOOD: "Good Match",
  MODERATE: "Moderate Match",
  LOW: "Low Match",
  VERY_LOW: "Very Low Match"
};

/**
 * Determines qualitative score label from numeric score
 * 90–100: Excellent Match
 * 80–89: Very Good Match
 * 70–79: Good Match
 * 60–69: Moderate Match
 * 40–59: Low Match
 * 0–39: Very Low Match
 */
export const getScoreLabel = (score) => {
  const numericScore = Number(score) || 0;
  if (numericScore >= 90) return SCORE_LABELS.EXCELLENT;
  if (numericScore >= 80) return SCORE_LABELS.VERY_GOOD;
  if (numericScore >= 70) return SCORE_LABELS.GOOD;
  if (numericScore >= 60) return SCORE_LABELS.MODERATE;
  if (numericScore >= 40) return SCORE_LABELS.LOW;
  return SCORE_LABELS.VERY_LOW;
};

/**
 * Calculates raw score for a single category based on matched requirements
 * Requirement importance:
 * - required: 1.0 weight
 * - preferred: 0.6 weight
 * - general: 0.8 weight
 * Match status:
 * - matched: 100% of weight
 * - partially_matched: 50% of weight
 * - not_detected: 0% of weight
 */
export const calculateCategoryScore = (categoryName, requirements = []) => {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return {
      category: categoryName,
      score: 0,
      isApplicable: false,
      totalRequirements: 0,
      matchedCount: 0,
      partiallyMatchedCount: 0,
      notDetectedCount: 0,
      confidence: "insufficient"
    };
  }

  let totalMaxWeight = 0;
  let totalEarned = 0;
  let matchedCount = 0;
  let partiallyMatchedCount = 0;
  let notDetectedCount = 0;

  for (const item of requirements) {
    const importance = (item.category || "required").toLowerCase();
    let itemWeight = 1.0;
    if (importance === "preferred") {
      itemWeight = 0.6;
    } else if (importance === "general") {
      itemWeight = 0.8;
    }

    totalMaxWeight += itemWeight;

    if (item.status === "matched") {
      totalEarned += itemWeight * 1.0;
      matchedCount++;
    } else if (item.status === "partially_matched") {
      totalEarned += itemWeight * 0.5;
      partiallyMatchedCount++;
    } else {
      notDetectedCount++;
    }
  }

  const rawScore = totalMaxWeight > 0 ? (totalEarned / totalMaxWeight) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Assess confidence based on evidence presence
  let confidence = "high";
  if (matchedCount === 0 && partiallyMatchedCount === 0) {
    confidence = "low";
  } else if (matchedCount === 0 && partiallyMatchedCount > 0) {
    confidence = "medium";
  }

  return {
    category: categoryName,
    score,
    isApplicable: true,
    totalRequirements: requirements.length,
    matchedCount,
    partiallyMatchedCount,
    notDetectedCount,
    confidence
  };
};

/**
 * Calculates transparent category scores, normalized weights, and overall score
 * across all 6 requirement categories.
 *
 * Normalization Formula:
 * If some categories are not applicable in the JD:
 * sumApplicableBaseWeights = sum of baseWeights for applicable categories
 * normalizedWeight = (baseWeight / sumApplicableBaseWeights) * 100
 * categoryContribution = (categoryScore / 100) * normalizedWeight
 * overallScore = Math.round(sum of categoryContribution)
 */
export const calculateJobMatchScores = (matchingDetails = {}) => {
  const categories = ["skills", "experience", "education", "projects", "responsibilities", "certifications"];
  const categoryDetails = {};
  const categoryScores = {};
  const categoryWeights = {};

  // Step 1: Calculate raw scores and determine applicability
  let applicableCount = 0;
  let sumApplicableBaseWeight = 0;

  for (const cat of categories) {
    const reqs = matchingDetails[cat] || [];
    const catResult = calculateCategoryScore(cat, reqs);
    const baseWeight = BASE_CATEGORY_WEIGHTS[cat] || 0;

    catResult.baseWeight = baseWeight;

    if (catResult.isApplicable) {
      applicableCount++;
      sumApplicableBaseWeight += baseWeight;
    }

    categoryDetails[cat] = catResult;
  }

  // Step 2: Normalize weights and calculate contribution
  let totalOverallScore = 0;

  for (const cat of categories) {
    const detail = categoryDetails[cat];
    let normalizedWeight = 0;
    let weightedContribution = 0;

    if (detail.isApplicable && sumApplicableBaseWeight > 0) {
      // Normalize weight so applicable categories total 100%
      normalizedWeight = (detail.baseWeight / sumApplicableBaseWeight) * 100;
      // Round normalized weight to 2 decimal places for transparency
      normalizedWeight = Math.round(normalizedWeight * 100) / 100;
      weightedContribution = (detail.score / 100) * normalizedWeight;
      totalOverallScore += weightedContribution;
    }

    detail.normalizedWeight = normalizedWeight;
    detail.weightedContribution = Math.round(weightedContribution * 100) / 100;

    categoryScores[cat] = detail.score;
    categoryWeights[cat] = normalizedWeight;
  }

  // Step 3: Clamp overall score safely between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(totalOverallScore)));
  const scoreLabel = getScoreLabel(finalScore);

  const scoreExplanation =
    "The overall job match score represents an estimated resume-to-job relevance based on textual evidence. " +
    "It is not an official ATS score, and does not guarantee interview selection or hiring.";

  return {
    overallScore: finalScore,
    scoreLabel,
    scoreExplanation,
    categoryScores,
    categoryWeights,
    categoryDetails,
    applicableCategoriesCount: applicableCount,
    isFullyApplicable: applicableCount === categories.length
  };
};

export default {
  BASE_CATEGORY_WEIGHTS,
  SCORE_LABELS,
  getScoreLabel,
  calculateCategoryScore,
  calculateJobMatchScores
};

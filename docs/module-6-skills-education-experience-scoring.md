# Module 6: Resume Scoring System — Lesson 6.3: Skills, Education, and Experience Scoring

## 1. Lesson Objective

Lesson 6.3 extends the **Standalone AI Resume Analyzer** with a deterministic, explainable, and transparent scoring engine specifically focused on the core candidate qualifications:
- **Skills Scoring (Category Weight: 20 Points)**
- **Education Scoring (Category Weight: 10 Points)**
- **Experience Scoring (Category Weight: 20 Points)**
- **Fresher-Friendly Experience Policy**
- **Seamless Integration with Lesson 6.1 (Overall Composite Score of 100 Points)**

The detailed evaluation operates 100% locally in Free Mode (zero OpenAI credits or API keys required) using structured resume extractions, while remaining fully compatible with Advanced AI Analysis.

---

## 2. Skills Scoring Model

### Category Weight & Formula
- **Overall Category Weight**: `20 points`
- **Internal Rating**: `0–100`
- **Calculated Contribution**:
  $$\text{skillsRating} = \sum (\text{parameterRating}_i \times \text{parameterWeight}_i)$$
  $$\text{skillsEarnedPoints} = \frac{\text{skillsRating}}{100} \times 20$$

### 5 Internal Parameters
| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Skills Identification** | **25%** | Detects and normalizes unique technical & soft skills without duplicates (e.g. `reactjs`, `react.js` $\rightarrow$ `React`; `nodejs`, `node` $\rightarrow$ `Node.js`). |
| **Skills Organization** | **15%** | Evaluates grouping across standard technical domains: Programming Languages, Frontend, Backend, Databases, Cloud/DevOps, Tools, and Soft Skills. |
| **Evidence in Projects & Experience** | **30%** | Scans project descriptions and work history for listed skills. Distinguishes **evidence-supported skills** from **listed-only skills**. |
| **Skills Description & Clarity** | **15%** | Verifies concise, professional skill tokens without run-on sentence noise. Only reports proficiency when explicitly documented. |
| **Relevant Skills Coverage** | **15%** | Evaluates foundational software engineering breadth (e.g., languages, storage, version control) without penalizing missing niche tools without a job description. |

---

## 3. Education Scoring Model

### Category Weight & Formula
- **Overall Category Weight**: `10 points`
- **Internal Rating**: `0–100`
- **Calculated Contribution**:
  $$\text{educationEarnedPoints} = \frac{\text{educationRating}}{100} \times 10$$

### 5 Internal Parameters
| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Qualification Details** | **30%** | Detects stated degrees or diplomas (B.Tech, B.S., M.S., Associate, High School, etc.). Evaluated objectively across formats. |
| **Institution Information** | **20%** | Validates the presence of an educational institution, college, or university. **Zero prestige bias** or institutional discrimination. |
| **Field or Specialization** | **20%** | Identifies academic major or technical focus (e.g. Computer Science, Information Technology, Software Engineering). |
| **Graduation Year or Dates** | **15%** | Evaluates graduation timeline or expected date. Missing dates are evaluated neutrally and **never** assumed to be incomplete degrees. |
| **Education Section Clarity** | **15%** | Evaluates structural formatting, GPA/honors if provided, and supports multiple academic records. |

---

## 4. Experience Scoring Model & Fresher Policy

### Category Weight & Formula
- **Overall Category Weight**: `20 points`
- **Internal Rating**: `0–100`
- **Calculated Contribution**:
  $$\text{experienceEarnedPoints} = \frac{\text{experienceRating}}{100} \times 20$$

### 5 Internal Parameters
| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Role & Responsibility Clarity** | **25%** | Validates defined job titles, employer/organization context, and delineated scope of duties. |
| **Achievement & Impact Evidence** | **25%** | Detects outcome-driven metrics (percentages, throughput, scale, latency improvements) vs generic task lists. |
| **Experience Description Quality** | **20%** | Evaluates action verbs, technical depth, and architectural execution details. |
| **Relevant Technologies & Skills** | **15%** | Links technical stacks and developer tools directly to employment roles. |
| **Employment Timeline Clarity** | **15%** | Evaluates chronological consistency, duration, and active current employment (`Present`). |

### Fresher-Friendly Policy
To prevent unfair bias against early-career talent:
1. **Internship Evaluation**: Internships are recognized as legitimate professional development rather than discounted.
2. **Project Experience Policy**: If a candidate has no formal full-time employment but has built practical engineering projects, their project responsibilities, technical impact, technologies, and architecture are evaluated as **practical engineering experience evidence**!
3. **Transparent Weight Normalization**: If a fresher has genuinely zero work history and zero practical projects, the category status is marked `not_applicable_fresher`, and the 20-point weight is normalized across the remaining 80 points per Lesson 6.1 rules so the candidate is not permanently penalized.

---

## 5. Integration with Overall Score (100 Points)

The detailed ratings directly feed into the Lesson 6.1 overall composite score:
$$\text{Overall Score} = \text{Content Quality (25)} + \text{Skills (20)} + \text{Experience (20)} + \text{Projects (15)} + \text{Education (10)} + \text{Clarity (10)}$$
- Total Weight: **100 Points**
- No double counting of evidence.
- Scoring Version: `1.1.0`.

---

## 6. Database Schema & Migration

### Table: `resume_scores`
Non-destructive migration script: `backend/scripts/migrateAddDetailedScoring.js`.
- `detailed_result`: `JSON NULL` — stores the complete 15-parameter breakdown, normalized skills taxonomy, evidence/findings arrays, and fresher policy details.
- `skills_score`: `DECIMAL(5,2)` — persists internal skills rating (0–100).
- `education_score`: `DECIMAL(5,2)` — persists internal education rating (0–100).
- `experience_score`: `DECIMAL(5,2)` — persists internal experience rating (0–100).
- `scoring_version`: `'1.1.0'`.

---

## 7. API Endpoints

### 1. Calculate Detailed Score
- **Route**: `POST /api/resumes/:resumeId/detailed-score`
- **Auth**: Protected via JWT cookie or `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Detailed resume score calculated successfully",
  "data": {
    "resumeId": 431,
    "userId": 382,
    "overallScore": 84,
    "scoringVersion": "1.1.0",
    "fresherPolicyApplied": false,
    "categories": {
      "skills": { "rating": 85, "weight": 20, "earnedPoints": 17, "status": "evaluated", ... },
      "education": { "rating": 90, "weight": 10, "earnedPoints": 9, "status": "evaluated", ... },
      "experience": { "rating": 80, "weight": 20, "earnedPoints": 16, "status": "evaluated", ... }
    },
    "integratedOverallBreakdown": {
      "contentQuality": 21,
      "skills": 17,
      "experience": 16,
      "projects": 12,
      "education": 9,
      "clarity": 9,
      "totalScore": 84,
      "isNormalized": false
    }
  }
}
```

### 2. Fetch Latest Detailed Score
- **Route**: `GET /api/resumes/:resumeId/detailed-score`
- **Auth**: Protected via JWT (enforces strict tenant ownership)
- **Response**: `200 OK` with cached score record or `404 Not Found`.

---

## 8. Frontend Integration

1. `SkillsScoreCard.jsx`:
   - Visual progress bars for the 5 internal parameters.
   - Domain taxonomy pills (Languages, Frontend, Backend, Databases, Cloud, Tools, Soft Skills).
   - `SkillsEvidenceList`: Evidence-supported skills with green checkmarks vs listed-only skills.
2. `EducationScoreCard.jsx`:
   - Visual parameter progress bars.
   - `EducationDetails`: Degree, Institution, Major, Dates, GPA/Grade.
   - Neutrality notice (no university prestige bias).
3. `ExperienceScoreCard.jsx`:
   - Visual parameter progress bars.
   - Fresher Policy badge and details when active.
   - `ExperienceTimeline`: Roles, companies, duration, internship badges, quantified impact detection, tech pills.
4. `CategoryScoreBreakdown.jsx`:
   - Segmented 6-category composite progress bar with total score out of 100.
5. `DetailedScoringView.jsx`:
   - Responsive tabbed navigation across all categories with recalculation trigger.
6. `ResumeAnalysisModal.jsx`:
   - Integrated "Skills & Experience" subnav tab with real-time score display.

---

## 9. Verification & Automated Tests

Run the dedicated test suite:
```powershell
npm --prefix backend run test:detailed
```

Total: **33 Tests Executed, 33 Passed, 0 Failed**.
- Skills Tests: Tests 1–8
- Education Tests: Tests 9–15
- Experience Tests: Tests 16–24
- Integration & Security Tests: Tests 25–33

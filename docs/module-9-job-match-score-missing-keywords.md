# Module 9: Job Description Matching
## Lesson 9.3: Job Match Score & Missing Keywords

### 1. Overview and Objectives
Lesson 9.3 completes the Job Description Matching Engine by implementing:
1. **Transparent Weighted Scoring**: 6 distinct requirement categories with mathematical weight normalization when job postings leave categories unspecified.
2. **Missing Keyword Detection**: High-accuracy technical and domain keyword extraction cross-referenced against all candidate resume sections (skills, work experience, projects, summary, education, certifications, achievements).
3. **Ethical Non-Fabrication Guidance**: Every unevidenced requirement provides clear guidance stating that a keyword being "not detected" does not mean the candidate lacks the skill, advising candidates to add truthful evidence without ever encouraging fabrication.
4. **Structured Job Match Report**: Evidence-backed strengths, actionable improvement areas, category progress breakdowns, and qualitative score interpretation labels.
5. **Interactive Dashboard**: Full frontend reporting suite with Recharts/progress bars, tabbed category navigation, and seamless integration with existing resume management.

---

### 2. Category Weights & Scoring Formula

#### Category Base Weights
Totaling 100%:
- **Skills Match**: 35%
- **Experience Match**: 25%
- **Education Match**: 10%
- **Projects Match**: 15%
- **Responsibilities Match**: 10%
- **Certifications Match**: 5%

#### Dynamic Weight Normalization for Unspecified Categories
If a target job description does not specify requirements for a category (e.g. no certifications or no academic degrees mentioned), the category is marked as `isApplicable: false` and is **not** assigned a punitive 0.

The remaining applicable category weights are dynamically normalized to total 100%:
$$\text{SumApplicableBaseWeights} = \sum_{c \in \text{Applicable}} \text{BaseWeight}_c$$
$$\text{NormalizedWeight}_c = \frac{\text{BaseWeight}_c}{\text{SumApplicableBaseWeights}} \times 100$$
$$\text{CategoryContribution}_c = \frac{\text{CategoryScore}_c}{100} \times \text{NormalizedWeight}_c$$
$$\text{OverallScore} = \text{clamp}\left(0, 100, \text{round}\left(\sum_{c \in \text{Applicable}} \text{CategoryContribution}_c\right)\right)$$

---

### 3. Score Interpretation Tiers

The overall score is an estimated resume-to-job relevance based strictly on explicit textual evidence. It is **not** an official ATS score, and does not predict or guarantee interview selection.

| Score Range | Qualitative Tier | Description |
|:---|:---|:---|
| **90 – 100** | **Excellent Match** | Candidate qualifications closely match almost all core and preferred criteria. |
| **80 – 89** | **Very Good Match** | Strong alignment across primary technical stack and experience. |
| **70 – 79** | **Good Match** | Core requirements evidenced; minor gaps in preferred tools or responsibilities. |
| **60 – 69** | **Moderate Match** | Demonstrates foundational background, but several key criteria lack citations. |
| **40 – 59** | **Low Match** | Significant gaps in core technologies, experience, or required qualifications. |
| **0 – 39** | **Very Low Match** | Minimal textual overlap between candidate document and job description. |

---

### 4. Missing Keyword Detection & Ethical Safety

#### Extraction & Normalization
Keywords from the target job posting are extracted and normalized using the master dictionary:
- Known aliases resolved (e.g. `JS` $\rightarrow$ `JavaScript`, `ReactJS` $\rightarrow$ `React`, `NodeJS` $\rightarrow$ `Node.js`).
- Strict word-boundary regex patterns prevent false positives (e.g., `Java` will **never** match `JavaScript`; standalone `C` will not match `C++` or `C#`).
- Duplicates are removed and canonical casing is preserved.

#### Ethical Guidance
For every keyword classified as `not_detected`:
> *"If you genuinely have this skill or experience, consider adding relevant evidence to your resume."*

The engine strictly enforces that missing keywords are never automatically injected into candidate resume data, and users are never prompted to make false claims.

---

### 5. API Endpoints

All endpoints enforce JWT authentication and tenant ownership verification (`user_id = req.user.id`).

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/job-matches` | Run matching analysis; generates scoring, keywords, and report. |
| `GET` | `/api/job-matches` | List recent matching analyses with overall score and metadata. |
| `GET` | `/api/job-matches/:id` | Retrieve saved matching record with scores and citations. |
| `POST` | `/api/job-matches/:id/score` | Recalculate transparent category scores and persist updated report. |
| `GET` | `/api/job-matches/:id/report` | Retrieve the complete structured report object. |

---

### 6. Database Storage

Stored in the `job_matches` table in MySQL:
- `match_id` (BIGINT, PK, Auto Increment)
- `user_id` (BIGINT, FK to `users.user_id`)
- `resume_id` (BIGINT, FK to `resumes.resume_id`)
- `job_id` (BIGINT, FK to `job_descriptions.job_id`)
- `status` (`completed`, `pending`, `processing`, `failed`)
- `match_score` (DECIMAL(5,2), indexed numeric overall score 0–100)
- `matched_skills` (JSON, list of verified keywords with citations)
- `missing_skills` (JSON, list of undetected keywords with ethical advice)
- `match_analysis` (JSON, complete report with category scores, weights, strengths, and improvement areas)
- `matching_details` (JSON, granular requirement matches from Lesson 9.2)
- `created_at`, `updated_at` (TIMESTAMP)

---

### 7. Frontend Components Architecture

Located in `frontend/src/`:
- **`pages/JobMatching/ResumeJobMatching.jsx`**: Main hub to select a saved resume and saved job description, toggle Free Mode vs Advanced AI, trigger matching, and view recent scans.
- **`pages/JobMatching/MatchingReport.jsx`**: Main report dashboard with tab navigation (Score Overview, Keywords & Missing Skills, Detailed Evidence Citations).
- **`components/jobMatching/JobMatchScoreCard.jsx`**: Circular SVG score gauge, qualitative tier badge, and transparency disclaimer.
- **`components/jobMatching/CategoryScoreBreakdown.jsx`**: 6 category cards with progress bars, normalized weights, and non-applicable indicators.
- **`components/jobMatching/KeywordMatchList.jsx`**: Filterable pill cards for matched and partially matched keywords with source section citations.
- **`components/jobMatching/MissingKeywords.jsx`**: Undetected keywords with priority badges (Must Have / Preferred) and ethical advice.
- **`components/jobMatching/MatchingStrengths.jsx`**: Evidence-backed demonstrated candidate strengths.
- **`components/jobMatching/ImprovementAreas.jsx`**: Actionable recommendations for resume refinement.

---

### 8. Verification and Test Results

#### Backend Test Suite
- `npm --prefix backend run test:job-match-score`: **12 Passed, 0 Failed**.
  - Category base weights sum to 100%.
  - Unspecified category weight normalization verified.
  - Score clamping strictly inside [0, 100].
  - All 6 score interpretation tiers verified.
  - Java vs JavaScript distinction guaranteed.
  - Alias normalization (JS $\rightarrow$ JavaScript).
  - Ethical advice verification.
  - Fresh graduate handling with 0 employment history verified.
  - Complete report validation against Zod schema.
- `npm --prefix backend run test:job-match-api`: **8 Passed, 0 Failed**.
  - Unauthenticated rejection with HTTP 401.
  - Authenticated match execution and score report creation.
  - MySQL database persistence verified in `job_matches`.
  - Recalculate endpoint `POST /:id/score` verified.
  - Report endpoint `GET /:id/report` verified.
  - Multi-tenant isolation verified with HTTP 403 Forbidden.
- Full backend suite `npm --prefix backend test`: **All test suites passed cleanly**.

#### Frontend Test Suite
- `npm --prefix frontend test`: **86 Passed, 0 Failed**.
- `npm --prefix frontend run build`: Vite production build passed in **808ms**.

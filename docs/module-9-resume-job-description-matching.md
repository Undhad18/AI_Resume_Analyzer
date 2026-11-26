# Module 9 — Lesson 9.2: Resume and Job Description Matching Engine

## 1. Lesson Objective

The primary objective of **Lesson 9.2** is to implement a robust, evidence-backed Resume and Job Description Matching Engine within the standalone AI Resume Analyzer. Users select one of their saved resumes and one of their saved target job descriptions to execute a comprehensive semantic and requirement-level comparison across six key categories:
1. **Technical & Domain Skills**
2. **Work Experience**
3. **Education & Academic Credentials**
4. **Projects & Technical Implementations**
5. **Role Responsibilities & Operational Duties**
6. **Certifications & Professional Licenses**

Each requirement is classified into one of three statuses:
- `matched`: Verified direct textual or factual evidence detected in candidate's resume.
- `partially_matched`: Related, adjacent, or foundational background detected, but direct or complete evidence is absent.
- `not_detected`: No sufficient or direct evidence found in candidate's resume.

Every match or partial match includes explicit verbatim evidence citations (`sourceSection` and quoted text snippet). Requirements with zero evidence never receive fabricated or hallucinated citations.

> [!IMPORTANT]
> In strict compliance with Lesson 9.2 scope boundaries, this engine provides requirement classification, evidence extraction, and gap analysis. It intentionally excludes final overall percentage match scores, numerical ranking, or missing keyword scoring (which belong to Lesson 9.3).

---

## 2. Architecture & Design Principles

```
                  ┌────────────────────────┐
                  │ Target Job Description │
                  └───────────┬────────────┘
                              │
                    Requirement Extraction
                 (Heuristic Regex + Dictionary)
                              │
                              ▼
┌─────────────────┐    Categorized Jd Requirements:
│ Stored Resume   │    • Skills (required / preferred)
│ (Structured JSON│    • Experience (years, domain)
│  + Raw Text)    │    • Education (degrees, fields)
└────────┬────────┘    • Projects (tech stacks, architecture)
         │             • Responsibilities (operational duties)
         │             • Certifications (credentials)
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
     ┌───────────────────────────────┐
     │  Two-Tier Matching Engine     │
     │  1. Deterministic Heuristic   │
     │  2. OpenAI Responses API      │
     │     Structured Output Fallback│
     └──────────────┬────────────────┘
                    │
                    ▼
     ┌───────────────────────────────┐
     │ Validated Matching Report     │
     │ - Matched / Partial / Absent  │
     │ - Verbatim Evidence Citations │
     │ - Zero Hallucinations         │
     └───────────────────────────────┘
```

### Key Technical Pillars:
1. **Zero Citation Fabrication**: If a candidate lacks evidence for a skill or qualification (e.g. CISSP or Rust), the engine strictly categorizes it as `not_detected` with an empty evidence list (`evidence: []`).
2. **Semantic Distinction (Java vs JavaScript)**: Token-aware boundaries and word regex prevent false positive matches between distinct technologies like Java and JavaScript.
3. **Graceful Handling of Fresh Graduates**: Fresh graduates or career changers with strong portfolio projects are not arbitrarily penalized with runtime crashes; their projects provide evidence for applied technical capabilities.
4. **Resilient Dual-Engine Strategy**: A high-speed, 100% local deterministic matching engine runs instantly and handles offline or low-latency workloads. When complex semantic inferences are required and an API key is available, the OpenAI official SDK (`openai`) with Responses API structured outputs is employed.
5. **Multi-Tenant Data Isolation**: Database persistence ensures users can only execute matching analyses against their own uploaded resumes and saved job descriptions.

---

## 3. Database Table and Schema

### Table: `job_matches`
Created via migration script `backend/scripts/migrateAddJobMatches.js`:

```sql
CREATE TABLE IF NOT EXISTS job_matches (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  resume_id BIGINT NOT NULL,
  job_description_id BIGINT NOT NULL,
  engine_used VARCHAR(50) NOT NULL DEFAULT 'deterministic',
  matching_details JSON NOT NULL,
  summary_stats JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jm_user (user_id),
  INDEX idx_jm_resume (resume_id),
  INDEX idx_jm_jd (job_description_id),
  INDEX idx_jm_created (created_at),
  CONSTRAINT fk_jm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_jm_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE,
  CONSTRAINT fk_jm_jd FOREIGN KEY (job_description_id) REFERENCES job_descriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Backend API Endpoints

All endpoints require JWT authentication via `authenticateToken`:

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/job-matches` | Execute matching analysis between a resume and job description | 201, 400, 401, 403, 404, 500 |
| `GET` | `/api/job-matches` | List authenticated user's past matching analyses | 200, 401, 500 |
| `GET` | `/api/job-matches/:id` | Retrieve detailed matching report by match ID | 200, 401, 403, 404, 500 |

### Request Payload (`POST /api/job-matches`):
```json
{
  "resumeId": 105,
  "jobDescriptionId": 12,
  "preferredEngine": "deterministic" // Optional: "deterministic" | "ai"
}
```

### Response Payload Structure:
```json
{
  "success": true,
  "matchId": 1,
  "resumeId": 105,
  "jobDescriptionId": 12,
  "engineUsed": "deterministic",
  "summary": {
    "totalRequirements": 15,
    "matchedCount": 9,
    "partiallyMatchedCount": 3,
    "notDetectedCount": 3
  },
  "matchingDetails": {
    "skills": [
      {
        "requirement": "React.js",
        "category": "required",
        "status": "matched",
        "evidence": [
          {
            "sourceSection": "skills",
            "text": "Identified \"React.js\" in technical skills list."
          }
        ],
        "explanation": "Verified direct evidence of React.js in resume."
      }
    ],
    "experience": [...],
    "education": [...],
    "projects": [...],
    "responsibilities": [...],
    "certifications": [...]
  },
  "createdAt": "2026-11-26T18:44:38.000Z"
}
```

---

## 5. Zod Validation Schemas (`backend/validators/jobMatchingSchema.js`)

- **`createJobMatchRequestSchema`**:
  - `resumeId`: Positive integer, coercible from numeric string.
  - `jobDescriptionId`: Positive integer, coercible from numeric string.
  - `preferredEngine`: Optional enum `["ai", "deterministic", "auto"]`.
- **`requirementMatchItemSchema`**:
  - `requirement`: String (min 1, max 300).
  - `category`: Enum `["required", "preferred"]`.
  - `status`: Enum `["matched", "partially_matched", "not_detected"]`.
  - `evidence`: Array of `{ sourceSection, text }`.
  - `explanation`: Informative explanation string.
- **`matchingDetailsSchema`**:
  - Validates strict presence of all six requirement categories (`skills`, `experience`, `education`, `projects`, `responsibilities`, `certifications`).

---

## 6. Frontend Components (`frontend/src/components/jobMatching/`)

1. **`ResumeJobMatching.jsx` (`frontend/src/pages/JobMatching/ResumeJobMatching.jsx`)**:
   - Primary interactive launchpad with two-column selection interface (Saved Resumes & Saved Target Job Descriptions).
   - Instant search filters for resumes and job descriptions.
   - Selection summaries and engine toggle (Fast Deterministic vs In-Depth AI).
   - Recent match history drawer allowing one-click access to past matching reports.
2. **`MatchingResult.jsx` (`frontend/src/pages/JobMatching/MatchingResult.jsx`)**:
   - Comprehensive tabbed matching report displaying requirement breakdowns.
   - Category filtering (`All`, `Skills`, `Experience`, `Education`, `Projects`, `Responsibilities`, `Certifications`).
   - Status filtering (`All`, `Matched`, `Partially Matched`, `Not Detected`).
   - Summary stat badges (`Total`, `Matched`, `Partially Matched`, `Not Detected`).
3. **`EvidenceCard.jsx` (`frontend/src/components/jobMatching/EvidenceCard.jsx`)**:
   - Render section source badge (e.g. `workExperience`, `education`, `projects`) and quoted verbatim textual evidence with visual quotation styling.
4. **`RequirementItemCard.jsx`**:
   - Reusable card with status badges (`Matched` - Emerald, `Partial` - Amber, `Not Detected` - Rose), importance badges (`Required` vs `Preferred`), requirement title, plain-language explanation, and evidence list.
5. **Modular Category Matchers**:
   - `SkillsMatching.jsx`: Displays technical skills comparison.
   - `ExperienceMatching.jsx`: Displays professional work history comparison.
   - `EducationMatching.jsx`: Displays academic degree and qualification comparison.
   - `ProjectMatching.jsx`: Displays technical portfolio project comparison.
   - `ResponsibilitiesMatching.jsx`: Displays operational job duty comparison.
   - `CertificationsMatching.jsx`: Displays professional license and credential comparison.
6. **`MatchingSummary.jsx`**:
   - Summary status counters highlighting counts of matched, partial, and not detected requirements.

---

## 7. Verification and Testing

### Backend Unit Test Suite (`backend/tests/jobMatching.test.js`):
- **Test 1**: Valid resume and JD matching extracts all categories.
- **Test 2**: Required skill directly matched with explicit citation.
- **Test 3**: Related skill in same category classified as partially matched.
- **Test 4**: Unevidenced skill classified strictly as `not_detected` without fake citations.
- **Test 5**: Java vs JavaScript distinction prevents false positive matching.
- **Test 6**: Work experience evidence matching finds job title and responsibilities.
- **Test 7**: Education evidence matching verifies degree and field of study.
- **Test 8**: Technical project evidence matching verifies project details.
- **Test 9**: Certification evidence matching validates credentials.
- **Test 10**: Requirements with zero evidence never receive fabricated citations.
- **Test 11**: Fresh graduate profile with projects matches project requirements without employment penalty.
- **Test 12**: Empty resume content returns `not_detected` for all items without crashing.
- **Test 13**: Empty JD text extracts empty categories cleanly.
- **Test 14**: Request schema rejects non-numeric or missing `resumeId`.
- **Test 15**: Request schema rejects missing `jobDescriptionId`.
- **Test 16**: Structured matching details adhere to Zod schema.
- **Test 17**: `JobMatchingError` encapsulates code and HTTP `statusCode`.

**Result**: 17 Passed, 0 Failed.

### Regression Testing:
- Full backend test suite executed: All tests passed.
- Full frontend test suite (8 test suites) executed: All tests passed.
- Frontend production Vite build: Verified error-free compilation (`dist/`).

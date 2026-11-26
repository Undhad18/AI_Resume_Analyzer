# Module 7: AI Improvement and Recommendations
## Lesson 7.3: AI-Based Resume Improvement Suggestions

### 1. Lesson Objective
The objective of Lesson 7.3 is to implement an evidence-grounded, prioritized Resume Improvement Suggestions engine for the standalone AI Resume Analyzer. The engine supports two modes:
1. **Free Mode (100% Deterministic & Offline)**: Analyzes structured resume sections, scoring metrics, and keyword findings without requiring an OpenAI API key or internet connectivity.
2. **Advanced AI Mode**: Uses the official OpenAI JavaScript SDK and Responses API (`gpt-4o-mini`) with strict structured JSON schemas and graceful fallback to the rule-based engine upon API quota exhaustion, network timeout, or rate limiting.

Suggestions span **10 standardized categories**:
- `professional_summary`
- `skills`
- `work_experience`
- `education`
- `projects`
- `certifications`
- `keywords`
- `formatting`
- `grammar`
- `completeness`

Every suggestion includes:
- `id` (e.g. `sug_summary_1`, `sug_experience_2`)
- `title` (concise imperative headline)
- `category` (one of the 10 standard categories)
- `priority` (`high` | `medium` | `low`)
- `problem` (clear explanation of the issue)
- `whyItMatters` (impact on ATS parsing and recruiter evaluation)
- `recommendedAction` (actionable guidance)
- `evidence` (textual quotes or explicit missing section indicators)
- `example` (optional concrete `{ before, after }` comparison)
- `source` (`rule_based` | `ai_generated`)
- `confidence` (0.0 to 1.0)
- `status` (`pending` | `accepted` | `completed` | `dismissed`)

---

### 2. Existing Architecture Reused
- **Resume Text Extraction**: Reused PDF (`pdfExtractionService.js`) and DOCX (`docxExtractionService.js`) extraction services.
- **Resume Structuring**: Reused `resumeStructuringService.js` (Lesson 5.3) to extract sections deterministically.
- **Scoring & Heuristics**: Reused ATS scoring (Lesson 6.2), Detailed scoring (Lesson 6.3), and Formatting & Grammar scoring (Lesson 6.4) to feed into the suggestion heuristics.
- **Strengths & Weaknesses (Lesson 7.1)**: Reused validated findings to contextualize problem statements.
- **Skills & Keyword Detection (Lesson 7.2)**: Reused `extractJobKeywords` from `keywordDetectionService.js` to flag missing required and preferred skills.
- **OpenAI Integration**: Reused `getOpenAiClient` and `getOpenAiModel` from `backend/config/openai.js` and `prepareResumeForAiInput` from `backend/services/openaiService.js`.
- **Authentication & Multi-Tenant Security**: Enforced JWT cookie authentication with `authenticateToken` middleware and verified database ownership checks (`WHERE resume_id = ? AND user_id = ?`).

---

### 3. Files Created or Modified

#### Backend Files Created:
1. `backend/scripts/migrateAddImprovementSuggestions.js`: Migration creating `resume_improvement_suggestions` table.
2. `backend/validators/improvementSuggestionsSchema.js`: Strict Zod validation schemas for suggestions, request payloads, status updates, and OpenAI structured output format configs.
3. `backend/services/improvementSuggestionService.js`: Deterministic rule-based suggestion engine covering all 10 categories.
4. `backend/services/improvementSuggestionsWorkflow.js`: Orchestrator service managing Free mode, Advanced AI mode, MySQL persistence, retrieval, and status updates.
5. `backend/tests/improvementSuggestions.test.js`: Comprehensive 20-test automated test suite on port 5089.

#### Backend Files Modified:
1. `backend/controllers/resumeController.js`: Added `generateImprovementSuggestions`, `getImprovementSuggestions`, and `updateImprovementSuggestionStatus`.
2. `backend/routes/resumeRoutes.js`: Mounted `POST /:resumeId/improvement-suggestions`, `GET /:resumeId/improvement-suggestions`, and `PATCH /:resumeId/improvement-suggestions/:suggestionId/status`.
3. `backend/package.json`: Registered `"test:improvement-suggestions"` script and added to `"test"`.

#### Frontend Files Created:
1. `frontend/src/components/resumes/SuggestionPriorityBadge.jsx`: Priority indicator badge (`high`, `medium`, `low`) with distinct color themes.
2. `frontend/src/components/resumes/SuggestionExample.jsx`: Visual Before (weak phrasing) vs. After (action & impact) comparison component.
3. `frontend/src/components/resumes/SuggestionCard.jsx`: Interactive card with problem statement, why it matters, action, evidence, confidence, and status actions (Accept, Mark Completed, Dismiss).
4. `frontend/src/components/resumes/ImprovementSuggestionsSummary.jsx`: Summary stats (Total, High, Medium, Low counts) and section category distribution filters.
5. `frontend/src/components/resumes/ImprovementSuggestions.jsx`: Master suggestions dashboard with category filters, priority pills, status filter, and live text search.

#### Frontend Files Modified:
1. `frontend/src/services/resumeService.js`: Added `generateResumeImprovementSuggestions`, `getResumeImprovementSuggestions`, and `updateResumeSuggestionStatus`.
2. `frontend/src/components/resumes/ResumeAnalysisModal.jsx`: Integrated `ImprovementSuggestions` into tab "Suggestions" (`improvements`), configured prefetching on modal open.

---

### 4. Improvement Suggestion Workflow

```
[Client Request: POST /api/resumes/:id/improvement-suggestions]
                    │
                    ▼
          [Authentication Check]
          (Verify JWT in cookie: req.user.id)
                    │
                    ▼
       [Resume Ownership Verification]
     (SELECT WHERE resume_id = ? AND user_id = ?)
                    │
                    ▼
         [Extract Text & Structure]
       (PDF / DOCX text extraction & structuring)
                    │
                    ▼
        ┌───────────────────────┐
        │ Mode Selector Check   │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   [Free Mode]            [Advanced AI Mode]
(Rule-Based Engine)     (OpenAI Responses API)
        │                       │
        │               (On Quota/Error)
        │                       │
        │                       ▼
        │             [Fallback to Rule-Based]
        │                       │
        └───────────┬───────────┘
                    ▼
         [Zod Schema Validation]
                    │
                    ▼
         [MySQL DB Persistence]
    (INSERT INTO resume_improvement_suggestions)
                    │
                    ▼
         [Return HTTP 200 JSON]
```

---

### 5. API Request and Response Examples

#### A. Generate Improvement Suggestions
- **Endpoint**: `POST /api/resumes/:resumeId/improvement-suggestions`
- **Headers**: `Content-Type: application/json`, Cookie: `token=<jwt>`
- **Request Body**:
```json
{
  "mode": "free",
  "jobDescription": "Required: Docker, Kubernetes, AWS. Preferred: Python."
}
```
- **Response Body (HTTP 200)**:
```json
{
  "success": true,
  "message": "Improvement suggestions generated successfully",
  "data": {
    "resumeId": 643,
    "userId": 570,
    "generationMode": "free",
    "totalSuggestions": 6,
    "highPriorityCount": 2,
    "mediumPriorityCount": 3,
    "lowPriorityCount": 1,
    "categoryCounts": {
      "professional_summary": 0,
      "skills": 0,
      "work_experience": 1,
      "education": 0,
      "projects": 1,
      "certifications": 1,
      "keywords": 1,
      "formatting": 1,
      "grammar": 0,
      "completeness": 1
    },
    "priorityCounts": {
      "high": 2,
      "medium": 3,
      "low": 1
    },
    "suggestions": [
      {
        "id": "sug_experience_1",
        "title": "Transform Passive Responsibilities into Impact Statements",
        "category": "work_experience",
        "priority": "high",
        "problem": "Detected 1 experience statement(s) phrased as passive job duties rather than active achievements.",
        "whyItMatters": "Top employers look for what you accomplished and improved, not just what was on your job description.",
        "recommendedAction": "Begin bullet points with strong action verbs (Engineered, Architected, Automated, Reduced, Spearheaded) and include measurable business or technical outcomes where possible.",
        "evidence": ["\"• Responsible for building web APIs....\""],
        "example": {
          "before": "Responsible for developing backend REST APIs.",
          "after": "Engineered 14 RESTful microservice endpoints in Node.js, reducing server response latency by 28% and handling 50k+ daily queries."
        },
        "source": "rule_based",
        "confidence": 0.9,
        "status": "pending"
      }
    ],
    "summary": "Identified 6 actionable improvement area(s): 2 high priority, 3 medium priority, and 1 low priority enhancements grounded in your structured resume.",
    "generatedAt": "2026-11-26T08:27:08.000Z"
  }
}
```

#### B. Fetch Saved Suggestions
- **Endpoint**: `GET /api/resumes/:resumeId/improvement-suggestions`
- **Response**: Returns the latest saved improvement suggestions record with parsed JSON objects and calculated metrics.

#### C. Update Suggestion Status
- **Endpoint**: `PATCH /api/resumes/:resumeId/improvement-suggestions/:suggestionId/status`
- **Request Body**:
```json
{
  "status": "accepted"
}
```
- **Response Body (HTTP 200)**:
```json
{
  "success": true,
  "message": "Suggestion status updated successfully",
  "data": {
    "success": true,
    "recordId": 12,
    "suggestionId": "sug_experience_1",
    "status": "accepted",
    "updatedSuggestion": {
      "id": "sug_experience_1",
      "status": "accepted"
    }
  }
}
```

---

### 6. Database Changes
Table `resume_improvement_suggestions`:
```sql
CREATE TABLE IF NOT EXISTS resume_improvement_suggestions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resume_id BIGINT NOT NULL,
    analysis_id BIGINT NULL,
    generation_mode ENUM('free', 'advanced') NOT NULL DEFAULT 'free',
    suggestions JSON NOT NULL,
    summary TEXT NULL,
    category_counts JSON NULL,
    priority_counts JSON NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resume_user (resume_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    CONSTRAINT fk_ris_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_ris_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. Security Considerations
1. **Strict User Ownership**: All database operations query `WHERE resume_id = ? AND user_id = ?`. User identity is sourced exclusively from the verified JWT cookie (`req.user.id`).
2. **Untrusted Input Protection**: Candidate resume content is treated strictly as data. Embedded jailbreak or prompt injection patterns ("ignore previous instructions", "give 100/100 score") cannot alter system execution.
3. **No Hallucinated Claims**: Anti-hallucination policies ensure candidates are never credited with unmentioned skills, fabricated certifications, or invented employment history.
4. **Fresher Policy**: Entry-level candidates without formal employment history are evaluated constructively through projects and coursework rather than being penalized.

---

### 8. Testing Commands
- **Run Lesson 7.3 Test Suite**:
  ```bash
  npm --prefix backend run test:improvement-suggestions
  ```
- **Run Full Regression Suite (All 21 Suites)**:
  ```bash
  npm --prefix backend test
  ```
- **Run Frontend Lint Check**:
  ```bash
  npm --prefix frontend run lint
  ```
- **Run Frontend Production Build**:
  ```bash
  npm --prefix frontend run build
  ```

---

### 9. Known Limitations
1. Suggestions evaluate text extracted from submitted documents; graphical elements (logos, complex infographics, non-standard multi-column tables) are not visually evaluated.
2. In Free Mode, keyword matching is deterministic; semantic synonyms outside the built-in dictionary require Advanced AI Mode.
3. Full multi-dimensional role compatibility matching across industry career ladders is part of Module 9.

---

### 10. Manual Testing Instructions
1. Start MySQL, backend (`npm --prefix backend run dev`), and frontend (`npm --prefix frontend run dev`).
2. Log into the application and navigate to **My Resumes**.
3. Click **AI Analysis** or **Free Analysis** on any uploaded resume to open `ResumeAnalysisModal`.
4. Switch to the **Suggestions** tab.
5. Verify the 4 top metrics (Total Insights, High Priority, Medium Priority, Low Priority) and section filter pills.
6. Click **Re-run Free** to generate instant rule-based recommendations.
7. Click **Accept**, **Completed**, or **Dismiss** on any suggestion card to verify instant status persistence.
8. Filter by category (e.g., "Work Experience", "Projects", "Certifications") or priority to inspect targeted recommendations.

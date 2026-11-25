# Module 5 — Lesson 5.5: Complete AI Resume Analysis Engine

## 1. Lesson Objective

This document provides complete architectural, operational, and verification details for **Module 5 — Lesson 5.5: Complete AI Resume Analysis Engine** in the **AI Resume Analyzer** application.

This lesson implements the end-to-end analytical pipeline connecting authenticated document ingestion, multi-tenant ownership validation, document text extraction (PDF & DOCX), deterministic section structuring, OpenAI Responses API evaluation via strict Structured Outputs JSON schemas, transactional database persistence in MySQL, and an interactive 5-tab user review modal in React.

---

## 2. Architecture Overview

```
+---------------------------------------------------------------------------------------------------------------------+
|                                          AI RESUME ANALYZER PIPELINE                                                |
|                                                                                                                     |
|  [Authenticated Client]                                                                                             |
|          |                                                                                                          |
|          v  POST /api/resumes/:resumeId/analyze                                                                     |
|  [resumeRoutes.js]                                                                                                  |
|          |                                                                                                          |
|          v  authenticateToken (JWT Verification & User Status Check)                                                |
|  [resumeController.js / resumeAnalysisService.js]                                                                   |
|          |                                                                                                          |
|          +---> Step 1: IDOR & Resource Ownership Check (getResumeFileForPreviewOrDownload)                          |
|          |                                                                                                          |
|          +---> Step 2: Overlapping Active Analysis Concurrency Guard (409 Conflict)                                 |
|          |                                                                                                          |
|          +---> Step 3: MySQL Transaction (INSERT INTO resume_analyses status='pending' -> 'processing')             |
|          |                                                                                                          |
|          +---> Step 4: Text Extraction (extractTextFromPdf / extractTextFromDocx)                                    |
|          |                                                                                                          |
|          +---> Step 5: Deterministic Structuring Engine (structureResumeContent)                                    |
|          |                                                                                                          |
|          +---> Step 6: OpenAI Responses API Analysis (client.responses.create with complete_resume_analysis schema) |
|          |                                                                                                          |
|          +---> Step 7: Zod Post-Validation (completeResumeAnalysisZodSchema.safeParse)                             |
|          |                                                                                                          |
|          +---> Step 8: Persistence (UPDATE resume_analyses status='completed', overall_score, analysis_result)       |
|          |                                                                                                          |
|          v                                                                                                          |
|  [HTTP 200 JSON Response -> Frontend ResumeAnalysisModal.jsx]                                                       |
+---------------------------------------------------------------------------------------------------------------------+
```

---

## 3. End-to-End Analysis Workflow

1. **Authentication & Tenant Isolation**:
   - The user must provide a valid signed JWT session cookie.
   - The server resolves `req.user.id` (strictly trusted server-side identity).
   - `getResumeFileForPreviewOrDownload` verifies that `resumes.resume_id` belongs strictly to `req.user.id`. If the resume exists under another user ID, an HTTP 403 Forbidden is returned (preventing IDOR).
2. **Concurrency Control**:
   - If an analysis for the same `resume_id` is currently in status `'processing'` started within the last 60 seconds, an HTTP 409 Conflict is returned (`ACTIVE_ANALYSIS_IN_PROGRESS`).
3. **Pending Lifecycle Initialization**:
   - A row is inserted into `resume_analyses` with `analysis_status: 'pending'` and immediately transitioned to `'processing'`.
4. **Document Extraction & Section Structuring**:
   - If `extracted_text` is not cached in MySQL, the engine detects file type (`pdf` or `docx`) and reads disk storage via `pdfExtractionService` or `docxExtractionService`.
   - The raw text is segmented into standardized sections (`personalInfo`, `skills`, `workExperience`, `education`, `projects`, `certifications`, `additionalSections`) using the deterministic structuring engine from Lesson 5.3.
5. **OpenAI Responses API Structured Output**:
   - The payload is sanitized and checked against size bounds (`HARD_INPUT_LIMIT = 50,000` chars).
   - Dispatches a single call to `client.responses.create()` configured with the `complete_resume_analysis` JSON Schema.
   - Strictly enforces prompt-injection boundaries (treating resume content as untrusted data, refusing to execute embedded instructions).
6. **Zod Validation & Persistence**:
   - `output_text` is validated against `completeResumeAnalysisZodSchema`.
   - An objective composite score ($0 - 100$) is computed via `calculateOverallResumeScore`.
   - The record in `resume_analyses` is updated to `analysis_status: 'completed'`.
   - On unhandled failures, the row is marked as `analysis_status: 'failed'` with `error_message`, ensuring no records remain stuck in `processing`.

---

## 4. Structured Output Contract

The analysis output strictly conforms to the following 10-section schema:

```json
{
  "resumeOverview": {
    "summary": "Executive summary of the candidate's career trajectory",
    "professionalProfile": "Identified candidate persona and domain specialization",
    "detectedCareerLevel": "Entry-Level | Mid-Level | Senior | Lead | Executive",
    "targetRoles": ["Senior Backend Engineer", "Distributed Systems Engineer"]
  },
  "skillsAnalysis": {
    "foundSkills": [
      {
        "skill": "Node.js",
        "category": "Technical",
        "evidence": "Built microservices handling 10k req/s"
      }
    ],
    "skillGaps": [
      {
        "skill": "Kubernetes",
        "reason": "Container orchestration not explicitly detailed"
      }
    ],
    "skillsSummary": "Strong mastery of JavaScript backend ecosystem with relational database expertise."
  },
  "experienceAnalysis": {
    "summary": "Extensive experience delivering scalable services.",
    "strengths": ["Clear metrics and throughput achievements"],
    "improvements": ["Add more context on cross-functional team leadership"]
  },
  "educationAnalysis": {
    "summary": "B.S. in Computer Science from accredited institution.",
    "observations": ["Verified degree and relevant coursework"]
  },
  "projectsAnalysis": {
    "summary": "Highlighted open-source distributed task queue.",
    "strengths": ["Working code link and architecture documentation"],
    "improvements": ["Include automated test coverage metrics"]
  },
  "strengths": [
    {
      "title": "Scalable Architecture",
      "description": "Demonstrated success handling large traffic",
      "evidence": "10k req/s"
    }
  ],
  "weaknesses": [
    {
      "title": "Missing Cloud Certifications",
      "description": "No official AWS/GCP certificates listed",
      "suggestion": "Consider obtaining AWS Solutions Architect",
      "evidence": "Certifications section empty"
    }
  ],
  "missingInformation": [
    {
      "field": "Portfolio Link",
      "reason": "No personal portfolio or blog link found"
    }
  ],
  "improvementSuggestions": [
    {
      "area": "Metrics",
      "suggestion": "Quantify latency reductions in recent role",
      "priority": "high"
    }
  ],
  "analysisLimitations": [
    "Analysis based exclusively on provided document text without external background checks"
  ]
}
```

---

## 5. Database Schema & Migration

### Migration: `database/migrations/005_add_user_id_to_resume_analyses.sql`
Links `resume_analyses` directly to `users(user_id)` for high-performance multi-tenant indexing:

```sql
ALTER TABLE `resume_analyses`
ADD COLUMN `user_id` bigint NULL AFTER `analysis_id`,
ADD KEY `idx_analysis_user` (`user_id`),
ADD CONSTRAINT `fk_resume_analyses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

Run migration via CLI:
```bash
npm --prefix backend run test:migrate
```

---

## 6. API Endpoints

### 6.1 Execute AI Resume Analysis
- **URL**: `POST /api/resumes/:resumeId/analyze`
- **Headers**:
  - `Cookie: token=<jwt-token>`
  - `X-CSRF-Token: <csrf-token>`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Resume analysis completed successfully",
    "data": {
      "analysisId": 12,
      "resumeId": 324,
      "status": "completed",
      "overallScore": 86.0,
      "analysis": { ... },
      "metadata": {
        "aiModel": "gpt-4o-mini",
        "responseId": "resp_mock_analysis_123",
        "analyzedAt": "2026-11-25T11:50:00.000Z"
      }
    }
  }
  ```

### 6.2 Retrieve Latest Analysis
- **URL**: `GET /api/resumes/:resumeId/analysis`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "analysisId": 12,
      "resumeId": 324,
      "userId": 1,
      "status": "completed",
      "overallScore": 86.0,
      "aiModel": "gpt-4o-mini",
      "analysisResult": { ... },
      "errorMessage": null,
      "analyzedAt": "2026-11-25T11:50:00.000Z"
    }
  }
  ```

---

## 7. Frontend User Experience (`MyResumes.jsx`)

1. **Analysis Trigger Pill**:
   In the "My Resumes" document list, a purple `Sparkles` action button is positioned alongside Preview and Download actions.
2. **Analysis Modal (`ResumeAnalysisModal.jsx`)**:
   - Opens an interactive full-featured modal dialog.
   - Automatically loads existing analysis if previously generated.
   - Features a primary **"Run AI Analysis"** (or **"Re-Analyze"**) button.
   - Locks interaction during analysis with animated pulse loaders and stage notifications.
   - Visualizes overall score badge (`XX/100`) with color grading.
   - Organizes findings into 5 clean tabs:
     - **Overview**: Executive summary, career level, target roles.
     - **Skills Analysis**: Found skills with quotes; identified skill gaps.
     - **Experience & Education**: Granular section feedback.
     - **Strengths & Weaknesses**: Evidence-backed recommendations.
     - **Actionable Improvements**: Prioritized suggestions (`high`, `medium`, `low`).

---

## 8. Automated Test Results

Execute the complete Lesson 5.5 test suite:
```bash
npm --prefix backend run test:engine
```

All 40 required test cases pass 100% green:
```
=================================================
 AI RESUME ANALYZER - LESSON 5.5 ENGINE TESTS   
=================================================

[PASS] Test 1: Unauthenticated request returns HTTP 401
[PASS] Test 2: Authenticated user successfully analyzes own resume (status: completed)
[PASS] Test 3: Cross-tenant analysis request returns HTTP 403 Forbidden
[PASS] Test 4: Non-existent resume returns HTTP 404 Not Found
[PASS] Test 5: Non-numeric resume ID returns HTTP 400 Bad Request
[PASS] Test 6: Valid PDF is registered and reached extraction
[PASS] Test 7: Valid DOCX reaches extraction and completes analysis
[PASS] Test 8: Extracted text verification executes safely
[PASS] Test 9: Corrupt document storage handled via existing validation layer
[PASS] Test 10: Unsupported file types rejected before analysis pipeline
[PASS] Test 11: Structuring service fallback and error isolation verified
[PASS] Test 12: Valid structured AI response accepted by Zod schema
[PASS] Test 13: Invalid AI response schema rejected by Zod validator
[PASS] Test 14: Empty model output throws HTTP 502 EMPTY_AI_RESPONSE
[PASS] Test 15: Refusal responses mapped to controlled application errors
[PASS] Test 16: Incomplete model output throws HTTP 502 MALFORMED_AI_OUTPUT
[PASS] Test 17: Upstream rate limit (429) mapped to RATE_LIMIT_EXCEEDED
[PASS] Test 18: Invalid API credentials mapped to 401 INVALID_API_KEY
[PASS] Test 19: Request timeout mapped to HTTP 504 OPENAI_TIMEOUT
[PASS] Test 20: System prompt enforces untrusted data boundary against injection
[PASS] Test 21: Successful analysis is persisted in MySQL
[PASS] Test 22: Analysis record correctly references user_id and resume_id
[PASS] Test 23: Completed status is verified in MySQL record
[PASS] Test 24: Failed status and error message safely recorded in database
[PASS] Test 25: Schema validation guard prevents saving invalid output as completed
[PASS] Test 26: Duplicate active request prevented with HTTP 409
[PASS] Test 27: Database transactions and error handling reject false success
[PASS] Test 28: GET /api/resumes/:id/analysis returns 200 with saved analysis
[PASS] Test 29: Overall composite score calculator available for UI
[PASS] Test 30: Accidental duplicate clicks blocked via state locks
[PASS] Test 31: Full structured analysis renders across 5 report tabs
[PASS] Test 32: API failures cleanly displayed in UI without raw traces
[PASS] Test 33: Empty analysis sections render clean fallbacks
[PASS] Test 34: Existing registration and login operate normally
[PASS] Test 35: Existing JWT authentication and protected routes operate normally
[PASS] Test 36: Existing Multer upload and storage operate normally
[PASS] Test 37: Existing PDF extraction operates normally
[PASS] Test 38: Existing DOCX extraction operates normally
[PASS] Test 39: Existing resume structuring operates normally
[PASS] Test 40: Existing dashboard summaries and resume listing operate normally

-------------------------------------------------
TEST SUMMARY: 40 Passed, 0 Failed
-------------------------------------------------
```

---

## 9. Files Created or Modified

| File | Type | Purpose |
| :--- | :--- | :--- |
| `backend/validators/resumeAnalysisSchema.js` | Created | Zod schema and OpenAI strict JSON Schema for the comprehensive analysis contract. |
| `backend/services/resumeAnalysisService.js` | Created | End-to-end analysis orchestration, concurrency locks, and MySQL persistence. |
| `backend/scripts/migrateResumeAnalyses.js` | Created | Idempotent migration script adding `user_id` and foreign key to `resume_analyses`. |
| `database/migrations/005_add_user_id_to_resume_analyses.sql` | Created | SQL migration definition file. |
| `backend/tests/resumeAnalysis.test.js` | Created | 40-test automated verification suite. |
| `frontend/src/components/resumes/ResumeAnalysisModal.jsx` | Created | Interactive 5-tab analysis review modal. |
| `docs/module-5-complete-ai-resume-analysis-engine.md` | Created | Technical documentation. |
| `backend/services/openaiService.js` | Modified | Added `analyzeFullResumeWithAi` and `calculateOverallResumeScore`. |
| `backend/controllers/resumeController.js` | Modified | Added `analyzeResume` and `getResumeAnalysis` endpoints. |
| `backend/routes/resumeRoutes.js` | Modified | Mounted `/api/resumes/:resumeId/analyze` and `/analysis`. |
| `backend/package.json` | Modified | Registered `test:engine` and `test:migrate` test scripts. |
| `frontend/src/services/resumeService.js` | Modified | Added `analyzeResume` and `getResumeAnalysis` API client methods. |
| `frontend/src/pages/dashboard/MyResumes.jsx` | Modified | Added AI analysis action button and mounted `ResumeAnalysisModal`. |

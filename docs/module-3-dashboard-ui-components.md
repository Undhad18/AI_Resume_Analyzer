# Module 3 – Lesson 3.2: Dashboard UI Components & Real Data Integration

## 1. Executive Summary

This document details the architectural design, implementation, data security model, and verification of **Module 3 – Lesson 3.2: Dashboard UI Components and Real Data Integration** for the **AI Resume Analyzer** application.

In this lesson, all mock/hardcoded statistics and UI placeholders were eliminated. A dedicated, authenticated backend summary endpoint (`GET /api/dashboard/summary`) was built on top of MySQL tables (`resumes`, `resume_analyses`, `resume_scores`, `job_matches`, and `resume_files`). The frontend was equipped with reusable presentation components (`StatCard`, `RecentResumes`, `RecentAnalyses`, `QuickActions`, and `DashboardSkeleton`), consuming verified user metrics through `dashboardService.js` and existing `api.js` Axios credentials.

---

## 2. Database Tables & Fields Utilized

The dashboard summary utilizes existing schema tables without mutating structure:

1. **`resumes`**:
   - `resume_id` (Primary Key)
   - `user_id` (Foreign Key -> `users.user_id`)
   - `resume_title` (Title of the document)
   - `candidate_name` (Name extracted/entered)
   - `status` (`uploaded`, `processing`, `completed`, `failed`)
   - `created_at` (Upload timestamp)
   - `deleted_at` (Soft-delete timestamp filter: `deleted_at IS NULL`)

2. **`resume_analyses`**:
   - `analysis_id` (Primary Key)
   - `resume_id` (Foreign Key -> `resumes.resume_id`)
   - `overall_score` (Numeric score 0–100)
   - `analysis_status` (`pending`, `processing`, `completed`, `failed`)
   - `ai_model` (AI model name, e.g. `gpt-4o`)
   - `analyzed_at` (Timestamp of analysis)

3. **`resume_scores`**:
   - `score_id` (Primary Key)
   - `analysis_id` (Foreign Key -> `resume_analyses.analysis_id`)
   - `ats_score` (ATS system match rating 0–100)
   - `overall_score` (Overall aggregated score)

4. **`job_matches`**:
   - `match_id` (Primary Key)
   - `resume_id` (Foreign Key -> `resumes.resume_id`)
   - `job_id` (Foreign Key -> `job_descriptions.job_id`)
   - `match_score` (Calculated match score)

5. **`resume_files`**:
   - `file_id` (Primary Key)
   - `resume_id` (Foreign Key -> `resumes.resume_id`)
   - `file_name` (Display file name, e.g. `resume.pdf`)
   - `file_type` (`pdf`, `doc`, `docx`)
   - `file_size` (Size in bytes)
   - `file_purpose` (`original`, `improved`, `report`)
   - *Security Note: Internal server storage paths (`file_path`) are strictly omitted from API outputs.*

---

## 3. Backend API Architecture

### Endpoint Specification:
- **Route**: `GET /api/dashboard/summary`
- **Protection**: `authenticateToken` middleware (enforces valid JWT session cookie or Bearer token, account status check, and injects `req.user.id`).
- **Controller**: [backend/controllers/dashboardController.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/controllers/dashboardController.js)
- **Service**: [backend/services/dashboardService.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/services/dashboardService.js)

### Response Payload Structure:
```json
{
  "success": true,
  "data": {
    "totalResumes": 2,
    "totalAnalyses": 2,
    "averageScore": 85.0,
    "totalJobMatches": 1,
    "recentResumes": [
      {
        "id": 14,
        "title": "Fullstack Resume",
        "candidateName": "User Alpha",
        "status": "completed",
        "fileName": "resume_alpha.pdf",
        "fileType": "pdf",
        "fileSize": 104857,
        "createdAt": "2026-11-25T06:48:00.000Z"
      }
    ],
    "recentAnalyses": [
      {
        "id": 22,
        "resumeId": 14,
        "resumeTitle": "Fullstack Resume",
        "overallScore": 90.0,
        "atsScore": 92.0,
        "status": "completed",
        "aiModel": "gpt-4o",
        "analyzedAt": "2026-11-25T06:48:30.000Z"
      }
    ]
  }
}
```

---

## 4. Statistics Calculation & Business Rules

1. **Total Resumes**:
   - Counts active resumes owned by the authenticated user.
   - SQL Rule: `WHERE user_id = ? AND deleted_at IS NULL`.
   - Never counts soft-deleted resumes.

2. **Completed Analyses**:
   - Counts only records where `analysis_status = 'completed'` belonging to the user's active resumes.
   - SQL Rule: `WHERE r.user_id = ? AND r.deleted_at IS NULL AND ra.analysis_status = 'completed'`.
   - Pending or failed analyses are excluded.

3. **Average Resume Score**:
   - Computes `ROUND(AVG(ra.overall_score), 1)` across all completed analyses for the user's active resumes.
   - Excludes `NULL` scores and failed/pending analyses.
   - When no completed analyses exist, returns `null` (displayed as `"—"` in the UI).

4. **Total Job Matches**:
   - Counts job comparisons linked to the user's active resumes via `job_matches`.
   - SQL Rule: `JOIN resumes r ON jm.resume_id = r.resume_id WHERE r.user_id = ? AND r.deleted_at IS NULL`.

---

## 5. Frontend Components Created & Updated

1. **[frontend/src/services/dashboardService.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/services/dashboardService.js)**:
   - Exposes `getDashboardSummary()` using existing `api.js` (cookie credentials, CSRF headers, no manual JWT tokens in localStorage).

2. **[frontend/src/components/dashboard/StatCard.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/dashboard/StatCard.jsx)**:
   - Displays numeric metrics with Lucide icons, color accents (`blue`, `emerald`, `indigo`, `amber`), loading skeletons, and optional status badges.

3. **[frontend/src/components/dashboard/RecentResumes.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/dashboard/RecentResumes.jsx)**:
   - Displays recent resumes with document icon badges (PDF / DOCX), processing status pills (`Ready`, `Processing`, `Uploaded`, `Failed`), formatted timestamps, and direct "Analyze" action links.
   - Includes an empty state with an upload action button for users without resumes.

4. **[frontend/src/components/dashboard/RecentAnalyses.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/dashboard/RecentAnalyses.jsx)**:
   - Displays recent analysis evaluations with color-coded score badges (>= 80 emerald, >= 60 amber, < 60 rose), status indicator, and "View Report" actions.
   - Includes an empty state prompting the user to start their first analysis.

5. **[frontend/src/components/dashboard/QuickActions.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/dashboard/QuickActions.jsx)**:
   - Provides 4 quick workflow launch cards: "Upload Resume", "Analyze Resume", "Job Matching", and "Resume Builder".

6. **[frontend/src/components/dashboard/DashboardSkeleton.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/dashboard/DashboardSkeleton.jsx)**:
   - Full layout pulse animation skeleton mirroring the header, 4 stat cards, quick action cards, and dual data tables.

7. **[frontend/src/pages/dashboard/Dashboard.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/pages/dashboard/Dashboard.jsx)**:
   - Combines greeting with live user name, refresh button, real-time backend health check, stat cards, quick actions, empty state onboarding card (when `totalResumes === 0`), recent resumes, and recent analyses.

---

## 6. Multi-Tenant Security & Isolation Verification

- **Server-Side Authentication**: Identity is verified strictly from the signed JWT access token in the `HttpOnly` cookie (`req.user.id`). Client-supplied `userId` parameters are never accepted.
- **Strict Tenant Scoping**: Every query filters by `user_id = ?` or `r.user_id = ?`.
- **Cross-User Protection**: Verified via automated test cases where User A and User B concurrently have resumes and analyses; User B cannot see any data or metrics belonging to User A.
- **Sanitized Responses**: Internal file storage paths (`file_path`) are strictly omitted from responses.

---

## 7. Testing & Quality Assurance

### Automated Backend Test Suite Results:
Executed via `npm --prefix backend test`:
```
Registration Suite:           12 Passed, 0 Failed
Login Suite:                  11 Passed, 0 Failed
Protected Routes Suite:       14 Passed, 0 Failed
Frontend Auth Suite:          14 Passed, 0 Failed
Dashboard Summary Suite:       6 Passed, 0 Failed
-------------------------------------------------
TOTAL:                        57 Passed, 0 Failed (100% Pass Rate)
```

### Dashboard Summary Specific Test Cases ([backend/tests/dashboardSummary.test.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/tests/dashboardSummary.test.js)):
- **Case 1**: Unauthenticated request to `/api/dashboard/summary` is rejected with HTTP 401.
- **Case 2**: New user with zero records returns zero counts, `null` average score, and empty arrays `[]`.
- **Case 3**: User A calculates exact metrics (2 active resumes, 2 completed analyses, avg 85.0, 1 job match).
- **Case 4**: Soft-deleted resumes (`deleted_at IS NOT NULL`) are strictly excluded from all counts and lists.
- **Case 5**: Server storage file paths are strictly omitted from responses.
- **Case 6**: Multi-tenant isolation verified: User B sees strictly their own 3 resumes and 0 from User A.

### Frontend Production Build:
- **Command**: `npm --prefix frontend run build`
- **Output**: 2,219 modules transformed into `dist/assets/index-BPxQqmZy.js` (380 kB) and `dist/assets/index-C8Y_tz7_.css` (33 kB).
- **Status**: Exit code 0, 0 errors, 0 warnings.

---

## 8. Remaining Issues & Next Steps

- **No Remaining Issues**: All requirements for Module 3 Lesson 3.2 are satisfied.
- **Next Steps (Module 4)**: Implement file intake pipeline (Resume Upload API with Multer, PDF/DOCX text extraction with `pdf-parse` and `mammoth`, and database insertion into `resumes` and `resume_files`).

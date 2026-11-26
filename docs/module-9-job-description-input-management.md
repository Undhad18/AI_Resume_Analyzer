# Module 9 — Lesson 9.1: Job Description Input & Management

## 1. Lesson Objective

The primary objective of **Lesson 9.1** is to provide complete Job Description Input and Management functionality within the standalone AI Resume Analyzer. Users can create, view, edit, search, paginate, and delete target job descriptions. These saved records will serve as the foundation for resume-job matching and keyword alignment in subsequent lessons (Lesson 9.2 and 9.3).

---

## 2. Existing Architecture Inspected

- **Frontend Routing**: React Router v7 configured in `frontend/src/routes/AppRoutes.jsx` with protected route wrappers (`ProtectedRoute.jsx`) and `MainLayout.jsx`.
- **Navigation**: `frontend/src/components/dashboard/navigationItems.js` includes the existing "Job Matching" entry pointing to `/job-matching`.
- **Backend Architecture**: Express.js server in `backend/app.js` with cookie-based CSRF protection, rate limiting, and JWT authentication (`authenticateToken`).
- **Database Architecture**: MySQL with `mysql2/promise` pool connection in `backend/config/db.js`. Existing tables include `users`, `resumes`, `resume_analyses`, `resume_versions`, and `resume_enhancement_drafts`.

---

## 3. Database Table and Migration Details

### Migration File:
`backend/scripts/migrateAddJobDescriptions.js`

### Schema Definition:
```sql
CREATE TABLE IF NOT EXISTS job_descriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NULL,
  experience_required VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  description MEDIUMTEXT NOT NULL,
  source_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jd_user (user_id),
  INDEX idx_jd_created (created_at),
  INDEX idx_jd_title (job_title),
  INDEX idx_jd_company (company_name),
  CONSTRAINT fk_jd_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Backend API Endpoints

All endpoints require standard Bearer / cookie JWT authentication (`authenticateToken`).

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/job-descriptions` | Create a new job description | 201, 400, 401, 500 |
| `GET` | `/api/job-descriptions` | List & search authenticated user's job descriptions | 200, 400, 401, 500 |
| `GET` | `/api/job-descriptions/:id` | View full job description details | 200, 400, 401, 404, 500 |
| `PUT` | `/api/job-descriptions/:id` | Update allowed fields of an existing job description | 200, 400, 401, 404, 500 |
| `DELETE` | `/api/job-descriptions/:id` | Permanently delete a job description | 200, 400, 401, 404, 500 |

### Query Parameters for `GET /api/job-descriptions`:
- `search` (string, max 100): Searches across `job_title`, `company_name`, `location`, and `description`.
- `page` (integer >= 1, default: 1): Current pagination page.
- `limit` (integer 1-100, default: 10): Page size.
- `sortBy` (`created_at` \| `updated_at` \| `job_title` \| `company_name`, default: `created_at`).
- `sortOrder` (`ASC` \| `DESC`, default: `DESC`).

---

## 5. Validation Rules (Zod)

`backend/validators/jobDescriptionSchema.js`:
- **`jobTitle`**: Required, trimmed string, min 2, max 255 characters.
- **`companyName`**: Optional string, trimmed, max 255 characters.
- **`experienceRequired`**: Optional string, trimmed, max 100 characters.
- **`location`**: Optional string, trimmed, max 255 characters.
- **`description`**: Required, trimmed string, min 10, max 50,000 characters.
- **`sourceUrl`**: Optional URL validating format `http://` or `https://`, max 500 characters.
- Client-supplied `user_id`, `id`, `created_at`, or `updated_at` parameters are ignored/rejected.

---

## 6. Frontend Components

1. **`JobDescriptions.jsx`** (`frontend/src/pages/dashboard/JobDescriptions.jsx`):
   - Primary dashboard view mounted at `/job-matching` and `/job-descriptions`.
   - Header with title, module badge, and "Add Job Description" CTA.
   - Debounced search bar with instant clear.
   - Responsive card grid displaying saved listings.
   - Pagination controls with bounded navigation.
   - Loading skeleton, empty states (both generic and search-filtered), and error handling.
2. **`JobDescriptionCard.jsx`** (`frontend/src/components/jobDescriptions/JobDescriptionCard.jsx`):
   - Card representation with job title, company name, location, experience requirement, creation date, and description preview.
   - Quick actions for View, Edit, and Delete.
3. **`JobDescriptionFormModal.jsx`** (`frontend/src/components/jobDescriptions/JobDescriptionFormModal.jsx`):
   - Dual-mode modal for Adding new and Editing existing job descriptions.
   - Client-side validation with real-time feedback.
   - Submitting indicator preventing duplicate submissions.
4. **`JobDescriptionDetailsModal.jsx`** (`frontend/src/components/jobDescriptions/JobDescriptionDetailsModal.jsx`):
   - Full details modal rendering job requirements with whitespace preservation.
   - Strictly renders content as safe text nodes (no `dangerouslySetInnerHTML`).
5. **`DeleteConfirmationModal.jsx`** (`frontend/src/components/jobDescriptions/DeleteConfirmationModal.jsx`):
   - Two-step destructive confirmation dialog identifying the exact job title.

---

## 7. Authentication & Ownership Security

1. **Server-Side Tenant Isolation**:
   - Every database query explicitly filters by `user_id = ?`.
   - User B cannot view, list, update, or delete User A's job descriptions. Any attempt to access unauthorized IDs returns HTTP `404 Not Found` (preventing ID enumeration).
2. **SQL Injection Prevention**:
   - All queries use parameterized statements (`?`) with `mysql2`.
3. **Safe Text Rendering**:
   - Description text is rendered as plain text nodes with CSS `whitespace-pre-wrap`, eliminating XSS vulnerabilities.
4. **CSRF & Credentials**:
   - Preserves existing cookie and header CSRF configurations.

---

## 8. Verification & Test Suite

### Running Backend Tests:
```bash
cd backend
npm run test:job-descriptions
```

### Running Frontend Tests:
```bash
cd frontend
npm run test:job-descriptions
```

### Running Full Verification:
```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

## 9. Known Limitations & Next Steps

- **Lesson 9.1 Scope**: This lesson intentionally handles job description storage and management only.
- **Lesson 9.2 (Upcoming)**: Automated keyword matching, skill extraction, and match percentage calculations between resumes and saved job descriptions.

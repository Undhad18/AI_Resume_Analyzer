# Module 7: AI Improvement and Recommendations
## Lesson 7.4: Resume Enhancement and Rewriting

### 1. Overview & Objective
Lesson 7.4 introduces an intelligent, safe, and fact-preserving **Resume Enhancement and Rewriting Engine** to the standalone AI Resume Analyzer. It allows candidates to transform weak, passive, unformatted, or repetitive resume content into crisp, high-impact professional phrasing while maintaining strict truthfulness and zero fabrication of candidate qualifications.

---

### 2. Core Architectural Pillars

#### A. Strict Fact Preservation Guarantee
The resume rewriting engine strictly guarantees **zero factual fabrication**:
* **No Invented Metrics**: Unquantified statements (e.g., *"Built a website"*) are rewritten for clarity and active-verb impact (e.g., *"Engineered and deployed responsive website"*), but **never** injected with fabricated numbers, percentages, or dollar figures (e.g., *"improved performance by 42%"*).
* **No Hallucinated Experience**: Job titles, company names, employment dates, academic credentials, institutions, and core skills are preserved verbatim.
* **Grounded Rewriting**: Polish is limited to sentence structure, active action verbs, concise phrasing, and formatting standardization.

#### B. Dual Operating Modes
1. **100% Free Deterministic Engine**:
   - Zero OpenAI API calls; 100% offline and cost-free.
   - Cleans irregular whitespace, non-breaking spaces, and punctuation spacing.
   - Normalizes date representations (`2023-05` or `05/2023` to `May 2023`).
   - Normalizes and deduplicates skills case-insensitively (e.g., `React.js` and `react.js` deduplicated into `React`).
   - Safely replaces passive responsibility openers (`Responsible for the development of` $\to$ `Developed`).
2. **Advanced AI Mode (OpenAI Responses API)**:
   - Uses `gpt-4o-mini` with structured JSON schema output and low temperature ($0.2$) for factual reliability.
   - System prompts enforce strict instruction boundaries and fact-preservation rules.
   - **Automated Graceful Fallback**: If OpenAI returns a 429 quota error, rate limit, timeout, or missing key, the engine automatically catches the error, logs a clean notice, and falls back to the deterministic Free Mode with complete continuity and clear attribution.

#### C. Enhancement Scopes
- `full_resume`: Rewrites and polishes all applicable resume sections (`professionalSummary`, `skills`, `experience`, `projects`, `education`, `certifications`, `achievements`).
- `single_section`: Targets only one candidate-selected section, leaving all other sections strictly unchanged.

---

### 3. Database Schema & Non-Destructive Versioning

#### Table: `resume_enhancement_drafts`
```sql
CREATE TABLE IF NOT EXISTS resume_enhancement_drafts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resume_id BIGINT NOT NULL,
    version_id BIGINT NULL,
    enhancement_mode ENUM('free', 'advanced') NOT NULL DEFAULT 'free',
    scope ENUM('full_resume', 'single_section') NOT NULL DEFAULT 'full_resume',
    section_name VARCHAR(100) NULL,
    original_content JSON NOT NULL,
    enhanced_content JSON NOT NULL,
    changes_summary TEXT NULL,
    status ENUM('draft', 'approved', 'discarded') NOT NULL DEFAULT 'draft',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_resume_draft (user_id, resume_id),
    INDEX idx_draft_status (status),
    CONSTRAINT fk_enhancement_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_enhancement_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Non-Destructive Workflow:
1. **Never Overwrite**: The original uploaded file and raw extracted text in `resumes` and `resume_files` remain permanently preserved.
2. **Draft State**: Enhancements are generated into `resume_enhancement_drafts` with `status = 'draft'`.
3. **Candidate Customization**: The candidate can review the side-by-side diff, edit any enhanced section in real time, and save draft modifications.
4. **Approval & Version Registration**: Clicking "Approve" transitions the draft to `status = 'approved'`, timestamps it, and inserts a new official version record in `resume_versions` with `version_type = 'improved'`.
5. **Discard**: Clicking "Discard" marks the draft as `'discarded'` without modifying versions or resumes.

---

### 4. REST API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/resumes/:resumeId/enhance` | Generate an enhancement draft (`mode`: free/advanced, `scope`: full/single) | Yes (JWT) |
| `GET` | `/api/resumes/:resumeId/enhance/draft` | Fetch the latest enhancement draft with computed section diffs | Yes (JWT) |
| `PUT` | `/api/resumes/:resumeId/enhance/draft/:draftId` | Save manual candidate edits to the enhanced draft content | Yes (JWT) |
| `POST` | `/api/resumes/:resumeId/enhance/draft/:draftId/approve` | Approve draft and create an `improved` version in `resume_versions` | Yes (JWT) |
| `POST` | `/api/resumes/:resumeId/enhance/draft/:draftId/discard` | Safely discard the enhancement draft | Yes (JWT) |

---

### 5. Frontend UI Components

The enhancement suite is integrated directly into `ResumeAnalysisModal.jsx` under the **"Enhance & Rewrite"** subnav tab (`Wand2` icon):

- `EnhancementModeSelector.jsx`: Toggle between 100% Free Mode and Advanced AI.
- `EnhancementScopeSelector.jsx`: Toggle between Full Resume and Single Section (with section picker).
- `ResumeComparison.jsx`: Side-by-side split diff view comparing original text with enhanced text and highlighting applied polish.
- `EnhancedSectionEditor.jsx`: Real-time candidate editor to adjust phrasing before approval.
- `EnhancedResumePreview.jsx`: Clean, professional full-resume rendering of the enhanced draft.
- `EnhancementActions.jsx`: Dedicated action bar supporting "Save Draft Edits", "Approve & Register Version", and "Discard Draft".
- `ResumeEnhancement.jsx`: Master orchestrator component managing state, draft loading, API calls, and alerts.

---

### 6. Automated Testing Verification
The test suite `backend/tests/resumeEnhancement.test.js` runs on isolated test port **5090** and verifies 21 distinct scenarios:
- **Test Group 1**: Zod schema validation for input options, section restrictions, and draft updates.
- **Test Group 2**: Deterministic Free Mode engine (whitespace normalization, date standardization, passive-to-active transformations, deduplication, and fact-preservation verification).
- **Test Group 3**: Advanced AI Mode with graceful fallback to Free Mode under 429 quota exhaustion.
- **Test Group 4**: Draft creation, retrieval, candidate edits, approval versioning, and discard workflow.
- **Test Group 5**: HTTP REST endpoints and multi-tenant security verification.

All 21 test assertions pass cleanly with zero regressions across the codebase.

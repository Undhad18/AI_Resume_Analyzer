# Module 7: AI Improvement and Recommendations
## Lesson 7.1: Resume Strengths and Weaknesses Detection

### 1. Lesson Objective
The objective of Lesson 7.1 is to build a reliable, evidence-based **Resume Strengths and Weaknesses Detection Engine** for the standalone AI Resume Analyzer. Every detected strength and weakness is grounded in explicit textual citations from the candidate's structured resume content, eliminating fabricated claims, hallucinations, and unverified assumptions. The system provides actionable, constructive recommendations and works 100% offline in **Free Rule-Based Mode** (zero OpenAI API calls required) while also supporting **Advanced AI Mode** via the OpenAI Responses API.

---

### 2. Strength Detection Model (10 Dimensions)
Strengths are detected across 10 evaluation dimensions. A strength is only generated when verified positive evidence exists in the resume:

1. **Professional Summary (`summary`)**:
   - Detects well-articulated career summaries (>= 35 chars, >= 8 words) highlighting professional identity, domain focus, and engineering level.
2. **Technical Skills (`skills`)**:
   - Detects clearly categorized technical skills across programming languages, frameworks, databases, DevOps, and tools (>= 4 skills).
3. **Hands-on Practical Skill Application (`projects` / `skills`)**:
   - Matches declared technical skills against practical project technologies and experience descriptions.
4. **Soft Skills & Collaborative Competencies (`skills`)**:
   - Detects interpersonal, Agile, Scrum, mentoring, and team leadership keywords backed by contextual usage.
5. **Work Experience & Internships (`experience`)**:
   - Detects structured career history with defined positions, companies, dates, and responsibility bullet points.
6. **Technical Projects Portfolio (`projects`)**:
   - Detects hands-on personal or open-source projects specifying architecture, tech stack, and implementation details.
7. **Academic Qualifications (`education`)**:
   - Identifies complete degree titles, major/field of study, and accredited institutions.
8. **Industry Certifications (`certifications`)**:
   - Detects verified certifications from recognized vendors (e.g., AWS, Azure, Google Cloud, Scrum Alliance).
9. **Quantifiable Impact & Achievements (`achievements`)**:
   - Detects measurable metrics, percentages (e.g., `40%`), currency metrics (`$`), throughput/scale (`50,000 req/s`, `10,000 users`), and recognized honors/awards.
10. **Standard Section Organization (`structure`)**:
    - Validates presence of core standard sections (Contact Info, Summary, Skills, Experience/Projects, Education).

---

### 3. Weakness Detection & Constructive Recommendations (12 Dimensions)
Potential improvement areas are formulated constructively and respectfully:

1. **Missing or Incomplete Professional Summary (`summary`)**:
   - Recommends adding a 2-3 sentence overview of primary tech stack, experience level, and domain focus.
2. **Skills Without Supporting Evidence (`skills`)**:
   - Identifies declared skills that are never applied or referenced in any project or work history description.
3. **General or Passive Work Descriptions (`experience`)**:
   - Identifies passive phrasing ("responsible for", "assisted with") or overly brief responsibilities (< 25 chars), recommending strong action verbs (e.g. *Developed*, *Architected*, *Automated*).
4. **Missing Project Outcomes & Impact (`projects`)**:
   - Flags projects that describe features/tools but omit tangible outcomes, user adoption, or performance metrics.
5. **Sparse Quantifiable Achievements (`achievements`)**:
   - Encourages incorporating numerical data, percentage improvements, and measurable scale.
6. **Incomplete Education Details (`education`)**:
   - Identifies missing institution name, incomplete degree title, or graduation date.
7. **Unclear Employment Dates (`experience`)**:
   - Flags roles lacking month/year date ranges, clarifying chronology.
8. **Inconsistent Section Headings (`structure`)**:
   - Flags non-standard or unconventional headings that reduce ATS parsing accuracy.
9. **Repeated Content & Redundancy (`readability`)**:
   - Flags identical lines or duplicate phrasing repeated across sections.
10. **Excessively Long Sentences (`readability`)**:
    - Flags run-on sentences (> 35 words) and suggests breaking into concise 15-25 word bullet points.
11. **Missing Portfolio or Profile Links (`contact_information`)**:
    - Recommends adding GitHub, LinkedIn, or personal portfolio URL (classified as low-impact optional item).
12. **Missing Essential Contact Information (`contact_information`)**:
    - Flags absence of email address or contact phone number (high impact).

#### Special Handling for Fresher / Entry-Level Resumes:
* Freshers or students with 0 formal experience are **never** penalized with negative work experience findings.
* Practical academic or personal projects are recognized as the primary demonstration of competence.
* Candidates are guided to build 2-3 comprehensive personal or open-source projects.

---

### 4. Zod Validation Schemas
Located in `backend/validators/strengthsWeaknessesSchema.js`:
* `strengthFindingSchema`: `{ id, title, description, category, evidence: string[], importance, confidence }`
* `weaknessFindingSchema`: `{ id, title, description, category, evidence: string[], impact, confidence, suggestion }`
* `missingInfoFindingSchema`: `{ field, reason, importance }`
* `strengthsWeaknessesResponseSchema`: Master schema validating complete payload structure.

---

### 5. API Endpoints

#### POST `/api/resumes/:resumeId/strengths-weaknesses`
* **Authentication**: Required (`Bearer <JWT>`)
* **Security**: IDOR protection (strictly scoped to `req.user.id`)
* **Request Body**:
  ```json
  {
    "analysisMode": "free" // or "ai"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Resume strengths and weaknesses analyzed successfully",
    "data": {
      "resumeId": 535,
      "userId": 458,
      "analysisMode": "free",
      "strengths": [ ... ],
      "weaknesses": [ ... ],
      "missingInformation": [ ... ],
      "analysisSummary": "Profile analysis completed with ...",
      "limitations": [ ... ],
      "analyzedAt": "2026-11-26T06:57:50.000Z"
    }
  }
  ```

#### GET `/api/resumes/:resumeId/strengths-weaknesses`
* **Authentication**: Required (`Bearer <JWT>`)
* **Returns**: Latest saved record from `resume_strengths_weaknesses` table.

---

### 6. Database Schema (`resume_strengths_weaknesses`)
```sql
CREATE TABLE IF NOT EXISTS resume_strengths_weaknesses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resume_id BIGINT NOT NULL,
    analysis_id BIGINT NULL,
    analysis_mode VARCHAR(20) NOT NULL DEFAULT 'free',
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'strengths_weaknesses',
    strengths_result JSON NOT NULL,
    weaknesses_result JSON NOT NULL,
    missing_info_result JSON NULL,
    status ENUM('completed', 'failed') NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_resume (user_id, resume_id),
    CONSTRAINT fk_rsw_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_rsw_resume FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) ON DELETE CASCADE
);
```

---

### 7. Frontend User Interface
* **`StrengthCard.jsx`**: Displays verified strengths with value badge and expandable citations.
* **`WeaknessCard.jsx`**: Displays constructive improvement opportunities with actionable recommendation box.
* **`FindingEvidence.jsx`**: Interactive quotation box displaying exact source citations.
* **`FindingImportance.jsx`**: Standardized badges for priority levels (`high`, `medium`, `low`).
* **`MissingInformationList.jsx`**: Grid of non-critical missing or omitted optional items.
* **`StrengthsWeaknessesReportView.jsx`**: Comprehensive dashboard with metric counters, category filters, Free / AI recalculation triggers, and visual layout limitation disclosures.
* **Integrated in `ResumeAnalysisModal.jsx`**: Bound to the "Strengths & Weaknesses" tab with background prefetching.

---

### 8. Automated Test Suite
* Test File: `backend/tests/strengthsWeaknessesDetection.test.js`
* Command:
  ```powershell
  npm --prefix backend run test:strengths-weaknesses
  ```
* Test Coverage: **30 automated tests (100% passing)**:
  * 8 Strength Detection unit tests
  * 11 Weakness & Improvement Detection unit tests
  * 11 Integration, Security, Persistence, and Regression tests

---

### 9. Known Limitations
* Plain-text extraction from PDF/DOCX tools (`pdf-parse`, `mammoth`) cannot assess visual margins, typography, color palettes, or multi-column graphical layouts.
* The engine evaluates explicitly provided content only; unlisted skills or achievements outside the document cannot be inferred.

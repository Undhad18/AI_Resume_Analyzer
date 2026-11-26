# Module 8: Resume Builder
## Lesson 8.1: Resume Builder UI

### 1. Lesson Objective
The objective of Lesson 8.1 is to establish the foundation of the in-browser **Resume Builder UI** for the AI Resume Analyzer application. Candidates can create, customize, and edit an ATS-friendly, professionally structured resume in real time with an instant live preview.

---

### 2. Existing Frontend Architecture Reused
- **Layout & Routing**: Reused `MainLayout` / `DashboardLayout` ensuring sidebar navigation, top navbar, responsive mobile drawer, and authentication context are fully preserved.
- **Route Protection**: Reused `ProtectedRoute` route guard (`/builder` is strictly protected).
- **Styling**: Tailwind CSS with project-wide color schemes (slate, blue, emerald, indigo, purple).
- **Icons**: Standard `lucide-react` icons matching the rest of the application.
- **Zero Hallucination / Fact Protection**: No AI generation or fabricated details are injected.

---

### 3. Components Created & Files Modified

#### Newly Created:
1. `frontend/src/pages/dashboard/ResumeBuilder.jsx`:
   - Master page providing header, editable resume title, draft status notifications, section quick-jump filters, responsive two-column layout, and mobile view toggle.
2. `frontend/src/components/builder/ResumePreview.jsx`:
   - Real-time ATS-compatible live preview component. Safely renders contact info, summary, skills, experience, education, projects, certifications, and achievements.
   - Automatically hides empty sections to prevent broken or empty placeholders.
3. `frontend/src/components/builder/PersonalInfoForm.jsx`:
   - Personal details form (Full Name, Email, Phone, Location, LinkedIn, GitHub, Portfolio).
4. `frontend/src/components/builder/SummaryForm.jsx`:
   - Professional summary editor with live character counter (600 character ceiling) and ATS writing tips.
5. `frontend/src/components/builder/SkillsForm.jsx`:
   - Technical competencies chip management with "Add" button, Enter key support, removable tags, and duplicate entry prevention.
6. `frontend/src/components/builder/ExperienceForm.jsx`:
   - Work experience form (Job Title, Company, Dates, Responsibilities, Achievements).
7. `frontend/src/components/builder/EducationForm.jsx`:
   - Education form (Institution, Degree, Field of Study, Graduation Year).
8. `frontend/src/components/builder/ProjectsForm.jsx`:
   - Featured projects form (Project Name, Technologies, Description, Project URL).
9. `frontend/src/components/builder/CertificationsForm.jsx`:
   - Certifications form (Certification Name, Issuing Organization, Issue Date).
10. `frontend/src/components/builder/AchievementsForm.jsx`:
    - Key achievements form (Achievement Title, Description).
11. `frontend/src/utils/resumeBuilderValidation.js`:
    - Default resume state template and validation utilities for emails, URLs, and required personal info.
12. `frontend/tests/resumeBuilder.test.js`:
    - Comprehensive test suite covering state shapes, validations, deduplication, and preview filtering.

#### Modified:
- `frontend/src/routes/AppRoutes.jsx`: Connected route `/builder` to `<ResumeBuilder />`.
- `frontend/package.json`: Added `test:builder` script and chained with `test`.

---

### 4. UI Layout & Form Fields

#### A. Two-Column Layout
- **Left Column (Editor Form)**:
  - Section quick-jump bar (`Personal Info`, `Summary`, `Skills`, `Experience`, `Education`, `Projects`, `Certifications`, `Achievements`).
  - Modular, accessible card inputs with focus states and clear labels.
- **Right Column (Live Preview)**:
  - Sticky on desktop (`sticky top-6`), synchronized in real time with form state.
  - Safe text rendering (no `dangerouslySetInnerHTML`), proper text wrapping (`break-words`, `whitespace-pre-wrap`).
- **Mobile Responsive Behavior**:
  - Two-state mobile toggle button (`Editor` vs `Preview`) prevents horizontal overflow and allows small screens to easily view both the form and live output.

#### B. Form Sections
1. **Personal Information**:
   - `fullName` (Required)
   - `email` (Required, email format validated)
   - `phone` (Optional)
   - `location` (Optional)
   - `linkedIn` (Optional, URL validated)
   - `gitHub` (Optional, URL validated)
   - `portfolio` (Optional, URL validated)
2. **Professional Summary**:
   - `professionalSummary` (Textarea, live counter `X / 600`)
3. **Skills**:
   - `skills` (Removable tag chips, duplicate prevention)
4. **Work Experience**:
   - `jobTitle`, `company`, `startDate`, `endDate`, `responsibilities`, `achievements`
5. **Education**:
   - `institution`, `degree`, `fieldOfStudy`, `graduationYear`
6. **Projects**:
   - `name`, `technologies`, `description`, `projectUrl`
7. **Certifications**:
   - `name`, `issuer`, `issueDate`
8. **Achievements**:
   - `title`, `description`

---

### 5. State Management & Draft Handling
- Controlled state initialized with `INITIAL_RESUME_DATA`.
- Checks `localStorage` on initial mount to restore any existing candidate draft.
- "Save Draft" action validates required fields and persists draft to browser `localStorage` with a timestamp notice:
  *"Draft saved locally at [time]. (UI ready; full backend cloud sync scheduled for Module 8.4)."*
- "Reset" button clears local draft and resets state to clean template after user confirmation.

---

### 6. Test Commands & Results
```bash
# Run all frontend tests (Validation + Resume Builder)
npm --prefix frontend test

# Run Resume Builder unit test specifically
npm --prefix frontend run test:builder

# Run linting
npm --prefix frontend run lint

# Build production bundle
npm --prefix frontend run build
```

#### Results:
- `npm test`: **30/30 tests passed** (16 validation tests + 14 resume builder tests).
- `npm run lint`: **0 errors, 0 warnings**.
- `npm run build`: Production build succeeded in 595ms.

---

### 7. Known Scope Boundaries & Next Lessons
- **Lesson 8.2**: Dynamic section management (adding/reordering/removing multiple entries per section) is reserved for Lesson 8.2.
- **Lesson 8.3**: AI content generation and automated section drafting will be implemented in Lesson 8.3.
- **Lesson 8.4**: Server-side draft persistence and database synchronization will be implemented in Lesson 8.4.
- **PDF Generation**: Reserved for subsequent export lessons.

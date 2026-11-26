# Module 8 — Lesson 8.3: AI Content Generation

## 1. Lesson Objective
Lesson 8.3 implements tailored, fact-preserving content generation for the Standalone AI Resume Analyzer Resume Builder across 6 core sections and 4 professional writing styles (tones). It features dual-mode architecture:
- **100% Free Mode (Rule-Based & Template-Based)**: Makes ZERO OpenAI API calls, requires no API key, incurs no cost, and functions offline or under quota exhaustion.
- **Advanced AI Mode (OpenAI GPT-4o-mini)**: Uses the existing singleton OpenAI client with Structured Outputs (`response_format: json_schema`) and Zod schema verification.
- **Strict Fact Preservation Guarantee**: Under no circumstances invents unverified metrics, percentages, dollar figures, company names, titles, skills, or experience for freshers.
- **Live Interactive Approval Workflow**: Generated content is never auto-inserted into the resume; users can review, edit, regenerate, or cancel, and upon acceptance, only the target field/entry is updated immutably.

---

## 2. Existing Architecture Reused
- **OpenAI Client (`backend/config/openai.js`)**: Reused existing lazy singleton without introducing competing clients.
- **Authentication Middleware (`backend/middleware/authMiddleware.js`)**: Enforces JWT token verification on `POST /api/resume-builder/generate-content`.
- **Form State Hook (`frontend/src/hooks/useResumeForm.js`)**: Leveraged immutable section updates (`updateProfessionalSummary`, `updateExperience`, `updateProject`, `addSkill`, `updateEducation`, `updateAchievement`).
- **Live Preview (`frontend/src/components/builder/ResumePreview.jsx`)**: Synchronizes immediately upon accepting generated content.

---

## 3. Supported Sections & Writing Styles

### Supported Sections:
1. `professionalSummary`: 2-4 sentence tailored summary adapted to candidate career level (Fresher vs Experienced) and skills.
2. `experience`: Bullet point formatting converting passive openers ("responsible for", "worked on") into impactful active verbs ("Spearheaded", "Engineered", "Coordinated").
3. `project`: Project overview and contribution bullets incorporating the candidate's actual technology stack.
4. `skills`: Structured technical domain classification (Languages & Runtimes, Frameworks & Libraries, Databases & Cloud, Tools) without adding unlisted tools.
5. `education`: Standardized academic qualification statements with GPA, honors, and coursework formatting.
6. `achievement`: Recognition statement with organization, date, and truthful impact context.

### Supported Tones:
1. `professional`: Formal, balanced, industry-standard resume phrasing.
2. `concise`: Direct, punchy, zero fluff, high signal-to-noise ratio.
3. `technical`: Emphasizes system architecture, frameworks, and engineering depth.
4. `achievement_focused`: Highlights truthful delivered outcomes and strong action verbs without fabricating metrics.

---

## 4. API Specification

### Endpoint:
`POST /api/resume-builder/generate-content`

### Request Headers:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Payload Example:
```json
{
  "mode": "advanced",
  "section": "professionalSummary",
  "tone": "technical",
  "data": {
    "targetRole": "Frontend Developer",
    "experienceLevel": "Fresher",
    "skills": ["React.js", "JavaScript", "Tailwind CSS"],
    "currentSummary": "Computer engineering student with project experience."
  }
}
```

### Response Payload Example:
```json
{
  "success": true,
  "data": {
    "section": "professionalSummary",
    "mode": "ai_generated",
    "generationType": "ai_generated",
    "tone": "technical",
    "generatedContent": "Technical Frontend Developer with strong hands-on aptitude in React.js, JavaScript, and Tailwind CSS. Focused on component-based architecture, clean design patterns, and responsive user experiences.",
    "bullets": [],
    "keyChangesMade": [
      "Applied active technical phrasing",
      "Preserved candidate qualifications strictly"
    ],
    "originalInput": { ... },
    "metadata": {
      "model": "gpt-4o-mini",
      "factPreservationNotice": "Strict fact preservation applied: No unverified metrics or credentials added."
    }
  }
}
```

### HTTP Status Codes:
- `200 OK`: Successful content generation (Free Mode or Advanced AI Mode).
- `400 Bad Request`: Invalid request structure or unsupported section/tone.
- `401 Unauthorized`: Missing or invalid JWT authentication token.
- `422 Unprocessable Entity`: Insufficient input data (e.g. completely blank section).
- `429 Too Many Requests`: OpenAI quota exceeded or IP/user rate limit exceeded.
- `502 Bad Gateway`: OpenAI service failure or schema validation refusal.
- `504 Gateway Timeout`: OpenAI request timed out.

---

## 5. Strict Fact Preservation Rules

| Rule | Enforcement Mechanism |
|---|---|
| **No Fabricated Metrics** | Prompts forbid inserting unverified percentages, dollar amounts, traffic figures, or performance gains. |
| **No Invented Experience for Freshers** | Fresher inputs are strictly framed around projects, foundational skills, and academics. |
| **No Ghost Skills** | Only skills explicitly provided in user data are categorized and presented. |
| **Untrusted Input Boundaries** | User input is serialized as untrusted JSON data inside quotes, preventing prompt injection instructions. |
| **Accuracy Warning Notice** | Mandatory prominent UI notice displayed to users: *"Review generated content carefully. Do not include claims that do not accurately describe your experience."* |

---

## 6. Files Created and Modified

### Backend Files Created:
- `backend/validators/resumeBuilderContentSchema.js`: Zod request/response validation and OpenAI JSON schema format configuration.
- `backend/services/freeContentGeneratorService.js`: Deterministic rule-based content generator (Zero OpenAI calls).
- `backend/services/aiContentGeneratorService.js`: OpenAI Responses API structured generator with comprehensive error handling.
- `backend/controllers/resumeBuilderController.js`: Controller validating input and dispatching between Free Mode and Advanced AI.
- `backend/routes/resumeBuilderRoutes.js`: Express router mounting `/generate-content`.
- `backend/tests/resumeBuilderContent.test.js`: 15 automated test cases covering Free Mode, Advanced AI, rate limits, and error handling.

### Backend Files Modified:
- `backend/app.js`: Registered `/api/resume-builder` router.
- `backend/middleware/rateLimitMiddleware.js`: Added `builderAiLimiter` for rate-limiting AI generation requests.
- `backend/config/openai.js`: Added `setOpenAiClientInstance` test mock helper.
- `backend/package.json`: Chained `test:builder-content` into `npm test`.

### Frontend Files Created:
- `frontend/src/components/builder/GenerationModeSelector.jsx`: Toggle between 100% Free Mode and Advanced AI.
- `frontend/src/components/builder/ContentSectionSelector.jsx`: Section picker with multi-entry selection support.
- `frontend/src/components/builder/ContentToneSelector.jsx`: 4 tone buttons.
- `frontend/src/components/builder/GeneratedContentPreview.jsx`: Preview with editable textarea, origin badge, and accuracy warning.
- `frontend/src/components/builder/GeneratedContentActions.jsx`: Action buttons (Generate, Regenerate, Accept & Insert, Cancel).
- `frontend/src/components/builder/AIContentGenerator.jsx`: Master generation modal dialog.
- `frontend/tests/resumeContentGenerator.test.js`: 10 automated test cases for frontend integration and state isolation.

### Frontend Files Modified:
- `frontend/src/services/resumeService.js`: Added `generateBuilderContent` API client function.
- `frontend/src/pages/dashboard/ResumeBuilder.jsx`: Wired generator modal, top header button, and immutable acceptance updates.
- `frontend/src/components/builder/SummaryForm.jsx`: Added inline "Generate with AI" button.
- `frontend/src/components/builder/ExperienceForm.jsx`: Added inline "Polish with AI" button per entry.
- `frontend/src/components/builder/ProjectsForm.jsx`: Added inline "Generate with AI" button per entry.
- `frontend/src/components/builder/SkillsForm.jsx`: Added inline "Organize with AI" button.
- `frontend/src/components/builder/EducationForm.jsx`: Added inline "Format with AI" button per entry.
- `frontend/src/components/builder/AchievementsForm.jsx`: Added inline "Polish with AI" button per entry.
- `frontend/package.json`: Chained `test:content-generator` into `npm test`.

---

## 7. Automated Test Commands

### Backend Tests:
```bash
npm --prefix backend test
```
*Result*: 23 test suites passing (including 15/15 builder content tests).

### Frontend Tests:
```bash
npm --prefix frontend test
```
*Result*: 61 test cases passing (16 validation + 14 builder + 21 sections + 10 content generator).

### Frontend Lint:
```bash
npm --prefix frontend run lint
```
*Result*: 0 errors, 0 warnings.

### Frontend Production Build:
```bash
npm --prefix frontend run build
```
*Result*: Code 0, cleanly built client bundle.

---

## 8. Manual Testing Steps

1. **Open Resume Builder**: Navigate to `/dashboard/builder`.
2. **Launch Smart Generator**: Click the purple **"AI Generator"** button in the top action bar or the inline button next to any section.
3. **Test 100% Free Mode**:
   - Select **100% Free Mode**.
   - Choose section (e.g. **Professional Summary**) and tone (e.g. **Technical**).
   - Click **Generate Free Content**.
   - Verify content displays with green badge `"Template-Based / Rule-Based"`.
4. **Test Editable Preview**:
   - Edit a word in the generated preview textarea.
   - Verify the origin badge changes to amber `"User-Edited"`.
5. **Test Accept & Insert**:
   - Click **Accept & Insert**.
   - Verify only the targeted section updates. Sibling sections and entries remain untouched.
   - Verify the Live ATS Preview updates synchronously.
6. **Test Advanced AI Mode**:
   - Select **Advanced AI**.
   - Verify structured response returns with purple badge `"AI-Generated (GPT-4o-mini)"` or displays clear quota notice with option to switch to Free Mode if credits are exhausted.

---

## 9. Known Limitations
- Lesson 8.3 focuses exclusively on content formulation and client-side form synchronization. Cloud database synchronization of builder drafts will be implemented in Lesson 8.4.
- Direct PDF export is reserved for Module 9.

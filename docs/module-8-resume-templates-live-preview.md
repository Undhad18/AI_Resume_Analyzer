# Module 8 — Lesson 8.4: Resume Templates & Live Preview

## 1. Lesson Objective
Lesson 8.4 implements four professional resume templates and an interactive live preview inside the AI Resume Analyzer Resume Builder. The architecture decouples presentation templates (`selectedTemplate`) from candidate content (`resumeData`), allowing candidates to toggle between visual designs without mutating, converting, or reloading their resume data.

---

## 2. Existing Architecture Inspected & Reused
- **Resume Builder State (`frontend/src/hooks/useResumeForm.js`)**: Single source of truth for resume data. Retains all section inputs, stable keys, and dynamic arrays.
- **AI Content Generator Integration (Lesson 8.3)**: Any content accepted from the Free Mode or Advanced AI generator flows directly into `resumeData` and updates the active template preview synchronously.
- **Empty Section Suppression**: Automatically hides empty headers and unpopulated blocks across all templates without displaying blank sections.
- **Tailwind CSS Design System**: Uses consistent typography, responsive grid columns, and paper-sheet drop shadows without introducing external heavy styling libraries.

---

## 3. Four Distinct Resume Templates

| Template | ID | Description & Styling Highlights | Best Suited For |
|---|---|---|---|
| **Modern Professional** | `modern` | Clean contemporary layout with blue/indigo theme rules, elegant name heading, border-accented section headers, and modern rounded badge tags for skills. | Technology, startups, engineering, design, and modern corporate roles. |
| **Professional Classic** | `classic` | Traditional corporate resume design with formal serif typography (`font-serif`), centered contact strip, full-width horizontal divider lines, and neutral monochrome palette. | Finance, legal, executive, banking, and traditional corporate recruiters. |
| **Minimalist** | `minimal` | Scandinavian-inspired ultra-clean design with generous whitespace, light typography hierarchy, subtle uppercase category tracking (`tracking-widest`), and no heavy lines. | Creative fields, architecture, product management, and modern editorial profiles. |
| **ATS-Friendly Clean** | `ats` | Strict single-column plain text layout with standard headings (`PROFESSIONAL SUMMARY`, `SKILLS`, `WORK EXPERIENCE`, `EDUCATION`, `PROJECTS`, `CERTIFICATIONS`, `ACHIEVEMENTS`). Eliminates multi-column tables, icons, and decorative graphics to maximize machine parsing reliability. | Online portals, enterprise ATS parsing systems (Workday, Greenhouse, Taleo). |

---

## 4. Component Structure & Responsibilities

```
frontend/src/components/builder/
├── templates/
│   ├── templateConfig.js       # Central template IDs, metadata, and extractValidResumeSections()
│   ├── TemplateSelector.jsx    # Responsive selector with interactive thumbnail wireframes
│   ├── TemplateRenderer.jsx    # Component mapping selectedTemplate to the active design
│   ├── ModernTemplate.jsx      # Modern layout implementation
│   ├── ClassicTemplate.jsx     # Classic corporate layout implementation
│   ├── MinimalTemplate.jsx     # Minimalist layout implementation
│   └── ATSTemplate.jsx         # ATS single-column layout implementation
└── ResumePreview.jsx           # Master paper frame container with TemplateSelector and live sync
```

### Component Details:
1. `templateConfig.js`:
   - Defines stable IDs: `modern`, `classic`, `minimal`, `ats`.
   - Exports `extractValidResumeSections(resumeData)` which safely normalizes skills, suppresses empty sections, and provides consistent data extraction across all templates.
2. `TemplateSelector.jsx`:
   - Features responsive visual wireframe thumbnails, template descriptions, badge highlights ("Popular", "Corporate", "Clean", "ATS-Safe"), and active rings.
   - Works seamlessly on both desktop and mobile without horizontal overflow.
3. `TemplateRenderer.jsx`:
   - Acts as a pure functional dispatcher rendering the chosen template component based on `selectedTemplate`.
4. `ResumePreview.jsx`:
   - Renders a paper-like sheet simulation (`bg-white shadow-lg rounded-2xl p-6 sm:p-10 min-h-[700px]`).
   - Displays empty state prompt when no resume content exists.
   - Synchronously updates as the user edits form inputs or accepts AI-generated content.

---

## 5. Live Preview Data Flow

```
[Resume Editor Inputs]  ──>  [useResumeForm State (resumeData)]  ──>  [ResumePreview.jsx]
           │                                                                 │
[AI Content Generator]  ──>  (Accept & Insert)                               ├──> [TemplateSelector]
                                                                             └──> [TemplateRenderer]
                                                                                        │
                                                           ┌────────────────────────────┼────────────────────────────┐
                                                           ▼                            ▼                            ▼
                                                  [ModernTemplate]             [ClassicTemplate]              [ATSTemplate]
                                                                                        ▲
                                                                                        │
                                                                                [MinimalTemplate]
```

- **Props-Driven**: `ResumePreview` takes `resumeData` and `selectedTemplate` directly via props.
- **Zero Duplication**: Presentation settings do not pollute candidate resume records.
- **Safe Rendering**: All text is rendered using standard React children; no `dangerouslySetInnerHTML`.

---

## 6. Files Created or Modified

### Created:
- `frontend/src/components/builder/templates/templateConfig.js`: Template configurations and safe section extraction.
- `frontend/src/components/builder/templates/TemplateSelector.jsx`: Visual template selection component.
- `frontend/src/components/builder/templates/TemplateRenderer.jsx`: Master template dispatcher.
- `frontend/src/components/builder/templates/ModernTemplate.jsx`: Modern layout template.
- `frontend/src/components/builder/templates/ClassicTemplate.jsx`: Professional classic template.
- `frontend/src/components/builder/templates/MinimalTemplate.jsx`: Minimalist template.
- `frontend/src/components/builder/templates/ATSTemplate.jsx`: ATS-optimized single-column template.
- `frontend/tests/resumeTemplates.test.js`: 12 automated test cases for template rendering, switching, and section extraction.
- `docs/module-8-resume-templates-live-preview.md`: This documentation.

### Modified:
- `frontend/src/components/builder/ResumePreview.jsx`: Refactored to integrate `TemplateSelector`, paper sheet container, and `TemplateRenderer`.
- `frontend/src/pages/dashboard/ResumeBuilder.jsx`: Integrated `selectedTemplate` state and passed down to `ResumePreview`.
- `frontend/package.json`: Chained `test:templates` into `npm test`.

---

## 7. Testing & Verification

Run all test suites:
```bash
npm --prefix frontend test
```
*Result*: 73 / 73 passing tests across 5 test suites:
- `resumeValidation.test.js` (16/16)
- `resumeBuilder.test.js` (14/14)
- `resumeSections.test.js` (21/21)
- `resumeContentGenerator.test.js` (10/10)
- `resumeTemplates.test.js` (12/12)

Run ESLint checks:
```bash
npm --prefix frontend run lint
```
*Result*: 0 errors, 0 warnings.

Run production build:
```bash
npm --prefix frontend run build
```
*Result*: Exited with code 0 (`dist/` generated cleanly in ~600ms).

---

## 8. Known Limitations & Scope Boundaries
- In accordance with lesson constraints, PDF export, backend PDF rendering, and PDFKit are **strictly excluded** from Lesson 8.4 and will be implemented in Lesson 8.5.
- Templates are rendered purely in client-side DOM for instantaneous live interaction.

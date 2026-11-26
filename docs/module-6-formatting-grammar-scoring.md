# Module 6: Resume Scoring System — Lesson 6.4: Resume Formatting and Grammar Scoring

## 1. Lesson Objective

Lesson 6.4 introduces a deterministic, explainable, and transparent scoring engine specifically designed to evaluate:
- **Resume Formatting and Structural Consistency (0–100 Points)**
- **Grammar, Spelling, and Writing Quality (0–100 Points)**
- **Technical Vocabulary and Proper Noun Protection**
- **Seamless Integration with Lesson 6.1 (100-Point Overall Composite Rubric)**

Both scoring systems operate **100% locally in Free Mode** without requiring an `OPENAI_API_KEY` or third-party cloud credits, while maintaining full compatibility with Advanced AI Analysis.

---

## 2. Formatting Scoring Model (0–100)

### Internal Parameter Rubric
$$\text{formattingScore} = \sum (\text{rating}_i \times \text{weight}_i)$$

| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Heading Consistency** | **20%** | Evaluates standard section headings (Summary, Skills, Experience, Education, Projects), detects casing consistency (ALL CAPS vs Title Case), and penalizes missing or malformed headings. |
| **Section Organization** | **20%** | Validates logical document sequence, flags duplicate section occurrences, and identifies misplaced contact or personal info. |
| **Bullet Point Structure** | **15%** | Verifies uniform bullet marker symbols (`•`, `-`, `*`), detects broken bullet symbols (e.g. `?` or replacement artifacts), and penalizes long unstructured paragraphs (> 75 words). |
| **Date and Text Consistency** | **15%** | Evaluates consistent date formatting (e.g., `Month YYYY` vs numeric notation), excessive consecutive whitespaces, and missing spaces after punctuation. |
| **Readability & Density** | **20%** | Assesses word count density, flags wall-of-text blocks (> 100 words), and detects excessive repetition of non-technical words. |
| **Special Characters & Extraction Issues** | **10%** | Detects garbled replacement characters (`\uFFFD`, `â€™`, `Ã©`), hyphenated line splits across line wraps, and repeated punctuation (`???`, `!!!!`). |

### Layout Limitations Disclosure
> Plain extracted text from PDF and DOCX files cannot reliably expose visual layout elements such as font families, font sizes, margins, multi-column CSS alignment, or print colors. All formatting checks are performed via text-based heuristics and clearly labeled as text-based evaluations.

---

## 3. Grammar and Spelling Scoring Model (0–100)

### Internal Parameter Rubric
$$\text{grammarScore} = \sum (\text{rating}_i \times \text{weight}_i)$$

| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Spelling Accuracy** | **25%** | Detects common resume misspellings with actionable correction recommendations. |
| **Grammar Correctness** | **25%** | Checks subject-verb agreement (`He have` $\rightarrow$ `He has`), homophone confusion (`their` vs `there`, `your` vs `you're`), and gerund forms after prepositions (`responsible for developing`). |
| **Sentence Structure** | **20%** | Flags run-on sentences (> 40 words without mid-sentence punctuation) and identifies weak passive bullet openers (`was responsible for`). |
| **Professional Language** | **15%** | Detects casual colloquialisms (`lots of`, `tons of`, `cool`, `gonna`), trailing vague lists (`etc.`), and excessive first-person pronoun usage (`I, me, my`). |
| **Clarity and Conciseness** | **15%** | Identifies wordy phrases (`in order to` $\rightarrow$ `to`, `at this point in time` $\rightarrow$ `currently`) and accidental duplicate consecutive words (`the the`). |

### Technical Vocabulary Protection
To prevent false-positive typo alerts, the engine maintains an extensive protected whitelist:
- **Languages & Frameworks**: `JavaScript`, `TypeScript`, `React`, `Node.js`, `Vue`, `Angular`, `Next.js`, `Tailwind CSS`, `GraphQL`, `Express`, etc.
- **Infrastructure & Tools**: `Docker`, `Kubernetes`, `PostgreSQL`, `MongoDB`, `Redis`, `Git`, `GitHub`, `Postman`, `AWS`, `GCP`, `Linux`, `CI/CD`.
- **Candidate & Employer Proper Nouns**: Protected dynamically from name extractions.

---

## 4. Overall Score Integration (100 Points)

Per the Lesson 6.1 architecture:
- **Grammar & Language Quality** directly refines **Resume Content Quality** (out of 25).
- **Formatting & Readability** directly refines **Resume Clarity & Completeness** (out of 10).
- Total composite weight remains exactly **100 points**:
  $$\text{Total Score} = \text{Content Quality (25)} + \text{Skills (20)} + \text{Experience (20)} + \text{Projects (15)} + \text{Education (10)} + \text{Clarity (10)}$$
- Scoring Version: `1.2.0`.

---

## 5. Database Schema & Migration

### Table: `resume_scores`
Migration script: `backend/scripts/migrateAddFormattingGrammarScoring.js`.
- `formatting_score`: `DECIMAL(5,2) NULL` — persists formatting rating (0–100).
- `grammar_score`: `DECIMAL(5,2) NULL` — persists grammar rating (0–100).
- `formatting_result`: `JSON NULL` — stores the 6-parameter formatting breakdown and findings.
- `grammar_result`: `JSON NULL` — stores the 5-parameter grammar breakdown and findings.
- `analysis_mode`: `VARCHAR(20) NOT NULL DEFAULT 'free'`.
- `scoring_version`: `'1.2.0'`.

---

## 6. API Endpoints

### 1. Calculate Formatting and Grammar Score
- **Route**: `POST /api/resumes/:resumeId/formatting-grammar-score`
- **Body**: `{ "analysisMode": "free" }`
- **Auth**: Protected via JWT cookie or `Authorization: Bearer <token>`
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Formatting and grammar score calculated successfully",
  "data": {
    "resumeId": 479,
    "userId": 384,
    "analysisMode": "free",
    "scoringVersion": "1.2.0",
    "formattingScore": 92,
    "grammarScore": 95,
    "overallScore": 86,
    "formatting": {
      "category": "Formatting & Layout",
      "rating": 92,
      "parameters": { ... },
      "findings": [ ... ]
    },
    "grammar": {
      "category": "Grammar & Language",
      "rating": 95,
      "parameters": { ... },
      "findings": [ ... ]
    }
  }
}
```

### 2. Fetch Latest Formatting and Grammar Score
- **Route**: `GET /api/resumes/:resumeId/formatting-grammar-score`
- **Auth**: Protected via JWT (enforces strict tenant isolation)
- **Response**: `200 OK` with cached score record or `404 Not Found`.

---

## 7. Frontend Integration

1. [FormattingScoreCard.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resumes/FormattingScoreCard.jsx):
   - 6 parameter progress bars with earned points.
   - `ReadabilityReport`: Text density, word count, and structural readability assessment.
   - `FormattingFindings`: List of formatting issues with severity tags and recommended actions.
2. [GrammarScoreCard.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resumes/GrammarScoreCard.jsx):
   - 5 parameter progress bars with earned points.
   - `SpellingSuggestions`: Spelling typo list with crossed-out typo and suggested fix.
   - `GrammarFindings`: Language, sentence structure, agreement, and tone findings.
3. [FormattingGrammarReportView.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resumes/FormattingGrammarReportView.jsx):
   - Tabbed container view with recalculate trigger and `ScoringLimitations` layout disclosure.
4. [ResumeAnalysisModal.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resumes/ResumeAnalysisModal.jsx):
   - Integrated "Formatting & Grammar" subnav tab with parallel data loading.

---

## 8. Automated Testing

Run the dedicated test suite:
```powershell
npm --prefix backend run test:formatting-grammar
```

Total: **33 Tests Executed, 33 Passed, 0 Failed**.
- Formatting Tests: Tests 1–12 (standard headings, casing inconsistencies, missing headings, duplicate sections, bullet markers, broken bullets, dense paragraphs, date consistency, garbled characters, repeated punctuation, empty text, Zod validation).
- Grammar Tests: Tests 13–22 (correct spelling, typos with suggestions, technical whitelist, proper nouns, grammar rules, subject-verb agreement, run-on sentences, duplicate words, wordy phrasing, Zod validation).
- Integration Tests: Tests 23–33 (Free mode without OpenAI, 100% local execution, Advanced mode structure, Zod invalid payload rejection, database persistence, overall score weighting, ATS regression check, IDOR tenant protection HTTP 403, 404 handling, detailed score regression check).

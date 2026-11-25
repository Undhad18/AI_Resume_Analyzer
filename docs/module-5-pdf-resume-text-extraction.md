# Module 5 — Lesson 5.1: PDF Resume Text Extraction
**Project:** AI Resume Analyzer  
**Date:** November 25, 2026  
**Status:** Completed & Verified  

---

## 1. Overview & Objective

The objective of Lesson 5.1 is to implement secure, robust server-side text extraction for PDF resumes stored in the application's private storage repository. The extracted text serves as the foundation for downstream AI parsing, ATS scoring, and keyword analysis (Lessons 5.2 - 5.4).

### Key Constraints Observed
- **PDF-Only Scope:** DOCX extraction is intentionally deferred to Lesson 5.2.
- **No OCR:** Image-based or scanned PDFs are detected and rejected with an informative error rather than attempting uninstalled OCR or returning silent empty strings.
- **No AI / LLM Calls:** Text extraction is pure deterministic document stream parsing.
- **Strict Tenant Isolation & Storage Privacy:** Resumes are accessed strictly via database-verified ownership. Raw client file paths and directory structures are never exposed.

---

## 2. PDF Parser & Dependency Architecture

### Parser Details
- **Library:** `pdf-parse`
- **Installed Version:** `v2.4.5` (modern ESM export)
- **Module System:** Node.js ECMAScript Modules (`"type": "module"`)
- **API Architecture:**
  - Modern `PDFParse` class instantiated with `{ data: Buffer }`.
  - Asynchronous `.getText()` returning structured `TextResult` containing:
    - `.total`: Total document page count.
    - `.pages`: Array of `{ num: number, text: string }` representing raw page streams.
  - Resource lifecycle management via `await parser.destroy()`.

---

## 3. Services & Architecture Implementation

### 3.1 Text Normalization & Extraction Service
**File:** `backend/services/pdfExtractionService.js`

Responsibilities:
1. **Input Validation & Binary Gate:** Verifies input is a Buffer or valid storage path and checks the `%PDF-` magic number header before parsing.
2. **Resource Safeguards:**
   - Enforces a 10 MB in-memory processing limit (`MAX_PDF_PROCESS_SIZE_BYTES`) to avoid denial-of-service or memory bloat.
   - Cleans up parser worker resources in a `finally` block using `parser.destroy()`.
3. **Whitespace Normalization (`normalizePdfText`):**
   - Unifies carriage returns (`\r\n` -> `\n`).
   - Normalizes unicode spaces, non-breaking spaces (`\u00A0`), and tabs.
   - Collapses multiple horizontal spaces.
   - Trims each line individually.
   - Preserves paragraph/section breaks while collapsing 3+ consecutive newlines to maximum 2 newlines (`\n\n`).
4. **Scanned & Empty PDF Detection:**
   - If after normalizing all pages the resulting combined text is empty or whitespace-only, the service rejects the document with `HTTP 422 Unprocessable Entity` (`NO_EXTRACTABLE_TEXT`):
     > *"No readable text could be extracted. The document may be an image-based or scanned PDF (OCR text recognition is not supported in this version)."*
5. **Exception Handling:**
   - `PasswordException` $\rightarrow$ `HTTP 422`: Explains the document is password-protected.
   - `InvalidPDFException` / `FormatError` $\rightarrow$ `HTTP 400`: Controlled error for malformed or corrupted files.

### 3.2 Database Storage Update
**File:** `backend/services/resumeStorageService.js`

- Added `updateResumeExtractedText({ resumeId, userId, extractedText })`:
  - Executes `UPDATE resumes SET extracted_text = ?, updated_at = NOW() WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`.
  - Persists the normalized text into the MySQL `resumes.extracted_text` (`longtext`) column for rapid retrieval by upcoming AI scoring modules.

---

## 4. Extraction API Specification

### Endpoint: `POST /api/resumes/:resumeId/extract-text`

#### Request Security & Headers
- **Authentication:** Required (`authenticateToken` middleware via HttpOnly JWT cookie or `Bearer` header).
- **CSRF Protection:** Required double-submit cookie validation (`X-CSRF-Token` header) for state-changing POST requests.
- **Path Isolation:** Client-provided `filePath` or `path` in request body is ignored. Storage path is strictly retrieved from the database row verified by `WHERE r.resume_id = ? AND r.user_id = ? AND r.deleted_at IS NULL`.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "PDF text extracted successfully",
  "data": {
    "resumeId": 189,
    "fileType": "application/pdf",
    "extractedText": "Harshil Undhad - Senior Full-Stack Engineer\n\nExperience:\n- Lead Software Architect...",
    "characterCount": 1420,
    "wordCount": 245,
    "pageCount": 2,
    "pages": [
      { "pageNumber": 1, "characterCount": 780 },
      { "pageNumber": 2, "characterCount": 640 }
    ]
  }
}
```

#### Response Headers
```http
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```

#### Controlled Error Responses
| Scenario | HTTP Status | Response Message |
| :--- | :--- | :--- |
| Unauthenticated request | `401 Unauthorized` | `"Authentication required"` |
| Accessing another user's resume | `403 Forbidden` | `"Access denied: you do not own this resource"` |
| Non-existent resume ID | `404 Not Found` | `"Resume not found"` |
| Attempting to extract DOCX | `400 Bad Request` | `"Text extraction for DOCX resumes is not supported by this PDF extraction endpoint."` |
| Malformed / corrupted PDF | `400 Bad Request` | `"The PDF file is malformed or corrupted and cannot be read."` |
| Password-protected / encrypted PDF | `422 Unprocessable Entity` | `"The PDF document is password-protected or encrypted. Please remove the password and upload an unprotected PDF."` |
| Scanned / image-only / empty PDF | `422 Unprocessable Entity` | `"No readable text could be extracted. The document may be an image-based or scanned PDF (OCR text recognition is not supported in this version)."` |
| PDF > 10 MB | `413 Payload Too Large` | `"PDF exceeds processing limit of 10 MB"` |

---

## 5. Frontend Integration

1. **Service Function (`frontend/src/services/resumeService.js`):**
   - Implemented `extractResumeText(resumeId)` using authenticated Axios client.
2. **Extracted Text Modal (`frontend/src/components/resumes/ExtractedTextModal.jsx`):**
   - Displays character count, word count, and page count in metadata badges.
   - Shows spinner loading state during extraction.
   - Renders text strictly inside preformatted `<pre>` text container (preventing HTML injection).
   - "Copy Text" button with clipboard synchronization and feedback state.
   - Graceful alert banner explaining scanned/image-based PDF limitation if extraction fails.
3. **My Resumes Table Integration (`frontend/src/pages/dashboard/MyResumes.jsx`):**
   - Added `FileSearch` action button on PDF resumes to trigger text extraction modal.

---

## 6. Verification & Test Matrix

All 11 backend test suites and frontend suites were executed:

### Backend Suites (`npm --prefix backend test`)
| Test Suite File | Tests | Result |
| :--- | :--- | :--- |
| `registration.test.js` | 12 | ✅ Passed |
| `login.test.js` | 11 | ✅ Passed |
| `protectedRoutes.test.js` | 10 | ✅ Passed |
| `frontendAuthIntegration.test.js` | 14 | ✅ Passed |
| `dashboardSummary.test.js` | 10 | ✅ Passed |
| `userProfile.test.js` | 12 | ✅ Passed |
| `resumeUpload.test.js` | 11 | ✅ Passed |
| `resumeFileValidation.test.js` | 21 | ✅ Passed |
| `resumeDatabaseStorage.test.js` | 15 | ✅ Passed |
| `resumeListPreviewDelete.test.js` | 34 | ✅ Passed |
| `resumePdfTextExtraction.test.js` | 36 assertions (17 cases) | ✅ Passed |
| **Total Backend Verification** | **186 Tests** | ✅ **186 Passed, 0 Failed** |

### Frontend Suites (`npm --prefix frontend test` & `lint` & `build`)
- **Unit Validation:** 16/16 tests passed (`resumeValidation.test.js`).
- **ESLint Code Quality:** 0 errors, 0 warnings.
- **Production Build:** Vite compiled production bundle in 685ms.

---

## 7. Files Created or Modified

1. **Created:**
   - `backend/services/pdfExtractionService.js`
   - `backend/tests/resumePdfTextExtraction.test.js`
   - `frontend/src/components/resumes/ExtractedTextModal.jsx`
   - `docs/module-5-pdf-resume-text-extraction.md`
2. **Modified:**
   - `backend/controllers/resumeController.js`
   - `backend/routes/resumeRoutes.js`
   - `backend/services/resumeStorageService.js`
   - `backend/package.json`
   - `backend/tests/fixtures/documentFixtures.js`
   - `frontend/src/services/resumeService.js`
   - `frontend/src/pages/dashboard/MyResumes.jsx`

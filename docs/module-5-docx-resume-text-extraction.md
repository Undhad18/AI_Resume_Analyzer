# Module 5 — Lesson 5.2: DOCX Resume Text Extraction
**Project:** AI Resume Analyzer  
**Date:** November 25, 2026  
**Status:** Completed & Verified  

---

## 1. Overview & Objective

Lesson 5.2 implements secure, high-performance server-side raw text extraction for Microsoft Word (`.docx`) resumes using Mammoth.js. This extends the document intake engine built in Lesson 5.1 (PDF extraction) while strictly maintaining consistency, isolation, and backward compatibility.

### Key Rules & Constraints Observed
- **DOCX Extraction via Mammoth.js:** Uses `mammoth.extractRawText({ buffer })` to extract semantic text without converting to lossy HTML.
- **Preserved Existing PDF Engine:** `POST /api/resumes/:resumeId/extract-text` continues to operate without changes or regressions.
- **Deep ZIP & OOXML Security:** Reuses the Module 4 defense-in-depth pipeline (magic numbers, ZIP entries limit, compression ratio check, missing document part check).
- **No OCR:** Scanned or image-only Word documents without selectable text are cleanly rejected with informative error messages.
- **No AI / LLM Calls:** Text extraction is deterministic. Structured entity extraction (skills, education, jobs) belongs to subsequent lessons.

---

## 2. Mammoth Version & Module System

### Parser Architecture
- **Library:** `mammoth`
- **Installed Version:** `v1.13.0`
- **Module System:** Node.js native ECMAScript Modules (`"type": "module"`)
- **API Invocation:**
  ```javascript
  import mammoth from "mammoth";

  const extractFn = mammoth.extractRawText || mammoth.default?.extractRawText;
  const result = await extractFn({ buffer: fileBuffer });
  // result.value: Raw text with paragraph line breaks
  // result.messages: Parser warnings and notifications
  ```

---

## 3. Services & Validation Architecture

### 3.1 DOCX Extraction Service
**File:** `backend/services/docxExtractionService.js`

Responsibilities:
1. **Input Verification:** Accepts an in-memory `Buffer` or a verified private disk storage path. Rejects non-buffer / non-string inputs.
2. **Binary Magic Number Gate:** Verifies initial bytes match the ZIP standard `PK\x03\x04` (`0x50 0x4B 0x03 0x04`).
3. **Resource Safeguards:**
   - 10 MB in-memory processing limit (`MAX_DOCX_PROCESS_SIZE_BYTES`).
   - Deep archive structure validation (`validateDocxDocument`) using `yauzl`:
     - Max entries limit (`500`).
     - Max total uncompressed bytes (`25 MB`).
     - Max compression ratio (`100:1`).
     - Directory traversal / path safety (rejects `..`, `/`, `\`, null bytes).
     - Required OpenXML package components (`[Content_Types].xml` and `word/document.xml`).
4. **Paragraph & Whitespace Normalization (`normalizeDocxText`):**
   - Unifies carriage returns (`\r\n` -> `\n`).
   - Normalizes unicode spaces, non-breaking spaces (`\u00A0`), and tabs.
   - Collapses multiple horizontal spaces.
   - Trims each line individually.
   - Preserves semantic paragraph and heading boundaries (collapses 3+ newlines to max 2 newlines).
5. **Empty & Scanned Document Detection:**
   - If normalized text is empty or whitespace-only, the service returns `HTTP 422 Unprocessable Entity` (`NO_EXTRACTABLE_TEXT`):
     > *"No readable text could be extracted. The document may be empty or contain only images (OCR text recognition is not supported in this version)."*
6. **Exception Handling:**
   - Missing main document part (`word/document.xml`) $\rightarrow$ `HTTP 400`.
   - Corrupted ZIP / truncated archive $\rightarrow$ `HTTP 400`.
   - Password-protected / encrypted document $\rightarrow$ `HTTP 422`.
   - Raw Node.js stack traces are masked from client responses.

### 3.2 Database Storage Update
**File:** `backend/services/resumeStorageService.js`

- Reused `updateResumeExtractedText({ resumeId, userId, extractedText })`:
  - Executes `UPDATE resumes SET extracted_text = ?, updated_at = NOW() WHERE resume_id = ? AND user_id = ? AND deleted_at IS NULL`.
  - Persists extracted text into the MySQL `longtext` column for both PDF and DOCX documents.

---

## 4. API Endpoint Specification

### Endpoint: `POST /api/resumes/:resumeId/extract-docx-text`

#### Security & Access Control
- **Authentication:** Required (`authenticateToken` middleware via HttpOnly cookie or Bearer JWT).
- **CSRF Protection:** Required double-submit cookie check (`X-CSRF-Token` header) for state-changing requests.
- **Tenant Isolation:** Verified against authenticated `req.user.id`. Accessing another tenant's resume returns `HTTP 403 Forbidden`.
- **Format Verification:** If a PDF resume is sent to the DOCX endpoint, it returns `HTTP 400 Bad Request` with an explanation.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "DOCX text extracted successfully",
  "data": {
    "resumeId": 229,
    "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "extractedText": "Professional Summary\n\nFull-Stack Architect with extensive experience in React, Node.js, and cloud systems.\n\nTechnical Skills\n\nLanguages: JavaScript, TypeScript, Python, SQL.\n\nFrameworks: React 19, Express 5, Tailwind CSS.",
    "characterCount": 242,
    "wordCount": 31,
    "warnings": []
  }
}
```

#### Response Headers
```http
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```

#### Error Handling Matrix
| Scenario | Status Code | Message / Code |
| :--- | :--- | :--- |
| Unauthenticated request | `401 Unauthorized` | `"Authentication required"` |
| Accessing another user's resume | `403 Forbidden` | `"Access denied: you do not own this resource"` |
| Non-existent resume ID | `404 Not Found` | `"Resume not found"` |
| Submitting PDF to DOCX endpoint | `400 Bad Request` | `"DOCX text extraction requires a DOCX document. Provided resume is a PDF file."` |
| Missing `word/document.xml` | `400 Bad Request` | `"Invalid DOCX document package: missing 'word/document.xml'."` |
| Corrupted ZIP / invalid binary | `400 Bad Request` | `"Invalid or corrupted DOCX archive..."` |
| Empty or scanned DOCX | `422 Unprocessable Entity` | `"No readable text could be extracted. The document may be empty or contain only images (OCR text recognition is not supported in this version)."` |
| Password-protected DOCX | `422 Unprocessable Entity` | `"The DOCX document is password-protected or encrypted. Please remove the password and upload an unprotected document."` |
| DOCX > 10 MB | `413 Payload Too Large` | `"DOCX exceeds processing limit of 10 MB"` |

---

## 5. Consistency Across PDF and DOCX Services

| Feature | PDF Engine (Lesson 5.1) | DOCX Engine (Lesson 5.2) |
| :--- | :--- | :--- |
| **API Endpoint** | `POST /api/resumes/:id/extract-text` | `POST /api/resumes/:id/extract-docx-text` |
| **Parser Engine** | `pdf-parse` v2.4.5 (`PDFParse`) | `mammoth` v1.13.0 (`extractRawText`) |
| **Common Output** | `resumeId`, `fileType`, `extractedText`, `characterCount`, `wordCount` | `resumeId`, `fileType`, `extractedText`, `characterCount`, `wordCount` |
| **Engine-Specific Metadata**| `pageCount`, `pages` array | `warnings` array |
| **Database Column** | `resumes.extracted_text` | `resumes.extracted_text` |
| **Empty/Scanned Handling** | Controlled `422` (No OCR message) | Controlled `422` (No OCR message) |
| **Security Gates** | JWT, CSRF, IDOR 403, Path Traversal Safe | JWT, CSRF, IDOR 403, Path Traversal Safe |

---

## 6. Frontend Integration

1. **API Client (`frontend/src/services/resumeService.js`):**
   - Added `extractDocxResumeText(resumeId)` alongside `extractResumeText(resumeId)`.
2. **Unified Extracted Text Modal (`frontend/src/components/resumes/ExtractedTextModal.jsx`):**
   - Automatically determines document type (`docx` vs `pdf`) and dispatches the corresponding extraction endpoint.
   - Shows format badge (`DOCX` in sky blue, `PDF` in rose).
   - Renders parser warnings if Mammoth emits any notices.
   - Renders plain text strictly inside a secure `<pre>` block with copy-to-clipboard support.
3. **Document Management Table (`frontend/src/pages/dashboard/MyResumes.jsx`):**
   - Enabled "Extract Text" (`FileSearch` icon) for all uploaded resume rows (both PDF and DOCX).

---

## 7. Test Verification Matrix

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
| `resumePdfTextExtraction.test.js` | 36 assertions | ✅ Passed |
| `resumeDocxTextExtraction.test.js` | 32 assertions (18 cases) | ✅ Passed |
| **Total Backend Verification** | **218 Tests** | ✅ **218 Passed, 0 Failed** |

### Frontend Suites
- `npm --prefix frontend test`: 16/16 Passed (`resumeValidation.test.js`).
- `npm --prefix frontend run lint`: 0 Errors, 0 Warnings.
- `npm --prefix frontend run build`: Vite compiled production bundle in 1.21s.

---

## 8. Files Created or Modified

1. **Created:**
   - `backend/services/docxExtractionService.js`
   - `backend/tests/resumeDocxTextExtraction.test.js`
   - `docs/module-5-docx-resume-text-extraction.md`
2. **Modified:**
   - `backend/controllers/resumeController.js`
   - `backend/routes/resumeRoutes.js`
   - `backend/package.json`
   - `backend/tests/fixtures/documentFixtures.js`
   - `frontend/src/services/resumeService.js`
   - `frontend/src/components/resumes/ExtractedTextModal.jsx`
   - `frontend/src/pages/dashboard/MyResumes.jsx`

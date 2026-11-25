# Module 4 – Lesson 4.2: Backend File Upload API Using Multer

## 1. Executive Summary

This document describes the design, implementation, storage configuration, security guardrails, and verification for **Module 4 – Lesson 4.2: Backend File Upload API Using Multer** of the **AI Resume Analyzer** application.

In this lesson, an authenticated file intake endpoint (`POST /api/resumes/upload`) was constructed using **Multer**. The system utilizes disk storage within a private staging directory outside public static exposure, enforces a **5 MB size limit**, verifies file extensions and MIME types (`.pdf`, `.docx`), randomizes storage filenames to prevent collisions and path traversals, strictly enforces authentication *before* file stream processing, and seamlessly connects to the existing React upload UI.

---

## 2. Multer Configuration & Storage Architecture

### 2.1 Storage Directory & File Naming
Configured in [backend/config/multerConfig.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/config/multerConfig.js):
- **Private Storage Path**: `backend/uploads/resumes/`
- **Directory Creation**: Recursively created at startup if absent (`fs.mkdirSync(UPLOAD_DIR, { recursive: true })`).
- **Access Model**: Not exposed via Express static middleware (`express.static`), preventing direct unauthorized URL access.
- **Randomized Filenames**:
  ```javascript
  const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : ".bin";
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const uniqueFilename = `resume-${Date.now()}-${uniqueId}${safeExt}`;
  ```
  - Eliminates filename collision risks.
  - Prevents path traversal via original filenames.
  - Retains normalized allowlisted extension for downstream parsers.

### 2.2 Boundaries and Allowlist
- **Maximum File Size**: `5 * 1024 * 1024` bytes (5 MB limit).
- **Single File Enforcement**: Limits intake to 1 file per request on the multipart field `"resume"`.
- **Supported Formats**:
  - Adobe PDF (`.pdf` / `application/pdf`)
  - Microsoft Word DOCX (`.docx` / `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`)

---

## 3. Upload API Endpoint Specification

### 3.1 Endpoint Details
- **Route**: `POST /api/resumes/upload`
- **Authentication**: Required (`authenticateToken` middleware executes *before* Multer).
- **Multipart Field Name**: `resume`
- **Controller**: [backend/controllers/resumeController.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/controllers/resumeController.js)
- **Middleware**: [backend/middleware/uploadMiddleware.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/middleware/uploadMiddleware.js)

### 3.2 Request & Response Examples

#### Successful Staged Upload (HTTP 201 Created):
**Request**:
```http
POST /api/resumes/upload HTTP/1.1
Host: localhost:5000
Cookie: token=<jwt_session_cookie>; csrfToken=<csrf_token>
X-CSRF-Token: <csrf_token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryX...

------WebKitFormBoundaryX
Content-Disposition: form-data; name="resume"; filename="senior_developer.pdf"
Content-Type: application/pdf

<PDF Binary Data>
------WebKitFormBoundaryX--
```

**Response**:
```json
{
  "success": true,
  "message": "Resume file uploaded and staged successfully",
  "data": {
    "originalName": "senior_developer.pdf",
    "fileName": "resume-1774512345678-4a9f8b2c1d3e5a7f9b0c2d4e6f8a1b3c.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1572864,
    "uploadedAt": "2026-11-25T08:27:00.000Z"
  }
}
```

*Security Note: Internal server disk paths (`path`, `destination`) are strictly stripped from response payloads.*

#### Error Responses:
- **Unauthenticated (HTTP 401)**:
  ```json
  { "success": false, "message": "Authentication required", "errors": null }
  ```
- **Oversized File (> 5 MB) (HTTP 413)**:
  ```json
  { "success": false, "message": "File size exceeds the 5 MB limit", "errors": null }
  ```
- **Unsupported Format / Image (HTTP 400)**:
  ```json
  { "success": false, "message": "Only PDF and DOCX files are supported", "errors": null }
  ```
- **Missing File in Multipart Payload (HTTP 400)**:
  ```json
  { "success": false, "message": "No resume file was uploaded. Please provide a file in the 'resume' field.", "errors": null }
  ```
- **Unexpected Field Name (HTTP 400)**:
  ```json
  { "success": false, "message": "Unexpected field: expected 'resume'", "errors": null }
  ```

---

## 4. Error Handling and Cleanup

In [backend/middleware/uploadMiddleware.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/backend/middleware/uploadMiddleware.js), Multer execution is wrapped with cleanup logic:
1. When Multer raises an error (such as `LIMIT_FILE_SIZE` or unsupported type mid-stream), any partially streamed file on disk (`req.file.path`) is immediately unlinked using `fs.unlinkSync()`, preventing disk bloat.
2. Status codes are mapped cleanly (413 for size limit, 400 for validation/unexpected fields, 500 for storage faults).
3. Stack traces are suppressed from client responses.

---

## 5. Frontend Integration

1. **Resume Service ([frontend/src/services/resumeService.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/services/resumeService.js))**:
   - Encapsulates `uploadResume(fileOrFormData)`.
   - Populates `FormData` with field key `"resume"`.
   - Relies on Axios to automatically attach the appropriate multipart boundary.

2. **Upload UI ([frontend/src/pages/dashboard/UploadResume.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/pages/dashboard/UploadResume.jsx))**:
   - Displays real loading indicator (`Loader2`, "Uploading Resume...") while request is inflight.
   - Disables the upload button to prevent duplicate submissions.
   - On HTTP 201: Renders real staged file metadata (`originalName`, `fileSize`, "Staging Complete").
   - On Error: Surfaces server-reported validation/size errors with an instant retry action button.

---

## 6. Security Enforcement

- **Auth-Before-Upload**: `authenticateToken` runs before Multer. Unauthenticated requests are rejected before receiving multipart bytes or touching storage.
- **No Directory Traversal**: Generated filenames use UUID/hex tokens; original client filenames are stored purely as metadata.
- **Private Directory**: Files are written to `backend/uploads/resumes`, isolated from public static assets.
- **CSRF Defense**: State-changing POST requests enforce double-submit CSRF cookie token headers.
- **Identity Integrity**: User ownership is derived strictly from verified JWT claims (`req.user.id`).

---

## 7. Verification and Testing

### Automated Test Suites:
Command: `npm --prefix backend test`
```
Registration Suite:           12 Passed, 0 Failed
Login Suite:                  11 Passed, 0 Failed
Protected Routes Suite:       14 Passed, 0 Failed
Frontend Auth Suite:          14 Passed, 0 Failed
Dashboard Summary Suite:       6 Passed, 0 Failed
User Profile Suite:           12 Passed, 0 Failed
Resume Upload Suite:          11 Passed, 0 Failed
-------------------------------------------------
TOTAL BACKEND:                80 Passed, 0 Failed (100% Pass Rate)
```

Command: `npm --prefix frontend test`
```
Frontend Validation Suite:    16 Passed, 0 Failed (100% Pass Rate)
```

Command: `npm --prefix frontend run build`
- **Output**: 2,229 modules transformed in **676ms** with **0 errors and 0 warnings**.

---

## 8. Remaining Limitations & Next Steps

- **Lesson 4.3**: Implement detailed deep content parsing (PDF/DOCX magic byte verification, `pdf-parse` and `mammoth` text extraction, and sanitization).
- **Lesson 4.4**: Implement permanent database persistence in `resumes` and `resume_files` tables.

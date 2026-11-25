# Module 4 – Lesson 4.1: Resume Upload UI

## 1. Executive Summary

This document describes the design, implementation, validation logic, accessibility standards, and verification for **Module 4 – Lesson 4.1: Resume Upload UI** in the **AI Resume Analyzer** application.

In this lesson, an interactive and responsive file intake interface was built, allowing authenticated users to select resumes via drag-and-drop or file browsing. The interface strictly supports **PDF** and **DOCX** files up to **5 MB**, displaying real metadata (file name, type badge, formatted size) upon selection, with actions to change or remove files. The frontend component is prepared for integration with backend multipart storage and AI parsing in Lesson 4.2, strictly avoiding simulated or fake upload success states.

---

## 2. Files Created or Modified

1. **[frontend/src/utils/resumeValidation.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/utils/resumeValidation.js)** *(Created)*:
   - Client-side validation utility enforcing PDF and DOCX format acceptance, a 5 MB file size boundary (`MAX_FILE_SIZE_BYTES = 5,242,880`), non-empty size checks, extension extraction, and readable size formatting (`formatFileSize`).

2. **[frontend/src/components/resume/ResumeDropzone.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resume/ResumeDropzone.jsx)** *(Created)*:
   - Drag-and-drop intake zone with interactive hover and drag-over visual feedback (`isDragging`), drag depth counters to eliminate child-element flicker, keyboard accessibility (`Enter`/`Space`), and hidden file input activation.

3. **[frontend/src/components/resume/SelectedFileCard.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resume/SelectedFileCard.jsx)** *(Created)*:
   - Preview card showing file name, extension badge (PDF/DOCX), formatted size (KB/MB), ready status indicator, "Change" action, and "Remove" action.

4. **[frontend/src/components/resume/UploadInstructions.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/components/resume/UploadInstructions.jsx)** *(Created)*:
   - Side panel detailing supported formats, size constraints, recommendations for text-based resumes over scanned images, and account-scoped data isolation.

5. **[frontend/src/pages/dashboard/UploadResume.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/pages/dashboard/UploadResume.jsx)** *(Created)*:
   - Main page coordinating file selection state, error alerts, readiness banner, action footer with disabled/enabled "Upload & Analyze Resume" button, and responsive grid layout.

6. **[frontend/src/routes/AppRoutes.jsx](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/routes/AppRoutes.jsx)** *(Modified)*:
   - Mounted `<UploadResume />` at `/upload` and configured `/dashboard/upload` redirect inside `<ProtectedRoute>` and `<MainLayout>`.

7. **[frontend/tests/resumeValidation.test.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/tests/resumeValidation.test.js)** *(Created)*:
   - Unit test suite verifying all 16 client validation scenarios.

8. **[frontend/package.json](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/package.json)** *(Modified)*:
   - Added `test` script running `node tests/resumeValidation.test.js`.

---

## 3. Upload Page Routes & Layout

- **Primary Route**: `/upload`
- **Alias Route**: `/dashboard/upload` (redirects to `/upload`)
- **Protection**: Guarded by `<ProtectedRoute>` ensuring unauthenticated visitors are redirected to `/login`.
- **Layout Integration**: Hosted inside `<MainLayout>` / `<DashboardLayout>`, inheriting the sticky desktop sidebar, sticky topbar with automatic "Upload Resume" title resolution, and scrollable middle container.

---

## 4. Supported File Formats & Validation Rules

### Format Specifications:
- **Adobe PDF**: `.pdf` / `application/pdf`
- **Microsoft Word (DOCX)**: `.docx` / `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Maximum File Size**: 5 MB (5,242,880 bytes)

### Validation Rules ([resumeValidation.js](file:///c:/Users/Admin/Desktop/AI_Resume_Analyzer/frontend/src/utils/resumeValidation.js)):
| Check | Condition | Message |
| :--- | :--- | :--- |
| **Missing File** | `!file` | "Please select a resume file." |
| **Empty File** | `file.size === 0` | "The selected file is empty." |
| **Oversized File** | `file.size > 5 * 1024 * 1024` | "File size must not exceed 5 MB." |
| **Unsupported Format** | Extension not in `['pdf', 'docx']` | "Only PDF and DOCX files are supported." |
| **Unsupported MIME** | Disallowed non-matching MIME type | "Only PDF and DOCX files are supported." |

*Security Disclaimer: Frontend validation guarantees responsive UI feedback; complete file integrity, magic byte verification, and virus scanning are enforced by the backend upload service in Lesson 4.2.*

---

## 5. UI States Implemented

1. **Initial Empty State**: Displays the dashed dropzone with upload cloud icon, format badges, and "Browse Files" button.
2. **Drag-Over State**: High-contrast blue border (`border-blue-500`), tinted backdrop (`bg-blue-50/80`), bouncing icon, and active drop message.
3. **Valid File Selected State**: Swaps dropzone with `SelectedFileCard`, displaying filename, extension pill, formatted size, and checkmark badge.
4. **Invalid File State**: Displays an alert banner explaining the validation failure, clears the selection, and resets the input ref.
5. **File Removed State**: Resets component to initial empty dropzone and clears native file input value so the same file can be re-selected.
6. **Upload Button Disabled State**: When no file is selected or validation fails, the "Upload & Analyze Resume" button is visually disabled (`bg-slate-100 text-slate-400 cursor-not-allowed`).
7. **Upload Ready State**: When a valid file is loaded, the button becomes active with hover and focus effects (`bg-blue-600 hover:bg-blue-700`).

---

## 6. Accessibility & Responsiveness

- **Keyboard Navigation**: The dropzone has `tabIndex={0}` and triggers file selection on `Enter` or `Space` keypress.
- **Hidden Input**: Native `<input type="file">` is kept with proper `accept` restrictions and triggered programmatically.
- **Screen Reader Support**: ARIA attributes (`aria-label`, `role="button"`) provide explicit context to assistive technologies.
- **Responsive Layout**:
  - **Mobile (< 768px)**: Single-column full-width upload area, large touch targets, wrap-around file details.
  - **Tablet (768px - 1024px)**: Comfortable card padding, full-width actions.
  - **Desktop (>= 1024px)**: Two-column grid layout with 2/3 main intake area and 1/3 guidelines panel.

---

## 7. Verification and Test Results

### Frontend Unit Tests:
Command: `npm --prefix frontend test`
```
=================================================
     AI RESUME ANALYZER - RESUME VALIDATION      
=================================================
[PASS] Case 1: Null file is rejected with appropriate error message
[PASS] Case 2: Valid PDF file (1.5 MB) is accepted
[PASS] Case 3: Valid DOCX file (850 KB) is accepted
[PASS] Case 4: Case-insensitive uppercase extension (.PDF) is accepted
[PASS] Case 5: Empty file (0 bytes) is rejected
[PASS] Case 6: File exceeding 5 MB limit is rejected
[PASS] Case 7a: Image file (.jpg) is rejected with format error
[PASS] Case 7b: Image file (.png) is rejected with format error
[PASS] Case 8: Executable file (.exe) is rejected
[PASS] Case 9a: 0 bytes formats to '0 KB'
[PASS] Case 9b: 512 bytes formats to '512 B'
[PASS] Case 9c: 450 KB formats to '450 KB'
[PASS] Case 9d: 2.5 MB formats to '2.5 MB'
[PASS] Case 10a: Extracts 'pdf'
[PASS] Case 10b: Extracts normalized 'docx'
[PASS] Case 10c: Handles file with no extension
-------------------------------------------------
TEST SUMMARY: 16 Passed, 0 Failed
-------------------------------------------------
```

### Production Build:
Command: `npm --prefix frontend run build`
- **Output**: 2,228 modules transformed in **658ms** with **0 errors and 0 warnings**.
- **Assets**: `dist/assets/index-DYq4-Ib1.js` (406 kB), `dist/assets/index-t4--zcw7.css` (41 kB).

---

## 8. Remaining Issues & Next Steps

- **No Remaining Issues**: All requirements for Module 4 Lesson 4.1 are fully completed.
- **Next Steps (Lesson 4.2)**: Build the backend file upload API (`POST /api/resumes/upload`) using Multer, write files to disk storage, insert records into `resumes` and `resume_files`, and wire the frontend "Upload & Analyze Resume" button to post multipart form data.

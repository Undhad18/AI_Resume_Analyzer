import {
    validateResumeFile,
    formatFileSize,
    getFileExtension,
    MAX_FILE_SIZE_BYTES
} from "../src/utils/resumeValidation.js";

function runValidationTests() {
    console.log("=================================================");
    console.log("     AI RESUME ANALYZER - RESUME VALIDATION      ");
    console.log("=================================================\n");

    let passed = 0;
    let failed = 0;

    const assert = (condition, testName, details = "") => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}: ${details}`);
            failed++;
        }
    };

    // Case 1: Null/undefined file returns required message
    const nullResult = validateResumeFile(null);
    assert(
        nullResult.isValid === false && nullResult.error === "Please select a resume file.",
        "Case 1: Null file is rejected with appropriate error message",
        JSON.stringify(nullResult)
    );

    // Case 2: Valid PDF file passes
    const validPdf = {
        name: "My_Software_Engineer_Resume.pdf",
        size: 1.5 * 1024 * 1024,
        type: "application/pdf"
    };
    const pdfResult = validateResumeFile(validPdf);
    assert(
        pdfResult.isValid === true && pdfResult.error === null,
        "Case 2: Valid PDF file (1.5 MB) is accepted",
        JSON.stringify(pdfResult)
    );

    // Case 3: Valid DOCX file passes
    const validDocx = {
        name: "Developer_Resume.docx",
        size: 850 * 1024,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    const docxResult = validateResumeFile(validDocx);
    assert(
        docxResult.isValid === true && docxResult.error === null,
        "Case 3: Valid DOCX file (850 KB) is accepted",
        JSON.stringify(docxResult)
    );

    // Case 4: Upper-case extension (.PDF / .DOCX) is normalized and accepted
    const uppercasePdf = {
        name: "RESUME_FINAL.PDF",
        size: 2 * 1024 * 1024,
        type: "application/pdf"
    };
    const uppercaseResult = validateResumeFile(uppercasePdf);
    assert(
        uppercaseResult.isValid === true && uppercaseResult.error === null,
        "Case 4: Case-insensitive uppercase extension (.PDF) is accepted",
        JSON.stringify(uppercaseResult)
    );

    // Case 5: Empty file (0 bytes) is rejected
    const emptyFile = {
        name: "empty_resume.pdf",
        size: 0,
        type: "application/pdf"
    };
    const emptyResult = validateResumeFile(emptyFile);
    assert(
        emptyResult.isValid === false && emptyResult.error === "The selected file is empty.",
        "Case 5: Empty file (0 bytes) is rejected",
        JSON.stringify(emptyResult)
    );

    // Case 6: Oversized file (> 5 MB) is rejected
    const oversizedFile = {
        name: "huge_portfolio_resume.pdf",
        size: MAX_FILE_SIZE_BYTES + 1024, // 5 MB + 1 KB
        type: "application/pdf"
    };
    const oversizedResult = validateResumeFile(oversizedFile);
    assert(
        oversizedResult.isValid === false && oversizedResult.error === "File size must not exceed 5 MB.",
        "Case 6: File exceeding 5 MB limit is rejected",
        JSON.stringify(oversizedResult)
    );

    // Case 7: Unsupported image formats (JPG/PNG) are rejected
    const jpgFile = {
        name: "resume_photo.jpg",
        size: 500 * 1024,
        type: "image/jpeg"
    };
    const jpgResult = validateResumeFile(jpgFile);
    assert(
        jpgResult.isValid === false && jpgResult.error === "Only PDF and DOCX files are supported.",
        "Case 7a: Image file (.jpg) is rejected with format error",
        JSON.stringify(jpgResult)
    );

    const pngFile = {
        name: "scanned_resume.png",
        size: 1.2 * 1024 * 1024,
        type: "image/png"
    };
    const pngResult = validateResumeFile(pngFile);
    assert(
        pngResult.isValid === false && pngResult.error === "Only PDF and DOCX files are supported.",
        "Case 7b: Image file (.png) is rejected with format error",
        JSON.stringify(pngResult)
    );

    // Case 8: Executable / script files are rejected
    const exeFile = {
        name: "resume.exe",
        size: 100 * 1024,
        type: "application/x-msdownload"
    };
    const exeResult = validateResumeFile(exeFile);
    assert(
        exeResult.isValid === false && exeResult.error === "Only PDF and DOCX files are supported.",
        "Case 8: Executable file (.exe) is rejected",
        JSON.stringify(exeResult)
    );

    // Case 9: formatFileSize helper accurately formats units
    assert(formatFileSize(0) === "0 KB", "Case 9a: 0 bytes formats to '0 KB'");
    assert(formatFileSize(512) === "512 B", "Case 9b: 512 bytes formats to '512 B'");
    assert(formatFileSize(450 * 1024) === "450 KB", "Case 9c: 450 KB formats to '450 KB'");
    assert(formatFileSize(2.5 * 1024 * 1024) === "2.5 MB", "Case 9d: 2.5 MB formats to '2.5 MB'");

    // Case 10: getFileExtension helper extracts cleanly
    assert(getFileExtension("resume.pdf") === "pdf", "Case 10a: Extracts 'pdf'");
    assert(getFileExtension("my.final.resume.DOCX") === "docx", "Case 10b: Extracts normalized 'docx'");
    assert(getFileExtension("no_extension") === "", "Case 10c: Handles file with no extension");

    console.log("\n-------------------------------------------------");
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log("-------------------------------------------------\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runValidationTests();

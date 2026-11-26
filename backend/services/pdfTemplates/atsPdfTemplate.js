/**
 * ATS-Friendly Resume PDF Template (Lesson 8.5)
 * Strict single-column layout with standard section headings, plain text bullets, and zero parsing obstacles.
 * Avoids multi-columns, icons, tables, and complex shapes to maximize machine readability.
 */

import { extractValidPdfSections, ensureSpace } from "./pdfDataHelper.js";

export const renderAtsPdf = (doc, resumeData) => {
  const {
    personalInfo,
    hasPersonalInfo,
    hasLinks,
    professionalSummary,
    hasSummary,
    skills,
    hasSkills,
    validExperience,
    validEducation,
    validProjects,
    validCertifications,
    validAchievements
  } = extractValidPdfSections(resumeData);

  const leftMargin = doc.page.margins.left;
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const rightBoundary = leftMargin + contentWidth;

  // 1. Single-Column Plain Text Header
  if (hasPersonalInfo) {
    if (personalInfo.fullName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#000000")
        .text(personalInfo.fullName.toUpperCase(), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    }

    const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);
    if (contactParts.length > 0) {
      doc
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#111111")
        .text(contactParts.join(" | "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.15);
    }

    if (hasLinks) {
      const linkParts = [];
      if (personalInfo.linkedIn) linkParts.push(`LinkedIn: ${personalInfo.linkedIn}`);
      if (personalInfo.gitHub) linkParts.push(`GitHub: ${personalInfo.gitHub}`);
      if (personalInfo.portfolio) linkParts.push(`Portfolio: ${personalInfo.portfolio}`);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#222222")
        .text(linkParts.join(" | "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.25);
    }

    // Simple single divider line
    const lineY = doc.y + 2;
    doc
      .strokeColor("#333333")
      .lineWidth(0.75)
      .moveTo(leftMargin, lineY)
      .lineTo(rightBoundary, lineY)
      .stroke();
    doc.y = lineY + 8;
  }

  // Section Heading Helper
  const drawSectionHeading = (title) => {
    ensureSpace(doc, 45);
    doc.moveDown(0.35);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#000000")
      .text(title.toUpperCase(), leftMargin, doc.y, { width: contentWidth });

    const dividerY = doc.y + 1;
    doc
      .strokeColor("#666666")
      .lineWidth(0.5)
      .moveTo(leftMargin, dividerY)
      .lineTo(rightBoundary, dividerY)
      .stroke();

    doc.y = dividerY + 6;
  };

  // 2. Professional Summary
  if (hasSummary) {
    drawSectionHeading("PROFESSIONAL SUMMARY");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#111111")
      .text(professionalSummary, leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 2.5
      });
    doc.moveDown(0.35);
  }

  // 3. Skills
  if (hasSkills) {
    drawSectionHeading("SKILLS");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#111111")
      .text(skills.join(", "), leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 2.5
      });
    doc.moveDown(0.35);
  }

  // 4. Work Experience
  if (validExperience.length > 0) {
    drawSectionHeading("WORK EXPERIENCE");

    validExperience.forEach((exp) => {
      ensureSpace(doc, 45);

      const title = exp.jobTitle || "Job Title";
      const companyPart = exp.company ? ` | ${exp.company}` : "";
      const locationPart = exp.location ? ` | ${exp.location}` : "";
      const headerLine = `${title}${companyPart}${locationPart}`;

      const dateText = exp.currentlyWorking
        ? `${exp.startDate || ""} - Present`
        : exp.startDate && exp.endDate
        ? `${exp.startDate} - ${exp.endDate}`
        : exp.startDate || exp.endDate || "";

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#000000")
        .text(headerLine, leftMargin, doc.y, { width: contentWidth });

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333333")
          .text(dateText, leftMargin, doc.y, { width: contentWidth });
        doc.moveDown(0.1);
      }

      if (exp.responsibilities) {
        // Split multi-line responsibilities into clean text bullet items
        const lines = exp.responsibilities
          .split(/\r?\n/)
          .map((l) => l.trim().replace(/^[-*•\s]+/, ""))
          .filter((l) => l.length > 0);

        if (lines.length > 1) {
          lines.forEach((line) => {
            doc
              .font("Helvetica")
              .fontSize(9)
              .fillColor("#111111")
              .text(`-  ${line}`, leftMargin + 10, doc.y, {
                width: contentWidth - 10,
                lineGap: 2
              });
          });
        } else {
          doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#111111")
            .text(exp.responsibilities, leftMargin + 10, doc.y, {
              width: contentWidth - 10,
              lineGap: 2
            });
        }
        doc.moveDown(0.15);
      }

      if (exp.achievements) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#000000")
          .text("Key Achievement: ", leftMargin + 10, doc.y, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("#111111")
          .text(exp.achievements, { lineGap: 2 });
        doc.moveDown(0.15);
      }

      doc.moveDown(0.25);
    });
  }

  // 5. Education
  if (validEducation.length > 0) {
    drawSectionHeading("EDUCATION");

    validEducation.forEach((edu) => {
      ensureSpace(doc, 35);

      const degreePart = edu.degree || "Degree";
      const fieldPart = edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : "";
      const instPart = edu.institution ? ` | ${edu.institution}` : "";
      const headerLine = `${degreePart}${fieldPart}${instPart}`;

      const dateText = edu.startDate && (edu.endDate || edu.graduationYear)
        ? `${edu.startDate} - ${edu.endDate || edu.graduationYear}`
        : edu.graduationYear || edu.endDate || edu.startDate || "";

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#000000")
        .text(headerLine, leftMargin, doc.y, { width: contentWidth });

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333333")
          .text(dateText, leftMargin, doc.y);
      }

      if (edu.grade) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333333")
          .text(`Grade / GPA: ${edu.grade}`, leftMargin, doc.y);
      }

      if (edu.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#111111")
          .text(edu.description, leftMargin + 10, doc.y, {
            width: contentWidth - 10,
            lineGap: 1.5
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 6. Projects
  if (validProjects.length > 0) {
    drawSectionHeading("PROJECTS");

    validProjects.forEach((proj) => {
      ensureSpace(doc, 35);

      const name = proj.projectName || "Project";
      const dateText = proj.startDate && proj.endDate
        ? ` (${proj.startDate} - ${proj.endDate})`
        : proj.startDate || proj.endDate
        ? ` (${proj.startDate || proj.endDate})`
        : "";
      const urlText = proj.projectUrl ? ` | Link: ${proj.projectUrl}` : "";

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#000000")
        .text(`${name}${dateText}${urlText}`, leftMargin, doc.y, { width: contentWidth });

      if (proj.technologies) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333333")
          .text(`Technologies: ${proj.technologies}`, leftMargin, doc.y);
      }

      if (proj.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#111111")
          .text(proj.description, leftMargin + 10, doc.y, {
            width: contentWidth - 10,
            lineGap: 2
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 7. Certifications
  if (validCertifications.length > 0) {
    drawSectionHeading("CERTIFICATIONS");

    validCertifications.forEach((cert) => {
      ensureSpace(doc, 20);

      const title = cert.certificationName || "Certification";
      const issuer = cert.issuingOrganization ? ` - ${cert.issuingOrganization}` : "";
      const date = cert.issueDate ? ` (${cert.issueDate})` : "";
      const link = cert.credentialUrl ? ` | Link: ${cert.credentialUrl}` : "";

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#111111")
        .text(`${title}${issuer}${date}${link}`, leftMargin, doc.y, { width: contentWidth });

      doc.moveDown(0.15);
    });
  }

  // 8. Achievements
  if (validAchievements.length > 0) {
    drawSectionHeading("ACHIEVEMENTS");

    validAchievements.forEach((ach) => {
      ensureSpace(doc, 20);

      const date = ach.date ? ` (${ach.date})` : "";
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#000000")
        .text(`${ach.title}${date}`, leftMargin, doc.y, { width: contentWidth });

      if (ach.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#111111")
          .text(ach.description, leftMargin + 10, doc.y, {
            width: contentWidth - 10,
            lineGap: 2
          });
      }

      doc.moveDown(0.2);
    });
  }
};

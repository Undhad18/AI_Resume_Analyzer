/**
 * Minimalist Resume PDF Template (Lesson 8.5)
 * Scandinavian-inspired ultra-clean design with generous whitespace and refined typography.
 */

import { extractValidPdfSections, ensureSpace } from "./pdfDataHelper.js";

export const renderMinimalPdf = (doc, resumeData) => {
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

  // 1. Understated Minimal Header
  if (hasPersonalInfo) {
    if (personalInfo.fullName) {
      doc
        .font("Helvetica")
        .fontSize(22)
        .fillColor("#0f172a")
        .text(personalInfo.fullName, leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    }

    const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);
    if (contactParts.length > 0) {
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#64748b")
        .text(contactParts.join("     "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.15);
    }

    if (hasLinks) {
      const linkParts = [];
      if (personalInfo.linkedIn) linkParts.push(`linkedin: ${personalInfo.linkedIn}`);
      if (personalInfo.gitHub) linkParts.push(`github: ${personalInfo.gitHub}`);
      if (personalInfo.portfolio) linkParts.push(`portfolio: ${personalInfo.portfolio}`);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#475569")
        .text(linkParts.join("     "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.25);
    }

    // Subtle faint separator
    const lineY = doc.y + 2;
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(0.5)
      .moveTo(leftMargin, lineY)
      .lineTo(rightBoundary, lineY)
      .stroke();
    doc.y = lineY + 12;
  }

  // Section Heading Helper
  const drawSectionHeading = (title) => {
    ensureSpace(doc, 45);
    doc.moveDown(0.4);

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#64748b")
      .text(title.toUpperCase(), leftMargin, doc.y, {
        width: contentWidth,
        characterSpacing: 1.2
      });

    doc.moveDown(0.25);
  };

  // 2. Professional Summary
  if (hasSummary) {
    drawSectionHeading("About");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#334155")
      .text(professionalSummary, leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 3
      });
    doc.moveDown(0.4);
  }

  // 3. Capabilities / Skills
  if (hasSkills) {
    drawSectionHeading("Capabilities");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#334155")
      .text(skills.join("   /   "), leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 3
      });
    doc.moveDown(0.4);
  }

  // 4. Experience
  if (validExperience.length > 0) {
    drawSectionHeading("Experience");

    validExperience.forEach((exp) => {
      ensureSpace(doc, 48);

      const title = exp.jobTitle || "Role";
      const companyPart = exp.company ? ` / ${exp.company}` : "";
      const locationPart = exp.location ? ` (${exp.location})` : "";
      const roleText = `${title}${companyPart}${locationPart}`;

      const dateText = exp.currentlyWorking
        ? `${exp.startDate || ""} - Present`
        : exp.startDate && exp.endDate
        ? `${exp.startDate} - ${exp.endDate}`
        : exp.startDate || exp.endDate || "";

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0f172a")
        .text(roleText, leftMargin, startY, { width: contentWidth - 120 });

      const roleEndY = doc.y;

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#94a3b8")
          .text(dateText, rightBoundary - 110, startY, {
            width: 110,
            align: "right"
          });
      }

      doc.y = Math.max(roleEndY, startY + 11);

      if (exp.responsibilities) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#475569")
          .text(exp.responsibilities, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 2.2
          });
        doc.moveDown(0.2);
      }

      if (exp.achievements) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#334155")
          .text("Impact: ", leftMargin, doc.y, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text(exp.achievements, { lineGap: 2 });
        doc.moveDown(0.2);
      }

      doc.moveDown(0.3);
    });
  }

  // 5. Education
  if (validEducation.length > 0) {
    drawSectionHeading("Education");

    validEducation.forEach((edu) => {
      ensureSpace(doc, 40);

      const degreePart = edu.degree || "Degree";
      const fieldPart = edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : "";
      const instPart = edu.institution ? ` - ${edu.institution}` : "";
      const titleText = `${degreePart}${fieldPart}${instPart}`;

      const dateText = edu.startDate && (edu.endDate || edu.graduationYear)
        ? `${edu.startDate} - ${edu.endDate || edu.graduationYear}`
        : edu.graduationYear || edu.endDate || edu.startDate || "";

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(titleText, leftMargin, startY, { width: contentWidth - 110 });

      const textEndY = doc.y;

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#94a3b8")
          .text(dateText, rightBoundary - 100, startY, {
            width: 100,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 11);

      if (edu.grade) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(`GPA: ${edu.grade}`, leftMargin, doc.y);
      }

      if (edu.description) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#475569")
          .text(edu.description, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 1.5
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 6. Projects
  if (validProjects.length > 0) {
    drawSectionHeading("Projects");

    validProjects.forEach((proj) => {
      ensureSpace(doc, 40);

      const name = proj.projectName || "Project";
      const startY = doc.y;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(name, leftMargin, startY, { width: contentWidth - 110 });

      const nameEndY = doc.y;

      const dateText = proj.startDate && proj.endDate
        ? `${proj.startDate} - ${proj.endDate}`
        : proj.startDate || proj.endDate || "";

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#94a3b8")
          .text(dateText, rightBoundary - 100, startY, {
            width: 100,
            align: "right"
          });
      }

      doc.y = Math.max(nameEndY, startY + 11);

      if (proj.technologies) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#64748b")
          .text(`Stack: ${proj.technologies}`, leftMargin, doc.y);
      }

      if (proj.projectUrl) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#475569")
          .text(`Link: ${proj.projectUrl}`, leftMargin, doc.y);
      }

      if (proj.description) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#475569")
          .text(proj.description, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 2
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 7. Certifications
  if (validCertifications.length > 0) {
    drawSectionHeading("Certifications");

    validCertifications.forEach((cert) => {
      ensureSpace(doc, 25);

      const title = cert.certificationName || "Certification";
      const issuer = cert.issuingOrganization ? ` - ${cert.issuingOrganization}` : "";
      const certText = `${title}${issuer}`;

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#0f172a")
        .text(certText, leftMargin, startY, { width: contentWidth - 90 });

      const textEndY = doc.y;

      if (cert.issueDate) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#94a3b8")
          .text(cert.issueDate, rightBoundary - 85, startY, {
            width: 85,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (cert.credentialUrl) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#64748b")
          .text(`Credential: ${cert.credentialUrl}`, leftMargin, doc.y);
      }

      doc.moveDown(0.2);
    });
  }

  // 8. Achievements
  if (validAchievements.length > 0) {
    drawSectionHeading("Achievements");

    validAchievements.forEach((ach) => {
      ensureSpace(doc, 25);

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#0f172a")
        .text(ach.title, leftMargin, startY, { width: contentWidth - 90 });

      const textEndY = doc.y;

      if (ach.date) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#94a3b8")
          .text(ach.date, rightBoundary - 85, startY, {
            width: 85,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (ach.description) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#475569")
          .text(ach.description, leftMargin, doc.y, {
            width: contentWidth,
            lineGap: 2
          });
      }

      doc.moveDown(0.2);
    });
  }
};

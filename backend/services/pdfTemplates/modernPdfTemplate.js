/**
 * Modern Resume PDF Template (Lesson 8.5)
 * Contemporary aesthetic with clean blue accents, timeline style headers, and structured typography.
 */

import { extractValidPdfSections, ensureSpace } from "./pdfDataHelper.js";

export const renderModernPdf = (doc, resumeData) => {
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

  // 1. Header: Full Name
  if (hasPersonalInfo) {
    if (personalInfo.fullName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#0f172a")
        .text(personalInfo.fullName, leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.2);
    }

    // Contact Details Line
    const contactParts = [personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean);
    if (contactParts.length > 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(contactParts.join("   •   "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.15);
    }

    // Social & Professional Links
    if (hasLinks) {
      const linkParts = [];
      if (personalInfo.linkedIn) linkParts.push(`LinkedIn: ${personalInfo.linkedIn}`);
      if (personalInfo.gitHub) linkParts.push(`GitHub: ${personalInfo.gitHub}`);
      if (personalInfo.portfolio) linkParts.push(`Portfolio: ${personalInfo.portfolio}`);

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#2563eb")
        .text(linkParts.join("   |   "), leftMargin, doc.y, { width: contentWidth });
      doc.moveDown(0.3);
    }

    // Modern Blue Accent Divider Line
    const lineY = doc.y + 2;
    doc
      .strokeColor("#2563eb")
      .lineWidth(2)
      .moveTo(leftMargin, lineY)
      .lineTo(rightBoundary, lineY)
      .stroke();
    doc.y = lineY + 12;
  }

  // Section Heading Helper
  const drawSectionHeading = (title) => {
    ensureSpace(doc, 45);
    doc.moveDown(0.4);
    const startY = doc.y;

    // Small vertical accent bar
    doc
      .rect(leftMargin, startY, 3, 11)
      .fill("#2563eb");

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1e40af")
      .text(title.toUpperCase(), leftMargin + 8, startY + 1, { width: contentWidth - 8 });

    doc.y = startY + 15;
  };

  // 2. Professional Summary
  if (hasSummary) {
    drawSectionHeading("Professional Summary");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#334155")
      .text(professionalSummary, leftMargin + 8, doc.y, {
        width: contentWidth - 8,
        lineGap: 2.5
      });
    doc.moveDown(0.4);
  }

  // 3. Technical & Professional Skills
  if (hasSkills) {
    drawSectionHeading("Technical & Professional Skills");
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#1e293b")
      .text(skills.join("   •   "), leftMargin + 8, doc.y, {
        width: contentWidth - 8,
        lineGap: 3
      });
    doc.moveDown(0.4);
  }

  // 4. Work Experience
  if (validExperience.length > 0) {
    drawSectionHeading("Work Experience");

    validExperience.forEach((exp) => {
      ensureSpace(doc, 55);

      const title = exp.jobTitle || "Role";
      const companyPart = exp.company ? ` - ${exp.company}` : "";
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
        .text(roleText, leftMargin + 8, startY, { width: contentWidth - 140 });

      const roleEndY = doc.y;

      if (dateText) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(dateText, rightBoundary - 130, startY, {
            width: 130,
            align: "right"
          });
      }

      doc.y = Math.max(roleEndY, startY + 12);

      if (exp.responsibilities) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(exp.responsibilities, leftMargin + 12, doc.y, {
            width: contentWidth - 12,
            lineGap: 2
          });
        doc.moveDown(0.2);
      }

      if (exp.achievements) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#1e40af")
          .text("Key Achievement: ", leftMargin + 12, doc.y, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("#334155")
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
      ensureSpace(doc, 45);

      const degreePart = edu.degree ? edu.degree : "Degree";
      const fieldPart = edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : "";
      const instPart = edu.institution ? ` - ${edu.institution}` : "";
      const titleText = `${degreePart}${fieldPart}${instPart}`;

      const dateText = edu.startDate && (edu.endDate || edu.graduationYear)
        ? `${edu.startDate} - ${edu.endDate || edu.graduationYear}`
        : edu.graduationYear || edu.endDate || edu.startDate || "";

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0f172a")
        .text(titleText, leftMargin + 8, startY, { width: contentWidth - 130 });

      const textEndY = doc.y;

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(dateText, rightBoundary - 120, startY, {
            width: 120,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 12);

      if (edu.grade) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(`Grade / GPA: ${edu.grade}`, leftMargin + 12, doc.y);
      }

      if (edu.description) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#475569")
          .text(edu.description, leftMargin + 12, doc.y, {
            width: contentWidth - 12,
            lineGap: 1.5
          });
      }

      doc.moveDown(0.3);
    });
  }

  // 6. Projects
  if (validProjects.length > 0) {
    drawSectionHeading("Projects");

    validProjects.forEach((proj) => {
      ensureSpace(doc, 45);

      const name = proj.projectName || "Project";
      const startY = doc.y;

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#0f172a")
        .text(name, leftMargin + 8, startY, { width: contentWidth - 140 });

      const nameEndY = doc.y;

      const dateText = proj.startDate && proj.endDate
        ? `${proj.startDate} - ${proj.endDate}`
        : proj.startDate || proj.endDate || "";

      if (dateText) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(dateText, rightBoundary - 130, startY, {
            width: 130,
            align: "right"
          });
      }

      doc.y = Math.max(nameEndY, startY + 12);

      if (proj.technologies) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#2563eb")
          .text("Technologies: ", leftMargin + 12, doc.y, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text(proj.technologies);
      }

      if (proj.projectUrl) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#2563eb")
          .text(`URL: ${proj.projectUrl}`, leftMargin + 12, doc.y);
      }

      if (proj.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(proj.description, leftMargin + 12, doc.y, {
            width: contentWidth - 12,
            lineGap: 2
          });
      }

      doc.moveDown(0.3);
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
        .fontSize(9)
        .fillColor("#0f172a")
        .text(certText, leftMargin + 8, startY, { width: contentWidth - 110 });

      const textEndY = doc.y;

      if (cert.issueDate) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(cert.issueDate, rightBoundary - 100, startY, {
            width: 100,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (cert.credentialUrl) {
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#2563eb")
          .text(`Credential: ${cert.credentialUrl}`, leftMargin + 12, doc.y);
      }

      doc.moveDown(0.2);
    });
  }

  // 8. Achievements
  if (validAchievements.length > 0) {
    drawSectionHeading("Honors & Achievements");

    validAchievements.forEach((ach) => {
      ensureSpace(doc, 30);

      const startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#0f172a")
        .text(ach.title, leftMargin + 8, startY, { width: contentWidth - 110 });

      const textEndY = doc.y;

      if (ach.date) {
        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#64748b")
          .text(ach.date, rightBoundary - 100, startY, {
            width: 100,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (ach.description) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#334155")
          .text(ach.description, leftMargin + 12, doc.y, {
            width: contentWidth - 12,
            lineGap: 2
          });
      }

      doc.moveDown(0.25);
    });
  }
};

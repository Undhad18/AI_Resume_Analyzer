/**
 * Professional / Classic Resume PDF Template (Lesson 8.5)
 * Traditional corporate design with formal serif typography (Times-Roman) and full-width rules.
 */

import { extractValidPdfSections, ensureSpace } from "./pdfDataHelper.js";

export const renderClassicPdf = (doc, resumeData) => {
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

  // 1. Formal Centered Header
  if (hasPersonalInfo) {
    if (personalInfo.fullName) {
      doc
        .font("Times-Bold")
        .fontSize(22)
        .fillColor("#111827")
        .text(personalInfo.fullName.toUpperCase(), leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      doc.moveDown(0.2);
    }

    const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email].filter(Boolean);
    if (contactParts.length > 0) {
      doc
        .font("Times-Roman")
        .fontSize(9.5)
        .fillColor("#374151")
        .text(contactParts.join("   •   "), leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      doc.moveDown(0.15);
    }

    if (hasLinks) {
      const linkParts = [];
      if (personalInfo.linkedIn) linkParts.push(`LinkedIn: ${personalInfo.linkedIn}`);
      if (personalInfo.gitHub) linkParts.push(`GitHub: ${personalInfo.gitHub}`);
      if (personalInfo.portfolio) linkParts.push(`Portfolio: ${personalInfo.portfolio}`);

      doc
        .font("Times-Roman")
        .fontSize(9)
        .fillColor("#1f2937")
        .text(linkParts.join("   |   "), leftMargin, doc.y, {
          width: contentWidth,
          align: "center"
        });
      doc.moveDown(0.25);
    }

    // Classic Double / Strong Underline
    const lineY = doc.y + 2;
    doc
      .strokeColor("#111827")
      .lineWidth(1.2)
      .moveTo(leftMargin, lineY)
      .lineTo(rightBoundary, lineY)
      .stroke();
    doc.y = lineY + 10;
  }

  // Section Heading Helper
  const drawSectionHeading = (title) => {
    ensureSpace(doc, 45);
    doc.moveDown(0.35);

    doc
      .font("Times-Bold")
      .fontSize(10.5)
      .fillColor("#111827")
      .text(title.toUpperCase(), leftMargin, doc.y, { width: contentWidth });

    const dividerY = doc.y + 2;
    doc
      .strokeColor("#374151")
      .lineWidth(0.75)
      .moveTo(leftMargin, dividerY)
      .lineTo(rightBoundary, dividerY)
      .stroke();

    doc.y = dividerY + 6;
  };

  // 2. Executive Summary
  if (hasSummary) {
    drawSectionHeading("Executive Summary");
    doc
      .font("Times-Roman")
      .fontSize(9.5)
      .fillColor("#1f2937")
      .text(professionalSummary, leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 2.5
      });
    doc.moveDown(0.35);
  }

  // 3. Core Competencies & Skills
  if (hasSkills) {
    drawSectionHeading("Core Competencies & Skills");
    doc
      .font("Times-Roman")
      .fontSize(9.5)
      .fillColor("#1f2937")
      .text(skills.join("   •   "), leftMargin, doc.y, {
        width: contentWidth,
        lineGap: 3
      });
    doc.moveDown(0.35);
  }

  // 4. Professional Experience
  if (validExperience.length > 0) {
    drawSectionHeading("Professional Experience");

    validExperience.forEach((exp) => {
      ensureSpace(doc, 50);

      const title = exp.jobTitle || "Position";
      const companyPart = exp.company ? `, ${exp.company}` : "";
      const locationPart = exp.location ? ` - ${exp.location}` : "";
      const roleText = `${title}${companyPart}${locationPart}`;

      const dateText = exp.currentlyWorking
        ? `${exp.startDate || ""} - Present`
        : exp.startDate && exp.endDate
        ? `${exp.startDate} - ${exp.endDate}`
        : exp.startDate || exp.endDate || "";

      const startY = doc.y;
      doc
        .font("Times-Bold")
        .fontSize(10)
        .fillColor("#111827")
        .text(roleText, leftMargin, startY, { width: contentWidth - 130 });

      const roleEndY = doc.y;

      if (dateText) {
        doc
          .font("Times-Italic")
          .fontSize(9)
          .fillColor("#4b5563")
          .text(dateText, rightBoundary - 120, startY, {
            width: 120,
            align: "right"
          });
      }

      doc.y = Math.max(roleEndY, startY + 12);

      if (exp.responsibilities) {
        doc
          .font("Times-Roman")
          .fontSize(9.5)
          .fillColor("#1f2937")
          .text(exp.responsibilities, leftMargin + 8, doc.y, {
            width: contentWidth - 8,
            lineGap: 2
          });
        doc.moveDown(0.2);
      }

      if (exp.achievements) {
        doc
          .font("Times-BoldItalic")
          .fontSize(9)
          .fillColor("#111827")
          .text("Key Contribution: ", leftMargin + 8, doc.y, { continued: true });
        doc
          .font("Times-Roman")
          .fillColor("#1f2937")
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
      const fieldPart = edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : "";
      const instPart = edu.institution ? `, ${edu.institution}` : "";
      const titleText = `${degreePart}${fieldPart}${instPart}`;

      const dateText = edu.startDate && (edu.endDate || edu.graduationYear)
        ? `${edu.startDate} - ${edu.endDate || edu.graduationYear}`
        : edu.graduationYear || edu.endDate || edu.startDate || "";

      const startY = doc.y;
      doc
        .font("Times-Bold")
        .fontSize(9.5)
        .fillColor("#111827")
        .text(titleText, leftMargin, startY, { width: contentWidth - 120 });

      const textEndY = doc.y;

      if (dateText) {
        doc
          .font("Times-Italic")
          .fontSize(9)
          .fillColor("#4b5563")
          .text(dateText, rightBoundary - 110, startY, {
            width: 110,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 11);

      if (edu.grade) {
        doc
          .font("Times-Roman")
          .fontSize(9)
          .fillColor("#4b5563")
          .text(`Honors / Grade: ${edu.grade}`, leftMargin + 8, doc.y);
      }

      if (edu.description) {
        doc
          .font("Times-Roman")
          .fontSize(9)
          .fillColor("#1f2937")
          .text(edu.description, leftMargin + 8, doc.y, {
            width: contentWidth - 8,
            lineGap: 1.5
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 6. Key Projects
  if (validProjects.length > 0) {
    drawSectionHeading("Key Projects");

    validProjects.forEach((proj) => {
      ensureSpace(doc, 40);

      const name = proj.projectName || "Project";
      const startY = doc.y;

      doc
        .font("Times-Bold")
        .fontSize(9.5)
        .fillColor("#111827")
        .text(name, leftMargin, startY, { width: contentWidth - 120 });

      const nameEndY = doc.y;

      const dateText = proj.startDate && proj.endDate
        ? `${proj.startDate} - ${proj.endDate}`
        : proj.startDate || proj.endDate || "";

      if (dateText) {
        doc
          .font("Times-Italic")
          .fontSize(8.5)
          .fillColor("#4b5563")
          .text(dateText, rightBoundary - 110, startY, {
            width: 110,
            align: "right"
          });
      }

      doc.y = Math.max(nameEndY, startY + 11);

      if (proj.technologies) {
        doc
          .font("Times-Italic")
          .fontSize(8.5)
          .fillColor("#4b5563")
          .text(`Technologies: ${proj.technologies}`, leftMargin + 8, doc.y);
      }

      if (proj.projectUrl) {
        doc
          .font("Times-Roman")
          .fontSize(8)
          .fillColor("#1f2937")
          .text(`URL: ${proj.projectUrl}`, leftMargin + 8, doc.y);
      }

      if (proj.description) {
        doc
          .font("Times-Roman")
          .fontSize(9.5)
          .fillColor("#1f2937")
          .text(proj.description, leftMargin + 8, doc.y, {
            width: contentWidth - 8,
            lineGap: 2
          });
      }

      doc.moveDown(0.25);
    });
  }

  // 7. Certifications
  if (validCertifications.length > 0) {
    drawSectionHeading("Certifications & Licenses");

    validCertifications.forEach((cert) => {
      ensureSpace(doc, 25);

      const title = cert.certificationName || "Certification";
      const issuer = cert.issuingOrganization ? `, ${cert.issuingOrganization}` : "";
      const certText = `${title}${issuer}`;

      const startY = doc.y;
      doc
        .font("Times-Bold")
        .fontSize(9)
        .fillColor("#111827")
        .text(certText, leftMargin, startY, { width: contentWidth - 100 });

      const textEndY = doc.y;

      if (cert.issueDate) {
        doc
          .font("Times-Italic")
          .fontSize(8.5)
          .fillColor("#4b5563")
          .text(cert.issueDate, rightBoundary - 90, startY, {
            width: 90,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (cert.credentialUrl) {
        doc
          .font("Times-Roman")
          .fontSize(8)
          .fillColor("#4b5563")
          .text(`Link: ${cert.credentialUrl}`, leftMargin + 8, doc.y);
      }

      doc.moveDown(0.2);
    });
  }

  // 8. Achievements
  if (validAchievements.length > 0) {
    drawSectionHeading("Honors & Awards");

    validAchievements.forEach((ach) => {
      ensureSpace(doc, 25);

      const startY = doc.y;
      doc
        .font("Times-Bold")
        .fontSize(9)
        .fillColor("#111827")
        .text(ach.title, leftMargin, startY, { width: contentWidth - 100 });

      const textEndY = doc.y;

      if (ach.date) {
        doc
          .font("Times-Italic")
          .fontSize(8.5)
          .fillColor("#4b5563")
          .text(ach.date, rightBoundary - 90, startY, {
            width: 90,
            align: "right"
          });
      }

      doc.y = Math.max(textEndY, startY + 10);

      if (ach.description) {
        doc
          .font("Times-Roman")
          .fontSize(9.5)
          .fillColor("#1f2937")
          .text(ach.description, leftMargin + 8, doc.y, {
            width: contentWidth - 8,
            lineGap: 2
          });
      }

      doc.moveDown(0.2);
    });
  }
};

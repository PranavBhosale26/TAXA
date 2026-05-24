import { jsPDF } from "jspdf";

export type TemplateType = "cv" | "report" | "letter" | "plain";

export interface ExporterOptions {
  author?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  accentColor?: string; // Hex color string, e.g. '#7b2cbf'
}

/**
 * Strips markdown symbols for clean text presentation in documents
 */
export const cleanMarkdownSymbols = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1")     // italic
    .replace(/`([^`]+)`/g, "$1")       // code
    .replace(/__([^_]+)__/g, "$1")     // underline
    .replace(/_([^_]+)_/g, "$1");      // italic
};

/**
 * Sanitizes text to remove emojis and replace unsupported smart quotes/special dashes
 * to prevent jsPDF WinAnsiEncoding rendering crashes.
 */
export const sanitizeTextForPDF = (text: string): string => {
  if (!text) return "";
  return text
    // Normalize smart quotes and common high-unicode punctuation
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-") // bullet point
    .replace(/\u2026/g, "...") // ellipsis
    // Strip standard emojis and pictographs
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
};

/**
 * Parses markdown to extract dynamic CV metadata if present in the text
 */
export const autoExtractMetadata = (content: string) => {
  const metadata = {
    name: "TAXA Document",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    title: "Project Report"
  };

  const lines = content.split("\n");
  
  // Try to find the name (typically the first header)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      metadata.name = trimmed.replace("#", "").trim();
      metadata.title = metadata.name;
      break;
    }
  }

  // Regex patterns to parse contact details
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const githubRegex = /(?:github\.com\/|git@github\.com:)([\w.-]+)/i;
  const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([\w.-]+)/i;

  const matches = content.match(emailRegex);
  if (matches) metadata.email = matches[0];

  const phoneMatches = content.match(phoneRegex);
  if (phoneMatches) metadata.phone = phoneMatches[0];

  const githubMatches = content.match(githubRegex);
  if (githubMatches) metadata.github = "github.com/" + githubMatches[1];

  const linkedinMatches = content.match(linkedinRegex);
  if (linkedinMatches) metadata.linkedin = "linkedin.com/in/" + linkedinMatches[1];

  return metadata;
};

/**
 * High-fidelity client-side PDF Exporter using jsPDF
 */
export const exportToPDF = (
  title: string,
  content: string,
  template: TemplateType = "plain",
  options: ExporterOptions = {}
): void => {
  // Upfront sanitization of title and content to prevent jsPDF WinAnsiEncoding crashes
  const sanitizedTitle = sanitizeTextForPDF(title);
  const sanitizedContent = sanitizeTextForPDF(content);

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageHeight = 297;
    const pageWidth = 210;
    const leftMargin = 20;
    const rightMargin = 20;
    const maxLineWidth = pageWidth - leftMargin - rightMargin; // 170mm usable width

    let y = 20; // Starting Y margin
    let pageNum = 1;

    const accentColor = options.accentColor || "#7b2cbf";
    
    // Convert Hex to RGB
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) || 123;
      const g = parseInt(hex.slice(3, 5), 16) || 44;
      const b = parseInt(hex.slice(5, 7), 16) || 191;
      return { r, g, b };
    };
    const rgb = hexToRgb(accentColor);

    // Helper to ensure height checks and automatic pagination
    const checkPageOverflow = (neededHeight: number) => {
      if (y + neededHeight > 275) {
        // Draw footer page number before breaking
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Page ${pageNum}`, pageWidth / 2, 287, { align: "center" });

        doc.addPage();
        pageNum++;
        y = 20; // Reset top margin on new page
      }
    };

    // Helper to draw horizontal rules
    const drawDivider = (height: number = 0.3) => {
      checkPageOverflow(height + 2);
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(height);
      doc.line(leftMargin, y, pageWidth - rightMargin, y);
      y += height + 4;
    };

    // Layout rendering by template types
    if (template === "cv") {
      // ----------------------------------------------------
      // CV / RESUME TEMPLATE
      // ----------------------------------------------------
      doc.setFont("times", "bold");
      doc.setFontSize(22);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      
      // Centered Name Header
      const displayName = sanitizeTextForPDF(options.author || "") || sanitizedTitle || "TAXA Applicant";
      doc.text(displayName, pageWidth / 2, y, { align: "center" });
      y += 8;

      // Contact Details Line
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);

      const contactParts = [];
      if (options.email) contactParts.push(sanitizeTextForPDF(options.email));
      if (options.phone) contactParts.push(sanitizeTextForPDF(options.phone));
      if (options.github) contactParts.push(sanitizeTextForPDF(options.github));
      if (options.linkedin) contactParts.push(sanitizeTextForPDF(options.linkedin));

      const contactStr = contactParts.join("  |  ");
      if (contactStr) {
        doc.text(contactStr, pageWidth / 2, y, { align: "center" });
        y += 6;
      }

      // Top Divider Line
      drawDivider(0.5);

      // Parse CV text body
      const paragraphs = sanitizedContent.split("\n");
      for (let p of paragraphs) {
        const line = p.trim();
        if (!line) {
          y += 2; // Spacer
          continue;
        }

        // Check section header (e.g. ## EDUCATION)
        if (line.startsWith("# ") || line.startsWith("## ")) {
          const headerText = cleanMarkdownSymbols(
            line.replace(/^##?\s+/, "")
          ).toUpperCase();
          
          y += 3;
          checkPageOverflow(12);
          
          doc.setFont("times", "bold");
          doc.setFontSize(12.5);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(headerText, leftMargin, y);
          y += 3;
          
          // Custom section underlines
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(leftMargin, y, pageWidth - rightMargin, y);
          y += 5;
        }
        // Check subheader (e.g. ### Experience Item)
        else if (line.startsWith("### ")) {
          const subheaderText = cleanMarkdownSymbols(line.replace(/^###\s+/, ""));
          checkPageOverflow(7);
          doc.setFont("times", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(30, 30, 30);
          doc.text(subheaderText, leftMargin, y);
          y += 5;
        }
        // Check list bullets (e.g. - experience description)
        else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
          const bulletText = cleanMarkdownSymbols(line.replace(/^[-*•]\s+/, ""));
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const wrapped = doc.splitTextToSize(bulletText, maxLineWidth - 6);
          for (let i = 0; i < wrapped.length; i++) {
            checkPageOverflow(5);
            if (i === 0) {
              // Draw a nice filled dot bullet
              doc.setFillColor(rgb.r, rgb.g, rgb.b);
              doc.circle(leftMargin + 2, y - 1.2, 0.7, "F");
            }
            doc.text(wrapped[i], leftMargin + 6, y);
            y += 4.8;
          }
        }
        // Standard paragraph text
        else {
          const cleanText = cleanMarkdownSymbols(line);
          doc.setFont("times", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const wrapped = doc.splitTextToSize(cleanText, maxLineWidth);
          for (const lineText of wrapped) {
            checkPageOverflow(5);
            doc.text(lineText, leftMargin, y);
            y += 4.8;
          }
        }
      }

    } else if (template === "report") {
      // ----------------------------------------------------
      // FORMAL PROJECT REPORT TEMPLATE
      // ----------------------------------------------------
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      
      // Left-aligned styled Header block
      doc.text(sanitizedTitle, leftMargin, y);
      y += 6;

      // Report Metadata block
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      });
      const authorStr = options.author ? `Author: ${sanitizeTextForPDF(options.author)}` : "Prepared by TAXA AI Engine";
      doc.text(`${authorStr}   |   Date: ${dateStr}`, leftMargin, y);
      y += 4;

      drawDivider(0.6);

      const paragraphs = sanitizedContent.split("\n");
      for (let p of paragraphs) {
        const line = p.trim();
        if (!line) {
          y += 2.5;
          continue;
        }

        // Check section header
        if (line.startsWith("# ") || line.startsWith("## ")) {
          const headerText = cleanMarkdownSymbols(line.replace(/^##?\s+/, ""));
          y += 4;
          checkPageOverflow(12);
          
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(13.5);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(headerText, leftMargin, y);
          y += 6;
        }
        // Check subheader
        else if (line.startsWith("### ")) {
          const subheaderText = cleanMarkdownSymbols(line.replace(/^###\s+/, ""));
          checkPageOverflow(8);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(50, 50, 50);
          doc.text(subheaderText, leftMargin, y);
          y += 5.5;
        }
        // Check blockquote (e.g. > Warning / Quote)
        else if (line.startsWith("> ")) {
          const quoteText = cleanMarkdownSymbols(line.replace(/^>\s+/, ""));
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);

          const wrapped = doc.splitTextToSize(quoteText, maxLineWidth - 10);
          checkPageOverflow(wrapped.length * 5 + 4);
          
          // Draw vertical quote bar
          doc.setDrawColor(rgb.r, rgb.g, rgb.b);
          doc.setLineWidth(0.8);
          doc.line(leftMargin + 2, y - 2, leftMargin + 2, y + (wrapped.length * 4.5) - 2);

          for (const lineText of wrapped) {
            doc.text(lineText, leftMargin + 6, y);
            y += 4.5;
          }
          y += 2;
        }
        // Check list bullets
        else if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
          const bulletText = cleanMarkdownSymbols(line.replace(/^[-*•]\s+/, ""));
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const wrapped = doc.splitTextToSize(bulletText, maxLineWidth - 6);
          for (let i = 0; i < wrapped.length; i++) {
            checkPageOverflow(5);
            if (i === 0) {
              doc.setFillColor(rgb.r, rgb.g, rgb.b);
              doc.rect(leftMargin + 1.5, y - 2.2, 1.2, 1.2, "F"); // square bullet
            }
            doc.text(wrapped[i], leftMargin + 6, y);
            y += 4.8;
          }
        }
        // Standard text
        else {
          const cleanText = cleanMarkdownSymbols(line);
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);

          const wrapped = doc.splitTextToSize(cleanText, maxLineWidth);
          for (const lineText of wrapped) {
            checkPageOverflow(5);
            doc.text(lineText, leftMargin, y);
            y += 4.8;
          }
        }
      }

    } else if (template === "letter") {
      // ----------------------------------------------------
      // FORMAL COVER LETTER TEMPLATE
      // ----------------------------------------------------
      doc.setFont("times", "normal");
      
      // Sender info top-right aligned
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      });
      
      const senderLines = [];
      if (options.author) senderLines.push(sanitizeTextForPDF(options.author));
      if (options.email) senderLines.push(sanitizeTextForPDF(options.email));
      if (options.phone) senderLines.push(sanitizeTextForPDF(options.phone));
      senderLines.push(dateStr);

      let senderY = y;
      for (const sLine of senderLines) {
        doc.text(sLine, pageWidth - rightMargin, senderY, { align: "right" });
        senderY += 4.5;
      }
      y = senderY + 6;

      // Recipient placeholder block
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(40, 40, 40);
      doc.text("To Whom It May Concern,", leftMargin, y);
      y += 5;
      doc.setFont("times", "normal");
      doc.text("Hiring and Admissions Committee", leftMargin, y);
      y += 8;

      // Letter title
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`Subject: Application / Formal Inquiry regarding ${sanitizedTitle}`, leftMargin, y);
      y += 8;

      // Letter Body paragraphs
      const paragraphs = sanitizedContent.split("\n");
      for (let p of paragraphs) {
        const line = p.trim();
        if (!line) {
          y += 4;
          continue;
        }

        const cleanText = cleanMarkdownSymbols(line);
        doc.setFont("times", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(50, 50, 50);

        const wrapped = doc.splitTextToSize(cleanText, maxLineWidth);
        for (const lineText of wrapped) {
          checkPageOverflow(5);
          doc.text(lineText, leftMargin, y);
          y += 5;
        }
      }

      // Formal Sign-off
      y += 8;
      checkPageOverflow(25);
      doc.setFont("times", "bold");
      doc.text("Sincerely,", leftMargin, y);
      y += 12;
      doc.text(sanitizeTextForPDF(options.author || "TAXA Client"), leftMargin, y);

    } else {
      // ----------------------------------------------------
      // PLAIN TEXT / CODE TEMPLATE
      // ----------------------------------------------------
      doc.setFont("Courier", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);

      const paragraphs = sanitizedContent.split("\n");
      for (let p of paragraphs) {
        const line = p.trimEnd(); // Keep leading spaces for code indentation!
        if (!line) {
          y += 4;
          continue;
        }

        // Check text size wrapping
        const wrapped = doc.splitTextToSize(line, maxLineWidth);
        for (const lineText of wrapped) {
          checkPageOverflow(5);
          doc.text(lineText, leftMargin, y);
          y += 4.5;
        }
      }
    }

    // Final page footer draw
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${pageNum}`, pageWidth / 2, 287, { align: "center" });

    // Compile PDF binary and download
    const safeName = sanitizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "document";
    doc.save(`${safeName}.pdf`);

  } catch (err) {
    console.error("PDF generation failed, falling back to clean text rendering:", err);
    try {
      // Standard ASCII fallback drawing loop
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      doc.setFont("Courier", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      
      const safeTitle = sanitizedTitle.replace(/[^\x20-\x7E\n]/g, "");
      const safeContent = sanitizedContent.replace(/[^\x20-\x7E\n]/g, "");
      
      doc.setFont("Courier", "bold");
      doc.text(`DOCUMENT: ${safeTitle}`, 20, 20);
      doc.line(20, 22, 190, 22);
      
      let yLine = 30;
      doc.setFont("Courier", "normal");
      const wrapped = doc.splitTextToSize(safeContent, 170);
      for (const line of wrapped) {
        if (yLine > 275) {
          doc.addPage();
          yLine = 20;
        }
        doc.text(line, 20, yLine);
        yLine += 5;
      }
      
      const safeName = sanitizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "document";
      doc.save(`${safeName}.pdf`);
    } catch (fallbackErr) {
      alert("A critical drawing error occurred in the PDF canvas. Please try exporting as a Word DOCX or TXT file instead.");
    }
  }
};

/**
 * Free Word Document (DOCX) exporter using client-side HTML-Blob compilers.
 * Fully compatible with Microsoft Word, Google Docs, and Apple Pages.
 */
export const exportToDOCX = (
  title: string,
  content: string,
  template: TemplateType = "plain",
  options: ExporterOptions = {}
): void => {
  const accentColor = options.accentColor || "#7b2cbf";
  
  // Format markdown structure into styled HTML elements
  const formatMarkdownToHTML = (text: string): string => {
    return text
      .split("\n")
      .map(p => {
        const line = p.trim();
        if (!line) return "<p style='margin-bottom: 8px;'></p>";

        // Headers
        if (line.startsWith("# ") || line.startsWith("## ")) {
          const header = cleanMarkdownSymbols(line.replace(/^##?\s+/, ""));
          return `<h2 style="font-family: Arial, sans-serif; color: ${accentColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px;">${header}</h2>`;
        }
        if (line.startsWith("### ")) {
          const subheader = cleanMarkdownSymbols(line.replace(/^###\s+/, ""));
          return `<h3 style="font-family: Arial, sans-serif; color: #334155; margin-top: 14px; margin-bottom: 6px;">${subheader}</h3>`;
        }

        // Blockquotes
        if (line.startsWith("> ")) {
          const quote = cleanMarkdownSymbols(line.replace(/^>\s+/, ""));
          return `<blockquote style="font-style: italic; border-left: 3px solid ${accentColor}; padding-left: 12px; color: #475569; margin: 12px 0;">${quote}</blockquote>`;
        }

        // Bullet lists
        if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ")) {
          const bullet = cleanMarkdownSymbols(line.replace(/^[-*•]\s+/, ""));
          return `<li style="font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; color: #334155; margin-left: 20px; list-style-type: square; margin-bottom: 4px;">${bullet}</li>`;
        }

        // Standard Paragraph
        const cleanP = cleanMarkdownSymbols(line);
        return `<p style="font-family: Georgia, serif; font-size: 11pt; line-height: 1.5; color: #334155; margin-bottom: 8px;">${cleanP}</p>`;
      })
      .join("");
  };

  let htmlBody = "";

  if (template === "cv") {
    const contactParts = [];
    if (options.email) contactParts.push(options.email);
    if (options.phone) contactParts.push(options.phone);
    if (options.github) contactParts.push(options.github);
    if (options.linkedin) contactParts.push(options.linkedin);
    const contactStr = contactParts.join("  |  ");

    htmlBody = `
      <div style="max-width: 600pt; margin: auto; padding: 20px;">
        <h1 style="text-align: center; font-family: Georgia, serif; font-size: 26pt; color: ${accentColor}; margin-bottom: 5px;">${options.author || title}</h1>
        ${contactStr ? `<p style="text-align: center; font-family: Georgia, serif; font-size: 10pt; color: #64748b; margin-bottom: 15px;">${contactStr}</p>` : ""}
        <div style="border-top: 2px solid ${accentColor}; margin-bottom: 20px;"></div>
        ${formatMarkdownToHTML(content)}
      </div>
    `;
  } else if (template === "report") {
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
    htmlBody = `
      <div style="max-width: 600pt; margin: auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-family: Arial, sans-serif; font-size: 24pt; color: ${accentColor}; margin-bottom: 6px;">${title}</h1>
        <p style="font-family: Arial, sans-serif; font-size: 10pt; color: #64748b; margin-bottom: 12px;">Prepared by: ${options.author || "TAXA AI System"}   |   Date: ${dateStr}</p>
        <div style="border-top: 3px double ${accentColor}; margin-bottom: 20px; height: 4px;"></div>
        ${formatMarkdownToHTML(content)}
      </div>
    `;
  } else if (template === "letter") {
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
    htmlBody = `
      <div style="max-width: 600pt; margin: auto; padding: 20px; font-family: Georgia, serif;">
        <div style="text-align: right; font-size: 11pt; color: #475569; margin-bottom: 25px;">
          ${options.author ? `<p style="margin:0; font-weight:bold;">${options.author}</p>` : ""}
          ${options.email ? `<p style="margin:0;">${options.email}</p>` : ""}
          ${options.phone ? `<p style="margin:0;">${options.phone}</p>` : ""}
          <p style="margin:0;">${dateStr}</p>
        </div>
        <p style="font-weight: bold; margin-bottom: 2px;">To Whom It May Concern,</p>
        <p style="color: #64748b; margin-bottom: 15px;">Hiring and Admissions Committee</p>
        <p style="font-weight: bold; color: ${accentColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 20px;">Subject: Application / Formal Inquiry regarding ${title}</p>
        ${formatMarkdownToHTML(content)}
        <div style="margin-top: 30px;">
          <p style="font-weight: bold; margin-bottom: 20px;">Sincerely,</p>
          <p style="font-weight: bold;">${options.author || "TAXA Client"}</p>
        </div>
      </div>
    `;
  } else {
    htmlBody = `
      <div style="max-width: 600pt; margin: auto; padding: 20px; font-family: Courier, monospace; white-space: pre-wrap; font-size: 10pt; color: #1e293b;">
        ${content}
      </div>
    `;
  }

  // Compile final structured HTML file
  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 size */
          margin: 72.0pt 72.0pt 72.0pt 72.0pt; /* 1 inch margins */
          mso-header-margin: 36.0pt;
          mso-footer-margin: 36.0pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
      </style>
    </head>
    <body style="tab-interval:36.0pt">
      <div class="Section1">
        ${htmlBody}
      </div>
    </body>
    </html>
  `;

  // Create Blob of ms-word and download
  const blob = new Blob(["\ufeff" + fullHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "document";
  a.download = `${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Free plain text/markdown document downloader
 */
export const exportToTXT = (title: string, content: string): void => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "document";
  a.download = `${safeName}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

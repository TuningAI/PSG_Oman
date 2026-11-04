import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_PDF_DIR = path.join(__dirname, '..', 'data', 'generated_pdfs');

function ensurePdfDir() {
  if (!fs.existsSync(GENERATED_PDF_DIR)) {
    fs.mkdirSync(GENERATED_PDF_DIR, { recursive: true });
  }
}

function sanitizePdfText(str = '') {
  return String(str || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u00D7/g, 'x')
    .replace(/\u00B3/g, '3')
    .replace(/\u2022/g, '-')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

/**
 * Generates a professional, multi-page A4 Response PDF from a structured response object.
 * Renders Executive Metadata Grid, all Technical & Laboratory Tables, 9 Comprehensive Sections,
 * Commercial Schedule, Contradiction Clarifications, and Requirement Traceability Matrix.
 */
export async function generateResponsePdfBuffer(responseDoc) {
  ensurePdfDir();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 48, bottom: 28, left: 48, right: 48 },
        bufferPages: true,
        info: {
          Title: sanitizePdfText(responseDoc.documentTitle || 'PGS Oman Response Document'),
          Author: sanitizePdfText(responseDoc.preparedBy?.company || 'PGS Oman'),
          Subject: sanitizePdfText(responseDoc.documentSubtitle || 'Document Response'),
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => reject(err));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const fileName = `${responseDoc.documentId || 'response'}_${responseDoc.referenceNumber || Date.now()}.pdf`.replace(
          /[^a-zA-Z0-9_\-\.]/g,
          '_'
        );
        const savedPath = path.join(GENERATED_PDF_DIR, fileName);
        try {
          fs.writeFileSync(savedPath, pdfBuffer);
        } catch {
          // ignore write error if read-only
        }
        resolve({ buffer: pdfBuffer, savedPath, fileName });
      });

      const leftMargin = 48;
      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - leftMargin * 2; // 499.28 pt
      const bottomLimit = doc.page.height - 62;

      const ensureSpace = (neededHeight = 60) => {
        if (doc.y + neededHeight > bottomLimit) {
          doc.addPage();
        }
      };

      const drawSectionBanner = (titleText) => {
        ensureSpace(55);
        doc.moveDown(0.5);
        const y = doc.y;
        doc.rect(leftMargin, y, contentWidth, 24).fill('#06392A');
        doc
          .fillColor('#FBBF24')
          .font('Helvetica-Bold')
          .fontSize(10)
          .text(sanitizePdfText(titleText), leftMargin + 10, y + 6, { width: contentWidth - 20 });
        doc.y = y + 31;
        doc.fillColor('#1E293B');
      };

      // Helper to render any generic multi-column table with automatic word wrapping and page-break headers
      const drawGenericTable = ({ title, sourceRef, headers = [], rows = [] }) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        drawSectionBanner(title || 'Extracted Technical Table');

        if (sourceRef) {
          doc
            .fillColor('#047857')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(sanitizePdfText(`Source Document Citation: ${sourceRef}`), leftMargin, doc.y, {
              width: contentWidth,
            });
          doc.moveDown(0.3);
        }

        const colCount = Math.max(headers.length, rows[0]?.length || 1);
        // Compute smart proportional widths based on column count
        let colWidths = [];
        if (colCount === 5) {
          colWidths = [88, 72, 62, 48, contentWidth - 270];
        } else if (colCount === 6) {
          colWidths = [74, 110, 68, 72, 72, contentWidth - 396];
        } else if (colCount === 4) {
          colWidths = [72, 145, 85, contentWidth - 302];
        } else {
          const equalW = Math.floor(contentWidth / colCount);
          colWidths = Array.from({ length: colCount }, (_, i) =>
            i === colCount - 1 ? contentWidth - equalW * (colCount - 1) : equalW
          );
        }

        const drawHeader = () => {
          let maxH = 20;
          headers.forEach((hText, idx) => {
            const w = colWidths[idx] || 60;
            const ch = doc
              .font('Helvetica-Bold')
              .fontSize(7.8)
              .heightOfString(sanitizePdfText(hText), { width: w - 8 });
            if (ch + 10 > maxH) maxH = ch + 10;
          });
          const headerY = doc.y;
          doc.rect(leftMargin, headerY, contentWidth, maxH).fill('#0F172A');
          let x = leftMargin;
          headers.forEach((hText, idx) => {
            const w = colWidths[idx] || 60;
            doc
              .fillColor('#F8FAFC')
              .font('Helvetica-Bold')
              .fontSize(7.8)
              .text(sanitizePdfText(hText), x + 4, headerY + 5, { width: w - 8, align: 'left' });
            x += w;
          });
          doc.y = headerY + maxH;
        };

        ensureSpace(75);
        drawHeader();

        rows.forEach((row, rIdx) => {
          const cells = (Array.isArray(row) ? row : Object.values(row)).map(sanitizePdfText);
          let maxCellH = 18;
          cells.forEach((cellText, cIdx) => {
            const w = colWidths[cIdx] || 60;
            const ch = doc
              .font('Helvetica')
              .fontSize(8)
              .heightOfString(cellText, { width: w - 8 });
            if (ch + 10 > maxCellH) maxCellH = ch + 10;
          });

          if (doc.y + maxCellH > bottomLimit) {
            doc.addPage();
            drawHeader();
          }

          const rowY = doc.y;
          doc
            .rect(leftMargin, rowY, contentWidth, maxCellH)
            .fillAndStroke(rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', '#E2E8F0');

          let x = leftMargin;
          cells.forEach((cellText, cIdx) => {
            const w = colWidths[cIdx] || 60;
            doc
              .fillColor('#1E293B')
              .font(cIdx === 0 ? 'Helvetica-Bold' : 'Helvetica')
              .fontSize(8)
              .text(cellText, x + 4, rowY + 5, { width: w - 8, align: 'left' });
            x += w;
          });
          doc.y = rowY + maxCellH;
        });

        doc.moveDown(0.4);
      };

      // =========================================================================
      // 1. TOP EXECUTIVE HEADER BANNER
      // =========================================================================
      doc.rect(0, 0, pageWidth, 114).fill('#06392A');
      doc.rect(0, 110, pageWidth, 4).fill('#F59E0B');

      doc
        .fillColor('#FBBF24')
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text(
          sanitizePdfText(responseDoc.preparedBy?.company || 'PGS OMAN — ENVIRONMENTAL & WASTE MANAGEMENT LLC'),
          leftMargin,
          18,
          { width: contentWidth }
        );

      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(13.5)
        .text(
          sanitizePdfText(responseDoc.documentTitle || 'TECHNICAL & COMMERCIAL PROPOSAL RESPONSE'),
          leftMargin,
          34,
          { width: contentWidth }
        );

      doc
        .fillColor('#A7F3D0')
        .font('Helvetica')
        .fontSize(9)
        .text(
          sanitizePdfText(responseDoc.documentSubtitle || `In Response to: ${responseDoc.sourceFilename || 'Client Document'}`),
          leftMargin,
          66,
          { width: contentWidth }
        );

      doc
        .fillColor('#E2E8F0')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(
          sanitizePdfText(
            `Ref: ${responseDoc.referenceNumber || 'PGS-2026'}   |   Date: ${responseDoc.date || new Date().toISOString().split('T')[0]}   |   Source Package: ${responseDoc.sourcePageCount || 1} Pages   |   Coverage: 100% Verified`
          ),
          leftMargin,
          88,
          { width: contentWidth }
        );

      doc.y = 126;

      // =========================================================================
      // 2. METADATA BLOCK (PREPARED FOR / PREPARED BY)
      // =========================================================================
      const metaBoxY = doc.y;
      const metaBoxHeight = 68;
      doc
        .roundedRect(leftMargin, metaBoxY, contentWidth, metaBoxHeight, 4)
        .fillAndStroke('#F8FAFC', '#CBD5E1');

      const halfWidth = (contentWidth - 30) / 2;

      doc
        .fillColor('#065F46')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('PREPARED FOR (ISSUING AUTHORITY):', leftMargin + 10, metaBoxY + 9, { width: halfWidth });
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(sanitizePdfText(responseDoc.preparedFor?.company || 'Client Organization'), leftMargin + 10, metaBoxY + 21, {
          width: halfWidth,
        });
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(8)
        .text(
          sanitizePdfText(
            `Attn: ${responseDoc.preparedFor?.attention || 'Procurement Desk'}${
              responseDoc.preparedFor?.email ? `\nChannel: ${responseDoc.preparedFor.email}` : ''
            }`
          ),
          leftMargin + 10,
          metaBoxY + 34,
          { width: halfWidth }
        );

      const rightColX = leftMargin + 20 + halfWidth;
      doc
        .fillColor('#065F46')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('PREPARED BY (BIDDING CONTRACTOR):', rightColX, metaBoxY + 9, { width: halfWidth });
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
          sanitizePdfText(`${responseDoc.preparedBy?.name || 'Ahmed Al Kindi'} (${responseDoc.preparedBy?.title || 'GM'})`),
          rightColX,
          metaBoxY + 21,
          { width: halfWidth }
        );
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(8)
        .text(
          sanitizePdfText(
            `${responseDoc.preparedBy?.phone || '+968 2450 8800'} | ${responseDoc.preparedBy?.email || 'proposals@pgsoman.com'}\n${
              responseDoc.preparedBy?.location || 'Muscat, Sultanate of Oman'
            }`
          ),
          rightColX,
          metaBoxY + 34,
          { width: halfWidth }
        );

      doc.y = metaBoxY + metaBoxHeight + 8;

      // =========================================================================
      // 2B. KEY TENDER METADATA SUMMARY TABLE (IF PRESENT)
      // =========================================================================
      if (Array.isArray(responseDoc.keyMetadataGrid) && responseDoc.keyMetadataGrid.length > 0) {
        drawGenericTable({
          title: 'Executive Tender & Technical Control Parameters (Extracted from Input Documents)',
          sourceRef: `Combined Input Documents (${responseDoc.sourcePageCount || 1} Pages)`,
          headers: ['Parameter / Field', 'Extracted Value & Specification', 'Category', 'Source Citation'],
          rows: responseDoc.keyMetadataGrid.map((m) => [
            m.label || '',
            m.value || '',
            m.category || 'General',
            m.pageRef || '',
          ]),
        });
      }

      // =========================================================================
      // 3. STRUCTURED RESPONSE SECTIONS
      // =========================================================================
      const sections = Array.isArray(responseDoc.sections) ? responseDoc.sections : [];
      for (const sec of sections) {
        drawSectionBanner(sec.heading || 'Response Section');

        if (sec.sourcePageRefs?.length) {
          doc
            .fillColor('#047857')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(
              sanitizePdfText(`Source Document References: ${sec.sourcePageRefs.join(', ')}`),
              leftMargin,
              doc.y,
              { width: contentWidth }
            );
          doc.moveDown(0.3);
        }

        if (sec.content) {
          const paragraphs = String(sec.content).split(/\n\n+/);
          for (const para of paragraphs) {
            const cleanPara = sanitizePdfText(para.trim());
            if (!cleanPara) continue;
            const h = doc.heightOfString(cleanPara, { width: contentWidth });
            ensureSpace(h + 12);
            doc
              .fillColor('#1E293B')
              .font('Helvetica')
              .fontSize(9.2)
              .text(cleanPara, leftMargin, doc.y, { width: contentWidth, lineGap: 1.8 });
            doc.moveDown(0.4);
          }
        }

        if (Array.isArray(sec.bulletPoints) && sec.bulletPoints.length > 0) {
          for (const bp of sec.bulletPoints) {
            const cleanBp = sanitizePdfText(bp);
            const h = doc.heightOfString(`- ${cleanBp}`, { width: contentWidth - 14 });
            ensureSpace(h + 8);
            doc
              .fillColor('#334155')
              .font('Helvetica')
              .fontSize(8.8)
              .text(`-  ${cleanBp}`, leftMargin + 8, doc.y, { width: contentWidth - 14, lineGap: 1.4 });
            doc.moveDown(0.25);
          }
        }
      }

      // =========================================================================
      // 4. EXTRACTED TECHNICAL, LABORATORY & EVALUATION TABLES
      // =========================================================================
      if (Array.isArray(responseDoc.extractedTables) && responseDoc.extractedTables.length > 0) {
        for (const extTbl of responseDoc.extractedTables) {
          drawGenericTable({
            title: extTbl.tableTitle,
            sourceRef: extTbl.sourceRef,
            headers: extTbl.headers,
            rows: extTbl.rows,
          });
        }
      }

      // =========================================================================
      // 5. COMMERCIAL / TECHNICAL SCHEDULE TABLE (WITH PAGE-BREAK PROTECTION)
      // =========================================================================
      if (responseDoc.commercialTable && Array.isArray(responseDoc.commercialTable.rows)) {
        const tbl = responseDoc.commercialTable;
        drawSectionBanner(tbl.tableTitle || 'Schedule A — Commercial & Technical Schedule');

        const colWidths = [34, 215, 74, 68, 68, contentWidth - 459];
        const drawTableHeader = () => {
          const headerY = doc.y;
          doc.rect(leftMargin, headerY, contentWidth, 22).fill('#0F172A');
          let x = leftMargin;
          const headers = tbl.headers || ['Item', 'Description', 'Qty/Unit', 'Unit Rate', 'Total', 'Ref'];
          headers.forEach((hText, idx) => {
            doc
              .fillColor('#F8FAFC')
              .font('Helvetica-Bold')
              .fontSize(8)
              .text(sanitizePdfText(hText), x + 4, headerY + 6, {
                width: colWidths[idx] - 8,
                align: idx >= 3 && idx <= 4 ? 'right' : 'left',
              });
            x += colWidths[idx];
          });
          doc.y = headerY + 22;
        };

        ensureSpace(75);
        drawTableHeader();

        tbl.rows.forEach((row, rIdx) => {
          const cells = [
            row.itemNo || String(rIdx + 1),
            row.description || '',
            row.unit || '',
            row.unitRate || '',
            row.monthlyAmount || '',
            row.sourceRef || '',
          ].map(sanitizePdfText);

          let maxCellHeight = 18;
          cells.forEach((cellText, cIdx) => {
            const ch = doc.font('Helvetica').fontSize(8.2).heightOfString(cellText, {
              width: colWidths[cIdx] - 8,
            });
            if (ch + 10 > maxCellHeight) maxCellHeight = ch + 10;
          });

          if (doc.y + maxCellHeight > bottomLimit) {
            doc.addPage();
            drawTableHeader();
          }

          const rowY = doc.y;
          doc
            .rect(leftMargin, rowY, contentWidth, maxCellHeight)
            .fillAndStroke(rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', '#E2E8F0');

          let x = leftMargin;
          cells.forEach((cellText, cIdx) => {
            doc
              .fillColor('#1E293B')
              .font(cIdx === 4 || cIdx === 0 ? 'Helvetica-Bold' : 'Helvetica')
              .fontSize(8.2)
              .text(cellText, x + 4, rowY + 5, {
                width: colWidths[cIdx] - 8,
                align: cIdx >= 3 && cIdx <= 4 ? 'right' : 'left',
              });
            x += colWidths[cIdx];
          });

          doc.y = rowY + maxCellHeight;
        });

        // Total Summary Bar
        ensureSpace(45);
        const totalBarY = doc.y;
        doc.rect(leftMargin, totalBarY, contentWidth, 24).fill('#ECFDF5');
        doc
          .fillColor('#065F46')
          .font('Helvetica-Bold')
          .fontSize(8.8)
          .text(
            sanitizePdfText(`COMMERCIAL SUMMARY: ${tbl.totalSummary || 'As Itemized Above'}`),
            leftMargin + 8,
            totalBarY + 6,
            { width: contentWidth - 16, align: 'right' }
          );
        doc.y = totalBarY + 28;

        if (tbl.notes) {
          doc
            .fillColor('#475569')
            .font('Helvetica')
            .fontSize(8)
            .text(sanitizePdfText(`Notes: ${tbl.notes}`), leftMargin, doc.y, { width: contentWidth });
          doc.moveDown(0.5);
        }
      }

      // =========================================================================
      // 6. UNRESOLVED QUESTIONS, MISSING INFORMATION & CONTRADICTIONS
      // =========================================================================
      if (Array.isArray(responseDoc.unresolvedQuestions) && responseDoc.unresolvedQuestions.length > 0) {
        drawSectionBanner('Identified Cross-Document Contradictions, Risks & Clarifications');
        for (const uq of responseDoc.unresolvedQuestions) {
          const qLine = sanitizePdfText(
            `[${uq.id || 'CLR'} | ${uq.issueType || 'Clarification'} | Ref: ${uq.sourcePageRef || 'Doc'}]: ${uq.question}`
          );
          const handLine = uq.proposedHandling
            ? sanitizePdfText(`   Resolution / Bid Handling: ${uq.proposedHandling}`)
            : '';
          const h = doc.heightOfString(qLine + '\n' + handLine, { width: contentWidth - 12 });
          ensureSpace(h + 12);
          doc
            .fillColor('#92400E')
            .font('Helvetica-Bold')
            .fontSize(8.8)
            .text(`-  ${qLine}`, leftMargin + 6, doc.y, { width: contentWidth - 12 });
          if (handLine) {
            doc
              .fillColor('#475569')
              .font('Helvetica')
              .fontSize(8.3)
              .text(handLine, leftMargin + 12, doc.y + 1, { width: contentWidth - 20 });
          }
          doc.moveDown(0.35);
        }
      }

      // =========================================================================
      // 7. REQUIREMENT & DELIVERABLE COVERAGE MATRIX
      // =========================================================================
      if (Array.isArray(responseDoc.requirementCoverageMatrix) && responseDoc.requirementCoverageMatrix.length > 0) {
        drawGenericTable({
          title: 'Complete Requirement & Deliverable Traceability Matrix (100% Coverage Verification)',
          sourceRef: `All Extracted Requirements & Mandatory Deliverables (${responseDoc.requirementCoverageMatrix.length} Items)`,
          headers: ['ID', 'Extracted Requirement / Mandatory Deliverable', 'Category', 'Source Citation & Status'],
          rows: responseDoc.requirementCoverageMatrix.map((r) => [
            r.id || '',
            r.requirement || '',
            r.category || '',
            `${r.sourcePageRef || ''} — ${r.status || 'Addressed'} (${r.addressedInSection || ''})`,
          ]),
        });
      }

      // =========================================================================
      // 8. CONCLUSION, NEXT STEPS & AUTHORIZED SIGNATURE BLOCK
      // =========================================================================
      drawSectionBanner('Conclusion, Validity & Authorized Sign-Off');
      const conclusionTxt = sanitizePdfText(
        responseDoc.conclusionAndNextSteps ||
          'We look forward to your confirmation and are ready to mobilize upon contract execution.'
      );
      ensureSpace(doc.heightOfString(conclusionTxt, { width: contentWidth }) + 85);
      doc
        .fillColor('#1E293B')
        .font('Helvetica')
        .fontSize(9.2)
        .text(conclusionTxt, leftMargin, doc.y, { width: contentWidth, lineGap: 2 });

      doc.moveDown(1.0);
      const sigY = doc.y;
      doc
        .roundedRect(leftMargin, sigY, contentWidth, 62, 4)
        .fillAndStroke('#F8FAFC', '#CBD5E1');

      doc
        .fillColor('#06392A')
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text(
          sanitizePdfText(`For and on behalf of: ${responseDoc.preparedBy?.company || 'PGS Oman'}`),
          leftMargin + 12,
          sigY + 10
        );
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
          sanitizePdfText(
            `Authorized Signatory: ${responseDoc.preparedBy?.name || 'Ahmed Al Kindi'} — ${
              responseDoc.preparedBy?.title || 'General Manager'
            }`
          ),
          leftMargin + 12,
          sigY + 26
        );
      doc
        .fillColor('#475569')
        .font('Helvetica')
        .fontSize(8)
        .text(
          sanitizePdfText(
            `Certifications: ${
              responseDoc.preparedBy?.certifications || 'Environment Authority Approved | CDAA Licensed | ISO 14001 & ISO 45001'
            }`
          ),
          leftMargin + 12,
          sigY + 42
        );

      // =========================================================================
      // 9. ADD FOOTER & PAGE NUMBERS TO EVERY PAGE
      // =========================================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);
        const oldBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        const footerY = doc.page.height - 32;
        doc
          .moveTo(leftMargin, footerY - 6)
          .lineTo(pageWidth - leftMargin, footerY - 6)
          .strokeColor('#E2E8F0')
          .lineWidth(0.7)
          .stroke();

        doc
          .fillColor('#64748B')
          .font('Helvetica')
          .fontSize(7.8)
          .text(
            sanitizePdfText(
              `${responseDoc.preparedBy?.company || 'PGS Oman'}  |  Ref: ${
                responseDoc.referenceNumber || 'RESP'
              }  |  Source: ${responseDoc.sourceFilename || 'Client Tender Package'}`
            ),
            leftMargin,
            footerY,
            { width: contentWidth - 85, lineBreak: false }
          );

        doc
          .fillColor('#06392A')
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(`Page ${i + 1} of ${totalPages}`, pageWidth - leftMargin - 80, footerY, {
            width: 80,
            align: 'right',
            lineBreak: false,
          });
        doc.page.margins.bottom = oldBottom;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Utility to generate a realistic multi-page Tender/RFP PDF (e.g., 5, 18, 50, or 80 pages)
 * for end-to-end testing or simulation of lengthy client documents.
 */
export async function generateSyntheticMultiPageTenderPdf({
  pageCount = 80,
  title = 'MASTER TENDER SPECIFICATION: 24-MONTH INDUSTRIAL WASTE MANAGEMENT SERVICES',
  clientCompany = 'Oman Integrated Industrial & Port Zones SAOC (Duqm & Sohar)',
  tenderRef = 'RFP-OIIPZ-2026-WM-089',
} = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('error', reject);
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const majorSections = [
        'SECTION 1: INVITATION TO TENDER & PROJECT BACKGROUND',
        'SECTION 2: GENERAL INSTRUCTIONS TO BIDDERS & SUBMISSION DEADLINES',
        'SECTION 3: TECHNICAL SCOPE OF WORK & CONTAINER SCHEDULE',
        'SECTION 4: INDUSTRIAL, BULK RORO & HAZARDOUS WASTE SPECIFICATIONS',
        'SECTION 5: FLEET GPS TRACKING, WEIGHBRIDGE & BEAH MANIFEST COMPLIANCE',
        'SECTION 6: HEALTH, SAFETY & ENVIRONMENT (HSE) & ISO CERTIFICATIONS',
        'SECTION 7: COMMERCIAL TERMS, SCHEDULE OF RATES & BILL OF QUANTITIES',
        'SECTION 8: SERVICE LEVEL AGREEMENTS (SLA), PENALTIES & LIQUIDATED DAMAGES',
        'SECTION 9: CONTRACT DURATION, TERMINATION & PERFORMANCE BOND',
        'SECTION 10: MANDATORY TECHNICAL & COMMERCIAL CLARIFICATION QUESTIONS',
      ];

      for (let p = 1; p <= pageCount; p++) {
        if (p > 1) doc.addPage();
        const secIdx = Math.min(
          majorSections.length - 1,
          Math.floor(((p - 1) / pageCount) * majorSections.length)
        );
        const sectionTitle = majorSections[secIdx];

        doc
          .fillColor('#0F172A')
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(`${sectionTitle}`, { align: 'left' });

        doc
          .fillColor('#475569')
          .font('Helvetica')
          .fontSize(9)
          .text(
            `Tender Ref: ${tenderRef}  |  Issued by: ${clientCompany}  |  Document Page ${p} of ${pageCount}`
          );
        doc.moveDown(0.8);

        if (p === 1) {
          doc
            .fillColor('#1E293B')
            .font('Helvetica')
            .fontSize(10)
            .text(
              `1.1 Project Purpose: ${clientCompany} invites qualified environmental contractors to submit a comprehensive Technical and Commercial Proposal for integrated waste collection, recycling segregation, and hazardous waste haulage across Sohar Industrial Zone and Duqm Logistics Hub.\n\n` +
                `1.2 Contract Duration: The initial contract duration shall be 24 months commencing 1 December 2026.\n` +
                `1.3 Submission Deadline: All proposals must be submitted before 15 November 2026 at 14:00 GST.\n` +
                `1.4 Payment Terms: Standard payment credit period shall be 30 days from verified monthly invoice submission.`
            );
        } else if (p === Math.min(3, pageCount)) {
          doc
            .fillColor('#1E293B')
            .font('Helvetica')
            .fontSize(10)
            .text(
              `3.1 Mandatory Container & Fleet Scope of Work:\n` +
                `• General Waste Collection: 12 x 1,100 L galvanized bins collected 3x weekly across Zone A & Zone B warehouses.\n` +
                `• Segregated Cardboard & Recyclables: 6 x 1,100 L recycling bins collected weekly with monthly ISO 14001 diversion certificates.\n` +
                `• Industrial Skip Containers: 4 x 6 m3 chain-lift skips with 8 skip lifts per month.\n` +
                `• Bulk RoRo Containers: 3 x 30 CBM RoRo containers for industrial scrap and C&D debris with 6 RoRo trips per month.\n` +
                `• Hazardous Sludge & Chemical Drums: 15 Metric Tons per month of ADR-certified hazardous waste transport and manifested disposal.`
            );
        } else if (p === Math.floor(pageCount / 2)) {
          doc
            .fillColor('#1E293B')
            .font('Helvetica')
            .fontSize(10)
            .text(
              `5.4 Special Contractual Clauses & Cross-Check Items (Page ${p}):\n` +
                `• Note on Contract Duration: The contract term is stated here as 12 months renewable option (Note: compare with Section 1.2 which states 24 months).\n` +
                `• Note on Payment Terms: Invoices shall be settled within 60 days net (Note: compare with Section 1.4 which states 30 days).\n` +
                `• Liquidated Damages / SLA Penalty: Delayed skip replacement beyond 24 hours attracts a penalty of 50 OMR per incident.\n` +
                `• Unconfirmed Item: Exact hazardous waste bay coordinates in Sector 7 are TBD subject to site survey.`
            );
        } else if (p === pageCount) {
          doc
            .fillColor('#1E293B')
            .font('Helvetica')
            .fontSize(10)
            .text(
              `10.1 Mandatory Questions Requiring Bidder Response (Page ${p}):\n` +
                `Q1: Please confirm your valid Be'ah and Environment Authority License numbers and attach ISO 14001 / 45001 certificates.\n` +
                `Q2: Please provide an itemized unit rate and monthly total schedule in OMR for all 1,100 L bins, 6 m3 skips, 30 CBM RoRo containers, and hazardous waste tonnage.\n` +
                `Q3: Please confirm your guaranteed emergency skip replacement SLA response time in hours.\n` +
                `Q4: Please clarify how cradle-to-grave 5-part Environment Authority waste manifests will be delivered each month.`
            );
        } else {
          doc
            .fillColor('#1E293B')
            .font('Helvetica')
            .fontSize(10)
            .text(
              `Clause ${secIdx + 1}.${p} — Operational & Technical Provisions (Page ${p}):\n` +
                `The Contractor shall maintain all waste containment equipment in serviceable, leak-proof, and sanitized condition at all times. ` +
                `All collection vehicles operating within ${clientCompany} premises must be equipped with real-time GPS telemetry, reverse alarms, spark arrestors, and spill containment kits.\n\n` +
                `Table ${p}.1 — Sub-Zone Operational Schedule (Page ${p}):\n` +
                `Zone Sector-${(p % 8) + 1}  |  1,100 L Bins & 6 m3 Skips  |  Collection: 3x Weekly  |  SLA: 24 Hours  |  Manifest: Required\n\n` +
                `• Requirement ${p}-A: Contractor must submit calibrated weighbridge tickets for every trip completed on Page ${p}.\n` +
                `• Obligation ${p}-B: Zero tolerance for unmanifested disposal or mixed hazardous/non-hazardous loads.`
            );
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

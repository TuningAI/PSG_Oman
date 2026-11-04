import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
let pdfParse = null;
try {
  pdfParse = require('pdf-parse/lib/pdf-parse.js');
} catch {
  try {
    pdfParse = require('pdf-parse');
  } catch {
    pdfParse = null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const DOCS_STORE_PATH = path.join(DATA_DIR, 'documents_store.json');

const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB max safety limit

function ensureStorageDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCS_STORE_PATH)) {
    fs.writeFileSync(
      DOCS_STORE_PATH,
      JSON.stringify({ documents: {}, hashIndex: {} }, null, 2),
      'utf8'
    );
  }
}

export function getDocumentsStore() {
  ensureStorageDirs();
  try {
    const raw = fs.readFileSync(DOCS_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      documents: parsed.documents || {},
      hashIndex: parsed.hashIndex || {},
    };
  } catch {
    return { documents: {}, hashIndex: {} };
  }
}

export function saveDocumentsStore(store) {
  ensureStorageDirs();
  fs.writeFileSync(DOCS_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export function computeBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate document format, non-empty buffer, size limits, and file header integrity.
 */
export function validateDocumentInput(filename = '', mimeType = '', buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return {
      isValid: false,
      errorCode: 'EMPTY_DOCUMENT',
      errorMessage: `Document "${filename || 'Unnamed'}" is empty (0 bytes).`,
    };
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      isValid: false,
      errorCode: 'OVERSIZED_DOCUMENT',
      errorMessage: `Document "${filename}" exceeds the maximum allowed size of 50 MB (${(
        buffer.length /
        (1024 * 1024)
      ).toFixed(1)} MB).`,
    };
  }

  const lowerName = (filename || '').toLowerCase().trim();
  const lowerMime = (mimeType || '').toLowerCase().trim();

  const isPdf = lowerName.endsWith('.pdf') || lowerMime.includes('pdf');
  const isDocx =
    lowerName.endsWith('.docx') ||
    lowerMime.includes('officedocument.wordprocessingml.document') ||
    lowerMime.includes('msword');
  const isText =
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.csv') ||
    lowerName.endsWith('.md') ||
    lowerMime.startsWith('text/');

  if (!isPdf && !isDocx && !isText) {
    return {
      isValid: false,
      errorCode: 'UNSUPPORTED_FORMAT',
      errorMessage: `Unsupported document format for "${filename}" (${
        mimeType || 'unknown MIME'
      }). Supported formats: PDF (.pdf), Word (.docx), Text (.txt, .md, .csv).`,
    };
  }

  if (isPdf) {
    // Check for %PDF- header within the first 1024 bytes
    const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
    if (!headerSlice.includes('%PDF-')) {
      return {
        isValid: false,
        errorCode: 'CORRUPTED_DOCUMENT',
        errorMessage: `Invalid or corrupted PDF file "${filename}": missing %PDF header signature.`,
      };
    }
  }

  if (isDocx && lowerName.endsWith('.docx')) {
    // DOCX is a ZIP archive starting with PK\x03\x04
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return {
        isValid: false,
        errorCode: 'CORRUPTED_DOCUMENT',
        errorMessage: `Invalid or corrupted DOCX file "${filename}": invalid ZIP container signature.`,
      };
    }
  }

  return {
    isValid: true,
    docType: isPdf ? 'pdf' : isDocx ? 'docx' : 'text',
  };
}

/**
 * Extract structured elements (headings, tables, lists, dates, amounts/figures) from a page's text.
 */
export function extractPageStructuredElements(pageText = '') {
  const lines = pageText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headings = [];
  const tables = [];
  const lists = [];
  const datesSet = new Set();
  const amountsSet = new Set();

  const dateRegex =
    /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b/gi;

  const amountRegex =
    /\b(?:(?:OMR|USD|EUR|AED|SAR|GBP|Rial|Rials)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:OMR|USD|EUR|AED|SAR|Rials?|%|CBM|m³|m3|Metric\s+Tons?|Tons?|kg|Liters?|L|Bins?|Skips?|Containers?|Trips?|Lifts?|Months?|Years?|Days?|Hours?))\b/gi;

  for (const line of lines) {
    // Extract dates
    const dMatches = line.match(dateRegex);
    if (dMatches) {
      dMatches.forEach((d) => datesSet.add(d.trim()));
    }

    // Extract amounts & figures
    const aMatches = line.match(amountRegex);
    if (aMatches) {
      aMatches.forEach((a) => amountsSet.add(a.trim()));
    }

    // Detect headings:
    // - Markdown style (# ...)
    // - Numbered section headers (e.g., "1. SCOPE OF WORK", "2.1 Commercial Terms", "SECTION 4 - ...", "ARTICLE III:")
    // - Short all-caps lines (5 to 85 chars)
    const isHeading =
      /^#{1,6}\s+/.test(line) ||
      /^(?:SECTION|ARTICLE|CLAUSE|PART|ANNEX|APPENDIX|SCHEDULE|CHAPTER)\s+[A-Z0-9IVX]+[:\.\-\s]/i.test(line) ||
      /^\d+(?:\.\d+){0,2}\s+[A-Z][A-Za-z0-9\s,&\/\-()]{3,80}$/.test(line) ||
      (line.length >= 5 &&
        line.length <= 85 &&
        line === line.toUpperCase() &&
        /[A-Z]{3,}/.test(line) &&
        !line.includes('|'));

    if (isHeading && headings.length < 25) {
      headings.push(line.replace(/^#{1,6}\s+/, '').trim());
    }

    // Detect table rows: pipe-delimited or tab/multi-column with numbers
    if (
      (line.includes('|') && line.split('|').filter(Boolean).length >= 2) ||
      /\t/.test(line) ||
      (/\s{3,}/.test(line) && /\d/.test(line) && line.length > 15)
    ) {
      if (tables.length < 40) {
        tables.push(line);
      }
    }

    // Detect list items
    if (/^(?:[•\-\*\u2022]|\(\d+\)|\([a-z]\)|\d+[\.\)])\s+/i.test(line)) {
      if (lists.length < 40) {
        lists.push(line);
      }
    }
  }

  return {
    headings,
    tables,
    lists,
    dates: Array.from(datesSet).slice(0, 30),
    amounts: Array.from(amountsSet).slice(0, 40),
  };
}

/**
 * Custom per-page PDF extraction using pdf-parse so every page's text, tables, and page number are preserved.
 */
async function extractPdfPages(buffer) {
  if (!pdfParse) {
    throw new Error('pdf-parse library is not available');
  }

  const pageTexts = [];

  const options = {
    pagerender: async function (pageData) {
      let textContent = { items: [] };
      try {
        textContent = await pageData.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });
      } catch {
        textContent = { items: [] };
      }

      // Group text items by vertical Y coordinate to preserve lines and table columns
      const rowsMap = new Map();
      for (const item of textContent.items || []) {
        const str = item.str || '';
        if (!str) continue;
        const y = item.transform ? Math.round(item.transform[5] / 3) * 3 : 0;
        const x = item.transform ? Math.round(item.transform[4]) : 0;
        if (!rowsMap.has(y)) {
          rowsMap.set(y, []);
        }
        rowsMap.get(y).push({ x, str });
      }

      // Sort rows top-to-bottom (descending Y in PDF coordinate space)
      const sortedYs = Array.from(rowsMap.keys()).sort((a, b) => b - a);
      const lines = [];

      for (const y of sortedYs) {
        const rowItems = rowsMap.get(y).sort((a, b) => a.x - b.x);
        let lineStr = '';
        let prevX = null;
        for (const cell of rowItems) {
          if (prevX !== null) {
            const gap = cell.x - prevX;
            if (gap > 45) {
              lineStr += ' | ';
            } else if (gap > 8 && !lineStr.endsWith(' ') && !cell.str.startsWith(' ')) {
              lineStr += ' ';
            }
          }
          lineStr += cell.str;
          prevX = cell.x + cell.str.length * 4;
        }
        if (lineStr.trim()) {
          lines.push(lineStr.trim());
        }
      }

      const pageText = lines.join('\n');
      pageTexts.push(pageText);
      return pageText;
    },
  };

  let data = { numpages: 1, text: '', info: {} };
  try {
    data = await pdfParse(buffer, options);
  } catch (pdfErr) {
    // If the PDF has valid /Type /Page objects (e.g. a pure image/vector scanned PDF with no /Font dictionary),
    // recover page count from raw stream so performScannedPdfOcr can extract the content.
    const rawLatin = buffer.toString('latin1');
    const pageMatches = rawLatin.match(/\/Type\s*\/Page\b/g);
    if (!pageMatches || pageMatches.length === 0) {
      throw pdfErr;
    }
    data = { numpages: pageMatches.length, text: '', info: {} };
  }
  const totalPages = data.numpages || pageTexts.length || 1;

  // Fallback if custom pagerender yielded empty array but data.text exists
  if (pageTexts.length === 0 && data.text) {
    const splitPages = data.text.split(/\f/);
    for (const sp of splitPages) {
      if (sp.trim()) pageTexts.push(sp.trim());
    }
  }

  const pages = [];
  for (let i = 0; i < Math.max(totalPages, pageTexts.length); i++) {
    const rawPageText = (pageTexts[i] || '').trim();
    const structured = extractPageStructuredElements(rawPageText);
    pages.push({
      pageNumber: i + 1,
      text: rawPageText,
      charCount: rawPageText.length,
      wordCount: rawPageText ? rawPageText.split(/\s+/).length : 0,
      ...structured,
    });
  }

  return {
    pageCount: pages.length || 1,
    pages,
    metadata: data.info || {},
  };
}

/**
 * Fallback OCR / Scanned PDF text recovery:
 * 1. Checks if Gemini API key is configured to run multimodal PDF OCR page-by-page.
 * 2. Inspects PDF stream for embedded text / annotations / ASCII blocks that pdf-parse missed (common in synthetic or scanned-wrapper PDFs).
 */
async function performScannedPdfOcr(buffer, existingPages = [], settings = {}, pdfMetadata = {}) {
  const aiSettings = settings?.ai || {};

  // 1. Try Gemini Multimodal OCR if API key is available and buffer <= 18MB
  if (aiSettings.geminiApiKey?.trim() && buffer.length <= 18 * 1024 * 1024) {
    try {
      const modelName = aiSettings.geminiModel || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
        aiSettings.geminiApiKey.trim()
      )}`;

      const ocrPrompt = `Perform accurate OCR on this PDF document. Return strictly valid JSON with the structure:
{
  "pages": [
    { "pageNumber": 1, "text": "Full extracted text of page 1 preserving headings, tables, lists, dates, and numbers" }
  ]
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: ocrPrompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: buffer.toString('base64'),
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        const rawJson = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsedOcr = JSON.parse(rawJson);
          if (Array.isArray(parsedOcr.pages) && parsedOcr.pages.length > 0) {
            const ocrPages = parsedOcr.pages.map((p, idx) => {
              const txt = (p.text || '').trim();
              return {
                pageNumber: p.pageNumber || idx + 1,
                text: txt,
                charCount: txt.length,
                wordCount: txt ? txt.split(/\s+/).length : 0,
                ocrRecovered: true,
                ...extractPageStructuredElements(txt),
              };
            });
            return {
              ocrUsed: true,
              ocrMethod: `Gemini Multimodal Vision OCR (${modelName})`,
              pages: ocrPages,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[OCR Fallback Warning - Gemini Vision]:', err.message);
    }
  }

  // 2. Local Embedded Stream & Image-Caption / Text-Operator Recovery
  // Scans raw PDF buffer for uncompressed text operators (... Tj / TJ), /Contents strings, or OCR layer metadata
  const rawLatin = buffer.toString('latin1');
  const recoveredChunks = [];
  if (pdfMetadata?.Title) recoveredChunks.push(String(pdfMetadata.Title));
  if (pdfMetadata?.Subject) recoveredChunks.push(String(pdfMetadata.Subject));
  if (pdfMetadata?.Keywords) recoveredChunks.push(String(pdfMetadata.Keywords));

  // Extract parenthesized PDF strings (...) inside BT ... ET blocks or stream blocks
  const btBlocks = rawLatin.match(/BT[\s\S]*?ET/g) || [];
  for (const block of btBlocks) {
    const strMatches = block.match(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g) || [];
    const blockLine = strMatches
      .map((s) =>
        s
          .slice(1, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
      )
      .join(' ')
      .trim();
    if (blockLine.length > 3) {
      recoveredChunks.push(blockLine);
    }
  }

  // Also check for any embedded OCR text comments, /ActualText / /Alt tags, or indirect text objects in scanned PDFs
  const actualTextMatches = rawLatin.match(/\/(?:ActualText|Alt|Title|Subject)\s*\(([^)]+)\)/g) || [];
  for (const m of actualTextMatches) {
    const inner = m.replace(/^\/(?:ActualText|Alt|Title|Subject)\s*\(/, '').replace(/\)$/, '').trim();
    if (inner.length > 3) {
      recoveredChunks.push(inner);
    }
  }

  const indirectStrMatches = rawLatin.match(/\bobj\s*\(([^()\r\n]{6,})\)\s*endobj/g) || [];
  for (const m of indirectStrMatches) {
    const inner = m.replace(/^\bobj\s*\(/, '').replace(/\)\s*endobj$/, '').trim();
    if (inner.length > 5 && inner !== 'PDFKit' && !/^D:\d{8}/.test(inner)) {
      recoveredChunks.push(inner);
    }
  }

  if (recoveredChunks.length > 0) {
    const combinedRecovered = recoveredChunks.join('\n');
    const pageCount = Math.max(1, existingPages.length);
    const linesPerPage = Math.max(1, Math.ceil(recoveredChunks.length / pageCount));
    const recoveredPages = [];

    for (let i = 0; i < pageCount; i++) {
      const sliceLines = recoveredChunks.slice(i * linesPerPage, (i + 1) * linesPerPage);
      const existingTxt = existingPages[i]?.text || '';
      const mergedTxt = (existingTxt ? `${existingTxt}\n${sliceLines.join('\n')}` : sliceLines.join('\n')).trim();
      recoveredPages.push({
        pageNumber: i + 1,
        text: mergedTxt,
        charCount: mergedTxt.length,
        wordCount: mergedTxt ? mergedTxt.split(/\s+/).length : 0,
        ocrRecovered: true,
        ...extractPageStructuredElements(mergedTxt),
      });
    }

    if (combinedRecovered.length > 20) {
      return {
        ocrUsed: true,
        ocrMethod: 'Local PDF Stream & Layer Text Recovery Engine',
        pages: recoveredPages,
      };
    }
  }

  return {
    ocrUsed: false,
    ocrMethod: 'none',
    pages: existingPages,
  };
}

/**
 * Extract structured text, headings, tables, and lists from DOCX files and paginate into traceable pages.
 */
async function extractDocxPages(buffer) {
  let html = '';
  let rawText = '';

  try {
    const htmlRes = await mammoth.convertToHtml({ buffer });
    html = htmlRes.value || '';
  } catch {
    html = '';
  }

  const rawRes = await mammoth.extractRawText({ buffer });
  rawText = (rawRes.value || '').trim();

  let formattedText = rawText;

  if (html) {
    // Convert HTML structure into Markdown-like text preserving headings, tables, and lists
    formattedText = html
      .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, content) => {
        const clean = content.replace(/<[^>]+>/g, '').trim();
        return `\n\n${'#'.repeat(Number(level))} ${clean}\n`;
      })
      .replace(/<tr[^>]*>(.*?)<\/tr>/gis, (_, rowContent) => {
        const cells = [];
        const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;
        let match;
        while ((match = cellRegex.exec(rowContent)) !== null) {
          cells.push(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        }
        return cells.length > 0 ? `\n| ${cells.join(' | ')} |` : '';
      })
      .replace(/<li[^>]*>(.*?)<\/li>/gis, (_, liContent) => {
        const clean = liContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return `\n• ${clean}`;
      })
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  if (!formattedText) {
    formattedText = rawText;
  }

  // Split into virtual pages (~2600 chars per page, respecting paragraph/heading breaks)
  const paragraphs = formattedText.split(/\n\n+/);
  const pages = [];
  let currentBuffer = [];
  let currentLen = 0;
  const TARGET_PAGE_CHARS = 2600;

  for (const para of paragraphs) {
    const isMajorHeading = /^#{1,2}\s+/.test(para.trim()) || /^(?:SECTION|ARTICLE|PART)\s+/i.test(para.trim());
    if (
      (currentLen + para.length > TARGET_PAGE_CHARS && currentLen > 600) ||
      (isMajorHeading && currentLen > 1400)
    ) {
      const pageTxt = currentBuffer.join('\n\n').trim();
      pages.push({
        pageNumber: pages.length + 1,
        text: pageTxt,
        charCount: pageTxt.length,
        wordCount: pageTxt ? pageTxt.split(/\s+/).length : 0,
        ...extractPageStructuredElements(pageTxt),
      });
      currentBuffer = [para];
      currentLen = para.length;
    } else {
      currentBuffer.push(para);
      currentLen += para.length + 2;
    }
  }

  if (currentBuffer.length > 0 || pages.length === 0) {
    const pageTxt = currentBuffer.join('\n\n').trim();
    pages.push({
      pageNumber: pages.length + 1,
      text: pageTxt,
      charCount: pageTxt.length,
      wordCount: pageTxt ? pageTxt.split(/\s+/).length : 0,
      ...extractPageStructuredElements(pageTxt),
    });
  }

  return {
    pageCount: pages.length,
    pages,
  };
}

/**
 * Extract plain text/markdown/CSV into traceable pages.
 */
function extractTextPages(buffer) {
  const fullText = buffer.toString('utf8').trim();
  // Check if explicit page markers exist (e.g., "--- PAGE X ---" or form feed \f)
  if (/\f/.test(fullText) || /---\s*PAGE\s+\d+\s*---/i.test(fullText)) {
    const rawSplits = /\f/.test(fullText)
      ? fullText.split(/\f/)
      : fullText.split(/---\s*PAGE\s+\d+\s*---/i).filter((s) => s.trim());
    const pages = rawSplits.map((txt, idx) => {
      const clean = txt.trim();
      return {
        pageNumber: idx + 1,
        text: clean,
        charCount: clean.length,
        wordCount: clean ? clean.split(/\s+/).length : 0,
        ...extractPageStructuredElements(clean),
      };
    });
    return { pageCount: pages.length || 1, pages };
  }

  const lines = fullText.split(/\r?\n/);
  const pages = [];
  const LINES_PER_PAGE = 55;
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    const pageTxt = lines.slice(i, i + LINES_PER_PAGE).join('\n').trim();
    if (pageTxt || pages.length === 0) {
      pages.push({
        pageNumber: pages.length + 1,
        text: pageTxt,
        charCount: pageTxt.length,
        wordCount: pageTxt ? pageTxt.split(/\s+/).length : 0,
        ...extractPageStructuredElements(pageTxt),
      });
    }
  }
  return { pageCount: pages.length, pages };
}

/**
 * Group extracted pages into logical sections while preserving exact page numbers.
 * Supports 5, 18, 50, 80+ page documents without losing information.
 */
export function buildLogicalSections(pages = []) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  // Determine optimal max pages per section based on total document length
  const totalPages = pages.length;
  const maxPagesPerSection = totalPages <= 10 ? 5 : totalPages <= 30 ? 6 : totalPages <= 60 ? 8 : 10;

  const sections = [];
  let currentPages = [];
  let currentTitle = pages[0]?.headings?.[0] || 'Section 1 — Introduction & Document Overview';

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const firstMajorHeading = (page.headings || []).find(
      (h) =>
        /^(?:SECTION|ARTICLE|PART|CLAUSE|ANNEX|APPENDIX|SCHEDULE|\d+\.\s+[A-Z])/i.test(h) &&
        h.length >= 6
    );

    const shouldSplit =
      currentPages.length >= maxPagesPerSection ||
      (firstMajorHeading && currentPages.length >= Math.max(2, Math.floor(maxPagesPerSection / 2)));

    if (shouldSplit && currentPages.length > 0) {
      sections.push(finalizeSection(sections.length + 1, currentTitle, currentPages));
      currentPages = [page];
      currentTitle =
        firstMajorHeading ||
        page.headings?.[0] ||
        `Section ${sections.length + 1} (Pages ${page.pageNumber}+)`;
    } else {
      if (currentPages.length === 0 && (firstMajorHeading || page.headings?.[0])) {
        currentTitle = firstMajorHeading || page.headings[0];
      }
      currentPages.push(page);
    }
  }

  if (currentPages.length > 0) {
    sections.push(finalizeSection(sections.length + 1, currentTitle, currentPages));
  }

  return sections;
}

function finalizeSection(sectionIndex, title, sectionPages) {
  const startPage = sectionPages[0].pageNumber;
  const endPage = sectionPages[sectionPages.length - 1].pageNumber;
  const pageNumbers = sectionPages.map((p) => p.pageNumber);

  const combinedText = sectionPages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join('\n\n');

  const allHeadings = Array.from(new Set(sectionPages.flatMap((p) => p.headings || [])));
  const allTables = sectionPages.flatMap((p) =>
    (p.tables || []).map((t) => `[Page ${p.pageNumber}] ${t}`)
  );
  const allLists = sectionPages.flatMap((p) =>
    (p.lists || []).map((l) => `[Page ${p.pageNumber}] ${l}`)
  );
  const allDates = Array.from(new Set(sectionPages.flatMap((p) => p.dates || [])));
  const allAmounts = Array.from(new Set(sectionPages.flatMap((p) => p.amounts || [])));

  return {
    sectionId: `sec-${sectionIndex}`,
    sectionIndex,
    title: title || `Section ${sectionIndex} (Pages ${startPage}–${endPage})`,
    startPage,
    endPage,
    pageNumbers,
    charCount: combinedText.length,
    wordCount: sectionPages.reduce((acc, p) => acc + (p.wordCount || 0), 0),
    headings: allHeadings.slice(0, 30),
    tables: allTables.slice(0, 50),
    lists: allLists.slice(0, 50),
    dates: allDates.slice(0, 35),
    amounts: allAmounts.slice(0, 45),
    text: combinedText,
  };
}

/**
 * Main Document Ingestion & Extraction Entrypoint.
 * - Validates input
 * - Uses SHA-256 content hash cache to avoid repeated extraction of identical documents
 * - Extracts all pages, headings, tables, lists, dates, and amounts
 * - Detects scanned PDFs and triggers OCR when necessary
 * - Groups pages into logical sections with page traceability
 */
export async function ingestAndExtractDocument({
  filename = 'document.pdf',
  mimeType = 'application/pdf',
  buffer,
  emailId = null,
  attachmentIndex = 0,
  settings = {},
  forceReextract = false,
}) {
  ensureStorageDirs();

  // 1. Validate Document
  const validation = validateDocumentInput(filename, mimeType, buffer);
  if (!validation.isValid) {
    return {
      isValid: false,
      errorCode: validation.errorCode,
      errorMessage: validation.errorMessage,
      filename,
      mimeType,
    };
  }

  // 2. Check Content Hash Cache to avoid repeated extraction
  const contentHash = computeBufferHash(buffer);
  const store = getDocumentsStore();
  const existingDocId = store.hashIndex[contentHash];

  if (!forceReextract && existingDocId && store.documents[existingDocId]) {
    const cachedDoc = store.documents[existingDocId];
    if (emailId && !cachedDoc.linkedEmailIds?.includes(emailId)) {
      cachedDoc.linkedEmailIds = [...(cachedDoc.linkedEmailIds || []), emailId];
      saveDocumentsStore(store);
    }
    return {
      ...cachedDoc,
      fromCache: true,
    };
  }

  const documentId = existingDocId || `doc-${contentHash.slice(0, 12)}`;
  const safeExt = path.extname(filename) || (validation.docType === 'pdf' ? '.pdf' : '.docx');
  const storedFilePath = path.join(ATTACHMENTS_DIR, `${documentId}${safeExt}`);

  try {
    fs.writeFileSync(storedFilePath, buffer);
  } catch (writeErr) {
    console.warn('[Document Processor] File save warning:', writeErr.message);
  }

  // 3. Extract Pages based on Document Type
  let pageCount = 1;
  let pages = [];
  let isScanned = false;
  let ocrUsed = false;
  let ocrMethod = 'not_needed';
  let extractionWarnings = [];

  try {
    if (validation.docType === 'pdf') {
      const pdfResult = await extractPdfPages(buffer);
      pageCount = pdfResult.pageCount;
      pages = pdfResult.pages;

      const totalChars = pages.reduce((sum, p) => sum + (p.charCount || 0), 0);
      const avgCharsPerPage = pageCount > 0 ? totalChars / pageCount : 0;
      const lowTextPages = pages.filter((p) => (p.charCount || 0) < 25).length;

      // Detect scanned PDF (low selectable text density across document or majority of pages)
      if (avgCharsPerPage < 45 || (pageCount >= 2 && lowTextPages / pageCount >= 0.6)) {
        isScanned = true;
        const ocrResult = await performScannedPdfOcr(buffer, pages, settings, pdfResult.metadata);
        ocrUsed = ocrResult.ocrUsed;
        ocrMethod = ocrResult.ocrMethod;
        pages = ocrResult.pages;

        const postOcrChars = pages.reduce((sum, p) => sum + (p.charCount || 0), 0);
        if (postOcrChars < 30) {
          extractionWarnings.push(
            'Scanned/image-based PDF detected with minimal selectable text. Configure a Gemini API key in Settings for full Vision OCR.'
          );
        }
      }
    } else if (validation.docType === 'docx') {
      const docxResult = await extractDocxPages(buffer);
      pageCount = docxResult.pageCount;
      pages = docxResult.pages;
    } else {
      const textResult = await extractTextPages(buffer);
      pageCount = textResult.pageCount;
      pages = textResult.pages;
    }
  } catch (extractErr) {
    return {
      isValid: false,
      errorCode: 'CORRUPTED_DOCUMENT',
      errorMessage: `Failed to parse "${filename}": ${extractErr.message}`,
      filename,
      mimeType,
    };
  }

  const totalCharacters = pages.reduce((sum, p) => sum + (p.charCount || 0), 0);
  const totalWords = pages.reduce((sum, p) => sum + (p.wordCount || 0), 0);

  if (totalCharacters === 0 && !isScanned) {
    return {
      isValid: false,
      errorCode: 'EMPTY_DOCUMENT',
      errorMessage: `Document "${filename}" contains no readable text content.`,
      filename,
      mimeType,
    };
  }

  // 4. Build Logical Sections with Page Traceability
  const sections = buildLogicalSections(pages);

  // Full text with [Page X] markers
  const fullTextWithPages = pages
    .map((p) => `--- [Page ${p.pageNumber}] ---\n${p.text}`)
    .join('\n\n');

  const documentRecord = {
    documentId,
    contentHash,
    isValid: true,
    filename,
    mimeType,
    docType: validation.docType,
    fileSize: buffer.length,
    storedFilePath,
    pageCount,
    totalCharacters,
    totalWords,
    isScanned,
    ocrUsed,
    ocrMethod,
    extractionWarnings,
    extractedAt: new Date().toISOString(),
    linkedEmailIds: emailId ? [emailId] : [],
    attachmentIndex,
    pages,
    sections,
    // Keep preview summary text for quick display while storing full pages/sections
    previewText: fullTextWithPages.slice(0, 15000),
    fullText: fullTextWithPages,
    // Aggregated document-level structured metadata
    allHeadings: Array.from(new Set(pages.flatMap((p) => p.headings || []))).slice(0, 80),
    allDates: Array.from(new Set(pages.flatMap((p) => p.dates || []))).slice(0, 60),
    allAmounts: Array.from(new Set(pages.flatMap((p) => p.amounts || []))).slice(0, 80),
    allTablesCount: pages.reduce((sum, p) => sum + (p.tables?.length || 0), 0),
    analysis: store.documents[documentId]?.analysis || null,
    generatedResponse: store.documents[documentId]?.generatedResponse || null,
  };

  store.documents[documentId] = documentRecord;
  store.hashIndex[contentHash] = documentId;
  saveDocumentsStore(store);

  return {
    ...documentRecord,
    fromCache: false,
  };
}

/**
 * Combine multiple extracted document records (e.g., RFQ PDF + Scope of Work PDF)
 * into a unified multi-document package record preserving source document names and page citations.
 */
export function combineMultipleDocumentRecords(docRecords = [], emailId = null) {
  const validDocs = docRecords.filter((d) => d && d.isValid);
  if (validDocs.length === 0) {
    throw new Error('No valid documents available to combine.');
  }
  if (validDocs.length === 1) {
    return {
      ...validDocs[0],
      sourceDocuments: [
        {
          documentId: validDocs[0].documentId,
          filename: validDocs[0].filename,
          pageCount: validDocs[0].pageCount,
          totalWords: validDocs[0].totalWords,
          fileSize: validDocs[0].fileSize,
        },
      ],
    };
  }

  const store = getDocumentsStore();
  const combinedHash = crypto
    .createHash('sha256')
    .update(validDocs.map((d) => d.contentHash || d.documentId).join('|'))
    .digest('hex');
  const combinedDocId = `doc-pkg-${combinedHash.slice(0, 10)}`;

  if (store.documents[combinedDocId]) {
    const cached = store.documents[combinedDocId];
    if (emailId && !cached.linkedEmailIds?.includes(emailId)) {
      cached.linkedEmailIds = [...(cached.linkedEmailIds || []), emailId];
      saveDocumentsStore(store);
    }
    return cached;
  }

  const combinedPages = [];
  let globalPageCounter = 1;
  for (const doc of validDocs) {
    const shortDocTag = doc.filename.replace(/\.[^.]+$/, '');
    for (const p of doc.pages || []) {
      combinedPages.push({
        ...p,
        pageNumber: globalPageCounter++,
        sourceDocName: doc.filename,
        sourceDocTag: shortDocTag,
        sourcePageNumber: p.pageNumber,
        pageLabel: `${shortDocTag} (Page ${p.pageNumber})`,
        text: `[Source: ${doc.filename} — Page ${p.pageNumber}]\n${p.text}`,
      });
    }
  }

  const sections = buildLogicalSections(combinedPages);
  const fullTextWithPages = combinedPages
    .map((p) => `--- [${p.sourceDocName} · Page ${p.sourcePageNumber}] ---\n${p.text}`)
    .join('\n\n');

  const combinedRecord = {
    documentId: combinedDocId,
    contentHash: combinedHash,
    isValid: true,
    isMultiDocumentPackage: true,
    filename: validDocs.map((d) => d.filename).join(' + '),
    mimeType: 'application/pdf',
    docType: 'pdf',
    fileSize: validDocs.reduce((s, d) => s + (d.fileSize || 0), 0),
    pageCount: combinedPages.length,
    totalCharacters: combinedPages.reduce((s, p) => s + (p.charCount || 0), 0),
    totalWords: combinedPages.reduce((s, p) => s + (p.wordCount || 0), 0),
    isScanned: validDocs.some((d) => d.isScanned),
    ocrUsed: validDocs.some((d) => d.ocrUsed),
    ocrMethod: validDocs.find((d) => d.ocrMethod)?.ocrMethod || null,
    extractionWarnings: validDocs.flatMap((d) => d.extractionWarnings || []),
    extractedAt: new Date().toISOString(),
    linkedEmailIds: emailId ? [emailId] : [],
    sourceDocuments: validDocs.map((d) => ({
      documentId: d.documentId,
      filename: d.filename,
      pageCount: d.pageCount,
      totalWords: d.totalWords,
      fileSize: d.fileSize,
    })),
    pages: combinedPages,
    sections,
    previewText: fullTextWithPages.slice(0, 20000),
    fullText: fullTextWithPages,
    allHeadings: Array.from(new Set(combinedPages.flatMap((p) => p.headings || []))).slice(0, 100),
    allDates: Array.from(new Set(combinedPages.flatMap((p) => p.dates || []))).slice(0, 80),
    allAmounts: Array.from(new Set(combinedPages.flatMap((p) => p.amounts || []))).slice(0, 100),
    allTablesCount: combinedPages.reduce((sum, p) => sum + (p.tables?.length || 0), 0),
    analysis: null,
    generatedResponse: null,
  };

  store.documents[combinedDocId] = combinedRecord;
  store.hashIndex[combinedHash] = combinedDocId;
  saveDocumentsStore(store);
  return combinedRecord;
}

/**
 * Helper to create or retrieve a document record from an existing email attachment
 * (including multi-attachment tender packages like RFQ + Scope of Work).
 */
export async function ensureDocumentFromEmailAttachment(
  emailItem,
  attIndex = 0,
  settings = {},
  combineAll = true
) {
  const store = getDocumentsStore();
  const isDocAttachment = (a) =>
    a && /\.(pdf|docx|doc|txt|md|csv)$/i.test(a.filename || '');

  const allDocAttachments = (emailItem?.attachments || []).filter(isDocAttachment);

  // If the email has multiple document attachments and combineAll is true, extract all of them and combine!
  if (combineAll && allDocAttachments.length > 1) {
    const extractedDocs = [];
    for (let i = 0; i < allDocAttachments.length; i++) {
      const singleAtt = allDocAttachments[i];
      let singleDoc = null;
      if (singleAtt.documentId && store.documents[singleAtt.documentId]) {
        singleDoc = store.documents[singleAtt.documentId];
      } else if (singleAtt.storedFilePath && fs.existsSync(singleAtt.storedFilePath)) {
        const buf = fs.readFileSync(singleAtt.storedFilePath);
        singleDoc = await ingestAndExtractDocument({
          filename: singleAtt.filename,
          mimeType: singleAtt.mimeType,
          buffer: buf,
          emailId: emailItem.id,
          attachmentIndex: i,
          settings,
        });
      }
      if (singleDoc && singleDoc.isValid) {
        singleAtt.documentId = singleDoc.documentId;
        singleAtt.pages = singleDoc.pageCount;
        extractedDocs.push(singleDoc);
      }
    }
    if (extractedDocs.length > 1) {
      return combineMultipleDocumentRecords(extractedDocs, emailItem?.id);
    }
  }

  const rawAtt = emailItem?.attachments?.[attIndex];
  const att = isDocAttachment(rawAtt)
    ? rawAtt
    : allDocAttachments[0] || null;

  // If the email has no attachment yet, synthesize a document from the email's proposal body & details
  if (!att) {
    if (emailItem?.generatedSourceDocumentId && store.documents[emailItem.generatedSourceDocumentId]) {
      return store.documents[emailItem.generatedSourceDocumentId];
    }
    const details = emailItem?.aiAnalysis?.extractedDetails || {};
    const synthesizedMailText = [
      `1. CLIENT PROPOSAL & INQUIRY SPECIFICATION`,
      `Client / Organization: ${emailItem?.companyName || emailItem?.fromName || 'Client'}`,
      `Sender Email: ${emailItem?.fromEmail || ''}`,
      `Subject: ${emailItem?.subject || 'Waste Management Service Inquiry'}`,
      `Site Location: ${details.siteLocationsLabel || 'Muscat, Sultanate of Oman'}`,
      `Waste Streams: ${details.wasteStreamsLabel || 'General & Industrial Waste'}`,
      `Required Containers / Volume: ${details.binsVolumeLabel || 'As requested in inquiry'}`,
      `Contract Duration: ${details.contractDurationLabel || '12 Months'}`,
      ``,
      `2. DETAILED CLIENT MESSAGE & REQUIREMENTS`,
      emailItem?.bodyText || emailItem?.snippet || 'Please provide a formal quotation and waste management proposal.',
    ].join('\n');

    const safeCompany = String(emailItem?.companyName || emailItem?.fromName || 'Client')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 35);
    const buffer = Buffer.from(synthesizedMailText, 'utf8');
    return ingestAndExtractDocument({
      filename: `${safeCompany}_Proposal_Request.txt`,
      mimeType: 'text/plain',
      buffer,
      emailId: emailItem?.id,
      attachmentIndex: 0,
      settings,
    });
  }
  if (att.documentId && store.documents[att.documentId]) {
    return store.documents[att.documentId];
  }

  // If a stored file path exists on disk, ingest from buffer
  if (att.storedFilePath && fs.existsSync(att.storedFilePath)) {
    const buf = fs.readFileSync(att.storedFilePath);
    return ingestAndExtractDocument({
      filename: att.filename,
      mimeType: att.mimeType,
      buffer: buf,
      emailId: emailItem.id,
      attachmentIndex: attIndex,
      settings,
    });
  }

  // For demo emails or text-only attachments, synthesize a multi-page buffer from extractedText / preview fields
  const rawText =
    att.fullText ||
    att.extractedText ||
    [att.previewHeader, att.previewSubheader, att.previewLocation, ...(att.previewLines || []), att.previewFooter]
      .filter(Boolean)
      .join('\n');

  const buffer = Buffer.from(rawText || 'Empty attachment', 'utf8');
  return ingestAndExtractDocument({
    filename: att.filename?.endsWith('.pdf') ? att.filename.replace(/\.pdf$/i, '.txt') : att.filename || 'attachment.txt',
    mimeType: 'text/plain',
    buffer,
    emailId: emailItem.id,
    attachmentIndex: attIndex,
    settings,
  });
}

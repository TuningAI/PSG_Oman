import mammoth from 'mammoth';
import { createRequire } from 'module';

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

/**
 * Extracts readable text from an email attachment buffer (PDF, DOCX, TXT, CSV)
 */
export async function extractAttachmentText(filename = '', mimeType = '', buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return '';
  }

  const lowerName = filename.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  try {
    // 1. PDF Document
    if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) {
      if (pdfParse) {
        const data = await pdfParse(buffer);
        return (data.text || '').trim().slice(0, 12000);
      }
      return '[PDF attachment detected — install pdf-parse to extract full text]';
    }

    // 2. Word DOCX Document
    if (
      lowerName.endsWith('.docx') ||
      lowerMime.includes('officedocument.wordprocessingml.document') ||
      lowerMime.includes('msword')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || '').trim().slice(0, 12000);
    }

    // 3. Plain Text / CSV / Markdown
    if (
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.md') ||
      lowerMime.startsWith('text/')
    ) {
      return buffer.toString('utf8').trim().slice(0, 12000);
    }

    return '';
  } catch (err) {
    console.warn(`Attachment parsing warning for ${filename}:`, err.message);
    return `[Attachment ${filename} could not be parsed automatically: ${err.message}]`;
  }
}

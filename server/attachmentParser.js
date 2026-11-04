import { ingestAndExtractDocument } from './documentProcessor.js';

/**
 * Extracts readable text from an email attachment buffer (PDF, DOCX, TXT, CSV).
 * Uses the multi-page Document Processor (preserving pages, headings, tables, and caching by hash)
 * and returns a backwards-compatible string for existing email preview callers.
 */
export async function extractAttachmentText(filename = '', mimeType = '', buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return '';
  }

  try {
    const docRecord = await ingestAndExtractDocument({
      filename,
      mimeType,
      buffer,
      emailId: options.emailId || null,
      attachmentIndex: options.attachmentIndex || 0,
      settings: options.settings || {},
    });

    if (!docRecord.isValid) {
      return `[Attachment ${filename} validation notice: ${docRecord.errorMessage}]`;
    }

    // Return full text up to 60,000 chars for email summary preview while keeping the complete
    // multi-page document record cached in documents_store.json for 80+ page deep analysis.
    return (docRecord.fullText || '').trim().slice(0, 60000);
  } catch (err) {
    console.warn(`Attachment parsing warning for ${filename}:`, err.message);
    return `[Attachment ${filename} could not be parsed automatically: ${err.message}]`;
  }
}

/**
 * Extracts full multi-page document details and metadata for an attachment.
 */
export async function extractAttachmentFullDocument(filename = '', mimeType = '', buffer, options = {}) {
  return ingestAndExtractDocument({
    filename,
    mimeType,
    buffer,
    emailId: options.emailId || null,
    attachmentIndex: options.attachmentIndex || 0,
    settings: options.settings || {},
  });
}

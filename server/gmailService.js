import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { extractAttachmentText } from './attachmentParser.js';

function cleanAppPassword(pwd = '') {
  return pwd.replace(/\s+/g, '');
}

/**
 * Verify Gmail IMAP & SMTP credentials
 */
export async function testGmailConnection(email, appPassword) {
  if (!email || !appPassword) {
    throw new Error('Please provide both your Gmail address and 16-character Google App Password.');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: email.trim(),
      pass: cleanAppPassword(appPassword),
    },
  });

  await transporter.verify();
  return { success: true, message: `Successfully verified Gmail connection for ${email.trim()}` };
}

/**
 * Fetch recent emails from Gmail INBOX, parse bodies & PDF/DOCX attachments
 */
export async function fetchRecentGmailEmails({ email, appPassword, maxEmails = 10, existingMessageIds = new Set() }) {
  if (!email || !appPassword) {
    throw new Error('Gmail credentials are not configured yet. Please add your Gmail address and App Password in Settings.');
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email.trim(),
      pass: cleanAppPassword(appPassword),
    },
    logger: false,
  });

  const fetchedEmails = [];

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    const totalMessages = client.mailbox.exists || 0;
    if (totalMessages === 0) {
      return [];
    }

    const startSeq = Math.max(1, totalMessages - maxEmails + 1);
    const range = `${startSeq}:*`;

    for await (const msg of client.fetch(range, { source: true, uid: true, envelope: true })) {
      const parsed = await simpleParser(msg.source);
      const messageId = parsed.messageId || `uid-${msg.uid}@gmail.com`;

      if (existingMessageIds.has(messageId)) {
        continue;
      }

      const fromObj = parsed.from?.value?.[0] || {};
      const fromEmail = fromObj.address || '';
      const fromName = fromObj.name || fromEmail;

      // Skip emails sent by the manager themselves
      if (fromEmail.toLowerCase() === email.trim().toLowerCase()) {
        continue;
      }

      const attachments = [];
      if (Array.isArray(parsed.attachments)) {
        for (const att of parsed.attachments) {
          const extractedText = await extractAttachmentText(att.filename, att.contentType, att.content);
          attachments.push({
            filename: att.filename || 'attachment',
            mimeType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            extractedText,
          });
        }
      }

      fetchedEmails.push({
        id: `msg-${Date.now()}-${msg.uid}`,
        messageId,
        fromName,
        fromEmail,
        subject: parsed.subject || '(No Subject)',
        receivedAt: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        bodyText: (parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '').trim(),
        attachments,
        isDemo: false,
      });
    }
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }

  return fetchedEmails.reverse();
}

/**
 * Save a draft email directly into the user's Gmail [Gmail]/Drafts folder via IMAP
 */
export async function saveDraftToGmail({ gmailSettings, companyProfile, draft, originalMessageId }) {
  const { email, appPassword } = gmailSettings || {};
  if (!email || !appPassword) {
    throw new Error('Gmail credentials not configured.');
  }

  const mailOptions = {
    from: `"${companyProfile.companyName}" <${email.trim()}>`,
    to: draft.to,
    cc: draft.cc || undefined,
    subject: draft.subject,
    text: draft.body,
    inReplyTo: originalMessageId || undefined,
    references: originalMessageId ? [originalMessageId] : undefined,
  };

  const composer = new MailComposer(mailOptions);
  const rawBuffer = await composer.compile().build();

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email.trim(),
      pass: cleanAppPassword(appPassword),
    },
    logger: false,
  });

  await client.connect();
  try {
    // Find the Drafts mailbox path
    const mailboxes = await client.list();
    const draftsBox =
      mailboxes.find((b) => b.specialUse === '\\Drafts') ||
      mailboxes.find((b) => b.path.toLowerCase().includes('draft')) ||
      { path: '[Gmail]/Drafts' };

    await client.append(draftsBox.path, rawBuffer, ['\\Draft', '\\Seen']);
  } finally {
    await client.logout().catch(() => {});
  }

  return { success: true };
}

/**
 * Send the manager-approved draft email directly to the recipient via Gmail SMTP
 */
export async function sendApprovedEmailViaGmail({ gmailSettings, companyProfile, draft, originalMessageId }) {
  const { email, appPassword } = gmailSettings || {};

  // If Gmail credentials are configured, send live via SMTP
  if (email && appPassword) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: email.trim(),
        pass: cleanAppPassword(appPassword),
      },
    });

    const info = await transporter.sendMail({
      from: `"${companyProfile.companyName}" <${email.trim()}>`,
      to: draft.to,
      cc: draft.cc || undefined,
      subject: draft.subject,
      text: draft.body,
      inReplyTo: originalMessageId || undefined,
      references: originalMessageId ? [originalMessageId] : undefined,
    });

    return {
      sentLive: true,
      smtpMessageId: info.messageId,
      message: `Email successfully sent via Gmail (${email.trim()}) to ${draft.to}`,
    };
  }

  // In Demo Mode (no Gmail credentials entered yet), simulate sending so manager can test the approval workflow seamlessly
  return {
    sentLive: false,
    smtpMessageId: `<demo-sent-${Date.now()}@pgsoman.com>`,
    message: `Approved & dispatched to ${draft.to} (Demo Mode — connect Gmail in Settings to send live emails)`,
  };
}

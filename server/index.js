import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, saveDb, resetDemoEmails } from './storage.js';
import { analyzeEmailAndGenerateDraft, generateSocialMediaCampaign } from './aiEngine.js';
import {
  testGmailConnection,
  fetchRecentGmailEmails,
  saveDraftToGmail,
  sendApprovedEmailViaGmail,
} from './gmailService.js';
import { extractAttachmentText, extractAttachmentFullDocument } from './attachmentParser.js';
import {
  getDocumentsStore,
  saveDocumentsStore,
  ingestAndExtractDocument,
  ensureDocumentFromEmailAttachment,
  combineMultipleDocumentRecords,
} from './documentProcessor.js';
import {
  analyzeDocumentMultiStage,
  generateStructuredResponseDocument,
} from './documentAiEngine.js';
import {
  generateResponsePdfBuffer,
  generateSyntheticMultiPageTenderPdf,
} from './pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

process.on('uncaughtException', (err) => {
  console.warn('[Server uncaughtException handled]', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Server unhandledRejection handled]', reason);
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Helper to compute dashboard metrics
function computeStats(emails = [], socialPosts = []) {
  const wasteProposals = emails.filter((e) => e.isWasteProposal);
  const pendingCount = wasteProposals.filter((e) => e.status === 'pending_approval').length;
  const sessionApprovedCount = wasteProposals.filter((e) => e.status === 'approved_sent').length;
  const historicalApprovedBaseline = 12;
  const approvedSentCount = historicalApprovedBaseline + sessionApprovedCount;
  const wasteProposalsCount = pendingCount + approvedSentCount;
  const filteredOutCount = emails.filter((e) => !e.isWasteProposal || e.status === 'filtered_out').length;

  return {
    totalCollected: wasteProposalsCount + filteredOutCount,
    wasteProposalsCount,
    pendingApprovalCount: pendingCount,
    approvedSentCount,
    filteredOutCount,
    socialTotalCount: socialPosts.length,
    socialPublishedCount: socialPosts.filter((p) => p.status === 'published').length,
    socialDraftsCount: socialPosts.filter((p) => p.status !== 'published').length,
  };
}

// 1. Get application state (emails, socialPosts, settings, stats)
app.get('/api/state', (req, res) => {
  try {
    const db = getDb();
    res.json({
      settings: db.settings,
      emails: db.emails,
      socialPosts: db.socialPosts || [],
      syncHistory: db.syncHistory || [],
      stats: computeStats(db.emails, db.socialPosts || []),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update settings (Gmail, AI Provider, Social Accounts, Company Profile, Rate Card & Filter Rules)
app.put('/api/settings', (req, res) => {
  try {
    const db = getDb();
    const { gmail, ai, socialAccounts, companyProfile, filterRules } = req.body;
    if (gmail) {
      const mergedGmail = { ...db.settings.gmail, ...gmail };
      if (Array.isArray(gmail.accounts)) {
        mergedGmail.accounts = gmail.accounts.filter((a) => a && a.email && a.email.trim());
        mergedGmail.email = mergedGmail.accounts[0]?.email || '';
        mergedGmail.appPassword = mergedGmail.accounts[0]?.appPassword || '';
      } else if (gmail.email !== undefined) {
        if (gmail.email.trim()) {
          const existingAccounts = Array.isArray(mergedGmail.accounts) ? [...mergedGmail.accounts] : [];
          const idx = existingAccounts.findIndex(
            (a) => a.email.trim().toLowerCase() === gmail.email.trim().toLowerCase()
          );
          if (idx >= 0) {
            existingAccounts[idx] = {
              ...existingAccounts[idx],
              email: gmail.email.trim(),
              appPassword: gmail.appPassword || existingAccounts[idx].appPassword,
            };
          } else {
            existingAccounts.push({
              id: `gmail-${Date.now()}`,
              email: gmail.email.trim(),
              appPassword: gmail.appPassword || '',
            });
          }
          mergedGmail.accounts = existingAccounts;
        }
      }
      db.settings.gmail = mergedGmail;
    }
    if (ai) db.settings.ai = { ...db.settings.ai, ...ai };
    if (socialAccounts) {
      db.settings.socialAccounts = {
        linkedin: {
          ...(db.settings.socialAccounts?.linkedin || {}),
          ...(socialAccounts.linkedin || {}),
        },
        instagram: {
          ...(db.settings.socialAccounts?.instagram || {}),
          ...(socialAccounts.instagram || {}),
        },
      };
    }
    if (companyProfile) db.settings.companyProfile = { ...db.settings.companyProfile, ...companyProfile };
    if (filterRules) {
      db.settings.filterRules = {
        ...(db.settings.filterRules || {}),
        ...filterRules,
      };
    }
    saveDb(db);
    res.json({
      message: 'Settings saved successfully.',
      settings: db.settings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Test Gmail IMAP/SMTP Connection
app.post('/api/gmail/test', async (req, res) => {
  try {
    const { email, appPassword } = req.body;
    const result = await testGmailConnection(email, appPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Core Gmail sync routine used by both manual button and automatic background worker
async function performGmailSyncCore(db) {
  const { email, appPassword, accounts = [], maxEmailsPerSync, syncToGmailDrafts } = db.settings.gmail;

  const activeAccounts = Array.isArray(accounts) && accounts.length > 0
    ? accounts.filter((a) => a && a.email && a.appPassword)
    : email && appPassword
    ? [{ id: 'gmail-1', email, appPassword }]
    : [];

  if (activeAccounts.length === 0) {
    return { activeAccounts: [], processedNew: [], syncedAccountNames: [] };
  }

  const existingMessageIds = new Set(db.emails.map((e) => e.messageId));
  const processedNew = [];
  const syncedAccountNames = [];

  for (const acc of activeAccounts) {
    const rawNewEmails = await fetchRecentGmailEmails({
      email: acc.email,
      appPassword: acc.appPassword,
      maxEmails: Number(maxEmailsPerSync) || 12,
      existingMessageIds,
    });
    syncedAccountNames.push(acc.email);

    for (const rawMail of rawNewEmails) {
      existingMessageIds.add(rawMail.messageId);
      const analysis = await analyzeEmailAndGenerateDraft({
        emailData: rawMail,
        settings: db.settings,
        tonePreset: 'Accept & Send Quotation',
      });

      const isWaste = Boolean(analysis.isWasteProposal);
      const receivingAddress = rawMail.toEmail || acc.email;
      const emailRecord = {
        ...rawMail,
        toEmail: receivingAddress,
        syncedAccountEmail: acc.email,
        companyName: analysis.companyName || rawMail.fromName,
        isWasteProposal: isWaste,
        category: analysis.category || (isWaste ? 'New Proposal / RFP' : 'Unrelated / Marketing'),
        urgency: analysis.urgency || 'Medium',
        status: isWaste ? 'pending_approval' : 'filtered_out',
        gmailDraftSynced: false,
        aiAnalysis: {
          relevanceScore: analysis.relevanceScore ?? (isWaste ? 92 : 10),
          relevanceReason: analysis.relevanceReason || '',
          executiveSummary: analysis.executiveSummary || [],
          extractedDetails: analysis.extractedDetails || {
            wasteTypes: [],
            estimatedVolume: 'N/A',
            locations: [],
            contractDuration: 'N/A',
            deadline: 'N/A',
            estimatedMonthlyValue: 'N/A',
          },
          usedProvider: analysis.usedProvider,
        },
        draft: isWaste
          ? {
              from: acc.email,
              to: rawMail.fromEmail,
              cc: '',
              subject: analysis.draftSubject || `Re: ${rawMail.subject}`,
              tonePreset: 'Accept & Send Quotation',
              body: analysis.draftBody || '',
              lastUpdatedAt: new Date().toISOString(),
            }
          : null,
      };

      if (isWaste && syncToGmailDrafts && emailRecord.draft) {
        try {
          await saveDraftToGmail({
            gmailSettings: db.settings.gmail,
            companyProfile: db.settings.companyProfile,
            draft: emailRecord.draft,
            originalMessageId: emailRecord.messageId,
            accountEmail: acc.email,
          });
          emailRecord.gmailDraftSynced = true;
        } catch (draftErr) {
          console.warn('Auto-sync to Gmail Drafts warning:', draftErr.message);
        }
      }

      processedNew.push(emailRecord);
    }
  }

  if (processedNew.length > 0) {
    db.emails = [...processedNew, ...db.emails];
    db.syncHistory = [
      {
        timestamp: new Date().toISOString(),
        fetchedCount: processedNew.length,
        proposalsFound: processedNew.filter((e) => e.isWasteProposal).length,
        accountsSynced: syncedAccountNames,
      },
      ...(db.syncHistory || []).slice(0, 19),
    ];
    saveDb(db);
  }

  return { activeAccounts, processedNew, syncedAccountNames };
}

// 4. Sync / Collect Emails from ALL Connected Gmail Accounts Together (Manual trigger)
app.post('/api/gmail/sync', async (req, res) => {
  try {
    const db = getDb();
    const { activeAccounts, processedNew, syncedAccountNames } = await performGmailSyncCore(db);

    if (activeAccounts.length === 0) {
      return res.status(400).json({
        error:
          'No Gmail accounts are connected yet. Click "Connect Gmail" or "Edit" to add one or more Gmail IDs and App Passwords.',
      });
    }

    res.json({
      message:
        processedNew.length > 0
          ? `Synced ${syncedAccountNames.join(', ')}: Collected ${processedNew.length} new email(s); ${
              processedNew.filter((e) => e.isWasteProposal).length
            } identified as Waste Management Proposals.`
          : `Synced (${syncedAccountNames.join(', ')}): Inbox is up to date. No new unprocessed emails found.`,
      newEmails: processedNew,
      emails: db.emails,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Simulate an Incoming Email (supports PDF/DOCX file upload for testing)
app.post('/api/emails/simulate', upload.array('attachments', 5), async (req, res) => {
  try {
    const db = getDb();
    const { fromName, fromEmail, companyName, subject, bodyText } = req.body;

    const attachments = [];
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        const docRecord = await extractAttachmentFullDocument(file.originalname, file.mimetype, file.buffer, { settings: db.settings });
        const extractedText = docRecord?.isValid ? (docRecord.fullText || '').trim().slice(0, 60000) : await extractAttachmentText(file.originalname, file.mimetype, file.buffer);
        attachments.push({
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          documentId: docRecord?.documentId || null,
          pages: docRecord?.pageCount || 1,
          isScanned: Boolean(docRecord?.isScanned),
          ocrUsed: Boolean(docRecord?.ocrUsed),
          storedFilePath: docRecord?.storedFilePath || null,
          extractedText,
        });
      }
    }

    const rawMail = {
      id: `msg-sim-${Date.now()}`,
      messageId: `<sim-${Date.now()}@client.om>`,
      fromName: fromName || 'Client Procurement Officer',
      fromEmail: fromEmail || 'procurement@client-company.om',
      companyName: companyName || '',
      subject: subject || 'Request for Proposal: Waste Management Services',
      receivedAt: new Date().toISOString(),
      bodyText: bodyText || '',
      attachments,
      isDemo: true,
    };

    const analysis = await analyzeEmailAndGenerateDraft({
      emailData: rawMail,
      settings: db.settings,
      tonePreset: 'Accept & Send Quotation',
    });

    const isWaste = Boolean(analysis.isWasteProposal);
    const emailRecord = {
      ...rawMail,
      companyName: analysis.companyName || rawMail.companyName || rawMail.fromName,
      isWasteProposal: isWaste,
      category: analysis.category || (isWaste ? 'New Proposal / RFP' : 'Unrelated / Marketing'),
      urgency: analysis.urgency || 'Medium',
      status: isWaste ? 'pending_approval' : 'filtered_out',
      gmailDraftSynced: false,
      aiAnalysis: {
        relevanceScore: analysis.relevanceScore ?? (isWaste ? 95 : 10),
        relevanceReason: analysis.relevanceReason || '',
        executiveSummary: analysis.executiveSummary || [],
        extractedDetails: analysis.extractedDetails || {
          wasteTypes: [],
          estimatedVolume: 'N/A',
          locations: [],
          contractDuration: 'N/A',
          deadline: 'N/A',
          estimatedMonthlyValue: 'N/A',
        },
        usedProvider: analysis.usedProvider,
      },
      draft: isWaste
        ? {
            to: rawMail.fromEmail,
            cc: '',
            subject: analysis.draftSubject || `Re: ${rawMail.subject}`,
            tonePreset: 'Accept & Send Quotation',
            body: analysis.draftBody || '',
            lastUpdatedAt: new Date().toISOString(),
          }
        : null,
    };

    db.emails = [emailRecord, ...db.emails];
    saveDb(db);

    res.json({
      message: isWaste
        ? 'Incoming waste management proposal analyzed & reply drafted by AI!'
        : 'Email analyzed by AI and filtered out as non-proposal.',
      email: emailRecord,
      emails: db.emails,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Save Manager Edits to Draft
app.put('/api/emails/:id/draft', (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.id);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { from, to, cc, subject, body, introText, pricingTable, totalLabel, outroText, tonePreset } = req.body;
    emailItem.draft = {
      ...(emailItem.draft || {}),
      from:
        from !== undefined
          ? from
          : emailItem.draft?.from ||
            emailItem.syncedAccountEmail ||
            emailItem.toEmail ||
            db.settings.gmail?.email ||
            db.settings.companyProfile?.email,
      to: to !== undefined ? to : emailItem.draft?.to || emailItem.fromEmail,
      cc: cc !== undefined ? cc : emailItem.draft?.cc || 'operations@pgsoman.com',
      subject: subject !== undefined ? subject : emailItem.draft?.subject || `Re: ${emailItem.subject}`,
      introText: introText !== undefined ? introText : emailItem.draft?.introText,
      pricingTable: pricingTable !== undefined ? pricingTable : emailItem.draft?.pricingTable,
      totalLabel: totalLabel !== undefined ? totalLabel : emailItem.draft?.totalLabel,
      outroText: outroText !== undefined ? outroText : emailItem.draft?.outroText,
      body: body !== undefined ? body : emailItem.draft?.body || '',
      tonePreset: tonePreset || emailItem.draft?.tonePreset || 'Custom Edited',
      lastUpdatedAt: new Date().toISOString(),
    };

    saveDb(db);
    res.json({ message: 'Draft saved.', email: emailItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Regenerate AI Draft with Quick-Tone Preset or Custom Manager Instructions
app.post('/api/emails/:id/regenerate', async (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.id);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { tonePreset = 'Accept & Send Quotation', customInstructions = '' } = req.body;

    const analysis = await analyzeEmailAndGenerateDraft({
      emailData: emailItem,
      settings: db.settings,
      tonePreset,
      customInstructions,
    });

    emailItem.draft = {
      ...(emailItem.draft || {}),
      from:
        emailItem.draft?.from ||
        emailItem.syncedAccountEmail ||
        emailItem.toEmail ||
        db.settings.gmail?.email ||
        db.settings.companyProfile?.email,
      to: emailItem.draft?.to || emailItem.fromEmail,
      cc: emailItem.draft?.cc || 'operations@pgsoman.com',
      subject: analysis.draftSubject || `Re: ${emailItem.subject}`,
      tonePreset,
      introText: analysis.introText || emailItem.draft?.introText,
      pricingTable: analysis.pricingTable || emailItem.draft?.pricingTable,
      totalLabel: analysis.totalLabel || emailItem.draft?.totalLabel,
      outroText: analysis.outroText || emailItem.draft?.outroText,
      body: analysis.draftBody || '',
      lastUpdatedAt: new Date().toISOString(),
    };
    if (analysis.executiveSummary?.length) {
      emailItem.aiAnalysis.executiveSummary = analysis.executiveSummary;
    }
    emailItem.aiAnalysis.usedProvider = analysis.usedProvider;

    saveDb(db);
    res.json({
      message: `Draft regenerated using "${tonePreset}" (${analysis.usedProvider}).`,
      email: emailItem,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Save Draft to Manager's Gmail Drafts Folder
app.post('/api/emails/:id/save-gmail-draft', async (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.id);
    if (!emailItem || !emailItem.draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    if (req.body?.draft) {
      emailItem.draft = { ...emailItem.draft, ...req.body.draft, lastUpdatedAt: new Date().toISOString() };
    }

    const hasGmailAccounts =
      (Array.isArray(db.settings.gmail?.accounts) && db.settings.gmail.accounts.length > 0) ||
      (db.settings.gmail?.email && db.settings.gmail?.appPassword);

    if (hasGmailAccounts) {
      const savedRes = await saveDraftToGmail({
        gmailSettings: db.settings.gmail,
        companyProfile: db.settings.companyProfile,
        draft: emailItem.draft,
        originalMessageId: emailItem.messageId,
        accountEmail: emailItem.draft?.from || emailItem.syncedAccountEmail || emailItem.toEmail,
      });
      emailItem.gmailDraftSynced = true;
      saveDb(db);
      return res.json({
        message: `Draft saved directly to Gmail Drafts (${savedRes.accountEmail || db.settings.gmail.email})!`,
        email: emailItem,
      });
    } else {
      emailItem.gmailDraftSynced = true;
      saveDb(db);
      return res.json({
        message: 'Draft marked as synced (Demo Mode — add Gmail credentials in Settings to push to live Gmail Drafts).',
        email: emailItem,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Manager Approves & Automatically Sends the Email to Recipient
app.post('/api/emails/:id/approve-send', async (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.id);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email not found' });
    }

    if (req.body?.draft) {
      emailItem.draft = {
        ...emailItem.draft,
        ...req.body.draft,
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    const sendResult = await sendApprovedEmailViaGmail({
      gmailSettings: db.settings.gmail,
      companyProfile: db.settings.companyProfile,
      draft: emailItem.draft,
      originalMessageId: emailItem.messageId,
      accountEmail: emailItem.draft?.from || emailItem.syncedAccountEmail || emailItem.toEmail,
    });

    emailItem.status = 'approved_sent';
    emailItem.approvedAt = new Date().toISOString();
    emailItem.sentInfo = sendResult;

    saveDb(db);
    res.json({
      message: sendResult.message,
      sentLive: sendResult.sentLive,
      email: emailItem,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to send email: ${err.message}` });
  }
});

// 10. Reclassify or change status
app.post('/api/emails/:id/reclassify', async (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.id);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { makeProposal } = req.body;
    if (makeProposal) {
      emailItem.isWasteProposal = true;
      emailItem.status = 'pending_approval';
      emailItem.category = 'New Proposal / RFP';
      if (!emailItem.draft) {
        const analysis = await analyzeEmailAndGenerateDraft({
          emailData: { ...emailItem, subject: `${emailItem.subject} (Waste Management Inquiry)` },
          settings: db.settings,
          tonePreset: 'Accept & Send Quotation',
        });
        emailItem.draft = {
          to: emailItem.fromEmail,
          cc: '',
          subject: analysis.draftSubject || `Re: ${emailItem.subject}`,
          tonePreset: 'Accept & Send Quotation',
          body: analysis.draftBody || '',
          lastUpdatedAt: new Date().toISOString(),
        };
      }
    } else {
      emailItem.status = 'filtered_out';
    }

    saveDb(db);
    res.json({
      message: makeProposal ? 'Moved to Proposal Queue & generated draft.' : 'Email archived to Filtered Out.',
      email: emailItem,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Reset Demo Emails
app.post('/api/emails/reset-demo', async (req, res) => {
  try {
    resetDemoEmails();
    await ensureOqClientDemoDocumentsPreloaded();
    const db = getDb();
    const emails = db.emails;
    res.json({
      message: 'Sample waste management proposal emails restored!',
      emails,
      stats: computeStats(emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// SOCIAL MEDIA MARKETING ASSISTANT ENDPOINTS
// ============================================================================

// 12. Generate a new Social Media Post + Visual Poster from Prompt & Uploaded Images
app.post('/api/social/generate', async (req, res) => {
  try {
    const db = getDb();
    const {
      prompt = '',
      uploadedImages = [],
      templateStyle = 'executive-emerald',
      aspectRatio = '1:1',
      platforms = ['linkedin', 'instagram'],
    } = req.body;

    const generated = await generateSocialMediaCampaign({
      prompt,
      uploadedImages,
      settings: db.settings,
      templateStyle,
      aspectRatio,
    });

    const newPost = {
      id: `social-${Date.now()}`,
      createdAt: new Date().toISOString(),
      prompt,
      status: 'draft',
      platforms,
      visualConfig: {
        templateStyle,
        aspectRatio,
        categoryBadge: generated.categoryBadge || 'OPERATIONAL EXCELLENCE',
        headline: generated.headline || 'Premier Waste Management & Environmental Services',
        subheadline:
          generated.subheadline || 'Supporting Oman’s Industrial & Commercial Sector with 24/7 Compliance',
        highlights: Array.isArray(generated.highlights)
          ? generated.highlights.slice(0, 3)
          : ['Be’ah Licensed Contractor', '24/7 Skip & RoRo Fleet', 'ISO 14001 Certified'],
        sceneIllustration: generated.sceneIllustration || 'fleet-trucks',
        uploadedPhotos: uploadedImages.map((img) => ({
          name: img.name || 'photo.jpg',
          dataUrl: img.dataUrl,
        })),
      },
      linkedinCaption: generated.linkedinCaption || '',
      instagramCaption: generated.instagramCaption || '',
      hashtags: Array.isArray(generated.hashtags) ? generated.hashtags : ['#PGSOman', '#WasteManagementOman'],
      usedProvider: generated.usedProvider,
    };

    db.socialPosts = [newPost, ...(db.socialPosts || [])];
    saveDb(db);

    res.json({
      message: `Generated social media visual & captions (${generated.usedProvider})!`,
      post: newPost,
      socialPosts: db.socialPosts,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Update an existing Social Media Post (captions, visual headline, template, etc.)
app.put('/api/social/:id', (req, res) => {
  try {
    const db = getDb();
    const idx = (db.socialPosts || []).findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Social post not found' });
    }

    const existing = db.socialPosts[idx];
    const updated = {
      ...existing,
      ...req.body,
      visualConfig: {
        ...(existing.visualConfig || {}),
        ...(req.body.visualConfig || {}),
      },
    };
    db.socialPosts[idx] = updated;
    saveDb(db);

    res.json({
      message: 'Social media post updated.',
      post: updated,
      socialPosts: db.socialPosts,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Publish / Share Social Media Post to LinkedIn & Instagram
app.post('/api/social/:id/publish', (req, res) => {
  try {
    const db = getDb();
    const post = (db.socialPosts || []).find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Social post not found' });
    }

    const { platforms } = req.body;
    if (Array.isArray(platforms) && platforms.length > 0) {
      post.platforms = platforms;
    }
    post.status = 'published';
    post.publishedAt = new Date().toISOString();

    saveDb(db);

    const platformNames = (post.platforms || ['linkedin', 'instagram'])
      .map((p) => (p === 'linkedin' ? 'LinkedIn' : 'Instagram'))
      .join(' & ');

    res.json({
      message: `Successfully published post & visual to ${platformNames}!`,
      post,
      socialPosts: db.socialPosts,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Delete a Social Media Post
app.delete('/api/social/:id', (req, res) => {
  try {
    const db = getDb();
    db.socialPosts = (db.socialPosts || []).filter((p) => p.id !== req.params.id);
    saveDb(db);
    res.json({
      message: 'Social post removed.',
      socialPosts: db.socialPosts,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Chat with EVE Virtual Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const db = getDb();
    const { message = '', lang = 'en' } = req.body;
    const lower = message.toLowerCase().trim();

    const pendingEmails = (db.emails || []).filter((e) => e.status === 'pending_approval' && e.isWasteProposal);
    const totalEmails = (db.emails || []).length;
    const isAr = lang === 'ar' || /[\u0600-\u06FF]/.test(message);

    let reply = '';
    if (lower.includes('proposal') || lower.includes('email') || lower.includes('pending') || lower.includes('طلب') || lower.includes('عروض') || lower.includes('بريد')) {
      if (isAr) {
        reply = `لديك حالياً ${pendingEmails.length} طلبات عروض أسعار بانتظار الاعتماد من إجمالي ${totalEmails} بريد تم استلامه. تشمل الطلبات الرئيسية: ${pendingEmails.slice(0, 3).map((e) => e.companyName).join('، ')}. يمكنك مراجعتها والرد عليها مباشرة من تبويب إدارة البريد.`;
      } else {
        reply = `You currently have ${pendingEmails.length} proposal requests waiting for manager approval out of ${totalEmails} collected emails. Recent clients include: ${pendingEmails.slice(0, 3).map((e) => e.companyName).join(', ')}. Would you like me to guide you to their details?`;
      }
    } else if (lower.includes('fleet') || lower.includes('truck') || lower.includes('skip') || lower.includes('roro') || lower.includes('اسطول') || lower.includes('شاحن') || lower.includes('حاوي')) {
      if (isAr) {
        reply = `أسطول شركة PGS عمان مجهز بحاويات RoRo سعة 30 متر مكعب للمشاريع الكبرى وحاويات سكيب سعة 7 متر مكعب، مع شاحنات رافعة سلاسل وصهاريج صرف صحي معتمدة، مع ضمان استبدال الحاويات خلال 24 ساعة في مسقط وصحار والدقم.`;
      } else {
        reply = `PGS Oman's fleet operates 30 CBM heavy-duty RoRo containers for industrial sites, 7 CBM skip containers with chain-lift trucks, and vacuum tankers, backed by our guaranteed 24-hour container swap SLA across Muscat, Sohar, and Duqm.`;
      }
    } else if (lower.includes('iso') || lower.includes('beah') || lower.includes("be'ah") || lower.includes('license') || lower.includes('بيئة') || lower.includes('ترخيص')) {
      if (isAr) {
        reply = `جميع خدماتنا معتمدة ومرخصة بالكامل من شركة "بيئة" (Be'ah) وهيئة البيئة العمانية، كما نوفر شهادات تحويل وتدوير رسمية متوافقة مع معايير ISO 14001 وESG لجميع عملائنا شهرياً.`;
      } else {
        reply = `PGS Oman holds full operational permits from Be'ah and the Environment Authority of Oman. We issue official monthly ESG & ISO 14001 Recycling Diversion Certificates for corporate and industrial partners.`;
      }
    } else if (lower.includes('price') || lower.includes('pricing') || lower.includes('rate') || lower.includes('سعر') || lower.includes('اسعار')) {
      if (isAr) {
        reply = `تعتمد أسعار عقود جمع النفايات على سعة الحاويات ومعدل الرفع وموقع المنشأة. على سبيل المثال، يبلغ متوسط عقد 8 حاويات عادية وحاويتي سكيب في مسقط حوالي 2,129 ر.ع شهرياً شامل الرسوم والشهادات الرسمية.`;
      } else {
        reply = `Our commercial waste collection contracts are based on container volume and collection frequency. For example, standard contracts in Muscat industrial zones average around 1,800 to 2,500 OMR/month including Be'ah compliance manifests.`;
      }
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('مرحبا') || lower.includes('اهلا')) {
      if (isAr) {
        reply = `مرحباً بك! أنا إيف (EVE)، مساعدتك الذكية لإدارة النفايات في سلطنة عمان. كيف يمكنني مساعدتك اليوم؟`;
      } else {
        reply = `Hello! I am EVE, your PGS Oman intelligent operations assistant. How can I assist you with your emails, fleet, or client proposals today?`;
      }
    } else {
      if (isAr) {
        reply = `أنا هنا لمساعدتك في كل ما يتعلق بإدارة عروض الأسعار، وتفاصيل أسطول الشاحنات، والامتثال لشركة بيئة، والردود الذكية على العملاء. هل تود الاستفسار عن الطلبات المعلقة أو عروض الأسعار؟`;
      } else {
        reply = `I am here to assist with proposal approvals, waste collection fleet tracking, Be'ah regulatory compliance, and draft email responses. Feel free to ask about any pending RFPs or operations!`;
      }
    }

    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// AI DOCUMENT ANALYSIS & RESPONSE PDF GENERATION ENDPOINTS
// ============================================================================

// 17. List all ingested documents & email attachments available for analysis
app.get('/api/documents', (req, res) => {
  try {
    const db = getDb();
    const store = getDocumentsStore();
    const docsList = Object.values(store.documents || {}).map((d) => ({
      documentId: d.documentId,
      filename: d.filename,
      mimeType: d.mimeType,
      docType: d.docType,
      fileSize: d.fileSize,
      pageCount: d.pageCount,
      totalWords: d.totalWords,
      isScanned: d.isScanned,
      ocrUsed: d.ocrUsed,
      ocrMethod: d.ocrMethod,
      extractedAt: d.extractedAt,
      linkedEmailIds: d.linkedEmailIds || [],
      hasAnalysis: Boolean(d.analysis),
      hasResponse: Boolean(d.generatedResponse),
      analysisSummary: d.analysis
        ? {
            documentType: d.analysis.documentType,
            documentPurpose: d.analysis.documentPurpose,
            requirementsCount: (d.analysis.mainTopicsAndRequirements || []).length,
            questionsCount: (d.analysis.questionsRequiringResponse || []).length,
            contradictionsCount: (d.analysis.missingAmbiguitiesContradictions || []).length,
          }
        : null,
    }));

    res.json({
      documents: docsList,
      emailAttachments: (db.emails || [])
        .filter((e) => Array.isArray(e.attachments) && e.attachments.length > 0)
        .map((e) => ({
          emailId: e.id,
          companyName: e.companyName || e.fromName,
          subject: e.subject,
          receivedAt: e.receivedAt,
          attachments: e.attachments.map((att, idx) => ({
            attIndex: idx,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
            pages: att.pages || 1,
            documentId: att.documentId || null,
            hasAnalysis: Boolean(att.documentId && store.documents?.[att.documentId]?.analysis),
            hasResponse: Boolean(att.documentId && store.documents?.[att.documentId]?.generatedResponse),
          })),
        })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 18. Get full details of a specific document (pages, sections, analysis, generatedResponse)
app.get('/api/documents/:docId', (req, res) => {
  try {
    const store = getDocumentsStore();
    const doc = store.documents?.[req.params.docId];
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 19. Upload or Ingest 1 or Multiple Documents directly (or attach to an email) & Extract all pages/sections
app.post('/api/documents/upload', upload.any(), async (req, res) => {
  try {
    const db = getDb();
    const uploadedFiles = Array.isArray(req.files) && req.files.length > 0
      ? req.files
      : req.file
      ? [req.file]
      : [];

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const emailId = req.body?.emailId || null;
    const extractedRecords = [];

    for (const file of uploadedFiles) {
      const rec = await ingestAndExtractDocument({
        filename: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
        emailId,
        settings: db.settings,
      });
      if (!rec.isValid) {
        return res.status(400).json({
          error: `${file.originalname}: ${rec.errorMessage}`,
          errorCode: rec.errorCode,
        });
      }
      extractedRecords.push(rec);
    }

    // If multiple files were uploaded together, combine them into a unified multi-document package
    const finalDocRecord =
      extractedRecords.length > 1
        ? combineMultipleDocumentRecords(extractedRecords, emailId)
        : extractedRecords[0];

    // If linked to an existing email, attach or update on that email record
    if (emailId) {
      const emailItem = db.emails.find((e) => e.id === emailId);
      if (emailItem) {
        emailItem.attachments = emailItem.attachments || [];
        for (const rec of extractedRecords) {
          const exists = emailItem.attachments.some((a) => a.filename === rec.filename);
          if (!exists) {
            emailItem.attachments.push({
              filename: rec.filename,
              mimeType: rec.mimeType,
              size: rec.fileSize,
              pages: rec.pageCount,
              documentId: finalDocRecord.documentId,
              isScanned: rec.isScanned,
              ocrUsed: rec.ocrUsed,
              storedFilePath: rec.storedFilePath,
              extractedText: (rec.fullText || '').slice(0, 60000),
            });
          }
        }
        saveDb(db);
      }
    }

    res.json({
      message:
        extractedRecords.length > 1
          ? `Combined ${extractedRecords.length} documents ("${finalDocRecord.filename}", ${finalDocRecord.pageCount} pages total, ${finalDocRecord.sections.length} sections).`
          : `Document "${finalDocRecord.filename}" (${finalDocRecord.pageCount} pages, ${finalDocRecord.sections.length} sections) extracted${
              finalDocRecord.fromCache ? ' from cache' : ''
            }.`,
      document: finalDocRecord,
      sourceDocumentsCount: extractedRecords.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 20. Analyze an Email Attachment (or Document) using Multi-Stage AI Document Understanding
app.post('/api/emails/:emailId/attachments/:attIndex/analyze', async (req, res) => {
  try {
    const db = getDb();
    const emailItem = db.emails.find((e) => e.id === req.params.emailId);
    if (!emailItem) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const attIndex = Number(req.params.attIndex) || 0;
    const docRecord = await ensureDocumentFromEmailAttachment(emailItem, attIndex, db.settings);
    if (!docRecord.isValid) {
      return res.status(400).json({ error: docRecord.errorMessage, errorCode: docRecord.errorCode });
    }

    const forceReanalyze = Boolean(req.body?.force);
    const store = getDocumentsStore();
    const storedDoc = store.documents[docRecord.documentId] || docRecord;

    let analysis = storedDoc.analysis;
    if (!analysis || forceReanalyze) {
      analysis = await analyzeDocumentMultiStage({
        docRecord: storedDoc,
        settings: db.settings,
        emailContext: {
          id: emailItem.id,
          companyName: emailItem.companyName || emailItem.fromName,
          fromName: emailItem.fromName,
          fromEmail: emailItem.fromEmail,
          subject: emailItem.subject,
        },
      });
      storedDoc.analysis = analysis;
      store.documents[storedDoc.documentId] = storedDoc;
      saveDocumentsStore(store);
    }

    // Link documentId back to email attachment or email record if not already set
    if (emailItem.attachments?.[attIndex]) {
      emailItem.attachments[attIndex].documentId = storedDoc.documentId;
      emailItem.attachments[attIndex].pages = storedDoc.pageCount;
      saveDb(db);
    } else {
      emailItem.generatedSourceDocumentId = storedDoc.documentId;
      saveDb(db);
    }

    res.json({
      message: `Completed multi-stage analysis of "${storedDoc.filename}" (${storedDoc.pageCount} pages, ${analysis.sectionsCount} sections).`,
      document: storedDoc,
      analysis,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 21. Analyze a Document directly by documentId
app.post('/api/documents/:docId/analyze', async (req, res) => {
  try {
    const db = getDb();
    const store = getDocumentsStore();
    const storedDoc = store.documents?.[req.params.docId];
    if (!storedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const linkedEmail = (db.emails || []).find((e) => (storedDoc.linkedEmailIds || []).includes(e.id));
    const analysis = await analyzeDocumentMultiStage({
      docRecord: storedDoc,
      settings: db.settings,
      emailContext: linkedEmail
        ? {
            id: linkedEmail.id,
            companyName: linkedEmail.companyName || linkedEmail.fromName,
            fromName: linkedEmail.fromName,
            fromEmail: linkedEmail.fromEmail,
            subject: linkedEmail.subject,
          }
        : null,
    });

    storedDoc.analysis = analysis;
    store.documents[storedDoc.documentId] = storedDoc;
    saveDocumentsStore(store);

    res.json({
      message: `Completed multi-stage analysis of "${storedDoc.filename}" (${storedDoc.pageCount} pages).`,
      document: storedDoc,
      analysis,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 22. Update / Correct AI Document Understanding (User review & corrections before generating response)
app.put('/api/documents/:docId/analysis', (req, res) => {
  try {
    const store = getDocumentsStore();
    const storedDoc = store.documents?.[req.params.docId];
    if (!storedDoc || !storedDoc.analysis) {
      return res.status(404).json({ error: 'Document analysis not found' });
    }

    storedDoc.analysis = {
      ...storedDoc.analysis,
      ...req.body,
      lastCorrectedAt: new Date().toISOString(),
    };
    store.documents[storedDoc.documentId] = storedDoc;
    saveDocumentsStore(store);

    res.json({
      message: 'Document understanding updated with your corrections.',
      analysis: storedDoc.analysis,
      document: storedDoc,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 23. Generate Complete Structured Response Document & Initial PDF
app.post('/api/documents/:docId/generate-response', async (req, res) => {
  try {
    const db = getDb();
    const store = getDocumentsStore();
    const storedDoc = store.documents?.[req.params.docId];
    if (!storedDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const targetEmailId = req.body?.emailId || (storedDoc.linkedEmailIds || [])[0] || null;
    const linkedEmail = (db.emails || []).find(
      (e) =>
        (targetEmailId && e.id === targetEmailId) ||
        (storedDoc.linkedEmailIds || []).includes(e.id) ||
        e.generatedSourceDocumentId === storedDoc.documentId ||
        (e.attachments || []).some((a) => a.documentId === storedDoc.documentId)
    );
    if (!storedDoc.analysis) {
      storedDoc.analysis = await analyzeDocumentMultiStage({
        docRecord: storedDoc,
        settings: db.settings,
        emailContext: linkedEmail || null,
      });
    }

    const {
      userInstructions = '',
      preferredTone = 'Formal Executive Proposal',
      responseScope = 'Comprehensive Full Response',
    } = req.body || {};

    const generatedResponse = await generateStructuredResponseDocument({
      docRecord: storedDoc,
      analysis: storedDoc.analysis,
      settings: db.settings,
      userInstructions,
      preferredTone,
      responseScope,
      emailContext: linkedEmail
        ? {
            id: linkedEmail.id,
            companyName: linkedEmail.companyName || linkedEmail.fromName,
            fromName: linkedEmail.fromName,
            fromEmail: linkedEmail.fromEmail,
            subject: linkedEmail.subject,
          }
        : null,
    });

    const pdfOut = await generateResponsePdfBuffer(generatedResponse);
    generatedResponse.pdfFileName = pdfOut.fileName;
    generatedResponse.pdfSavedPath = pdfOut.savedPath;
    generatedResponse.pdfSize = pdfOut.buffer.length;

    storedDoc.generatedResponse = generatedResponse;
    store.documents[storedDoc.documentId] = storedDoc;
    saveDocumentsStore(store);

    // Automatically attach generated response document & PDF to the linked email's draft
    if (linkedEmail) {
      linkedEmail.draft = linkedEmail.draft || {};
      linkedEmail.draft.attachedDocument = {
        documentId: storedDoc.documentId,
        fileName: pdfOut.fileName,
        pdfSavedPath: pdfOut.savedPath,
        pdfSize: pdfOut.buffer.length,
        documentTitle: generatedResponse.documentTitle,
        documentSubtitle: generatedResponse.documentSubtitle,
        referenceNumber: generatedResponse.referenceNumber,
        date: generatedResponse.date,
        totalSummary: generatedResponse.commercialTable?.totalSummary || '',
        addressedCount: generatedResponse.coverageSummary?.addressedCount || 0,
        sectionsCount: (generatedResponse.sections || []).length,
        generatedAt: new Date().toISOString(),
        pdfUrl: `/api/documents/${storedDoc.documentId}/pdf`,
      };
      saveDb(db);
    }

    res.json({
      message: `Generated complete response document & PDF (${generatedResponse.usedProvider}) and attached to email draft.`,
      generatedResponse,
      document: storedDoc,
      email: linkedEmail || null,
      emails: db.emails,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 24. Save User Edits to the Generated Response Document & Re-render PDF
app.put('/api/documents/:docId/response', async (req, res) => {
  try {
    const store = getDocumentsStore();
    const storedDoc = store.documents?.[req.params.docId];
    if (!storedDoc || !storedDoc.generatedResponse) {
      return res.status(404).json({ error: 'Generated response not found' });
    }

    const updatedResponse = {
      ...storedDoc.generatedResponse,
      ...req.body,
      lastEditedAt: new Date().toISOString(),
    };

    const pdfOut = await generateResponsePdfBuffer(updatedResponse);
    updatedResponse.pdfFileName = pdfOut.fileName;
    updatedResponse.pdfSavedPath = pdfOut.savedPath;
    updatedResponse.pdfSize = pdfOut.buffer.length;

    storedDoc.generatedResponse = updatedResponse;
    store.documents[storedDoc.documentId] = storedDoc;
    saveDocumentsStore(store);

    const db = getDb();
    const linkedEmail = (db.emails || []).find(
      (e) =>
        (storedDoc.linkedEmailIds || []).includes(e.id) ||
        e.generatedSourceDocumentId === storedDoc.documentId ||
        (e.attachments || []).some((a) => a.documentId === storedDoc.documentId)
    );
    if (linkedEmail) {
      linkedEmail.draft = linkedEmail.draft || {};
      linkedEmail.draft.attachedDocument = {
        documentId: storedDoc.documentId,
        fileName: pdfOut.fileName,
        pdfSavedPath: pdfOut.savedPath,
        pdfSize: pdfOut.buffer.length,
        documentTitle: updatedResponse.documentTitle,
        documentSubtitle: updatedResponse.documentSubtitle,
        referenceNumber: updatedResponse.referenceNumber,
        date: updatedResponse.date,
        totalSummary: updatedResponse.commercialTable?.totalSummary || '',
        addressedCount: updatedResponse.coverageSummary?.addressedCount || 0,
        sectionsCount: (updatedResponse.sections || []).length,
        generatedAt: new Date().toISOString(),
        pdfUrl: `/api/documents/${storedDoc.documentId}/pdf`,
      };
      saveDb(db);
    }

    res.json({
      message: 'Response updated and PDF regenerated successfully.',
      generatedResponse: updatedResponse,
      document: storedDoc,
      email: linkedEmail || null,
      emails: db.emails,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 25. Preview or Download the Final Generated Response PDF
app.get('/api/documents/:docId/pdf', async (req, res) => {
  try {
    const store = getDocumentsStore();
    const storedDoc = store.documents?.[req.params.docId];
    if (!storedDoc || !storedDoc.generatedResponse) {
      return res.status(404).json({ error: 'Generated response PDF not found. Please generate the response first.' });
    }

    const pdfOut = await generateResponsePdfBuffer(storedDoc.generatedResponse);
    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const safeFileName =
      storedDoc.generatedResponse.pdfFileName || `${storedDoc.documentId}_Response.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${safeFileName}"`
    );
    res.setHeader('Content-Length', pdfOut.buffer.length);
    res.send(pdfOut.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 26. Generate a Realistic Multi-Page Tender PDF (e.g. 5, 18, 50, or 80 pages) and Simulate Incoming Email
app.post('/api/documents/simulate-multipage-tender', async (req, res) => {
  try {
    const db = getDb();
    const pageCount = Math.min(120, Math.max(2, Number(req.body?.pageCount) || 80));
    const clientCompany =
      req.body?.clientCompany || 'Oman Integrated Industrial & Port Zones SAOC (Duqm & Sohar)';
    const tenderRef = `RFP-OIIPZ-2026-WM-${pageCount}P`;
    const filename = `OIIPZ_${pageCount}Page_Master_Waste_Tender_2026.pdf`;

    const pdfBuffer = await generateSyntheticMultiPageTenderPdf({
      pageCount,
      clientCompany,
      tenderRef,
    });

    const emailId = `msg-tender-${pageCount}p-${Date.now()}`;
    const docRecord = await ingestAndExtractDocument({
      filename,
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
      emailId,
      settings: db.settings,
    });

    const rawMail = {
      id: emailId,
      messageId: `<${tenderRef.toLowerCase()}-${Date.now()}@oiipz.om>`,
      initials: 'OI',
      fromName: 'Eng. Rashid Al-Mahrouqi',
      fromEmail: 'tenders@oiipz-industrial.om',
      companyName: clientCompany,
      subject: `Master RFP (${pageCount}-Page Specification): Integrated Industrial Waste Management`,
      displayTime: 'Just now',
      shortMeta: `Duqm + Sohar · ${pageCount}-Page PDF`,
      receivedAt: new Date().toISOString(),
      bodyText: `Dear Ahmed Al Kindi,\n\nPlease find attached our ${pageCount}-page Master Tender Specification (${filename}, Ref: ${tenderRef}) for 24-month integrated industrial, recycling, skip, RoRo, and hazardous waste management across our Sohar and Duqm industrial zones.\n\nKindly review all sections, technical requirements, SLA conditions, and mandatory bidder questions, and submit your formal Technical & Commercial Proposal PDF response.\n\nBest regards,\nEng. Rashid Al-Mahrouqi\nHead of Contracts & Procurement\n${clientCompany}`,
      attachments: [
        {
          filename,
          mimeType: 'application/pdf',
          size: pdfBuffer.length,
          pages: docRecord.pageCount,
          documentId: docRecord.documentId,
          isScanned: docRecord.isScanned,
          ocrUsed: docRecord.ocrUsed,
          storedFilePath: docRecord.storedFilePath,
          extractedText: (docRecord.fullText || '').slice(0, 60000),
        },
      ],
      isDemo: true,
    };

    const analysis = await analyzeEmailAndGenerateDraft({
      emailData: rawMail,
      settings: db.settings,
      tonePreset: 'Accept & Send Quotation',
    });

    const emailRecord = {
      ...rawMail,
      isWasteProposal: true,
      category: 'New Proposal / RFP',
      urgency: 'High',
      status: 'pending_approval',
      gmailDraftSynced: false,
      aiAnalysis: {
        relevanceScore: 99,
        relevanceReason: `${pageCount}-page master waste management tender specification.`,
        executiveSummary: [
          `${clientCompany} issued a ${pageCount}-page Master RFP (${filename}) for integrated waste management across Duqm & Sohar.`,
          'Includes 12 general bins (3x weekly), 6 recycling bins (weekly), 8 skip lifts/mo, 6 RoRo trips/mo, and 15 MT/mo hazardous waste.',
          `Contains ${docRecord.sections.length} logical sections with mandatory bidder questions and cross-section contractual clauses.`,
        ],
        extractedDetails: {
          wasteStreamsLabel: 'General + Recycling + Industrial + Hazmat',
          siteLocationsLabel: 'Duqm & Sohar Industrial Zones',
          binsVolumeLabel: '18 × 1,100 L; 4 × 6 m³; 3 × 30 CBM; 15 MT Hazmat',
          contractDurationLabel: '24 months · 1 Dec 2026',
          estimatedMonthlyValue: '9,389 OMR/month',
        },
        usedProvider: analysis.usedProvider,
      },
      draft: {
        to: rawMail.fromEmail,
        cc: 'operations@pgsoman.com',
        subject: `Official Proposal Response | ${tenderRef} (${pageCount}-Page Specification)`,
        tonePreset: 'Accept & Send Quotation',
        body: analysis.draftBody || '',
        lastUpdatedAt: new Date().toISOString(),
      },
    };

    db.emails = [emailRecord, ...db.emails];
    saveDb(db);

    res.json({
      message: `Generated and ingested ${pageCount}-page PDF Tender ("${filename}") into your Inbox!`,
      email: emailRecord,
      document: docRecord,
      emails: db.emails,
      stats: computeStats(db.emails, db.socialPosts),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-seed the two real client PDFs from PSG_Oman/documentation/ into a top-of-inbox OQ RPI Tender Email
async function ensureOqClientDemoDocumentsPreloaded() {
  try {
    const docFolder = path.join(__dirname, '..', 'documentation');
    const rfqPath = path.join(docFolder, 'RFQ 6000061376.pdf');
    const sowPath = path.join(docFolder, 'SoW - Recycling of oligomer V3.pdf');

    if (!fs.existsSync(rfqPath) || !fs.existsSync(sowPath)) {
      return;
    }

    const db = getDb();
    const oqEmailId = 'msg-oq-6000061376';

    const rfqBuf = fs.readFileSync(rfqPath);
    const sowBuf = fs.readFileSync(sowPath);

    const rfqDoc = await ingestAndExtractDocument({
      filename: 'RFQ 6000061376.pdf',
      mimeType: 'application/pdf',
      buffer: rfqBuf,
      emailId: oqEmailId,
      settings: db.settings,
    });

    const sowDoc = await ingestAndExtractDocument({
      filename: 'SoW - Recycling of oligomer V3.pdf',
      mimeType: 'application/pdf',
      buffer: sowBuf,
      emailId: oqEmailId,
      settings: db.settings,
    });

    if (!rfqDoc.isValid || !sowDoc.isValid) return;

    const combinedDoc = combineMultipleDocumentRecords([rfqDoc, sowDoc], oqEmailId);
    const store = getDocumentsStore();

    const analysis = await analyzeDocumentMultiStage({
      docRecord: combinedDoc,
      settings: db.settings,
      emailContext: {
        id: oqEmailId,
        companyName: 'OQ Refineries and Petroleum Industries LLC (OQ RPI)',
        fromName: 'Marjun DOYOG',
        fromEmail: 'marjun.doyog@oq.com',
        subject:
          'RFQ 6000061376 (Collective No. 9900048325) — Call-Off Contract for Recycling, Recovery & Reuse of Oligomer Waste (Suhar Plant)',
      },
    });
    combinedDoc.analysis = analysis;

    if (!combinedDoc.generatedResponse) {
      const generatedResponse = await generateStructuredResponseDocument({
        docRecord: combinedDoc,
        analysis,
        settings: db.settings,
        userInstructions: '',
        preferredTone: 'Technical & Commercial Bid',
        responseScope: 'Comprehensive Full Response',
        emailContext: {
          id: oqEmailId,
          companyName: 'OQ Refineries and Petroleum Industries LLC (OQ RPI)',
          fromName: 'Marjun DOYOG',
          fromEmail: 'marjun.doyog@oq.com',
          subject: 'RFQ 6000061376 — Call-Off Contract for Recycling, Recovery & Reuse of Oligomer Waste',
        },
      });
      const pdfOut = await generateResponsePdfBuffer(generatedResponse);
      generatedResponse.pdfFileName = pdfOut.fileName;
      generatedResponse.pdfSavedPath = pdfOut.savedPath;
      generatedResponse.pdfSize = pdfOut.buffer.length;
      combinedDoc.generatedResponse = generatedResponse;
    }

    store.documents[combinedDoc.documentId] = combinedDoc;
    saveDocumentsStore(store);

    const existingIdx = (db.emails || []).findIndex((e) => e.id === oqEmailId);
    const attachedDocMeta = combinedDoc.generatedResponse
      ? {
          documentId: combinedDoc.documentId,
          fileName: combinedDoc.generatedResponse.pdfFileName,
          pdfSavedPath: combinedDoc.generatedResponse.pdfSavedPath,
          pdfSize: combinedDoc.generatedResponse.pdfSize,
          documentTitle: combinedDoc.generatedResponse.documentTitle,
          documentSubtitle: combinedDoc.generatedResponse.documentSubtitle,
          referenceNumber: combinedDoc.generatedResponse.referenceNumber,
          date: combinedDoc.generatedResponse.date,
          totalSummary: combinedDoc.generatedResponse.commercialTable?.totalSummary || '',
          addressedCount: combinedDoc.generatedResponse.coverageSummary?.addressedCount || 21,
          sectionsCount: (combinedDoc.generatedResponse.sections || []).length,
          generatedAt: combinedDoc.generatedResponse.generatedAt,
          pdfUrl: `/api/documents/${combinedDoc.documentId}/pdf`,
        }
      : null;

    const oqEmailRecord = {
      id: oqEmailId,
      messageId: '<rfq-6000061376-9900048325@oq.com>',
      initials: 'OQ',
      fromName: 'Marjun DOYOG (OQ Procurement)',
      fromEmail: 'marjun.doyog@oq.com',
      companyName: 'OQ Refineries and Petroleum Industries LLC (OQ RPI)',
      subject:
        'RFQ 6000061376 (Collective No. 9900048325) — Call-Off Contract for Recycling, Recovery & Reuse of Oligomer Waste (Suhar Plant)',
      displayTime: 'Today',
      shortMeta: 'Suhar Plant · 2 PDFs (23 Pages)',
      receivedAt: new Date().toISOString(),
      bodyText: `Dear Valued Supplier (Vendor 12169),\n\nOQ Refineries LLC / OQ Refineries and Petroleum Industries (OQ RPI) invites your organization to submit a formal Technical and Commercial Offer for:\n\n• RFQ Internal No: 6000061376 (Collective No: 9900048325)\n• Scope of Work: Call-off Contract for the Recycling, Recovery and/or Reuse of Oligomer Waste at OQ RPI Suhar (Sohar) Polypropylene Plant\n• Attached Documents:\n   1. RFQ 6000061376.pdf (15 Pages — Commercial, Legal, HSE & General Conditions)\n   2. SoW - Recycling of oligomer V3.pdf (8 Pages — Technical Scope, Lab Analysis, Mandatory Criteria & 100-Point Scoring Matrix)\n• Submission Deadline: 20.08.2026 by 23:59:59 hrs via Tawreed Portal (www.tawreed.oq.com)\n• IMPORTANT NOTICE: Do NOT copy the Procurement Officer when submitting your offer on Tawreed Portal, otherwise your bid will be rejected.\n\nBest regards,\nMarjun DOYOG\nProcurement Officer\nOQ Refineries LLC (Muscat / Suhar)`,
      attachments: [
        {
          filename: 'RFQ 6000061376.pdf',
          mimeType: 'application/pdf',
          size: rfqBuf.length,
          pages: rfqDoc.pageCount,
          documentId: combinedDoc.documentId,
          isScanned: false,
          ocrUsed: false,
          storedFilePath: rfqPath,
          extractedText: (rfqDoc.fullText || '').slice(0, 60000),
        },
        {
          filename: 'SoW - Recycling of oligomer V3.pdf',
          mimeType: 'application/pdf',
          size: sowBuf.length,
          pages: sowDoc.pageCount,
          documentId: combinedDoc.documentId,
          isScanned: false,
          ocrUsed: false,
          storedFilePath: sowPath,
          extractedText: (sowDoc.fullText || '').slice(0, 60000),
        },
      ],
      isWasteProposal: true,
      category: 'New Proposal / RFP',
      urgency: 'High',
      status: 'pending_approval',
      gmailDraftSynced: false,
      aiAnalysis: {
        relevanceScore: 99,
        relevanceReason:
          'Official 2-Document OQ RPI Tender Package (23 pages total) for Oligomer Waste Recycling & Recovery in Suhar.',
        executiveSummary: [
          'OQ Refineries LLC (OQ RPI Suhar) issued RFQ 6000061376 (15 pages) + Scope of Work V3 (8 pages) for a 3-Year Call-Off Contract to recycle/recover Oligomer waste in Oman.',
          'Volume & Chemistry: 50 Tons on-site inventory + 30 Tons/year generation in IBCs/steel drums; ASTM D6730 C10–C11 (58.50%), C12+ (21.94%), C6–C9 (19.37%), Flash Point 56 °C, Sulfur 21 mg/l, Cl <0.02 mg/l, Hg <0.001 mg/l.',
          'Mandatory Gates & SLAs: EA & CDAA permits, own/operate facility in Oman, post-2021 experience, >75% HSE score, 10-working-day collection SLA, and 60-day recycling completion SLA.',
          'Critical Alerts Detected: (1) Do NOT copy Procurement Officer Marjun DOYOG on Tawreed submission; (2) Duration contradiction (RFQ Pg 2 "3 days" vs SoW Sec 9 "3 years"); (3) Payment contradiction (SoW Sec 10 "Payable to OQ RPI in 7 days" vs RFQ Cl 2.1 "30 days").',
        ],
        extractedDetails: {
          wasteStreamsLabel: 'Oligomer Hydrocarbon Waste (Flash Pt 56°C)',
          siteLocationsLabel: 'OQ RPI Suhar Polypropylene Plant',
          binsVolumeLabel: '50 Tons Inventory + 30 Tons/Yr (IBCs/Drums)',
          contractDurationLabel: '3-Year Call-Off · Due 20.08.2026',
          estimatedMonthlyValue: '85.000 OMR/Ton (~11,900 OMR / 140T)',
        },
        usedProvider: 'Deep Multi-Document Tender Intelligence Engine',
      },
      draft: {
        from: db.settings?.gmail?.email || db.settings?.companyProfile?.email || 'proposals@pgsoman.com',
        to: 'www.tawreed.oq.com (Tawreed Portal Submission — Do Not CC marjun.doyog@oq.com)',
        cc: 'operations@pgsoman.com',
        subject:
          'Official Technical & Commercial Bid Submission | RFQ 6000061376 (Collective No. 9900048325) — Recycling, Recovery & Reuse of Oligomer Waste',
        tonePreset: 'Accept & Send Quotation',
        introText:
          'Dear OQ Refineries and Petroleum Industries (OQ RPI) Tender Evaluation Committee,\n\nPGS Oman (Premier Green Environmental & Waste Management LLC, Vendor Code 12169, JSRS Certified) is pleased to submit our complete Technical & Commercial Bid Package in response to RFQ No. 6000061376 (Collective No. 9900048325) and Scope of Work V3 for the Call-off Contract for the Recycling, Recovery and/or Reuse of Oligomer Waste at OQ RPI Suhar.',
        pricingTable: [
          {
            serviceItem:
              'Primary Offer (SoW Sec 10): Purchase & Recovery of On-Site Oligomer Inventory (50 Tons in IBCs/Drums) — Payable to OQ RPI within 7 Days',
            qtyFreq: '50 Metric Tons',
            monthlyTotal: '4,250.000 OMR (85.000 OMR/Ton)',
          },
          {
            serviceItem:
              'Ongoing Call-Off (Years 1–3): Annual Oligomer Generation Collection & Fractional Distillation (30 Tons/Yr × 3 Yrs)',
            qtyFreq: '90 Metric Tons (3 Yrs)',
            monthlyTotal: '7,650.000 OMR (85.000 OMR/Ton)',
          },
          {
            serviceItem:
              'Alternative Turnkey Service Option (If RFQ Cl 2.1 Governs): Collection, ADR Transport & 4-Stage Distillation Service Fee (30-Day Credit)',
            qtyFreq: '140 Metric Tons (Est.)',
            monthlyTotal: '110.000 OMR / Ton',
          },
        ],
        totalLabel: '85.000 OMR / Ton Payable to OQ RPI (11,900.000 OMR Est. 3-Yr Value, Excl. 5% VAT)',
        outroText:
          'Please find attached our complete 9-Section Technical & Commercial Bid Documentation PDF covering: (1) Facility Ownership & Sohar Distillation Plant Details, (2) Valid Environment Authority (#EA-WM-4092) & CDAA (#CDAA-SH-8821) Permits, (3) 4-Stage Fractional Distillation Methodology for C6–C12+ Oligomer (Flash Point 56 °C), (4) Beneficial Reuse Route in Oman, (5) Key Personnel CVs & Post-2021 References, (6) 10-Day Collection & 60-Day Recycling Completion SLAs, and (7) Cross-Document Contract Clarifications.\n\nOur Quotation remains valid for Ninety (90) calendar days from 20.08.2026.',
        body: `Dear OQ Refineries and Petroleum Industries (OQ RPI) Tender Evaluation Committee,\n\nPGS Oman (Vendor Code 12169, JSRS Certified) is pleased to submit our complete Technical & Commercial Bid Package in response to RFQ No. 6000061376 (Collective No. 9900048325) and Scope of Work V3 for the Call-off Contract for the Recycling, Recovery and/or Reuse of Oligomer Waste at OQ RPI Suhar.\n\n• Primary Commercial Offer (SoW Section 10): 85.000 OMR / Ton payable to OQ RPI within 7 calendar days of OQ RPI weighbridge invoice (Est. 11,900.000 OMR across 50T current inventory + 90T over 3 years).\n• Alternative Service Rate (RFQ Clause 2.1): 110.000 OMR / Ton turnkey recycling service fee (30 days credit).\n• Technical & Regulatory Compliance: 100% in-country fractional distillation at PGS Oman's owned & operated Sohar Industrial Estate facility under EA License #EA-WM-4092 & CDAA Permit #CDAA-SH-8821; 10-working-day collection SLA; 60-day recycling completion SLA; 90-day bid validity.\n\nSincerely,\nAhmed Al Kindi\nGeneral Manager · PGS Oman`,
        attachedDocument: attachedDocMeta,
        lastUpdatedAt: new Date().toISOString(),
      },
      isDemo: false,
    };

    if (existingIdx >= 0) {
      db.emails[existingIdx] = oqEmailRecord;
      if (existingIdx > 0) {
        db.emails.splice(existingIdx, 1);
        db.emails.unshift(oqEmailRecord);
      }
    } else {
      db.emails = [oqEmailRecord, ...(db.emails || [])];
    }

    saveDb(db);
    console.log(
      `[OQ Tender Preloader] Loaded "RFQ 6000061376.pdf" (15p) + "SoW - Recycling of oligomer V3.pdf" (8p) -> 23-page unified package (${combinedDoc.documentId}).`
    );
  } catch (err) {
    console.warn('[OQ Tender Preloader] Warning:', err.message);
  }
}

ensureOqClientDemoDocumentsPreloaded();


// Serve built frontend in production / single-click mode
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`  PGS Oman — Complete Manager Virtual Assistant Dashboard`);
  console.log(`  Backend API Server listening on http://localhost:${PORT}`);
  console.log(`==================================================================`);

  // Start background auto-sync worker
  let isAutoSyncRunning = false;
  setInterval(async () => {
    if (isAutoSyncRunning) return;
    try {
      const db = getDb();
      const filterRules = db.settings?.filterRules || {};
      if (filterRules.autoSyncEnabled === false) return;

      isAutoSyncRunning = true;
      const { processedNew, syncedAccountNames } = await performGmailSyncCore(db);
      if (processedNew && processedNew.length > 0) {
        console.log(`[Auto-Sync Worker] Automatically collected ${processedNew.length} new email(s) from ${syncedAccountNames.join(', ')}.`);
      }
    } catch (err) {
      console.warn('[Auto-Sync Worker] Notice:', err.message);
    } finally {
      isAutoSyncRunning = false;
    }
  }, 60000);
});

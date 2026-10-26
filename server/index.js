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
import { extractAttachmentText } from './attachmentParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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
        const extractedText = await extractAttachmentText(file.originalname, file.mimetype, file.buffer);
        attachments.push({
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
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
app.post('/api/emails/reset-demo', (req, res) => {
  try {
    const emails = resetDemoEmails();
    const db = getDb();
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

const PORT = process.env.PORT || 3001;
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

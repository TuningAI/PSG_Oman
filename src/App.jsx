import React, { useState, useEffect, useMemo } from 'react';
import {
  Recycle,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  RefreshCw,
  Settings,
  Plus,
  FileText,
  MapPin,
  MessageSquare,
  Check,
  Loader2,
  Megaphone,
  ShieldCheck,
  Paperclip,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Save,
  ListFilter,
} from 'lucide-react';
import SettingsModal from './components/SettingsModal.jsx';
import SimulateModal from './components/SimulateModal.jsx';
import SocialMediaWorkspace from './components/SocialMediaWorkspace.jsx';

const ACTION_PRESETS = [
  {
    id: 'Accept & Send Quotation',
    shortLabel: 'Proposal / Quotation',
    label: 'Send Proposal / Quotation',
    icon: FileText,
  },
  {
    id: 'Request Site Inquiry / Visit',
    shortLabel: 'Site Visit',
    label: 'Request Site Visit / Inquiry',
    icon: MapPin,
  },
  {
    id: 'Ask for Missing Specs',
    shortLabel: 'Missing Specs',
    label: 'Ask for Missing Specs',
    icon: MessageSquare,
  },
  {
    id: 'Approve Contract Terms',
    shortLabel: 'Approve Contract',
    label: 'Approve Contract Terms',
    icon: CheckCircle2,
  },
];

function getInitials(companyName = '') {
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (companyName.slice(0, 2) || 'CL').toUpperCase();
}

/**
 * Individual Stacked Mail Card matching the 3-row wireframe:
 * Row 1: Mail Subject (Original mail)
 * Row 2: Mail Summary
 * Row 3: AI Action: Proposal / Site visit / etc (with AI Draft & Approve/Send)
 */
function MailCard({
  emailItem,
  defaultExpandedDraft = false,
  settings,
  onUpdateEmail,
  onOpenPdfPreview,
  showToast,
}) {
  const [showOriginalMail, setShowOriginalMail] = useState(false);
  const [showDraftPanel, setShowDraftPanel] = useState(defaultExpandedDraft);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const [draftTo, setDraftTo] = useState(emailItem.draft?.to || emailItem.fromEmail || '');
  const [draftCc, setDraftCc] = useState(
    emailItem.draft?.cc || settings?.companyProfile?.defaultCc || 'operations@pgsoman.com'
  );
  const [draftSubject, setDraftSubject] = useState(
    emailItem.draft?.subject || `Quotation | ${emailItem.subject}`
  );
  const [draftIntro, setDraftIntro] = useState(
    emailItem.draft?.introText ||
      `Dear ${emailItem.fromName?.split(' ')[0] || 'Client'},\n\nThank you for your RFQ. We are pleased to quote for your waste collection services.`
  );
  const [draftOutro, setDraftOutro] = useState(
    emailItem.draft?.outroText ||
      `Payment: 30 days. Please confirm to arrange mobilisation.\n\nKind regards, Ahmed Al Kindi\nGeneral Manager · PGS Oman`
  );
  const [draftBody, setDraftBody] = useState(emailItem.draft?.body || '');
  const [selectedTone, setSelectedTone] = useState(
    emailItem.draft?.tonePreset || 'Accept & Send Quotation'
  );
  const [customInstruction, setCustomInstruction] = useState('');

  const [regenerating, setRegenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingGmailDraft, setSavingGmailDraft] = useState(false);
  const [approvingSend, setApprovingSend] = useState(false);

  useEffect(() => {
    if (emailItem?.draft) {
      setDraftTo(emailItem.draft.to || emailItem.fromEmail || '');
      setDraftCc(
        emailItem.draft.cc || settings?.companyProfile?.defaultCc || 'operations@pgsoman.com'
      );
      setDraftSubject(emailItem.draft.subject || `Quotation | ${emailItem.subject}`);
      setDraftIntro(
        emailItem.draft.introText ||
          `Dear ${emailItem.fromName?.split(' ')[0] || 'Client'},\n\nThank you for your RFQ. We are pleased to quote for your waste collection services.`
      );
      setDraftOutro(
        emailItem.draft.outroText ||
          `Payment: 30 days. Please confirm to arrange mobilisation.\n\nKind regards, Ahmed Al Kindi\nGeneral Manager · PGS Oman`
      );
      setDraftBody(emailItem.draft.body || '');
      setSelectedTone(emailItem.draft.tonePreset || 'Accept & Send Quotation');
    }
  }, [emailItem?.id, emailItem?.draft?.lastUpdatedAt]);

  const initials = emailItem.initials || getInitials(emailItem.companyName || emailItem.fromName);
  const timeStr =
    emailItem.displayTime ||
    new Date(emailItem.receivedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const pricingRows = emailItem.draft?.pricingTable || [
    { service: 'General waste · 6 bins × 208', amount: '1,248.000' },
    { service: 'Cardboard · 2 bins × 240.500', amount: '481.000' },
    { service: '6 m³ skips · 2 lifts × 200', amount: '400.000' },
  ];
  const pricingTotal =
    emailItem.draft?.totalLabel ||
    emailItem.aiAnalysis?.extractedDetails?.estimatedMonthlyValue ||
    '2,129 OMR/month';

  const handleActionSelect = async (presetId) => {
    setSelectedTone(presetId);
    setShowDraftPanel(true);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/emails/${emailItem.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tonePreset: presetId,
          customInstructions: customInstruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update AI action draft');
      onUpdateEmail(data.email);
      setCustomInstruction('');
      showToast(`AI Draft updated for "${presetId}"`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch(`/api/emails/${emailItem.id}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: draftTo,
          cc: draftCc,
          subject: draftSubject,
          introText: draftIntro,
          outroText: draftOutro,
          body: draftBody,
          tonePreset: selectedTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');
      onUpdateEmail(data.email);
      setIsEditingDraft(false);
      showToast('Draft changes saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveToGmailDrafts = async () => {
    setSavingGmailDraft(true);
    try {
      const res = await fetch(`/api/emails/${emailItem.id}/save-gmail-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: {
            to: draftTo,
            cc: draftCc,
            subject: draftSubject,
            introText: draftIntro,
            outroText: draftOutro,
            body: draftBody,
            tonePreset: selectedTone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save to Gmail Drafts');
      onUpdateEmail(data.email);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingGmailDraft(false);
    }
  };

  const handleApproveAndSend = async () => {
    setApprovingSend(true);
    try {
      const res = await fetch(`/api/emails/${emailItem.id}/approve-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: {
            to: draftTo,
            cc: draftCc,
            subject: draftSubject,
            introText: draftIntro,
            outroText: draftOutro,
            body: draftBody,
            tonePreset: selectedTone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      onUpdateEmail(data.email, data.stats);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApprovingSend(false);
    }
  };

  const handleRestoreProposal = async () => {
    try {
      const res = await fetch(`/api/emails/${emailItem.id}/reclassify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeProposal: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdateEmail(data.email, data.stats);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#CBD5E1] shadow-sm p-4 space-y-3 transition hover:border-[#0B7A53]/60">
      {/* =====================================================================
          ROW 1: Mail Subject (Original mail)
         ===================================================================== */}
      <div className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-extrabold flex items-center justify-center shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B7A53]">
                  Mail Subject (Original mail):
                </span>
                <span className="text-sm font-bold text-[#111827]">
                  {emailItem.subject}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                <strong className="text-[#334155]">
                  {emailItem.companyName || emailItem.fromName}
                </strong>
                <span>({emailItem.fromEmail})</span>
                <span>·</span>
                <span>Received {timeStr}</span>
                {emailItem.shortMeta && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-[#475569]">{emailItem.shortMeta}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Badges & "View Original Mail" Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {emailItem.status === 'pending_approval' && (
              <span className="px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] text-xs font-bold">
                Needs Approval
              </span>
            )}
            {emailItem.status === 'approved_sent' && (
              <span className="px-2.5 py-1 rounded-md bg-[#D1FAE5] text-[#065F46] text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Approved & Sent
              </span>
            )}
            {emailItem.urgency === 'High' && emailItem.isWasteProposal && (
              <span className="px-2.5 py-1 rounded-md bg-[#FEE2E2] text-[#B91C1C] text-xs font-bold">
                High Priority
              </span>
            )}

            {emailItem.attachments?.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenPdfPreview(emailItem.attachments[0])}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0B7A53] text-xs font-semibold text-[#1E293B] transition"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>{emailItem.attachments[0].filename}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowOriginalMail(!showOriginalMail)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:bg-slate-100 text-xs font-bold text-[#334155] transition"
            >
              <Eye className="w-3.5 h-3.5 text-[#0B7A53]" />
              <span>{showOriginalMail ? 'Hide Original Mail' : 'Read Original Mail'}</span>
              {showOriginalMail ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Original Email Content */}
        {showOriginalMail && (
          <div className="mt-3 pt-3 border-t border-[#E2E8EC] grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8 bg-white p-3.5 rounded-xl border border-[#E2E8EC]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                Original Client Email Body
              </div>
              <pre className="text-xs text-[#1E293B] whitespace-pre-wrap font-sans leading-relaxed">
                {emailItem.bodyText}
              </pre>
            </div>
            {emailItem.attachments?.length > 0 && (
              <div className="lg:col-span-4 bg-white p-3.5 rounded-xl border border-[#E2E8EC] flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Attached Document Extracted by AI
                  </div>
                  <div className="text-xs font-bold text-[#111827] mb-1">
                    {emailItem.attachments[0].filename}
                  </div>
                  <pre className="text-[11px] text-[#475569] whitespace-pre-wrap font-mono leading-snug bg-[#F8FAFC] p-2.5 rounded-lg border border-[#EEF2F6]">
                    {emailItem.attachments[0].extractedText}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPdfPreview(emailItem.attachments[0])}
                  className="mt-2 w-full py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-bold text-[#1E293B] transition"
                >
                  Open Full Document Preview
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          ROW 2: Mail Summary (AI Generated Summary & Key Specs)
         ===================================================================== */}
      <div className="rounded-xl border border-[#CBEAD9] bg-[#EBF8F2] px-4 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0B7A53]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B7A53]">
                Mail Summary (AI Read & Extracted):
              </span>
            </div>

            <ul className="space-y-1 pl-1">
              {(emailItem.aiAnalysis?.executiveSummary || []).map((point, idx) => (
                <li
                  key={idx}
                  className="text-xs text-[#064E3B] font-medium flex items-start gap-2 leading-relaxed"
                >
                  <span className="font-extrabold text-[#0B7A53]">{idx + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Extracted Contract Metrics Pills */}
          {emailItem.isWasteProposal && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-[#CBEAD9]">
                <div className="text-[10px] text-[#64748B] font-medium">Waste Streams</div>
                <div className="text-xs font-bold text-[#111827]">
                  {emailItem.aiAnalysis?.extractedDetails?.wasteStreamsLabel ||
                    'General + cardboard'}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-[#CBEAD9]">
                <div className="text-[10px] text-[#64748B] font-medium">Site Locations</div>
                <div className="text-xs font-bold text-[#111827]">
                  {emailItem.aiAnalysis?.extractedDetails?.siteLocationsLabel ||
                    'Ghala + Rusayl'}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-white border border-[#CBEAD9]">
                <div className="text-[10px] text-[#64748B] font-medium">Bins / Skips Volume</div>
                <div className="text-xs font-bold text-[#111827]">
                  {emailItem.aiAnalysis?.extractedDetails?.binsVolumeLabel ||
                    '8 × 1,100 L; 2 × 6 m³'}
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-[#0B4F3A] text-white">
                <div className="text-[10px] text-[#A7F3D0] font-medium">Est. Contract Value</div>
                <div className="text-xs font-extrabold text-white">{pricingTotal}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          ROW 3: AI Action: Proposal / Site visit / etc
         ===================================================================== */}
      {!emailItem.isWasteProposal || emailItem.status === 'filtered_out' ? (
        <div className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[#64748B]">
            <strong>AI Action:</strong> Ignored automatically (Unrelated / Non-Proposal Email)
          </span>
          <button
            type="button"
            onClick={handleRestoreProposal}
            className="px-3.5 py-1.5 rounded-lg bg-[#0B7A53] text-white text-xs font-bold hover:bg-[#096645] transition"
          >
            Move to Proposals & Generate AI Draft
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-3.5 space-y-3">
          {/* Action Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#111827] mr-1">
                AI Action:
              </span>

              {ACTION_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isActive = selectedTone === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={regenerating}
                    onClick={() => handleActionSelect(preset.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition ${
                      isActive
                        ? 'bg-[#EFFAF5] border-[1.5px] border-[#0B7A53] text-[#0B7A53] font-bold'
                        : 'bg-[#F8FAFC] border-[#E2E8EC] text-[#334155] font-medium hover:border-[#CBD5E1]'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{preset.shortLabel}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#0B7A53]" />}
                  </button>
                );
              })}
            </div>

            {/* Right Quick Approve & Expand Draft Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDraftPanel(!showDraftPanel)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-bold text-[#1E293B] transition"
              >
                <Pencil className="w-3.5 h-3.5 text-[#0B7A53]" />
                <span>{showDraftPanel ? 'Hide AI Draft' : 'Review / Edit AI Draft'}</span>
                {showDraftPanel ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleApproveAndSend}
                disabled={approvingSend}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0B7A53] hover:bg-[#096645] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
              >
                {approvingSend ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {emailItem.status === 'approved_sent'
                    ? 'Sent ✓ (Click to Resend)'
                    : 'Approve & Send Mail'}
                </span>
              </button>
            </div>
          </div>

          {/* Expandable AI Draft Review & Editor Panel */}
          {showDraftPanel && (
            <div className="pt-3 border-t border-[#E2E8EC] space-y-3">
              {/* AI Custom Instruction Bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8EC]">
                <Sparkles className="w-4 h-4 text-[#0B7A53] shrink-0" />
                <input
                  type="text"
                  placeholder="Tell AI what to change in this draft (e.g., 'Offer 10% discount' or 'Schedule site visit on Tuesday')..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleActionSelect(selectedTone);
                    }
                  }}
                  className="flex-1 bg-transparent text-xs text-[#111827] placeholder-[#64748B] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={regenerating}
                  onClick={() => handleActionSelect(selectedTone)}
                  className="px-3 py-1 rounded-lg bg-white border border-[#D8E0E5] hover:border-[#0B7A53] text-[#0B7A53] text-xs font-bold transition shrink-0"
                >
                  {regenerating ? 'Updating...' : 'Apply'}
                </button>
              </div>

              {/* To / CC / Subject Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6]">
                  <span className="text-[#64748B] font-semibold mr-2">To:</span>
                  <input
                    type="email"
                    value={draftTo}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="flex-1 font-medium text-[#111827] bg-transparent focus:outline-none"
                  />
                </div>
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6]">
                  <span className="text-[#64748B] font-semibold mr-2">CC:</span>
                  <input
                    type="text"
                    value={draftCc}
                    onChange={(e) => setDraftCc(e.target.value)}
                    className="flex-1 font-medium text-[#111827] bg-transparent focus:outline-none"
                  />
                </div>
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#EEF2F6]">
                  <span className="text-[#64748B] font-semibold mr-2">Subject:</span>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="flex-1 font-bold text-[#111827] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Drafted Email Content with Pricing Table */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8EC] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    AI-Drafted Response ({selectedTone})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingDraft) {
                        handleSaveEdits();
                      } else {
                        setIsEditingDraft(true);
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#0B7A53] hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{isEditingDraft ? 'Save Text Changes' : 'Edit Text Directly'}</span>
                  </button>
                </div>

                {isEditingDraft ? (
                  <textarea
                    rows={8}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white border border-[#0B7A53] text-xs text-[#111827] leading-relaxed focus:outline-none"
                  />
                ) : (
                  <div className="text-xs text-[#1E293B] space-y-2.5 leading-relaxed bg-white p-4 rounded-xl border border-[#EEF2F6]">
                    <div className="whitespace-pre-line">{draftIntro}</div>

                    {/* Monthly Service Pricing Table */}
                    <div className="rounded-xl border border-[#E2E8EC] overflow-hidden my-2 max-w-2xl">
                      <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-[#EEF2F6] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        <span>MONTHLY SERVICE</span>
                        <span>OMR / MONTH</span>
                      </div>
                      <div className="divide-y divide-[#EEF2F6] bg-white">
                        {pricingRows.map((row, idx) => (
                          <div
                            key={idx}
                            className="px-3.5 py-1.5 flex items-center justify-between text-xs text-[#1E293B]"
                          >
                            <span>{row.service}</span>
                            <span className="font-medium tabular-nums">{row.amount}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-3.5 py-2 bg-[#EBF8F2] border-t border-[#CBEAD9] flex items-center justify-between text-xs font-extrabold text-[#065F46]">
                        <span>Total · excluding VAT</span>
                        <span>{pricingTotal}</span>
                      </div>
                    </div>

                    <div className="whitespace-pre-line text-[#334155]">{draftOutro}</div>
                  </div>
                )}

                {/* Bottom Action Footer inside Draft Panel */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleSaveToGmailDrafts}
                      disabled={savingGmailDraft}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#334155] hover:text-[#0B7A53] transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {savingGmailDraft
                          ? 'Saving to Gmail Drafts...'
                          : emailItem.gmailDraftSynced
                          ? 'Saved in Gmail Drafts ✓'
                          : 'Save to Gmail Drafts'}
                      </span>
                    </button>

                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#0B7A53]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sends only with your approval</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApproveAndSend}
                    disabled={approvingSend}
                    className="px-6 py-2.5 rounded-xl bg-[#0B7A53] hover:bg-[#096645] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Send Email to {draftTo}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Primary Leftmost Navigation Sidebar Tab: 'email_assistant' | 'social_assistant'
  const [activeMainModule, setActiveMainModule] = useState('email_assistant');

  const [emails, setEmails] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({
    totalCollected: 19,
    wasteProposalsCount: 15,
    pendingApprovalCount: 3,
    approvedSentCount: 12,
    filteredOutCount: 4,
  });
  const [loading, setLoading] = useState(true);
  const [syncingGmail, setSyncingGmail] = useState(false);

  // Filter tab for Mails list: 'proposals' | 'pending_approval' | 'approved_sent' | 'filtered_out'
  const [mailFilter, setMailFilter] = useState('proposals');

  // Modals & Toasts
  const [pdfPreviewAttachment, setPdfPreviewAttachment] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setEmails(data.emails || []);
      setSocialPosts(data.socialPosts || []);
      setSettings(data.settings || null);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      showToast('Failed to load assistant data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const displayedMails = useMemo(() => {
    return emails.filter((e) => {
      if (mailFilter === 'pending_approval') {
        return e.isWasteProposal && e.status === 'pending_approval';
      }
      if (mailFilter === 'approved_sent') {
        return e.isWasteProposal && e.status === 'approved_sent';
      }
      if (mailFilter === 'filtered_out') {
        return !e.isWasteProposal || e.status === 'filtered_out';
      }
      return e.isWasteProposal;
    });
  }, [emails, mailFilter]);

  const updateEmailInList = (updatedEmail, newStats) => {
    setEmails((prev) => prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e)));
    if (newStats) setStats(newStats);
  };

  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not sync Gmail', 'warning');
        if (data.error?.includes('Settings')) {
          setSettingsModalOpen(true);
        }
        return;
      }
      setEmails(data.emails || []);
      if (data.stats) setStats(data.stats);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSyncingGmail(false);
    }
  };

  const handleSaveSettings = async (updatedSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    setSettings(data.settings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101C24] text-white gap-3">
        <Loader2 className="w-9 h-9 text-[#10B981] animate-spin" />
        <p className="text-sm font-semibold text-slate-200">Loading PGS Oman AI Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F5F7F8] text-[#111827] font-sans antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-950 text-white border-amber-700'
                : 'bg-[#101C24] text-white border-[#0B7A53]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEFTMOST NAVIGATION SIDEBAR (Matching Wireframe: Software Name | Email Management | Social Media)
         ===================================================================== */}
      <aside className="w-[260px] bg-[#101C24] text-white flex flex-col justify-between shrink-0 p-4 select-none border-r border-[#1E2F3B]">
        <div className="space-y-6">
          {/* Box 1: Software Name */}
          <div className="p-4 rounded-xl bg-[#162630] border-2 border-[#2A404E] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B7A53] flex items-center justify-center shrink-0">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-extrabold tracking-tight text-white leading-tight truncate">
                PGS Oman AI Hub
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9EA9] mt-0.5">
                Waste Contracting Assistant
              </div>
            </div>
          </div>

          {/* Navigation Buttons: Email Management & Social Media */}
          <nav className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveMainModule('email_assistant')}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 text-left transition ${
                activeMainModule === 'email_assistant'
                  ? 'bg-[#0B7A53] border-[#10B981] text-white shadow-md'
                  : 'bg-[#162630] border-[#263B48] text-[#C5D1D8] hover:text-white hover:border-[#3B5566]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-sm font-bold leading-snug">Email Management</div>
                  <div className="text-[11px] opacity-80">Proposals & Contracts</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/25 text-xs font-extrabold">
                {stats.pendingApprovalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainModule('social_assistant')}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 text-left transition ${
                activeMainModule === 'social_assistant'
                  ? 'bg-[#0B7A53] border-[#10B981] text-white shadow-md'
                  : 'bg-[#162630] border-[#263B48] text-[#C5D1D8] hover:text-white hover:border-[#3B5566]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 shrink-0" />
                <div>
                  <div className="text-sm font-bold leading-snug">Social Media</div>
                  <div className="text-[11px] opacity-80">LinkedIn & Instagram</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-black/25 text-[11px] font-bold">
                IN+IG
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Settings & Manager Info */}
        <div className="space-y-3 pt-4 border-t border-[#1E2F3B]">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#162630] hover:bg-[#1D313E] border border-[#263B48] text-xs font-semibold text-[#C5D1D8] hover:text-white transition"
          >
            <Settings className="w-4 h-4 text-[#10B981]" />
            <span>Company, Rate Card & Setup</span>
          </button>

          <div className="px-2 py-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1E3B38] text-[#6EE7B7] text-xs font-bold flex items-center justify-center shrink-0">
              {settings?.companyProfile?.managerInitials || 'AK'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {settings?.companyProfile?.managerName || 'Ahmed Al Kindi'}
              </div>
              <div className="text-[10.5px] text-[#7D919E] truncate">
                {settings?.companyProfile?.managerTitle || 'General Manager · PGS Oman'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          RIGHT MAIN CONTENT WINDOW (Matching Wireframe)
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5 overflow-y-auto">
        {activeMainModule === 'social_assistant' ? (
          <>
            {/* Top Header Box for Social Media */}
            <header className="bg-white rounded-2xl border-2 border-[#CBD5E1] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h1 className="text-xl font-extrabold text-[#111827]">
                  Social Media Marketing Assistant (LinkedIn & Instagram)
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Generate branded post images and captions from your prompt or uploaded photos
                </p>
              </div>
            </header>

            <SocialMediaWorkspace
              socialPosts={socialPosts}
              settings={settings}
              onUpdateSocialPosts={(updatedPosts, updatedStats) => {
                setSocialPosts(updatedPosts);
                if (updatedStats) setStats(updatedStats);
              }}
              onSaveSettings={handleSaveSettings}
              showToast={showToast}
            />
          </>
        ) : (
          /* =====================================================================
             EMAIL PROPOSAL & CONTRACT ASSISTANT (Exact Wireframe Structure)
             ===================================================================== */
          <div className="max-w-[1440px] w-full mx-auto space-y-5">
            {/* Top Box: Email Proposal & Contract Assistant */}
            <header className="bg-white rounded-2xl border-2 border-[#CBD5E1] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <h1 className="text-xl font-extrabold text-[#111827]">
                  Email Proposal & Contract Assistant
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0B7A53]" />
                  <span>
                    Gmail connected · {settings?.gmail?.email || 'proposals@pgsoman.com'} · Only waste
                    management proposals & contract mails collected
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#1E293B] border border-[#CBD5E1] text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4 text-[#0B7A53]" />
                  <span>Simulate Incoming Mail</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncGmail}
                  disabled={syncingGmail}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B7A53] hover:bg-[#096645] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGmail ? 'animate-spin' : ''}`} />
                  <span>{syncingGmail ? 'Syncing...' : 'Sync Gmail Inbox'}</span>
                </button>
              </div>
            </header>

            {/* "Mails" Section Header + Quick Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Mails</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E6F4EE] text-[#0B7A53] text-xs font-extrabold">
                  {displayedMails.length} Showing
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMailFilter('proposals')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    mailFilter === 'proposals'
                      ? 'bg-[#101C24] text-white border-[#101C24]'
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  All Waste Proposals ({emails.filter((e) => e.isWasteProposal).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMailFilter('pending_approval')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    mailFilter === 'pending_approval'
                      ? 'bg-[#0B7A53] text-white border-[#0B7A53]'
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  Needs Approval (
                  {emails.filter((e) => e.isWasteProposal && e.status === 'pending_approval').length}
                  )
                </button>
                <button
                  type="button"
                  onClick={() => setMailFilter('approved_sent')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    mailFilter === 'approved_sent'
                      ? 'bg-[#0B7A53] text-white border-[#0B7A53]'
                      : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  Approved & Sent (
                  {emails.filter((e) => e.isWasteProposal && e.status === 'approved_sent').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMailFilter('filtered_out')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    mailFilter === 'filtered_out'
                      ? 'bg-[#475569] text-white border-[#475569]'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  Filtered Out ({stats.filteredOutCount})
                </button>
              </div>
            </div>

            {/* Vertically Stacked Mail Cards List (Each Card has: Mail Subject | Mail Summary | AI Action) */}
            <div className="space-y-5 pb-10">
              {displayedMails.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-[#CBD5E1] p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#0B7A53] mx-auto" />
                  <div className="text-base font-bold text-[#111827]">No mails in this filter</div>
                  <p className="text-xs text-[#64748B]">
                    Click "All Waste Proposals" or "Simulate Incoming Mail" above.
                  </p>
                </div>
              ) : (
                displayedMails.map((mail, index) => (
                  <MailCard
                    key={mail.id}
                    emailItem={mail}
                    defaultExpandedDraft={index === 0}
                    settings={settings}
                    onUpdateEmail={updateEmailInList}
                    onOpenPdfPreview={(att) => setPdfPreviewAttachment(att)}
                    showToast={showToast}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* PDF Attachment Full Preview Modal */}
      {pdfPreviewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {pdfPreviewAttachment.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPdfPreviewAttachment(null)}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close Preview
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {pdfPreviewAttachment.extractedText}
            </pre>
          </div>
        </div>
      )}

      {/* Settings & Rate Card Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        showToast={showToast}
      />

      {/* Simulate Incoming Proposal Modal */}
      <SimulateModal
        isOpen={simulateModalOpen}
        onClose={() => setSimulateModalOpen(false)}
        onSimulated={(data) => {
          setEmails(data.emails || []);
          if (data.stats) setStats(data.stats);
          if (data.email) {
            setMailFilter(data.email.isWasteProposal ? 'proposals' : 'filtered_out');
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}

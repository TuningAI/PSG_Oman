import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Search,
  Star,
  Save,
  Globe,
  Truck,
  Banknote,
  Calendar,
  Trash2,
  Inbox,
  Edit3,
  SlidersHorizontal,
  Filter,
  LogOut,
} from 'lucide-react';
import SettingsModal from './components/SettingsModal.jsx';
import SimulateModal from './components/SimulateModal.jsx';
import SocialMediaWorkspace from './components/SocialMediaWorkspace.jsx';
import ExtractionRulesModal from './components/ExtractionRulesModal.jsx';
import VoiceAssistantButton, { speakTextInChunks } from './components/VoiceAssistantButton.jsx';
import EveChatbotModal from './components/EveChatbotModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import eveBurningParkAvatar from './assets/eve-burning-park.png';
import { TRANSLATIONS } from './i18n.js';

const ARABIC_PROPOSAL_TRANSLATIONS = {
  'msg-demo-101': {
    companyNameAr: 'شركة النور للخدمات اللوجستية (Al Noor Logistics)',
    subjectAr: 'طلب عرض سعر: جمع النفايات لمستودعين في مسقط (غلا والرسيل)',
    locationAr: 'غلا + الرسيل، مسقط',
    wasteTypeAr: 'نفايات عامة + كرتون للتدوير',
    volumeAr: '٨ حاويات (١١٠٠ لتر) + ٢ حاوية سكيب (٦ م³)',
    durationAr: '١٢ شهراً · يبدأ ١ نوفمبر ٢٠٢٦',
    summaryAr: [
      'تطلب شركة النور للخدمات اللوجستية عقد جمع نفايات لمستودعاتها في منطقتي غلا والرسيل بمسقط.',
      'يشمل الطلب: تفريغ ٦ حاويات نفايات عامة (٣ مرات أسبوعياً)، وحاويتين للكرتون (أسبوعياً)، ورفع حاويتين سكيب شهرياً.',
      'مدة العقد ١٢ شهراً ابتداءً من ١ نوفمبر ٢٠٢٦، ويرغبون باستلام عرض السعر قبل ٢٣ أكتوبر ٢٠٢٦.',
    ],
  },
  'msg-demo-102': {
    companyNameAr: 'مرافق خليج مسقط (Muscat Bay Facilities)',
    subjectAr: 'تجديد العقد السنوي لإدارة وجمع النفايات — قنتب',
    locationAr: 'قنتب، مسقط',
    wasteTypeAr: 'نفايات عامة + مواد قابلة للتدوير',
    volumeAr: '١٤ حاوية (١١٠٠ لتر) + ٣ حاويات سكيب (٦ م³)',
    durationAr: '١٢ شهراً · يبدأ ١٥ نوفمبر ٢٠٢٦',
    summaryAr: [
      'ترغب شركة مرافق خليج مسقط بتجديد عقد إدارة النفايات السنوي لمرافقها في منطقة قنتب لمدة ١٢ شهراً.',
      'يشمل النطاق ١٠ حاويات نفايات عامة (٣ مرات أسبوعياً)، و٤ حاويات تدوير (أسبوعياً)، و٣ رفعات لحاويات السكيب شهرياً.',
      'يبدأ التجديد في ١٥ نوفمبر ٢٠٢٦ بنظام الدفع الآجل (٣٠ يوماً).',
    ],
  },
  'msg-demo-103': {
    companyNameAr: 'صحار للخدمات الصناعية (Sohar Industrial Services)',
    subjectAr: 'طلب حاويات سكيب وRoRo لتوسعة المصنع في صحار',
    locationAr: 'منطقة صحار الصناعية',
    wasteTypeAr: 'نفايات صناعية + مخلفات بناء وتوسعة',
    volumeAr: '٤ حاويات + ٤ سكيب (٦ م³) + ٢ حاوية كبيرة (٣٠ م³)',
    durationAr: '٦ أشهر · يبدأ ١ نوفمبر ٢٠٢٦',
    summaryAr: [
      'تحتاج شركة صحار للخدمات الصناعية إلى خدمة حاويات نفايات لمشروع توسعة مصنعها في صحار الصناعية.',
      'المطلوب: ٤ حاويات عامة، و٦ رفعات شهرياً لحاويات السكيب (٦ م³)، و٤ رحلات شهرياً لحاويات RoRo الكبيرة (٣٠ م³).',
      'مدة العقد ٦ أشهر مع توفير تصاريح وإيصالات شركة بيئة (Be’ah) الرسمية.',
    ],
  },
};

function getInitials(companyName = '') {
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (companyName.slice(0, 2) || 'CL').toUpperCase();
}

export default function App() {
  // Authentication State: defaults to false so the user starts at the login page
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Language: 'en' (English LTR) | 'ar' (Arabic RTL for GCC / Oman managers)
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRtl = lang === 'ar';

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

  // Gmail-Style Inbox State:
  // When openedEmailId is null -> Shows full-width Google Mail Inbox List.
  // When openedEmailId is set  -> Goes inside that specific mail (Gmail Thread View).
  const [activeQueueTab, setActiveQueueTab] = useState('all_proposals'); // 'all_proposals' | 'pending_approval' | 'approved_sent' | 'filtered_out'
  const [searchQuery, setSearchQuery] = useState('');
  const [openedEmailId, setOpenedEmailId] = useState(null);
  const [starredIds, setStarredIds] = useState(['msg-demo-101']);

  // Inside-Mail View State:
  // Original mail is MINIMIZED by default!
  const [isOriginalMailExpanded, setIsOriginalMailExpanded] = useState(false);

  // Draft Editor state for the opened email
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftCc, setDraftCc] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [selectedTone, setSelectedTone] = useState('Accept & Send Quotation');
  const [aiSuggestionInput, setAiSuggestionInput] = useState('');

  // Action states
  const [regenerating, setRegenerating] = useState(false);
  const [savingGmailDraft, setSavingGmailDraft] = useState(false);
  const [approvingSend, setApprovingSend] = useState(false);

  // Modals & Toasts
  const [pdfPreviewAttachment, setPdfPreviewAttachment] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('company');
  const [settingsEditEmail, setSettingsEditEmail] = useState(null);
  const [extractionRulesModalOpen, setExtractionRulesModalOpen] = useState(false);
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [chatbotModalOpen, setChatbotModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // 3D Blue Voice Assistant State for Reading Text
  const [activeSpeakingBoxId, setActiveSpeakingBoxId] = useState(null); // 'complete_mail' | 'mail_summary' | 'generated_mail' | null
  const cancelSpeechRef = useRef(null);

  // Stop voice reading when switching email or module
  useEffect(() => {
    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
      cancelSpeechRef.current = null;
    }
    setActiveSpeakingBoxId(null);
  }, [openedEmailId, activeMainModule]);

  const handleToggleSpeakBox = (boxId, textToRead) => {
    if (activeSpeakingBoxId === boxId) {
      if (cancelSpeechRef.current) {
        cancelSpeechRef.current();
        cancelSpeechRef.current = null;
      }
      setActiveSpeakingBoxId(null);
      return;
    }

    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
    }

    setActiveSpeakingBoxId(boxId);
    cancelSpeechRef.current = speakTextInChunks(
      textToRead,
      lang,
      () => setActiveSpeakingBoxId(boxId),
      () => setActiveSpeakingBoxId(null)
    );
  };

  // Compute all synced Gmail accounts
  const syncedGmailAccounts = useMemo(() => {
    const g = settings?.gmail || {};
    if (Array.isArray(g.accounts) && g.accounts.length > 0) {
      return g.accounts.filter((a) => a && a.email);
    }
    if (g.email && g.email.trim()) {
      return [{ id: 'gmail-1', email: g.email.trim(), appPassword: g.appPassword || '' }];
    }
    return [];
  }, [settings]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchState = async (silent = false) => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setEmails(data.emails || []);
      setSocialPosts(data.socialPosts || []);
      setSettings(data.settings || null);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      if (!silent) {
        showToast('Failed to load assistant data: ' + err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Live background polling every 15s to automatically reflect background Gmail auto-syncing
    const pollTimer = setInterval(() => {
      fetchState(true);
    }, 15000);
    return () => clearInterval(pollTimer);
  }, []);

  // Filtered emails for the Gmail-style inbox list
  const filteredEmails = useMemo(() => {
    return emails.filter((e) => {
      if (activeQueueTab === 'pending_approval') {
        if (!e.isWasteProposal || e.status !== 'pending_approval') return false;
      } else if (activeQueueTab === 'approved_sent') {
        if (!e.isWasteProposal || e.status !== 'approved_sent') return false;
      } else if (activeQueueTab === 'filtered_out') {
        if (e.isWasteProposal && e.status !== 'filtered_out') return false;
      } else {
        // 'all_proposals'
        if (!e.isWasteProposal || e.status === 'filtered_out') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${e.companyName || ''} ${e.fromName || ''} ${e.fromEmail || ''} ${
          e.subject || ''
        } ${e.bodyText || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [emails, activeQueueTab, searchQuery]);

  const openedEmail = useMemo(
    () => emails.find((e) => e.id === openedEmailId) || null,
    [emails, openedEmailId]
  );

  const openedIndex = useMemo(
    () => filteredEmails.findIndex((e) => e.id === openedEmailId),
    [filteredEmails, openedEmailId]
  );

  // Sync draft editor fields whenever openedEmail changes or its draft updates
  useEffect(() => {
    const defaultFrom =
      openedEmail?.draft?.from ||
      openedEmail?.syncedAccountEmail ||
      openedEmail?.toEmail ||
      syncedGmailAccounts[0]?.email ||
      settings?.companyProfile?.email ||
      'proposals@pgsoman.com';

    if (openedEmail?.draft) {
      setDraftFrom(defaultFrom);
      setDraftTo(openedEmail.draft.to || openedEmail.fromEmail || '');
      setDraftCc(
        openedEmail.draft.cc ||
          settings?.companyProfile?.defaultCc ||
          'operations@pgsoman.com'
      );
      setDraftSubject(
        openedEmail.draft.subject || `Quotation | ${openedEmail.subject}`
      );
      setDraftBody(openedEmail.draft.body || '');
      setSelectedTone(openedEmail.draft.tonePreset || 'Accept & Send Quotation');
    } else if (openedEmail) {
      setDraftFrom(defaultFrom);
      setDraftTo(openedEmail.fromEmail || '');
      setDraftCc('operations@pgsoman.com');
      setDraftSubject(`Re: ${openedEmail.subject}`);
      setDraftBody('');
    }
  }, [openedEmail?.id, openedEmail?.draft?.lastUpdatedAt, syncedGmailAccounts]);

  // Reset minimized original mail state when opening a different email
  useEffect(() => {
    setIsOriginalMailExpanded(false);
    setAiSuggestionInput('');
  }, [openedEmailId]);

  const updateEmailInList = (updatedEmail, newStats) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e))
    );
    if (newStats) setStats(newStats);
  };

  const toggleStar = (e, id) => {
    e.stopPropagation();
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sync Gmail Inbox
  const handleSyncGmail = async () => {
    setSyncingGmail(true);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not sync Gmail', 'warning');
        if (data.error?.includes('Settings') || data.error?.includes('Gmail')) {
          setSettingsInitialTab('gmail');
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

  const handleDeleteGmailAccount = async (emailToDelete) => {
    try {
      const remaining = syncedGmailAccounts.filter(
        (a) => a.email.toLowerCase() !== emailToDelete.toLowerCase()
      );
      const updatedGmail = {
        ...(settings?.gmail || {}),
        accounts: remaining,
        email: remaining[0]?.email || '',
        appPassword: remaining[0]?.appPassword || '',
      };
      await handleSaveSettings({ gmail: updatedGmail });
      showToast(`Deleted synced Gmail ID: ${emailToDelete}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete Gmail account', 'error');
    }
  };

  // Generate / Update AI Mail Response based on Manager's Suggestion or Action Type
  const handleGenerateWithAi = async (presetOverride) => {
    if (!openedEmail) return;
    const toneToUse = presetOverride || selectedTone;
    setSelectedTone(toneToUse);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/emails/${openedEmail.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tonePreset: toneToUse,
          customInstructions: aiSuggestionInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate draft');
      updateEmailInList(data.email);
      setDraftSubject(data.email.draft?.subject || draftSubject);
      setDraftBody(data.email.draft?.body || '');
      showToast(
        lang === 'ar'
          ? 'تم توليد وتحديث مسودة الرد بالذكاء الاصطناعي!'
          : 'AI has updated the mail response draft!',
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRegenerating(false);
    }
  };

  // Save to Gmail Drafts
  const handleSaveToGmailDrafts = async () => {
    if (!openedEmail) return;
    setSavingGmailDraft(true);
    try {
      const res = await fetch(`/api/emails/${openedEmail.id}/save-gmail-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: {
            from: draftFrom,
            to: draftTo,
            cc: draftCc,
            subject: draftSubject,
            body: draftBody,
            tonePreset: selectedTone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save to Gmail Drafts');
      updateEmailInList(data.email);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingGmailDraft(false);
    }
  };

  // Respond to Mail with Generated Draft (Send back to client)
  const handleRespondAndSend = async () => {
    if (!openedEmail) return;
    setApprovingSend(true);
    try {
      const res = await fetch(`/api/emails/${openedEmail.id}/approve-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: {
            from: draftFrom,
            to: draftTo,
            cc: draftCc,
            subject: draftSubject,
            body: draftBody,
            tonePreset: selectedTone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      updateEmailInList(data.email, data.stats);
      showToast(
        lang === 'ar'
          ? `تم إرسال الرد إلى ${draftTo} بنجاح!`
          : data.message,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApprovingSend(false);
    }
  };

  const handleRestoreSpam = async () => {
    if (!openedEmail) return;
    try {
      const res = await fetch(`/api/emails/${openedEmail.id}/reclassify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ makeProposal: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateEmailInList(data.email, data.stats);
      setActiveQueueTab('all_proposals');
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#06392A] text-white gap-3">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        <p className="text-base font-bold">Loading PGS Oman Executive Assistant...</p>
      </div>
    );
  }

  const pendingCount = emails.filter(
    (e) => e.isWasteProposal && e.status === 'pending_approval'
  ).length;
  const allProposalsCount = emails.filter(
    (e) => e.isWasteProposal && e.status !== 'filtered_out'
  ).length;
  const approvedCount = emails.filter(
    (e) => e.isWasteProposal && e.status === 'approved_sent'
  ).length;

  const arData = openedEmail ? ARABIC_PROPOSAL_TRANSLATIONS[openedEmail.id] : null;
  const pricingTotal =
    openedEmail?.draft?.totalLabel ||
    openedEmail?.aiAnalysis?.extractedDetails?.estimatedMonthlyValue ||
    '2,129 OMR/month';

  const summaryPoints =
    isRtl && arData?.summaryAr
      ? arData.summaryAr
      : openedEmail?.aiAnalysis?.executiveSummary || [];

  const locationDisplay =
    isRtl && arData?.locationAr
      ? arData.locationAr
      : openedEmail?.aiAnalysis?.extractedDetails?.siteLocationsLabel ||
        'Ghala + Rusayl, Muscat';

  const wasteTypeDisplay =
    isRtl && arData?.wasteTypeAr
      ? arData.wasteTypeAr
      : openedEmail?.aiAnalysis?.extractedDetails?.wasteStreamsLabel ||
        'General + cardboard';

  const volumeDisplay =
    isRtl && arData?.volumeAr
      ? arData.volumeAr
      : openedEmail?.aiAnalysis?.extractedDetails?.binsVolumeLabel ||
        '8 × 1,100 L; 2 × 6 m³';

  const durationDisplay =
    isRtl && arData?.durationAr
      ? arData.durationAr
      : openedEmail?.aiAnalysis?.extractedDetails?.contractDurationLabel ||
        '12 months · 1 Nov 2026';

  const QUICK_ACTIONS = [
    { id: 'Accept & Send Quotation', label: t.actionQuoteTitle, icon: FileText },
    { id: 'Request Site Inquiry / Visit', label: t.actionVisitTitle, icon: MapPin },
    { id: 'Ask for Missing Specs', label: t.actionSpecsTitle, icon: MessageSquare },
    { id: 'Approve Contract Terms', label: t.actionContractTitle, icon: CheckCircle2 },
  ];

  // Text content strings prepared for the 3D Blue Voice Assistants
  const completeOriginalMailText = openedEmail
    ? [
        lang === 'ar' ? 'البريد الأصلي الكامل:' : 'Complete original email:',
        `${lang === 'ar' ? 'من' : 'From'}: ${openedEmail.fromName || openedEmail.companyName || ''} <${openedEmail.fromEmail || ''}>.`,
        `${lang === 'ar' ? 'إلى' : 'To'}: ${openedEmail.toEmail || openedEmail.syncedAccountEmail || 'proposals@pgsoman.com'}.`,
        `${lang === 'ar' ? 'الموضوع' : 'Subject'}: ${openedEmail.subject || ''}.`,
        `${lang === 'ar' ? 'نص الرسالة' : 'Message body'}: ${openedEmail.bodyText || ''}.`,
        openedEmail.attachments?.[0]?.extractedText
          ? `${lang === 'ar' ? 'محتوى المرفقات' : 'Attachment text'}: ${openedEmail.attachments[0].extractedText}`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  const mailSummaryText = openedEmail
    ? [
        lang === 'ar' ? 'ملخص الذكاء الاصطناعي لعرض الأسعار:' : 'AI proposal summary:',
        `${t.detailPricing}: ${pricingTotal}.`,
        `${t.detailLocation}: ${locationDisplay}.`,
        `${t.detailWasteType}: ${wasteTypeDisplay}.`,
        `${t.detailVolume}: ${volumeDisplay}.`,
        `${t.detailDuration}: ${durationDisplay}.`,
        `${lang === 'ar' ? 'النقاط الرئيسية' : 'Key points'}: ${summaryPoints.join('. ')}.`,
      ].join(' ')
    : '';

  const generatedMailText = [
    lang === 'ar' ? 'مسودة الرد المولدة:' : 'Generated email draft response:',
    `${lang === 'ar' ? 'من' : 'From'}: ${draftFrom || ''}.`,
    `${lang === 'ar' ? 'إلى' : 'To'}: ${draftTo || ''}.`,
    `${t.labelSubject}: ${draftSubject || ''}.`,
    `${lang === 'ar' ? 'نص الرد' : 'Draft body'}: ${draftBody || ''}`,
  ].join(' ');

  // Show interactive, stylish Login Page initially
  if (!isAuthenticated) {
    return (
      <LoginPage
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
        onLogin={(userData) => {
          setCurrentUser(userData);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen flex bg-[#F7F6F2] text-slate-900 antialiased"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md">
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold ${
              toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700'
                : toast.type === 'warning'
                ? 'bg-amber-950 text-white border-amber-700'
                : 'bg-[#06392A] text-white border-emerald-500'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          LEFTMOST EXECUTIVE SIDEBAR (Royal Emerald & Omani Gold Palette)
         ===================================================================== */}
      <aside className="w-72 bg-[#06392A] text-white flex flex-col justify-between shrink-0 p-5 select-none shadow-xl">
        <div className="space-y-5">
          {/* Company Brand Header */}
          <div className="p-4 rounded-2xl bg-[#094D39] border border-emerald-700/60 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shrink-0">
              <Recycle className="w-7 h-7 text-[#06392A]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight text-white truncate">
                {t.appName}
              </div>
              <div className="text-xs font-medium text-emerald-200 truncate">
                {t.appSubtitle}
              </div>
            </div>
          </div>

          {/* 1-Click Language Switcher (Arabic / English) */}
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 transition"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold">{t.switchLangLabel}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-xs font-bold">
              {lang === 'en' ? 'عربي' : 'EN'}
            </span>
          </button>

          {/* 2 Primary Assistant Tabs */}
          <nav className="space-y-3 pt-1">
            {/* Tab 1: Email Management (Inbox) */}
            <button
              type="button"
              onClick={() => {
                setActiveMainModule('email_assistant');
                setOpenedEmailId(null);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-start transition ${
                activeMainModule === 'email_assistant'
                  ? 'bg-white text-[#06392A] border-amber-400 shadow-lg'
                  : 'bg-[#094D39]/70 border-emerald-800/80 text-emerald-100 hover:bg-[#094D39]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    activeMainModule === 'email_assistant'
                      ? 'bg-[#06392A] text-amber-400'
                      : 'bg-[#06392A]/60 text-emerald-300'
                  }`}
                >
                  <Mail className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold truncate">
                    {t.navProposals}
                  </div>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      activeMainModule === 'email_assistant'
                        ? 'text-slate-600 font-medium'
                        : 'text-emerald-300/80'
                    }`}
                  >
                    {t.navProposalsSub}
                  </div>
                </div>
              </div>
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shrink-0">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Tab 2: Social Media Assistant */}
            <button
              type="button"
              onClick={() => setActiveMainModule('social_assistant')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-start transition ${
                activeMainModule === 'social_assistant'
                  ? 'bg-white text-[#06392A] border-amber-400 shadow-lg'
                  : 'bg-[#094D39]/70 border-emerald-800/80 text-emerald-100 hover:bg-[#094D39]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    activeMainModule === 'social_assistant'
                      ? 'bg-[#06392A] text-amber-400'
                      : 'bg-[#06392A]/60 text-emerald-300'
                  }`}
                >
                  <Megaphone className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold truncate">{t.navSocial}</div>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      activeMainModule === 'social_assistant'
                        ? 'text-slate-600 font-medium'
                        : 'text-emerald-300/80'
                    }`}
                  >
                    {t.navSocialSub}
                  </div>
                </div>
              </div>
            </button>
          </nav>

          {/* Reassuring Safety Card */}
          <div className="p-4 rounded-2xl bg-[#094D39]/80 border border-emerald-700/60 space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{t.controlTitle}</span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">{t.controlDesc}</p>
          </div>
        </div>

        {/* Bottom Synced Gmail Accounts List, Settings & Manager Profile */}
        <div className="space-y-3 pt-4 border-t border-emerald-800/80">
          {/* Simulate Mail Button (Placed above the Synced Mail List) */}
          <button
            type="button"
            onClick={() => setSimulateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#06392A] text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer"
            title={t.btnTestMail}
          >
            <Plus className="w-4 h-4 text-[#06392A]" />
            <span>{t.btnTestMail}</span>
          </button>

          {/* Synced Gmail Accounts Display + Edit & Delete Buttons in Sidebar */}
          <div className="p-3 rounded-xl bg-[#094D39]/90 border border-emerald-700/80 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    syncedGmailAccounts.length > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  {syncedGmailAccounts.length > 0 ? t.syncedGmailLabel : t.notSyncedGmailLabel}
                </span>
              </div>
            </div>

            {syncedGmailAccounts.length > 0 && (
              <div className="space-y-1.5">
                {syncedGmailAccounts.map((acc) => (
                  <div
                    key={acc.id || acc.email}
                    className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#06392A]/80 border border-emerald-800"
                  >
                    <span className="text-xs font-extrabold text-white truncate">
                      {acc.email}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsInitialTab('gmail');
                          setSettingsEditEmail(acc.email);
                          setSettingsModalOpen(true);
                        }}
                        title={t.btnEditGmail}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t.btnEditGmail}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGmailAccount(acc.email)}
                        title={t.btnDeleteGmail}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.btnDeleteGmail}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSettingsInitialTab('company');
              setSettingsEditEmail(null);
              setSettingsModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#094D39] hover:bg-emerald-800 text-white text-sm font-bold border border-emerald-700 transition"
          >
            <Settings className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{t.navSettings}</span>
          </button>

          <div className="flex items-center justify-between gap-2 px-2 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-[#06392A] text-sm font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                {currentUser?.initials || settings?.companyProfile?.managerInitials || 'AK'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {currentUser?.name || settings?.companyProfile?.managerName || 'Ahmed Al Kindi'}
                </div>
                <div className="text-xs text-emerald-300 truncate">
                  {currentUser?.role || settings?.companyProfile?.managerTitle || 'General Manager · PGS Oman'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="p-2 rounded-xl bg-[#094D39] hover:bg-rose-900/60 hover:text-rose-200 text-emerald-300 border border-emerald-700 hover:border-rose-400/50 transition cursor-pointer shrink-0"
              title={isRtl ? 'تسجيل الخروج والعودة لصفحة الدخول' : 'Sign Out / Return to Login Page'}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          RIGHT MAIN WINDOW
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {activeMainModule === 'social_assistant' ? (
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
        ) : !openedEmail ? (
          /* =====================================================================
             VIEW 1: GOOGLE MAIL (GMAIL) STYLE INBOX LIST VIEW
             ===================================================================== */
          <div className="flex-1 p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-5">
            {/* Top Gmail-Style Search & Action Bar */}
            <header className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              {/* Search Bar (Just like Gmail) */}
              <div className="relative flex-1 min-w-[260px] max-w-xl">
                <Search className="w-5 h-5 text-slate-400 absolute start-4 top-3" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-12 pe-4 py-2.5 rounded-xl bg-[#F4F3EE] focus:bg-white border border-transparent focus:border-[#065F46] text-sm font-medium text-slate-900 focus:outline-none transition"
                />
              </div>

              {/* Right Synced Gmail Account Pills (with Edit & Delete) + Sync & Test Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {syncedGmailAccounts.length === 0 ? (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-amber-900">{t.notSyncedGmailLabel}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsInitialTab('gmail');
                        setSettingsEditEmail(null);
                        setSettingsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 ms-1 px-2.5 py-1 rounded-lg bg-[#065F46] text-white font-extrabold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.btnConnectGmail}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {syncedGmailAccounts.map((acc) => (
                      <div
                        key={acc.id || acc.email}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-xs"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-600">{t.syncedGmailLabel}</span>
                        <span className="font-extrabold text-[#06392A]">{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsInitialTab('gmail');
                            setSettingsEditEmail(acc.email);
                            setSettingsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-300 text-[#065F46] font-extrabold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t.btnEditGmail}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGmailAccount(acc.email)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 font-extrabold transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.btnDeleteGmail}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Mail Filter Rules Modal Button */}
                <button
                  type="button"
                  onClick={() => setExtractionRulesModalOpen(true)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-400/80 text-[#06392A] text-sm font-extrabold shadow-sm transition cursor-pointer"
                  title={isRtl ? 'قواعد فرز البريد بالذكاء الاصطناعي وعناوين النطاقات المسموحة' : 'Configure AI extraction prompt, whitelisted company domains and email addresses'}
                >
                  <div className="relative flex items-center justify-center">
                    <Filter className="w-4 h-4 text-amber-600" />
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <span>{t.btnFilterRules}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncGmail}
                  disabled={syncingGmail}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-sm font-bold shadow-sm disabled:opacity-50 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingGmail ? 'animate-spin' : ''}`} />
                  <span>{syncingGmail ? t.btnCheckingGmail : t.btnCheckGmail}</span>
                </button>
              </div>
            </header>

            {/* Main Gmail-Style Inbox Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Gmail Category Tabs Header */}
              <div className="flex flex-wrap border-b border-slate-200 bg-[#FAF9F6] px-4">
                <button
                  type="button"
                  onClick={() => setActiveQueueTab('all_proposals')}
                  className={`flex items-center gap-2.5 px-6 py-4 text-sm font-extrabold border-b-4 transition ${
                    activeQueueTab === 'all_proposals'
                      ? 'border-[#065F46] text-[#065F46] bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span>{t.tabAll}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#065F46] text-xs font-extrabold">
                    {allProposalsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQueueTab('pending_approval')}
                  className={`flex items-center gap-2.5 px-6 py-4 text-sm font-extrabold border-b-4 transition ${
                    activeQueueTab === 'pending_approval'
                      ? 'border-amber-500 text-amber-800 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{t.tabWaiting}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                    {pendingCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQueueTab('approved_sent')}
                  className={`flex items-center gap-2.5 px-6 py-4 text-sm font-extrabold border-b-4 transition ${
                    activeQueueTab === 'approved_sent'
                      ? 'border-[#065F46] text-[#065F46] bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.tabApproved}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                    {approvedCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQueueTab('filtered_out')}
                  className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-4 transition ${
                    activeQueueTab === 'filtered_out'
                      ? 'border-slate-600 text-slate-800 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.tabIgnored}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs">
                    {stats.filteredOutCount}
                  </span>
                </button>
              </div>

              {/* Gmail-Style Email Rows List with Horizontal Scroll Bar */}
              {filteredEmails.length === 0 ? (
                <div className="p-16 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="text-lg font-extrabold text-slate-800">
                    {t.noMailsTitle}
                  </div>
                  <p className="text-sm text-slate-500">{t.noMailsSub}</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="divide-y divide-slate-100 min-w-max">
                    {filteredEmails.map((item) => {
                      const isPending = item.status === 'pending_approval';
                      const isStarred = starredIds.includes(item.id);
                      const itemAr = ARABIC_PROPOSAL_TRANSLATIONS[item.id];
                      const companyTitle =
                        isRtl && itemAr?.companyNameAr
                          ? itemAr.companyNameAr
                          : item.companyName || item.fromName;
                      const subjectTitle =
                        isRtl && itemAr?.subjectAr ? itemAr.subjectAr : item.subject;
                      const snippetText =
                        isRtl && itemAr?.summaryAr?.[0]
                          ? itemAr.summaryAr[0]
                          : item.aiAnalysis?.executiveSummary?.[0] || item.bodyText;
                      const itemValue =
                        item.draft?.totalLabel ||
                        item.aiAnalysis?.extractedDetails?.estimatedMonthlyValue ||
                        '';
                      const itemLocation =
                        isRtl && itemAr?.locationAr
                          ? itemAr.locationAr
                          : item.aiAnalysis?.extractedDetails?.location || '';
                      const itemWaste =
                        isRtl && itemAr?.wasteTypeAr
                          ? itemAr.wasteTypeAr
                          : item.aiAnalysis?.extractedDetails?.wasteStreams || '';

                      return (
                        <div
                          key={item.id}
                          onClick={() => setOpenedEmailId(item.id)}
                          className={`group px-5 py-4 flex items-center gap-4 cursor-pointer whitespace-nowrap transition ${
                            isPending
                              ? 'bg-white hover:bg-[#F0FDF4]'
                              : 'bg-slate-50/60 hover:bg-slate-100/80'
                          }`}
                        >
                          {/* Star Icon & Avatar */}
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => toggleStar(e, item.id)}
                              className="text-slate-300 hover:text-amber-400 transition"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  isStarred
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>

                            <span
                              className={`w-9 h-9 rounded-xl text-xs font-extrabold flex items-center justify-center ${
                                isPending
                                  ? 'bg-[#065F46] text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.initials || getInitials(item.companyName)}
                            </span>
                          </div>

                          {/* Sender Company Name (Full Width, Not Truncated) */}
                          <div className="min-w-[210px] shrink-0">
                            <span
                              className={`text-[15px] ${
                                isPending
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-semibold text-slate-700'
                              }`}
                            >
                              {companyTitle}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {item.status === 'pending_approval' && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-extrabold">
                                {t.statusWaiting}
                              </span>
                            )}
                            {item.status === 'approved_sent' && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                                {t.statusSent}
                              </span>
                            )}
                            {item.status === 'filtered_out' && (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold">
                                {t.statusSpam}
                              </span>
                            )}
                          </div>

                          {/* Extracted Mail Details Pills (Pricing, Location, Waste Stream) */}
                          {item.isWasteProposal && (
                            <div className="flex items-center gap-2 shrink-0">
                              {itemValue && (
                                <span className="px-3 py-1 rounded-lg bg-[#ECFDF5] border border-emerald-200 text-[#065F46] text-xs font-extrabold">
                                  {itemValue}
                                </span>
                              )}
                              {itemLocation && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs font-bold">
                                  <MapPin className="w-3.5 h-3.5 text-[#065F46]" />
                                  <span>{itemLocation}</span>
                                </span>
                              )}
                              {itemWaste && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-slate-200 text-slate-700 text-xs font-bold">
                                  <Recycle className="w-3.5 h-3.5 text-[#065F46]" />
                                  <span>{itemWaste}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Complete Subject + Summary Snippet (No Truncation) */}
                          <div className="text-[15px] pe-6 shrink-0">
                            <span
                              className={
                                isPending
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-semibold text-slate-800'
                              }
                            >
                              {subjectTitle}
                            </span>
                            <span className="text-slate-400 mx-2">—</span>
                            <span className="text-slate-500 text-sm">{snippetText}</span>
                          </div>

                          {/* Time (Right End) */}
                          <div className="flex items-center shrink-0 ms-auto ps-4">
                            <span className="text-xs font-bold text-slate-500 text-end">
                              {item.displayTime || '09:38'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =====================================================================
             VIEW 2: INSIDE A MAIL (GOOGLE MAIL THREAD VIEW)
             1. Top Back-to-Inbox Bar
             2. Mail Subject & Sender Header
             3. Minimized Original Mail Bar (Click to view complete original mail)
             4. AI-Generated Summary of Complete Mail (Pricing, Location, Details)
             5. AI-Generated Mail Response + AI Suggestion Box + Manual Editor + Respond Button
             ===================================================================== */
          <div className="flex-1 p-6 lg:p-8 max-w-[1300px] w-full mx-auto space-y-5">
            {/* 1. Top Gmail Thread Navigation Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setOpenedEmailId(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-extrabold transition"
              >
                {isRtl ? (
                  <ArrowRight className="w-4 h-4 text-[#065F46]" />
                ) : (
                  <ArrowLeft className="w-4 h-4 text-[#065F46]" />
                )}
                <span>{t.backToInbox}</span>
              </button>

              {/* Prev / Next Mail Navigation */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">
                  {openedIndex >= 0
                    ? `${openedIndex + 1} / ${filteredEmails.length}`
                    : ''}
                </span>
                <button
                  type="button"
                  disabled={openedIndex <= 0}
                  onClick={() => {
                    if (openedIndex > 0) {
                      setOpenedEmailId(filteredEmails[openedIndex - 1].id);
                    }
                  }}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                  title={t.prevMail}
                >
                  {isRtl ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={
                    openedIndex === -1 || openedIndex >= filteredEmails.length - 1
                  }
                  onClick={() => {
                    if (openedIndex < filteredEmails.length - 1) {
                      setOpenedEmailId(filteredEmails[openedIndex + 1].id);
                    }
                  }}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                  title={t.nextMail}
                >
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 2. Mail Subject & Sender Header Card (Showing Mail-From and Mail-To) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 w-full">
                  <span className="w-12 h-12 rounded-2xl bg-[#06392A] text-amber-400 text-base font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                    {openedEmail.initials || getInitials(openedEmail.companyName)}
                  </span>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900">
                        {isRtl && arData?.subjectAr
                          ? arData.subjectAr
                          : openedEmail.subject}
                      </h1>
                      {openedEmail.status === 'pending_approval' && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                          {t.statusWaiting}
                        </span>
                      )}
                      {openedEmail.status === 'approved_sent' && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                          {t.statusSent}
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-500 ms-auto">
                        {openedEmail.displayTime || '09:38 AM'}
                      </span>
                    </div>

                    {/* Explicit Mail-From & Mail-To Header Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
                          {t.mailFromLabel}
                        </span>
                        <span className="font-extrabold text-slate-900 truncate">
                          {isRtl && arData?.companyNameAr
                            ? arData.companyNameAr
                            : openedEmail.companyName || openedEmail.fromName}{' '}
                          &lt;{openedEmail.fromEmail}&gt;
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-xs">
                        <span className="font-extrabold uppercase tracking-wider text-[#065F46] shrink-0">
                          {t.mailToLabel}
                        </span>
                        <span className="font-extrabold text-[#06392A] truncate">
                          {openedEmail.toEmail ||
                            openedEmail.syncedAccountEmail ||
                            syncedGmailAccounts[0]?.email ||
                            settings?.companyProfile?.email ||
                            'proposals@pgsoman.com'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ORIGINAL MAIL FROM CLIENT BOX (Click to view complete original mail) */}
              <div className="relative rounded-2xl border-2 border-slate-200 bg-[#FAF9F6] overflow-visible transition shadow-sm">
                <div
                  onClick={() =>
                    setIsOriginalMailExpanded(!isOriginalMailExpanded)
                  }
                  className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition rounded-2xl pe-20"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#065F46] shrink-0" />
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {t.originalMailMinimizedTitle}
                      </span>
                      <span className="text-xs text-slate-500 ms-2 font-medium">
                        —{' '}
                        {isOriginalMailExpanded
                          ? t.originalMailClickToHide
                          : t.originalMailClickToView}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {openedEmail.attachments?.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfPreviewAttachment(openedEmail.attachments[0]);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#065F46] text-xs font-bold text-slate-800 transition"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-rose-600" />
                        <span>
                          {t.btnViewPdf} ({openedEmail.attachments[0].filename})
                        </span>
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#065F46] text-white text-xs font-bold">
                      {isOriginalMailExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Complete Original Mail & PDF Text (Including Mail-From & Mail-To) */}
                {isOriginalMailExpanded && (
                  <div className="p-5 bg-white border-t border-slate-200 space-y-4 pb-16 rounded-b-2xl">
                    <div
                      dir="ltr"
                      className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div>
                        <strong className="text-slate-600">Mail-From: </strong>
                        <span className="font-bold text-slate-900">
                          {openedEmail.fromName || openedEmail.companyName} &lt;
                          {openedEmail.fromEmail}&gt;
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-600">Mail-To: </strong>
                        <span className="font-bold text-[#065F46]">
                          {openedEmail.toEmail ||
                            openedEmail.syncedAccountEmail ||
                            syncedGmailAccounts[0]?.email ||
                            settings?.companyProfile?.email ||
                            'proposals@pgsoman.com'}
                        </span>
                      </div>
                      <div>
                        <strong className="text-slate-600">Subject: </strong>
                        <span className="font-bold text-slate-900">
                          {openedEmail.subject}
                        </span>
                      </div>
                    </div>

                    <pre
                      dir="ltr"
                      className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200"
                    >
                      {openedEmail.bodyText}
                    </pre>

                    {openedEmail.attachments?.length > 0 && (
                      <div
                        dir="ltr"
                        className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2"
                      >
                        <div className="text-xs font-extrabold uppercase text-rose-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-rose-600" />
                          Attached Document Content ({openedEmail.attachments[0].filename})
                        </div>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {openedEmail.attachments[0].extractedText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* 3D EVE Voice Assistant on the Right-Bottom Corner (overflowing out of the box when in minimized format) */}
                <VoiceAssistantButton
                  boxId="complete_mail"
                  text={completeOriginalMailText}
                  activeSpeakingBoxId={activeSpeakingBoxId}
                  onToggleSpeak={(boxId, text) => {
                    setIsOriginalMailExpanded(true);
                    handleToggleSpeakBox(boxId, text);
                  }}
                  lang={lang}
                  title={lang === 'ar' ? 'المساعد الصوتي إيف: قراءة البريد الأصلي الكامل' : 'EVE Voice Assistant: Read Original Mail'}
                  className={`absolute end-3 z-30 transition-all duration-200 ${
                    isOriginalMailExpanded ? 'bottom-3' : '-bottom-3'
                  }`}
                />
              </div>
            </div>

            {!openedEmail.isWasteProposal ||
            openedEmail.status === 'filtered_out' ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
                <div className="text-lg font-extrabold text-slate-800">
                  {t.spamBannerTitle}
                </div>
                <button
                  type="button"
                  onClick={handleRestoreSpam}
                  className="px-6 py-3 rounded-xl bg-[#065F46] text-white text-sm font-bold hover:bg-[#047857] transition"
                >
                  {t.btnRestoreSpam}
                </button>
              </div>
            ) : (
              <>
                {/* =============================================================
                    4. AI-GENERATED SUMMARY OF THE COMPLETE MAIL
                    (Including Pricing, Location, Waste Stream, Volume, Duration + Bullet Summary)
                   ============================================================= */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                    <div className="p-2 rounded-xl bg-emerald-100 text-[#065F46]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {t.aiSummaryHeader}
                    </h2>
                  </div>

                  {/* Key Extracted Details Row (Pricing, Location, Waste Type, Volume, Duration) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* Highlighted Pricing Card */}
                    <div className="p-4 rounded-2xl bg-[#06392A] text-white shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Banknote className="w-4 h-4" />
                        <span>{t.detailPricing}</span>
                      </div>
                      <div className="text-lg font-extrabold text-white mt-1.5">
                        {pricingTotal}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin className="w-4 h-4 text-[#065F46]" />
                        <span>{t.detailLocation}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1.5">
                        {locationDisplay}
                      </div>
                    </div>

                    {/* Waste Type */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Recycle className="w-4 h-4 text-[#065F46]" />
                        <span>{t.detailWasteType}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1.5">
                        {wasteTypeDisplay}
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Truck className="w-4 h-4 text-[#065F46]" />
                        <span>{t.detailVolume}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1.5">
                        {volumeDisplay}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Calendar className="w-4 h-4 text-[#065F46]" />
                        <span>{t.detailDuration}</span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1.5">
                        {durationDisplay}
                      </div>
                    </div>
                  </div>

                  {/* Bullet-Point Summary of the Complete Mail */}
                  <div className="relative p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-2.5 pb-14">
                    <ul className="space-y-2.5">
                      {summaryPoints.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-[15px] text-slate-800 font-medium leading-relaxed"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#065F46] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 3D Blue Voice Assistant at Right-Bottom Corner of Mail Summary Box */}
                    <VoiceAssistantButton
                      boxId="mail_summary"
                      text={mailSummaryText}
                      activeSpeakingBoxId={activeSpeakingBoxId}
                      onToggleSpeak={handleToggleSpeakBox}
                      lang={lang}
                      title={lang === 'ar' ? 'المساعد الصوتي 3D: قراءة ملخص البريد' : '3D Voice Assistant: Read Summary'}
                      className="absolute bottom-3 end-3"
                    />
                  </div>
                </div>

                {/* =============================================================
                    5. AI-GENERATED MAIL RESPONSE + SUGGESTION TO AI + MANUAL EDIT + SEND
                   ============================================================= */}
                <div className="bg-white rounded-3xl border-2 border-[#065F46]/30 p-6 shadow-md space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-[#06392A] text-amber-400">
                        <Send className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {t.aiResponseHeader}
                      </h2>
                    </div>
                  </div>

                  {/* Option 1: Give Suggestion to AI to Generate / Modify the Mail Response */}
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border-2 border-amber-400/50 space-y-3.5">
                    <label className="block text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{t.aiSuggestionTitle}</span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        placeholder={t.aiSuggestionPlaceholder}
                        value={aiSuggestionInput}
                        onChange={(e) => setAiSuggestionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGenerateWithAi(selectedTone);
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-[#065F46] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={regenerating}
                        onClick={() => handleGenerateWithAi(selectedTone)}
                        className="px-6 py-3 rounded-xl bg-[#06392A] hover:bg-[#094D39] text-amber-300 text-sm font-extrabold flex items-center justify-center gap-2 shrink-0 transition shadow-sm"
                      >
                        {regenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>
                          {regenerating
                            ? t.generatingWithAi
                            : t.btnGenerateWithAi}
                        </span>
                      </button>
                    </div>

                    {/* Quick Response Type Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500 me-1">
                        {t.quickSuggestionsLabel}
                      </span>
                      {QUICK_ACTIONS.map((act) => {
                        const IconComp = act.icon;
                        const active = selectedTone === act.id;
                        return (
                          <button
                            key={act.id}
                            type="button"
                            disabled={regenerating}
                            onClick={() => handleGenerateWithAi(act.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-extrabold transition ${
                              active
                                ? 'bg-[#065F46] text-white border-[#065F46]'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-[#065F46]'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{act.label}</span>
                            {active && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Option 2: Edit & Type Himself Directly in the AI-Generated Mail */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {/* Mail-From (Sender Gmail ID) */}
                      <div className="flex items-center px-4 py-2.5 rounded-xl bg-[#ECFDF5] border border-emerald-200">
                        <span className="text-[#065F46] font-extrabold me-2 shrink-0">
                          {t.mailFromLabel}
                        </span>
                        {syncedGmailAccounts.length > 1 ? (
                          <select
                            value={draftFrom}
                            onChange={(e) => setDraftFrom(e.target.value)}
                            className="flex-1 font-extrabold text-[#06392A] bg-transparent focus:outline-none"
                          >
                            {syncedGmailAccounts.map((acc) => (
                              <option key={acc.id || acc.email} value={acc.email}>
                                {acc.email}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="email"
                            value={draftFrom}
                            onChange={(e) => setDraftFrom(e.target.value)}
                            className="flex-1 font-extrabold text-[#06392A] bg-transparent focus:outline-none"
                          />
                        )}
                      </div>

                      {/* Mail-To (Recipient Client Email) */}
                      <div className="flex items-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-extrabold me-2 shrink-0">
                          {t.mailToLabel}
                        </span>
                        <input
                          type="email"
                          value={draftTo}
                          onChange={(e) => setDraftTo(e.target.value)}
                          className="flex-1 font-bold text-slate-900 bg-transparent focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-bold me-2">
                          {t.labelCc}
                        </span>
                        <input
                          type="text"
                          value={draftCc}
                          onChange={(e) => setDraftCc(e.target.value)}
                          className="flex-1 font-semibold text-slate-800 bg-transparent focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 font-bold me-2">
                          {t.labelSubject}
                        </span>
                        <input
                          type="text"
                          value={draftSubject}
                          onChange={(e) => setDraftSubject(e.target.value)}
                          className="flex-1 font-extrabold text-slate-900 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                        {t.labelBody}
                      </label>
                      <textarea
                        rows={12}
                        dir="ltr"
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        className="w-full p-5 rounded-2xl bg-[#FCFBF9] border-2 border-slate-300 focus:border-[#065F46] text-[15px] text-slate-900 font-sans leading-relaxed focus:outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Final Action Bar: Respond to Mail with Generated Draft */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={handleSaveToGmailDrafts}
                      disabled={savingGmailDraft}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-extrabold text-slate-700 transition"
                    >
                      <Save className="w-4 h-4 text-[#065F46]" />
                      <span>
                        {savingGmailDraft
                          ? '...'
                          : openedEmail.gmailDraftSynced
                          ? t.btnSavedGmailDraft
                          : t.btnSaveGmailDraft}
                      </span>
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleRespondAndSend}
                        disabled={approvingSend}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#065F46] hover:bg-[#047857] text-white text-base font-extrabold flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition"
                      >
                        {approvingSend ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        <span>
                          {approvingSend
                            ? t.sendingEmail
                            : openedEmail.status === 'approved_sent'
                            ? t.btnRespondResend
                            : t.btnRespondSend}
                        </span>
                      </button>

                      {/* 3D Blue Voice Assistant at Right-Bottom Corner of Generated Mail Box */}
                      <VoiceAssistantButton
                        boxId="generated_mail"
                        text={generatedMailText}
                        activeSpeakingBoxId={activeSpeakingBoxId}
                        onToggleSpeak={handleToggleSpeakBox}
                        lang={lang}
                        title={lang === 'ar' ? 'المساعد الصوتي 3D: قراءة مسودة الرد' : '3D Voice Assistant: Read Draft Response'}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* PDF Attachment Full Preview Modal */}
      {pdfPreviewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-rose-600" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  {pdfPreviewAttachment.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPdfPreviewAttachment(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
            </div>
            <pre
              dir="ltr"
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto"
            >
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
        initialTab={settingsInitialTab}
        initialEditEmail={settingsEditEmail}
      />

      {/* Email Extraction & AI Filter Rules Modal */}
      <ExtractionRulesModal
        isOpen={extractionRulesModalOpen}
        onClose={() => setExtractionRulesModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        showToast={showToast}
        lang={lang}
      />

      {/* Floating Main AI Assistant / Chatbot Action Button featuring EVE with Golden Light */}
      {activeMainModule === 'email_assistant' && (
        <div className="fixed bottom-6 end-6 z-40 flex items-center group">
          {/* Floating Tooltip / Speech Bubble on hover */}
          <div className="hidden sm:flex items-center gap-1.5 me-3 px-3.5 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-2xl shadow-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none translate-x-1 group-hover:translate-x-0 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? 'إيف: كيف يمكنني مساعدتك؟' : 'EVE: How can I assist you?'}</span>
          </div>

          {/* Floating Main EVE Assistant (Light aura only, no circle/sphere, no blinking, no plus badge) */}
          <button
            type="button"
            onClick={() => setChatbotModalOpen(!chatbotModalOpen)}
            title={isRtl ? 'المساعد الذكي إيف • انقر لبدء المحادثة' : 'EVE Virtual Assistant • Click to chat'}
            className="relative flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none hover:scale-115 active:scale-95"
            aria-label="EVE AI Chatbot"
          >
            {/* Golden Ambient Light (Soft blur light only, identical to voice assistant style) */}
            <span className="absolute -inset-2.5 rounded-full blur-md transition-all duration-300 pointer-events-none bg-amber-400/20 group-hover:bg-amber-400/40" />

            {/* EVE Character Body with Float Animation */}
            <div className="relative w-12 h-19 sm:w-13 sm:h-20 flex items-center justify-center animate-eve-float">
              <img
                src={eveBurningParkAvatar || '/eve-burning-park.png'}
                alt="EVE Main Assistant"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)] group-hover:drop-shadow-[0_6px_16px_rgba(245,158,11,0.75)] transition-all duration-200"
              />
            </div>

            {/* 3D Contact Shadow under Levitating EVE */}
            <span className="h-1.5 w-10 rounded-full bg-slate-900/20 blur-[1.5px] transition-all duration-200 mt-0.5 group-hover:w-11 group-hover:bg-amber-950/30" />
          </button>
        </div>
      )}

      {/* Interactive EVE AI Chatbot Modal */}
      <EveChatbotModal
        isOpen={chatbotModalOpen}
        onClose={() => setChatbotModalOpen(false)}
        lang={lang}
        stats={stats}
        pendingEmails={emails.filter((e) => e.status === 'pending_approval')}
      />

      {/* Simulate Incoming Proposal Modal */}
      <SimulateModal
        isOpen={simulateModalOpen}
        onClose={() => setSimulateModalOpen(false)}
        onSimulated={(data) => {
          setEmails(data.emails || []);
          if (data.stats) setStats(data.stats);
          if (data.email) {
            setActiveQueueTab(
              data.email.isWasteProposal ? 'all_proposals' : 'filtered_out'
            );
            setOpenedEmailId(data.email.id);
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}

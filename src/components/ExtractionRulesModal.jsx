import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Bot,
  Sparkles,
  Globe,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const PRESET_PROMPTS = [
  {
    id: 'waste_all',
    label: 'All Waste Management & RFQ Proposals (Default)',
    prompt:
      'Extract all waste management proposals, RFQs, commercial quotations, skip hire requests, bin collection inquiries, and environmental contract documentation. Automatically filter out unrelated marketing emails, security alerts, newsletters, and spam.',
  },
  {
    id: 'skips_containers',
    label: 'Skips, RoRo & Industrial Bin Inquiries',
    prompt:
      'Extract all inquiries and proposals specifically regarding skip hire (6 m³, 10 m³, 20 m³ RoRo), 1,100 L municipal bins, industrial compactor placement, and haulage service requests.',
  },
  {
    id: 'hazardous_chemical',
    label: 'Hazardous, Sludge & Chemical Waste Contracts',
    prompt:
      'Extract all inquiries, tenders, and contract documents regarding hazardous waste disposal, industrial chemical sludge, oil interceptor cleaning, sewage tankers, and environmental permits.',
  },
  {
    id: 'government_beah',
    label: 'Government, PDO & Be\'ah Tenders',
    prompt:
      'Extract all official tenders, RFPs, and contract correspondence from Be\'ah, Petroleum Development Oman (PDO), Port of Sohar, Duqm Authority, and municipal environmental tenders.',
  },
];

export default function ExtractionRulesModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  showToast,
  lang = 'en',
}) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [allowedSenders, setAllowedSenders] = useState([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newSenderInput, setNewSenderInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.filterRules) {
      setCustomPrompt(settings.filterRules.customPrompt || '');
      setAllowedDomains(Array.isArray(settings.filterRules.allowedDomains) ? settings.filterRules.allowedDomains : []);
      setAllowedSenders(Array.isArray(settings.filterRules.allowedSenders) ? settings.filterRules.allowedSenders : []);
      setAutoSyncEnabled(settings.filterRules.autoSyncEnabled !== false);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleAddDomain = () => {
    const val = newDomainInput.trim().replace(/^@/, '').toLowerCase();
    if (!val) return;
    if (allowedDomains.includes(val)) {
      showToast('Domain is already added', 'warning');
      return;
    }
    setAllowedDomains([...allowedDomains, val]);
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domainToRemove));
  };

  const handleAddSender = () => {
    const val = newSenderInput.trim().toLowerCase();
    if (!val || !val.includes('@')) {
      showToast('Please enter a valid email address (e.g. procurement@client.com)', 'warning');
      return;
    }
    if (allowedSenders.includes(val)) {
      showToast('Email address is already added', 'warning');
      return;
    }
    setAllowedSenders([...allowedSenders, val]);
    setNewSenderInput('');
  };

  const handleRemoveSender = (senderToRemove) => {
    setAllowedSenders(allowedSenders.filter((s) => s !== senderToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedFilterRules = {
        customPrompt: customPrompt.trim(),
        allowedDomains,
        allowedSenders,
        autoSyncEnabled,
        autoSyncIntervalSeconds: 60,
      };

      await onSaveSettings({ filterRules: updatedFilterRules });
      showToast(
        lang === 'ar'
          ? 'تم حفظ شروط وقواعد استخراج الرسائل بنجاح!'
          : 'Email extraction rules & whitelist saved successfully!',
        'success'
      );
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save extraction rules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#06392A] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-[#06392A]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">
                {isAr ? 'شروط وقواعد استخراج الرسائل من البريد' : 'Email Extraction & AI Filter Rules'}
              </h2>
              <p className="text-xs text-emerald-200">
                {isAr
                  ? 'حدد للذكاء الاصطناعي نوعية الرسائل والعناوين المطلوب جلبها تلقائياً إلى صندوق الوارد'
                  : 'Instruct AI what emails, proposals, domains, and addresses to automatically collect into your inbox'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: AI Extraction Prompt (Paragraph or Bullet points) */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border-2 border-emerald-900/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#065F46]" />
                <span>
                  {isAr
                    ? 'الأمر والتوجيه (Prompt) لاستخراج وتصنيف الرسائل:'
                    : 'AI Extraction Prompt (Specify what kind of emails to collect):'}
                </span>
              </label>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {isAr ? 'تخصيص حر' : 'Custom Prompt'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'اكتب كفقرة أو كنقاط ما هي الرسائل التي تريد من الذكاء الاصطناعي استخراجها من بريدك الإلكتروني (مثل: عروض النفايات، استفسارات الحاويات، عقود الهيئات، وغيرها):'
                : 'Write in natural paragraphs or bullet points what kind of emails you want the AI to extract from your Gmail inbox (e.g. waste management proposals, skip/bin inquiries, contractor RFQs):'}
            </p>

            <textarea
              rows={4}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Extract all waste management proposals, RFQs, and skip inquiries. Ignore all newsletters and unrelated marketing emails..."
              className="w-full p-4 rounded-xl bg-white border border-slate-300 text-sm font-medium text-slate-900 focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46] focus:outline-none"
            />

            {/* Ready Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {isAr ? 'أو اختر قالب جاهز بضغطة واحدة:' : 'Or pick a ready-made extraction prompt preset:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCustomPrompt(preset.prompt)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 text-start text-xs font-bold text-slate-800 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Specific Whitelisted Domains */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Globe className="w-4 h-4 text-[#065F46]" />
              <span>
                {isAr
                  ? 'النطاقات المعتمدة (Domains) للاستخراج التلقائي فوراً:'
                  : 'Whitelisted Domains (Always automatically extract emails from these domains):'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'أي رسالة ترد من هذه النطاقات (مثل beah.om أو pdo.co.om) سيتم جمعها تلقائياً إلى صندوق بريد البرنامج:'
                : 'Any email from these company domains (e.g. beah.om, soharport.om, client.com) will be automatically collected:'}
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute start-3 top-2.5 text-xs font-bold text-slate-400">@</span>
                <input
                  type="text"
                  placeholder="beah.om or client-company.com"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  className="w-full ps-8 pe-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#065F46]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddDomain}
                className="px-4 py-2 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة نطاق' : 'Add Domain'}</span>
              </button>
            </div>

            {/* Domain Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {allowedDomains.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  {isAr ? 'لم تتم إضافة نطاقات بعد.' : 'No whitelisted domains added yet.'}
                </span>
              ) : (
                allowedDomains.map((dom) => (
                  <span
                    key={dom}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-extrabold text-[#06392A]"
                  >
                    <span>@{dom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(dom)}
                      className="p-0.5 hover:bg-emerald-200 rounded text-slate-500 hover:text-rose-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Section 3: Specific Whitelisted Email Addresses */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Mail className="w-4 h-4 text-[#065F46]" />
              <span>
                {isAr
                  ? 'عناوين بريد إلكتروني محددة (Specific Email Addresses) للاستخراج التلقائي:'
                  : 'Specific Sender Email Addresses (Always extract from these exact addresses):'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'أدخل عناوين بريد كاملة لعملاء أو مسؤولين مشتريات محددين ترغب دائماً بجلب رسائلهم:'
                : 'Enter specific client or procurement officer email addresses you always want collected:'}
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="procurement.officer@company.om"
                value={newSenderInput}
                onChange={(e) => setNewSenderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSender();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-[#065F46]"
              />
              <button
                type="button"
                onClick={handleAddSender}
                className="px-4 py-2 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة عنوان' : 'Add Email'}</span>
              </button>
            </div>

            {/* Email Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {allowedSenders.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  {isAr ? 'لم تتم إضافة عناوين مخصصة بعد.' : 'No specific sender emails added yet.'}
                </span>
              ) : (
                allowedSenders.map((snd) => (
                  <span
                    key={snd}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-300 text-xs font-extrabold text-blue-900"
                  >
                    <span>{snd}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSender(snd)}
                      className="p-0.5 hover:bg-blue-200 rounded text-slate-500 hover:text-rose-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Automatic Background Sync Status */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  {isAr ? 'المزامنة التلقائية في الخلفية (Auto-Sync)' : 'Automatic Background Sync'}
                </div>
                <div className="text-xs text-slate-600">
                  {isAr
                    ? 'يقوم البرنامج بفحص بريد Gmail تلقائياً كل 60 ثانية وجلب الرسائل الجديدة دون الحاجة للضغط على أي زر.'
                    : 'The software checks your Gmail inboxes in the background every 60 seconds and auto-collects new matching emails.'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#065F46]"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-sm font-extrabold shadow-md shadow-emerald-900/20 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتطبيق القواعد' : 'Save & Apply Rules')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

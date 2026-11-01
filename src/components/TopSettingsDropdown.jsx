import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  PlayCircle,
  Mail,
  Plus,
  Globe,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export default function TopSettingsDropdown({
  lang = 'en',
  onToggleLang,
  onStartTour,
  onSimulateMail,
  onOpenSystemSettings,
}) {
  const isRtl = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTourClick = () => {
    setIsOpen(false);
    if (onStartTour) onStartTour();
  };

  const handleSimulateClick = () => {
    setIsOpen(false);
    if (onSimulateMail) onSimulateMail();
  };

  const handleSystemSettingsClick = () => {
    setIsOpen(false);
    if (onOpenSystemSettings) onOpenSystemSettings();
  };

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Gmail-Style Quick Settings Gear Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border ${
          isOpen
            ? 'bg-amber-400 text-[#06392A] border-amber-500 shadow-md ring-2 ring-amber-300'
            : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-[#06392A] border-slate-200/90 hover:border-slate-300 shadow-xs'
        }`}
        title={isRtl ? 'الإعدادات السريعة (جولة العرض، محاكاة البريد، اللغة)' : 'Settings (Client Demo Tour, Simulate Mail, Language)'}
        aria-label="Settings Menu"
        aria-expanded={isOpen}
      >
        <Settings
          className={`w-5 h-5 transition-transform duration-300 ${
            isOpen ? 'rotate-90 text-[#06392A]' : 'group-hover:rotate-45'
          }`}
        />
      </button>

      {/* Popover Flyout Menu (Gmail-Style Dropdown) */}
      {isOpen && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="absolute top-12 end-0 z-50 w-[330px] sm:w-[360px] rounded-3xl bg-white shadow-2xl border-2 border-slate-200/95 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Top Decorative Gradient Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-amber-500" />

          {/* Header */}
          <div className="p-4 bg-gradient-to-b from-[#F7F6F2] to-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#06392A] text-amber-300 flex items-center justify-center shadow-xs">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#06392A]">
                  {isRtl ? 'الإعدادات السريعة' : 'Quick Settings'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isRtl ? 'العرض التقديمي، الاختبار واللغة' : 'Presentation, Test & Language'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* 1. Client Demo Tour Mode Button */}
            {onStartTour && (
              <button
                type="button"
                onClick={handleTourClick}
                className="w-full text-start p-3.5 rounded-2xl bg-gradient-to-r from-amber-400/20 via-amber-500/15 to-emerald-500/15 hover:from-amber-400/35 hover:via-amber-500/25 hover:to-emerald-500/25 border-2 border-amber-400/70 transition-all duration-150 group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-[#06392A] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <PlayCircle className="w-5 h-5 fill-[#06392A] text-amber-300" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#06392A]">
                        {isRtl ? 'جولة العرض التقديمي للعملاء' : 'Client Demo Tour'}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-md">
                        <Sparkles className="w-2.5 h-2.5" />
                        {isRtl ? 'شرح صوتي تفاعلي 3D' : 'Interactive 3D Voice'}
                      </span>
                    </div>
                  </div>
                  <ChevronIcon className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed ps-10">
                  {isRtl
                    ? 'جولة تلقائية تفاعلية بصوت المساعد الافتراضي لشرح كافة ميزات المنصة للعملاء.'
                    : 'Walkthrough of every portal feature with hands-free automated voice narration.'}
                </p>
              </button>
            )}

            {/* 2. Simulate Incoming Mail Button */}
            {onSimulateMail && (
              <button
                type="button"
                onClick={handleSimulateClick}
                className="w-full text-start p-3.5 rounded-2xl bg-[#F7F6F2] hover:bg-emerald-50/70 border border-slate-300 hover:border-emerald-500/60 transition-all duration-150 group cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#06392A] text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 group-hover:text-[#06392A] transition-colors">
                        {isRtl ? 'محاكاة بريد وارد جديد' : 'Simulate Incoming Mail'}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                        {isRtl ? 'عروض الأسعار والاستخراج' : 'RFQ & AI Extraction'}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-800 group-hover:rotate-90 transition-transform" />
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed ps-10">
                  {isRtl
                    ? 'إرسال بريد تجريبي لاختبار استخراج تفاصيل العقد والرد الآلي الذكي.'
                    : 'Test AI contract extraction, skip container sizing, and automatic proposal replies.'}
                </p>
              </button>
            )}

            {/* 3. Language Switch Button */}
            {onToggleLang && (
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-slate-900">
                      {isRtl ? 'لغة الواجهة' : 'Display Language'}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-500">
                    {lang === 'en' ? 'English (EN)' : 'العربية (AR)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (lang !== 'en') onToggleLang();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      lang === 'en'
                        ? 'bg-[#06392A] text-amber-300 shadow-sm border border-emerald-800'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>English</span>
                    <span className="text-[10px] opacity-75">(EN)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (lang !== 'ar') onToggleLang();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      lang === 'ar'
                        ? 'bg-[#06392A] text-amber-300 shadow-sm border border-emerald-800'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>العربية</span>
                    <span className="text-[10px] opacity-75">(AR)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Full System Settings (Company Profile, Skip Rates & Gmail Credentials) */}
            {onOpenSystemSettings && (
              <button
                type="button"
                onClick={handleSystemSettingsClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-xs font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>
                    {isRtl
                      ? 'إعدادات المنصة وأسعار الحاويات'
                      : 'All System Settings & Rate Cards'}
                  </span>
                </div>
                <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

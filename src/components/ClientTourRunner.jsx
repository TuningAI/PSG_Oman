import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Sparkles,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { speakTextInChunks } from './VoiceAssistantButton.jsx';

export const TOUR_STEPS = [
  {
    id: 'email_inbox',
    stepNumber: 1,
    titleEn: 'Email Management & Real-Time Ingestion',
    titleAr: 'إدارة واستقبال البريد الإلكتروني المباشر',
    targetId: 'tour-inbox-container',
    narrationEn:
      "Welcome to the PGS Oman Executive Virtual Management Portal. Here in the Email Management Inbox, the platform connects directly to our operational Gmail accounts. When clients submit RFQ inquiries for skip containers or recycling contracts across Ghala, Sohar, and Muscat, incoming proposals are automatically categorized and ingested in real time.",
    narrationAr:
      "مرحباً بكم في منصة بي جي إس عُمان لإدارة العمليات والحلول البيئية. هنا في صندوق البريد، تتصل المنصة مباشرة بحسابات البريد الرسمية. وحينما يرسل العملاء طلبات عروض أسعار للحاويات أو عقود التدوير في غلا وصحار ومسقط، يتم تصنيف واستقبال الطلبات فورياً.",
    prepare: (app) => {
      app.setActiveMainModule('email_assistant');
      app.setOpenedEmailId(null);
      app.setExtractionRulesModalOpen(false);
    },
  },
  {
    id: 'proposal_summary',
    stepNumber: 2,
    titleEn: 'AI Proposal Summaries & Contract Extraction',
    titleAr: 'ملخصات الذكاء الاصطناعي واستخراج بنود العقد',
    targetId: 'tour-ai-summary-box',
    narrationEn:
      "Inside each proposal, our AI automatically extracts critical operational data: contract value, site location, waste streams, and container volume. Managers get an instant executive summary without reading through multi-page email threads.",
    narrationAr:
      "داخل كل عرض، يقوم الذكاء الاصطناعي باستخراج البيانات التشغيلية بدقة: قيمة العقد التقديرية، وموقع المشروع، ونوع النفايات، وسعة الحاويات، مما يمنح الإدارة ملخصاً تنفيذياً فورياً.",
    prepare: (app) => {
      app.setActiveMainModule('email_assistant');
      app.setOpenedEmailId('msg-demo-101');
      app.setExtractionRulesModalOpen(false);
    },
  },
  {
    id: 'voice_assistant',
    stepNumber: 3,
    titleEn: 'EVE 3D Voice Assistant (Hands-Free Reading)',
    titleAr: 'المساعد الصوتي ثلاثي الأبعاد إيف للقراءة الصوتية',
    targetId: 'tour-voice-assistant-summary',
    narrationEn:
      "For managers on the move, our 3D Voice Assistants are built into every component. With a single click, the assistant reads client emails, summaries, or drafted replies aloud in both English and Arabic.",
    narrationAr:
      "للمدراء أثناء التنقل، تتوفر المساعدات الصوتية ثلاثية الأبعاد في كل قسم لقراءة رسائل العملاء، والملخصات، والردود المقترحة بصوت واضح باللغتين العربية والإنجليزية.",
    prepare: (app) => {
      app.setActiveMainModule('email_assistant');
      app.setOpenedEmailId('msg-demo-101');
      app.setExtractionRulesModalOpen(false);
    },
  },
  {
    id: 'filter_rules',
    stepNumber: 4,
    titleEn: 'AI Mail Filter Rules & Domain Whitelist',
    titleAr: 'قواعد فرز البريد بالذكاء الاصطناعي وقائمة النطاقات',
    targetId: 'tour-filter-rules-modal',
    narrationEn:
      "With our AI Mail Filter Rules, executives can customize AI extraction prompts and whitelist company domains. Irrelevant emails are filtered out automatically, ensuring only qualified waste management proposals reach your team.",
    narrationAr:
      "من خلال قواعد فرز البريد بالذكاء الاصطناعي، يمكن للإدارة تخصيص تعليمات الفرز وقائمة النطاقات المعتمدة، لفرز الرسائل غير المتعلقة واستبعادها تلقائياً.",
    prepare: (app) => {
      app.setActiveMainModule('email_assistant');
      app.setExtractionRulesModalOpen(true);
    },
  },
  {
    id: 'social_studio',
    stepNumber: 5,
    titleEn: 'Social Media AI Studio & Voice Prompts',
    titleAr: 'ستوديو وسائل التواصل الاجتماعي والإدخال الصوتي',
    targetId: 'tour-social-studio-container',
    narrationEn:
      "Finally, the Social Media AI Studio generates 1080 by 1080 high-definition branded graphics for LinkedIn and Instagram, complete with certified Be'ah fleet stamps. Managers can type prompts or use hands-free voice input to create marketing copy and visuals in seconds.",
    narrationAr:
      "وأخيراً، يقوم ستوديو وسائل التواصل الاجتماعي بتوليد تصاميم احترافية بدقة 1080 في 1080 مع نصوص تسويقية مخصصة للينكدإن وإنستغرام، مع دعم الإدخال الصوتي لكتابة الأفكار دون لمس لوحة المفاتيح.",
    prepare: (app) => {
      app.setExtractionRulesModalOpen(false);
      app.setActiveMainModule('social_assistant');
    },
  },
  {
    id: 'conclusion',
    stepNumber: 6,
    titleEn: 'Presentation Complete • Operations Ready',
    titleAr: 'اكتمل العرض التقديمي • جاهز للعمليات',
    targetId: null,
    narrationEn:
      "This concludes the executive demonstration of the PGS Oman Virtual Assistant Dashboard. All systems are operational and ready for your team.",
    narrationAr:
      "بهذا يكتمل العرض التنفيذي لمنصة بي جي إس عُمان. جميع الأنظمة التشغيلية والذكية جاهزة لخدمتكم وخدمة عملائكم.",
    prepare: (app) => {
      app.setActiveMainModule('email_assistant');
      app.setOpenedEmailId(null);
      app.setExtractionRulesModalOpen(false);
    },
  },
];

export default function ClientTourRunner({
  isActive,
  onClose,
  lang = 'en',
  appControls,
}) {
  const isRtl = lang === 'ar';
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [targetRect, setTargetRect] = useState(null);

  const cancelSpeechRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Clear timers & speech on unmount
  useEffect(() => {
    return () => {
      if (cancelSpeechRef.current) cancelSpeechRef.current();
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  // Update target bounding rect when step changes or window resizes
  useEffect(() => {
    if (!isActive || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updateRect, 350);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, currentStepIndex, currentStep?.targetId]);

  // Execute Step Preparation & Speech Narration
  useEffect(() => {
    if (!isActive) {
      if (cancelSpeechRef.current) cancelSpeechRef.current();
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      setIsSpeaking(false);
      return;
    }

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (cancelSpeechRef.current) {
      cancelSpeechRef.current();
      cancelSpeechRef.current = null;
    }

    // Run prepare action for the step (navigates screen / opens modal)
    if (currentStep?.prepare && appControls) {
      currentStep.prepare(appControls);
    }

    if (isPaused) return;

    // Small delay to allow the DOM to mount before speaking
    const startDelay = setTimeout(() => {
      const narrationText = isRtl ? currentStep.narrationAr : currentStep.narrationEn;
      cancelSpeechRef.current = speakTextInChunks(
        narrationText,
        lang,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          // Auto advance to next step after brief pause
          if (currentStepIndex < totalSteps - 1) {
            autoAdvanceTimerRef.current = setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
            }, 1400);
          }
        }
      );
    }, 450);

    return () => clearTimeout(startDelay);
  }, [isActive, currentStepIndex, isPaused, lang, isRtl]);

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setIsPaused(true);
      if (cancelSpeechRef.current) {
        cancelSpeechRef.current();
        cancelSpeechRef.current = null;
      }
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      setIsSpeaking(false);
    }
  };

  if (!isActive) return null;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 pointer-events-none select-none font-sans"
    >
      {/* Visual Target Highlight Spotlight Box */}
      {targetRect && (
        <div
          style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
          className="fixed rounded-2xl border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.65)] ring-4 ring-amber-400/30 transition-all duration-300 pointer-events-none animate-pulse"
        />
      )}

      {/* Floating Executive Tour Controller & Subtitles HUD (Anchored bottom center) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl pointer-events-auto">
        <div className="relative rounded-3xl bg-[#06392A]/95 backdrop-blur-2xl border-2 border-amber-400/70 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden text-white transition-all">
          {/* Top Golden Progress Bar */}
          <div className="w-full bg-emerald-950/80 h-1.5">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500"
            />
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-3">
            {/* Header: Step Number, Title, Sound Wave & Exit */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-[#06392A] text-xs font-black shadow-sm shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isRtl ? `خطوة ${currentStep.stepNumber} من ${totalSteps}` : `Step ${currentStep.stepNumber} of ${totalSteps}`}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight">
                  {isRtl ? currentStep.titleAr : currentStep.titleEn}
                </h3>
              </div>

              {/* Controls: Audio Wave + Exit Button */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Audio Wave Visualizer */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-amber-300 text-xs font-bold">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-semibold">
                    {isSpeaking ? (isRtl ? 'جاري التحدث' : 'Narrating') : isPaused ? (isRtl ? 'متوقف' : 'Paused') : (isRtl ? 'استماع' : 'Voice')}
                  </span>
                  {isSpeaking && (
                    <div className="flex items-center gap-0.5 ms-1">
                      <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" />
                      <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white/80 hover:text-rose-200 border border-white/20 hover:border-rose-400 transition cursor-pointer"
                  title={isRtl ? 'إنهاء جولة العرض' : 'Exit Tour'}
                  aria-label="Exit Tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subtitle Narration Text Box (Live Spoken Transcript) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-600/40 text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
              <span className="text-amber-300 font-bold me-1.5">
                {isRtl ? 'الشرح الصوتي:' : 'Narration:'}
              </span>
              <span>{isRtl ? currentStep.narrationAr : currentStep.narrationEn}</span>
            </div>

            {/* Bottom Actions: Previous, Play/Pause, Next */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 disabled:opacity-40 transition cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>{isRtl ? 'السابق' : 'Previous'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-amber-300 border border-amber-400/40 text-xs font-extrabold shadow-sm transition cursor-pointer"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{isRtl ? 'استئناف' : 'Resume Voice'}</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-amber-300" />
                      <span>{isRtl ? 'إيقاف مؤقت' : 'Pause'}</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#06392A] text-xs font-black shadow-md transition cursor-pointer"
              >
                <span>
                  {currentStepIndex === totalSteps - 1
                    ? (isRtl ? 'إنهاء العرض' : 'Finish Tour')
                    : (isRtl ? 'التالي' : 'Next Step')}
                </span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

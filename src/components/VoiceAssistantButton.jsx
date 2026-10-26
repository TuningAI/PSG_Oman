import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import eveRobotAvatar from '../assets/eve-burning-park.png';

/**
 * Helper to split text into sentence chunks and speak them continuously
 * to avoid browser SpeechSynthesis 15s timeout quirks.
 */
function speakTextInChunks(text, lang, onStart, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    alert('Voice speech synthesis is not supported in this browser.');
    return () => {};
  }

  window.speechSynthesis.cancel();
  if (!text || !text.trim()) return () => {};

  const cleanText = text
    .replace(/[•\-\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const isArabic = /[\u0600-\u06FF]/.test(cleanText) || lang === 'ar';
  const targetLang = isArabic ? 'ar-SA' : 'en-US';

  // Chunk by punctuation or line breaks
  const rawChunks = cleanText
    .replace(/([.?!;:\n]+)/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  let currentIdx = 0;
  let isCancelled = false;

  if (onStart) onStart();

  const speakNext = () => {
    if (isCancelled) return;
    if (currentIdx >= rawChunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunk = rawChunks[currentIdx++];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = targetLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      if (!isCancelled) speakNext();
    };
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && !isCancelled) {
        speakNext();
      } else if (onEnd) {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();

  return () => {
    isCancelled = true;
    window.speechSynthesis.cancel();
    if (onEnd) onEnd();
  };
}

/**
 * EVE (WALL-E) 3D Voice Assistant Button
 * Displays EVE with levitating float animation, glowing electric blue eyes,
 * speech state indicator, and audio wave equalizer.
 */
export default function VoiceAssistantButton({
  boxId,
  text = '',
  activeSpeakingBoxId,
  onToggleSpeak,
  lang = 'en',
  className = '',
  title = '',
}) {
  const isSpeaking = activeSpeakingBoxId === boxId;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onToggleSpeak) {
      onToggleSpeak(boxId, text);
    }
  };

  const tooltipLabel = isSpeaking
    ? lang === 'ar'
      ? 'إيقاف المساعد إيف (انقر للإيقاف)'
      : 'Stop EVE Assistant (Click to pause)'
    : lang === 'ar'
    ? 'المساعد الصوتي إيف (EVE) • قراءة النص'
    : 'EVE Voice Assistant • Read text aloud';

  // Use bundled asset with public fallback
  const robotSrc = eveRobotAvatar || '/eve-burning-park.png';

  return (
    <div
      className={`inline-flex items-center gap-2 select-none z-20 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tooltip / Status Bubble (Shows on hover or while speaking) */}
      <div
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-[11px] font-bold shadow-xl border border-sky-400/40 backdrop-blur-sm pointer-events-none transition-all duration-200 ${
          isSpeaking
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 group-hover:opacity-100'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isSpeaking ? 'bg-sky-400 animate-ping' : 'bg-sky-400'
          }`}
        />
        <span>
          {isSpeaking
            ? lang === 'ar'
              ? 'إيف (EVE) تقرأ النص الآن...'
              : 'EVE is reading text aloud...'
            : title || tooltipLabel}
        </span>
      </div>

      {/* EVE 3D Assistant Avatar Button with Levitating Hover Animation */}
      <button
        type="button"
        onClick={handleClick}
        title={tooltipLabel}
        aria-label={tooltipLabel}
        className={`relative group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none ${
          isSpeaking
            ? 'scale-115'
            : 'hover:scale-115 active:scale-95'
        }`}
      >
        {/* Futuristic Glowing Ambient Aura around EVE */}
        <span
          className={`absolute -inset-2.5 rounded-full blur-md transition-all duration-300 pointer-events-none ${
            isSpeaking
              ? 'bg-sky-400/45 animate-pulse'
              : 'bg-sky-400/15 group-hover:bg-sky-400/35'
          }`}
        />

        {/* Dynamic Pulse Ring when speaking */}
        {isSpeaking && (
          <span className="absolute -inset-1.5 rounded-full border-2 border-sky-400/70 animate-ping pointer-events-none" />
        )}

        {/* EVE Character Body with Float Animation (Delicate Component-Specific Size) */}
        <div className="relative w-7 h-11 sm:w-8 sm:h-12 flex items-center justify-center animate-eve-float">
          <img
            src={robotSrc}
            alt="EVE Voice Assistant"
            className={`w-full h-full object-contain filter transition-all duration-200 ${
              isSpeaking
                ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.95)] brightness-105'
                : 'drop-shadow-[0_4px_8px_rgba(14,165,233,0.4)] group-hover:drop-shadow-[0_6px_12px_rgba(56,189,248,0.65)]'
            }`}
          />

          {/* Audio Equalizer Soundwave Badge when active */}
          {isSpeaking ? (
            <span className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded-full bg-slate-900/95 border border-sky-400 shadow-md flex items-center gap-0.5">
              <span className="w-0.5 bg-sky-300 rounded-full animate-soundwave-1" />
              <span className="w-0.5 bg-white rounded-full animate-soundwave-2" />
              <span className="w-0.5 bg-amber-300 rounded-full animate-soundwave-3" />
            </span>
          ) : (
            /* Idle glowing electric blue indicator */
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-400 border border-white shadow-sm group-hover:animate-ping" />
          )}
        </div>

        {/* 3D Contact Shadow under Levitating EVE */}
        <span
          className={`h-1 rounded-full bg-slate-900/25 blur-[1px] transition-all duration-200 mt-0.5 ${
            isSpeaking
              ? 'w-6 bg-sky-900/40 scale-110'
              : 'w-5 group-hover:w-6 group-hover:bg-slate-900/40'
          }`}
        />
      </button>
    </div>
  );
}

export { speakTextInChunks };

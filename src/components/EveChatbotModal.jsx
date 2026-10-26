import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Loader2, Bot, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';
import eveRobotAvatar from '../assets/eve-burning-park.png';

const QUICK_PROMPTS = [
  {
    en: '📊 How many proposals are pending approval?',
    ar: '📊 كم عدد العروض بانتظار الاعتماد؟',
  },
  {
    en: '🚛 What are our skip & RoRo container sizes?',
    ar: '🚛 ما هي سعات حاويات السكيب وRoRo؟',
  },
  {
    en: '📜 What is our Be’ah & ISO 14001 compliance?',
    ar: '📜 ما هي تراخيص شركة بيئة وISO 14001؟',
  },
  {
    en: '💰 Typical pricing for Muscat industrial sites?',
    ar: '💰 متوسط الأسعار للمناطق الصناعية بمسقط؟',
  },
];

export default function EveChatbotModal({
  isOpen,
  onClose,
  lang = 'en',
  stats,
  pendingEmails = [],
}) {
  const isAr = lang === 'ar';
  const initialGreeting = isAr
    ? 'مرحباً بك! أنا إيف (EVE)، مساعدتك الذكية في شركة PGS عمان. كيف يمكنني مساعدتك؟'
    : 'How can I assist you?';

  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'eve',
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang }),
      });
      const data = await res.json();

      const botReply = {
        id: `eve-${Date.now()}`,
        sender: 'eve',
        text:
          data.reply ||
          (isAr
            ? 'أنا هنا لمساعدتك في عمليات إدارة النفايات، وعروض الأسعار والأسطول.'
            : 'I am here to assist with proposal approvals, waste collection fleet, and operations.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      // Local contextual fallback if network fails
      let fallbackText = '';
      const lower = text.toLowerCase();
      if (lower.includes('proposal') || lower.includes('pending') || lower.includes('طلب') || lower.includes('عروض')) {
        fallbackText = isAr
          ? `لديك حالياً ${stats?.pendingApprovalCount || 3} طلبات عروض أسعار بانتظار الاعتماد. يمكنك مراجعتها والرد عليها من تبويب إدارة البريد.`
          : `You currently have ${stats?.pendingApprovalCount || 3} proposals waiting for manager review. You can review and respond directly in Email Management.`;
      } else if (lower.includes('fleet') || lower.includes('truck') || lower.includes('skip') || lower.includes('حاوي') || lower.includes('اسطول')) {
        fallbackText = isAr
          ? 'يوفر أسطول PGS عمان حاويات RoRo سعة 30 م³ وحاويات سكيب سعة 7 م³ وصهاريج صرف صحي مع استبدال مضمون خلال 24 ساعة.'
          : 'PGS Oman operates 30 CBM RoRo containers, 7 CBM skip chain-lift trucks, and sewage tankers with a 24-hour swap SLA across Oman.';
      } else {
        fallbackText = isAr
          ? 'أنا متصلة وجاهزة للإجابة عن أي استفسار بشأن عروض الأسعار والأسطول وتراخيص بيئة.'
          : 'I am ready to assist with any questions regarding client RFPs, fleet logistics, and Be\'ah compliance.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `eve-${Date.now()}`,
          sender: 'eve',
          text: fallbackText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'eve',
        text: initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed bottom-24 end-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[530px] max-h-[calc(100vh-7rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-[#06392A] via-[#065F46] to-[#094D39] text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-10 flex items-center justify-center shrink-0">
            <img
              src={eveRobotAvatar || '/eve-burning-park.png'}
              alt="EVE AI Assistant"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(56,189,248,0.8)]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold flex items-center gap-1.5">
              <span>EVE Assistant</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/25 text-amber-300 text-[10px] font-bold">AI</span>
            </h3>
            <p className="text-[11px] text-emerald-200 truncate">
              {isAr ? 'مساعدتك الذكية للعمليات وعروض الأسعار' : 'PGS Oman Virtual Operations'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
            title={isAr ? 'بدء محادثة جديدة' : 'Restart chat'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
            title={isAr ? 'إغلاق المحادثة' : 'Close chat'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF9F6]">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-9 shrink-0 flex items-center justify-center">
                  <img
                    src={eveRobotAvatar || '/eve-burning-park.png'}
                    alt="EVE"
                    className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(56,189,248,0.6)]"
                  />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-[#065F46] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <span
                  className={`block text-[10px] mt-1 ${
                    isUser ? 'text-emerald-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 ps-9">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>{isAr ? 'إيف تفكر في الإجابة...' : 'EVE is thinking...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3.5 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(isAr ? p.ar : p.en)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-900 border border-slate-200 text-slate-700 font-semibold whitespace-nowrap shrink-0 transition"
            >
              {isAr ? p.ar : p.en}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isAr ? 'اسأل إيف أي شيء عن العمليات أو العروض...' : 'Ask EVE anything...'}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:border-[#065F46] focus:bg-white outline-none transition"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="p-2.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white disabled:opacity-40 transition shadow-sm shrink-0"
          title={isAr ? 'إرسال' : 'Send message'}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

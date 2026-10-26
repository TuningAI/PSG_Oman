import React, { useState } from 'react';
import {
  Recycle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  Check,
} from 'lucide-react';

export default function LoginPage({ onLogin, lang = 'en', onToggleLang }) {
  const isRtl = lang === 'ar';
  const [email, setEmail] = useState('ahmed.alkindi@pgsoman.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotTip, setShowForgotTip] = useState(false);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    // Smooth high-tech transition simulation
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        email: email || 'ahmed.alkindi@pgsoman.com',
        name: isRtl ? 'أحمد الكندي' : 'Ahmed Al Kindi',
        role: isRtl ? 'المدير العام · بي جي إس عُمان' : 'General Manager · PGS Oman',
      });
    }, 450);
  };

  const handleQuickDemoLogin = () => {
    setEmail('ahmed.alkindi@pgsoman.com');
    setPassword('pgs-oman-secure-2026');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin({
        email: 'ahmed.alkindi@pgsoman.com',
        name: isRtl ? 'أحمد الكندي' : 'Ahmed Al Kindi',
        role: isRtl ? 'المدير العام · بي جي إس عُمان' : 'General Manager · PGS Oman',
      });
    }, 350);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#031d15] text-slate-100 selection:bg-amber-400 selection:text-[#06392A]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.18) 0%, transparent 60%),
          radial-gradient(circle at 10% 90%, rgba(245, 158, 11, 0.14) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(4, 120, 87, 0.22) 0%, transparent 55%),
          linear-gradient(180deg, #021a13 0%, #06392A 45%, #02140e 100%)
        `,
      }}
    >
      {/* Decorative Subtle Grid / Islamic Geometric Motif Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#F59E0B 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Floating Ambient Glowing Orbs */}
      <div className="pointer-events-none absolute top-12 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute bottom-16 right-1/4 w-[28rem] h-[28rem] bg-emerald-500/15 rounded-full blur-3xl" />

      {/* Top Bar with Language Switcher & Security Badge */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* PGS Oman Minimalist Logo Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-700 p-[2px] shadow-lg shadow-amber-400/20">
            <div className="w-full h-full bg-[#06392A] rounded-[14px] flex items-center justify-center">
              <Recycle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#021a13]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white">PGS OMAN</span>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {isRtl ? 'عُمان' : 'Sultanate of Oman'}
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 font-medium hidden sm:block">
              {isRtl ? 'إدارة النفايات والحلول البيئية' : 'Petrogas & Waste Environmental Solutions'}
            </p>
          </div>
        </div>

        {/* Top Right Controls: Language Switcher & Security Ping */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isRtl ? 'بوابة تنفيذية آمنة' : 'Executive Secure Gateway'}</span>
          </div>

          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-amber-400/40 text-xs font-bold transition shadow-sm backdrop-blur-md cursor-pointer"
            title={isRtl ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRtl ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Centered Elegant Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[460px]">
          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#06392A]/85 backdrop-blur-2xl border-2 border-emerald-500/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-7 sm:p-9 transition-all">
            {/* Top Golden Crown Highlight Bar */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)]" />

            {/* Header / Avatar */}
            <div className="text-center space-y-2 mb-7">
              <div className="inline-flex items-center justify-center relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-emerald-400 p-[2px] shadow-xl shadow-amber-500/25">
                  <div className="w-full h-full bg-[#042d21] rounded-[14px] flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-[#06392A] flex items-center justify-center text-[10px] font-black shadow-md">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isRtl ? 'تسجيل الدخول للنظام' : 'Executive Sign In'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium">
                {isRtl
                  ? 'منصة إدارة عروض النفايات ومساعد الذكاء الاصطناعي'
                  : 'AI Operations & Waste Management Proposal Portal'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300/90">
                  {isRtl ? 'البريد الإلكتروني / اسم المستخدم' : 'Email Address / Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-emerald-400/80" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@pgsoman.com"
                    className="w-full ps-10 pe-4 py-3 rounded-xl bg-[#032219]/90 border border-emerald-600/50 focus:border-amber-400 text-white placeholder-emerald-300/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition shadow-inner"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-300/90">
                    {isRtl ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotTip(!showForgotTip)}
                    className="text-xs font-bold text-amber-400/90 hover:text-amber-300 transition underline underline-offset-2 cursor-pointer"
                  >
                    {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-emerald-400/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full ps-10 pe-11 py-3 rounded-xl bg-[#032219]/90 border border-emerald-600/50 focus:border-amber-400 text-white placeholder-emerald-300/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition shadow-inner tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-emerald-400 hover:text-amber-400 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password helper alert tip */}
              {showForgotTip && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-200 space-y-1 animate-fadeIn">
                  <p className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isRtl ? 'ملاحظة تسجيل الدخول السريع:' : 'One-Click Access Note:'}
                  </p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isRtl
                      ? 'يمكنك تسجيل الدخول مباشرة بالضغط على زر "تسجيل الدخول"، حيث أن قاعدة البيانات لم تُربط بعد. سيتم توليد اسم المستخدم وكلمة المرور لاحقاً.'
                      : 'You can sign in right away by clicking the Login button directly without requiring pre-registered credentials. Database user authentication will be connected later.'}
                  </p>
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-emerald-600 text-amber-500 focus:ring-amber-400 focus:ring-offset-[#06392A] accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-emerald-100">
                    {isRtl ? 'تذكر بياناتي في هذا المتصفح' : 'Keep me signed in'}
                  </span>
                </label>
              </div>

              {/* Main Submit Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 relative group overflow-hidden flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#06392A] font-extrabold text-sm sm:text-base shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#06392A]" />
                    <span>{isRtl ? 'جاري التحقق والفتح...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRtl ? 'تسجيل الدخول إلى النظام' : 'Sign In to Dashboard'}</span>
                    {isRtl ? (
                      <ArrowLeft className="w-5 h-5 text-[#06392A] group-hover:-translate-x-1 transition-transform" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-[#06392A] group-hover:translate-x-1 transition-transform" />
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Persona Instant Login Pill */}
            <div className="mt-6 pt-5 border-t border-emerald-500/25">
              <div className="flex items-center justify-between text-xs text-emerald-300/70 mb-2.5">
                <span className="font-semibold">{isRtl ? 'دخول تجريبي سريع:' : 'Quick Demo Access:'}</span>
                <span className="text-[11px] text-amber-400/90 font-bold">{isRtl ? 'ضغطة واحدة' : '1-Click'}</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-left hover:border-amber-400/60 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#06392A] font-extrabold text-xs flex items-center justify-center shadow-sm">
                    AK
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                      {isRtl ? 'أحمد الكندي (المدير العام)' : 'Ahmed Al Kindi (General Manager)'}
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      ahmed.alkindi@pgsoman.com
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-[#06392A] transition">
                  {isRtl ? 'دخول مباشر' : 'Quick Enter'}
                </div>
              </button>
            </div>
          </div>

          {/* Under-Card Trust Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-emerald-300/75">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? 'معتمد من بيئة (Be\'ah)' : 'Be\'ah Environmental Certified'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>ISO 14001:2015</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? 'سلطنة عُمان' : 'Sultanate of Oman'}</span>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-300/60 border-t border-emerald-800/40">
        <div>
          © 2026 PGS Oman (Petrogas & Waste Management Solutions).{' '}
          {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Muscat HQ · Ghala & Sohar Hubs</span>
          <span>•</span>
          <span className="text-amber-400/80 font-bold">PGS AI Assistant v2.4</span>
        </div>
      </footer>
    </div>
  );
}

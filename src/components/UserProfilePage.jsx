import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  MapPin,
  Briefcase,
  Camera,
  Edit3,
  Check,
  X,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Upload,
} from 'lucide-react';
import TopSettingsDropdown from './TopSettingsDropdown.jsx';
import UserAccountDropdown from './UserAccountDropdown.jsx';

export default function UserProfilePage({
  currentUser,
  settings,
  syncedGmailAccounts = [],
  syncingGmail = false,
  onSyncGmail,
  onSaveProfile,
  onDeleteGmailAccount,
  onOpenGmailSettings,
  onLogout,
  onBack,
  lang = 'en',
  onToggleLang,
  onStartTour,
  onSimulateMail,
  onOpenSystemSettings,
  showToast,
}) {
  const isRtl = lang === 'ar';
  const managerProfile = settings?.companyProfile || {};

  const currentName = currentUser?.name || managerProfile.managerName || 'Ahmed Al Kindi';
  const currentRole = currentUser?.role || managerProfile.managerTitle || 'General Manager · PGS Oman';
  const currentEmail = currentUser?.email || managerProfile.email || 'ahmed.alkindi@pgsoman.com';
  const currentCompany = managerProfile.companyName || 'PGS Oman — Environmental Services';
  const currentLocation = managerProfile.location || 'Muscat, Sultanate of Oman';
  const currentPhone = managerProfile.phone || '+968 2459 8200';
  const currentPic = managerProfile.profilePic || currentUser?.profilePic || null;
  const currentInitials =
    currentUser?.initials ||
    managerProfile.managerInitials ||
    (currentName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AK');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentName);
  const [editRole, setEditRole] = useState(currentRole);
  const [editPic, setEditPic] = useState(currentPic);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setEditName(currentName);
    setEditRole(currentRole);
    setEditPic(currentPic);
  }, [currentName, currentRole, currentPic]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Please select a valid image file', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditPic(event.target.result);
      setIsEditing(true);
      if (showToast) showToast('Profile photo selected. Click Save Changes to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      if (showToast) showToast('Full name cannot be empty', 'warning');
      return;
    }
    setSaving(true);
    try {
      const words = editName.trim().split(/\s+/);
      const newInitials =
        words.length >= 2
          ? (words[0][0] + words[1][0]).toUpperCase()
          : editName.slice(0, 2).toUpperCase();

      if (onSaveProfile) {
        await onSaveProfile({
          managerName: editName.trim(),
          managerTitle: editRole.trim(),
          managerInitials: newInitials,
          profilePic: editPic,
        });
      }
      setIsEditing(false);
      if (showToast) {
        showToast(
          isRtl ? 'تم تحديث بيانات المستخدم بنجاح!' : 'User details updated successfully!',
          'success'
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-full bg-[#F7F6F2] text-slate-900 flex flex-col"
    >
      {/* Top Workspace Header */}
      <header className="bg-white border-b border-slate-200/90 px-8 h-[68px] flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3 text-sm">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isRtl ? 'رجوع' : 'Back'}</span>
            </button>
          )}
          <span className="text-slate-400 font-medium">
            {isRtl ? 'مساحة العمل' : 'Workspace'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-extrabold text-slate-900">
            {isRtl ? 'بيانات المستخدم المسجل' : 'Logged-in User Details'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TopSettingsDropdown
            lang={lang}
            onToggleLang={onToggleLang}
            onStartTour={onStartTour}
            onSimulateMail={onSimulateMail}
            onOpenSystemSettings={onOpenSystemSettings}
          />
          <UserAccountDropdown
            currentUser={currentUser}
            settings={settings}
            syncedGmailAccounts={syncedGmailAccounts}
            syncingGmail={syncingGmail}
            onSyncGmail={onSyncGmail}
            onSaveProfile={onSaveProfile}
            onDeleteGmailAccount={onDeleteGmailAccount}
            onOpenGmailSettings={onOpenGmailSettings}
            onLogout={onLogout}
            lang={lang}
            showToast={showToast}
          />
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-5xl w-full mx-auto px-8 py-8 space-y-6 flex-1">
        {/* Executive Profile Hero Card */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#06392A] via-[#094D39] to-[#0D6E52] relative px-8 flex items-end">
            <div className="absolute top-4 end-6 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isRtl ? 'متصل الآن' : 'Active Session'}
              </span>
            </div>
          </div>

          <div className="px-8 pb-7 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12">
              {/* Avatar + Photo Upload */}
              <div className="relative inline-block shrink-0">
                <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white shadow-xl bg-[#06392A] flex items-center justify-center text-amber-400 text-3xl font-black">
                  {(isEditing ? editPic : currentPic) ? (
                    <img
                      src={isEditing ? editPic : currentPic}
                      alt={currentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{currentInitials}</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={isRtl ? 'تغيير الصورة الشخصية' : 'Change Profile Photo'}
                  className="absolute -bottom-1 -right-1 p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#06392A] shadow-md ring-2 ring-white transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 sm:pb-1 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {currentName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold">
                    {isRtl ? 'حساب تنفيذي معتمد' : 'Executive Account'}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#065F46]">{currentRole}</p>
                <p className="text-xs font-mono text-slate-500">{currentEmail}</p>
              </div>
            </div>

            {/* Right Action Buttons: Edit Profile & Log Out */}
            <div className="flex items-center gap-3 flex-wrap">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-extrabold transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  <span>{isRtl ? 'تعديل البيانات' : 'Edit User Details'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-950/15 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Complete User Details */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#065F46]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {isRtl ? 'البيانات الشخصية والوظيفية' : 'Personal & Executive Details'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isRtl
                      ? 'تفاصيل الحساب المستخدمة في العروض الرسمية والمراسلات'
                      : 'Profile details used across official proposals, PDFs, and email signatures'}
                  </p>
                </div>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    {isRtl ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#065F46] focus:ring-2 focus:ring-[#065F46]/20 text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    {isRtl ? 'المسمى الوظيفي / الدور' : 'Job Title / Executive Role'}
                  </label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#065F46] focus:ring-2 focus:ring-[#065F46]/20 text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رفع صورة جديدة' : 'Upload New Photo'}</span>
                  </button>
                  {editPic && (
                    <button
                      type="button"
                      onClick={() => setEditPic(null)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
                    >
                      {isRtl ? 'إزالة الصورة' : 'Remove Photo'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{isRtl ? 'حفظ التغييرات' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(currentName);
                      setEditRole(currentRole);
                      setEditPic(currentPic);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'الاسم الكامل' : 'Full Name'}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1">
                    {currentName}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'المسمى الوظيفي' : 'Role / Title'}
                  </div>
                  <div className="text-sm font-extrabold text-[#065F46] mt-1">
                    {currentRole}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-800 mt-1 truncate">
                    {currentEmail}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'الشركة / المؤسسة' : 'Organization'}
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{currentCompany}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'الموقع' : 'Headquarters'}
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{currentLocation}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F7F6F2] border border-slate-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isRtl ? 'القسم والصلاحيات' : 'Department & Clearance'}
                  </div>
                  <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Executive & Commercial Operations</span>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace Permissions Summary */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="text-xs font-extrabold text-[#06392A] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isRtl ? 'صلاحيات الحساب المفعلة' : 'Active Workspace Permissions'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Proposal Inbox & Approval',
                  'Official PDF & Tender Builder',
                  'Social Media Campaign Studio',
                  'Company & AI Rules Configuration',
                ].map((perm) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-[#065F46]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Connected Gmail Accounts & Session Logout Card */}
          <div className="lg:col-span-5 space-y-6">
            {/* Connected Gmail Accounts Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isRtl ? 'حسابات البريد المتصلة' : 'Connected Gmail Accounts'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {syncedGmailAccounts.length}{' '}
                      {isRtl ? 'حساب متصل' : 'inbox account(s) synced'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSyncGmail}
                  disabled={syncingGmail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGmail ? 'animate-spin' : ''}`} />
                  <span>{syncingGmail ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {syncedGmailAccounts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span>{isRtl ? 'لا يوجد حساب متصل حالياً' : 'No Gmail inbox connected yet'}</span>
                  <button
                    type="button"
                    onClick={() => onOpenGmailSettings && onOpenGmailSettings(null)}
                    className="px-3 py-1.5 rounded-lg bg-[#065F46] text-white font-extrabold text-xs cursor-pointer"
                  >
                    + Connect
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {syncedGmailAccounts.map((acc) => (
                    <div
                      key={acc.id || acc.email}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#F7F6F2] border border-slate-200/90"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-800 truncate">
                          {acc.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenGmailSettings && onOpenGmailSettings(acc.email)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 text-[#065F46] text-[11px] font-bold transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGmailAccount && onDeleteGmailAccount(acc.email)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => onOpenGmailSettings && onOpenGmailSettings(null)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-emerald-400 hover:bg-emerald-50 text-[#065F46] text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? '+ إضافة حساب Gmail آخر' : '+ Add Another Gmail Account'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Session & Sign Out Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isRtl ? 'أمان الجلسة وتسجيل الخروج' : 'Session Security & Sign Out'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRtl
                      ? 'بوابة PGS Oman التنفيذية الآمنة'
                      : 'Authenticated into PGS Oman Executive Portal'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F6F2] border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isRtl ? 'حالة الجلسة' : 'Session Status'}</span>
                </span>
                <span className="font-extrabold text-emerald-700">
                  {isRtl ? 'نشطة ومؤمنة' : 'Active & Encrypted'}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold shadow-md shadow-rose-950/15 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {isRtl
                    ? 'تسجيل الخروج من الحساب'
                    : 'Log Out of Account'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

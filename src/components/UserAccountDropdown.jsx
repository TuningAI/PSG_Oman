import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Check,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  Mail,
  ShieldCheck,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';

export default function UserAccountDropdown({
  currentUser,
  settings,
  syncedGmailAccounts = [],
  syncingGmail = false,
  onSyncGmail,
  onSaveProfile,
  onDeleteGmailAccount,
  onOpenGmailSettings,
  onLogout,
  lang = 'en',
  showToast,
}) {
  const isRtl = lang === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const managerProfile = settings?.companyProfile || {};
  const currentName = currentUser?.name || managerProfile.managerName || 'Ahmed Al Kindi';
  const currentRole = currentUser?.role || managerProfile.managerTitle || 'General Manager · PGS Oman';
  const currentEmail = currentUser?.email || managerProfile.email || 'ahmed.alkindi@pgsoman.com';
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

  // Edit form state
  const [editName, setEditName] = useState(currentName);
  const [editRole, setEditRole] = useState(currentRole);
  const [editPic, setEditPic] = useState(currentPic);
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keep edit state updated when profile updates
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
      if (showToast) showToast('Profile picture selected! Click Save to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      if (showToast) showToast('Name cannot be empty', 'warning');
      return;
    }

    setSaving(true);
    try {
      const words = editName.trim().split(/\s+/);
      const newInitials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : editName.slice(0, 2).toUpperCase();

      await onSaveProfile({
        managerName: editName.trim(),
        managerTitle: editRole.trim(),
        managerInitials: newInitials,
        profilePic: editPic,
      });

      setIsEditing(false);
      if (showToast) {
        showToast(
          isRtl ? 'تم تحديث الملف الشخصي والصورة بنجاح!' : 'User profile & picture updated successfully!',
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
    <div className="relative inline-block" ref={dropdownRef}>
      {/* =========================================================================
          TOP-RIGHT AVATAR BUTTON (Google / Gmail Style)
          ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-0.5 rounded-full focus:outline-none transition-all duration-200 cursor-pointer"
        title={isRtl ? `حساب: ${currentName}` : `Google Account: ${currentName} (${currentEmail})`}
        aria-label="User Account Menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-amber-400 group-hover:ring-amber-300 group-hover:shadow-md transition-all">
          {currentPic ? (
            <img
              src={currentPic}
              alt={currentName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#06392A] to-[#047857] text-amber-400 font-black text-sm flex items-center justify-center">
              {currentInitials}
            </div>
          )}
        </div>

        {/* Live Active Online Status Indicator */}
        <span className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 ring-2 ring-white rounded-full shadow-xs" />
      </button>

      {/* =========================================================================
          INTERACTIVE GOOGLE-STYLE ACCOUNT FLYOUT POPOVER
          ========================================================================= */}
      {isOpen && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="absolute top-13 end-0 z-50 w-[360px] sm:w-[390px] rounded-3xl bg-white shadow-2xl border-2 border-slate-200/95 overflow-hidden text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Top Decorative Amber Crown Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600" />

          {/* User Profile Card Header */}
          <div className="p-5 bg-gradient-to-b from-[#F7F6F2] to-white border-b border-slate-200 text-center relative">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsEditing(false);
              }}
              className="absolute top-4 end-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Avatar with Camera Upload Badge */}
            <div className="inline-block relative mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-amber-400/80 shadow-md mx-auto bg-slate-900 flex items-center justify-center">
                {(isEditing ? editPic : currentPic) ? (
                  <img
                    src={isEditing ? editPic : currentPic}
                    alt={currentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-amber-400">
                    {currentInitials}
                  </span>
                )}
              </div>

              {/* Camera Trigger */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 end-0 p-1.5 rounded-full bg-[#06392A] hover:bg-[#047857] text-amber-300 ring-2 ring-white shadow-md transition cursor-pointer"
                title={isRtl ? 'تغيير صورة الملف الشخصي' : 'Change profile photo'}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Profile Information or Edit Form */}
            {!isEditing ? (
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {currentName}
                </h3>
                <p className="text-xs font-semibold text-emerald-800">
                  {currentRole}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {currentEmail}
                </p>

                <div className="pt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile & Photo'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Edit Mode Form */
              <form onSubmit={handleSaveEdit} className="space-y-3 pt-1 text-start">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    {isRtl ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#065F46] focus:ring-2 focus:ring-[#065F46]/20 text-xs font-bold text-slate-900 outline-none transition"
                    placeholder="Ahmed Al Kindi"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    {isRtl ? 'المسمى الوظيفي / الدور' : 'Role / Title'}
                  </label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#065F46] focus:ring-2 focus:ring-[#065F46]/20 text-xs font-bold text-slate-900 outline-none transition"
                    placeholder="General Manager · PGS Oman"
                  />
                </div>

                {/* Profile Pic Upload & Reset Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isRtl ? 'رفع صورة جديدة' : 'Upload Photo'}</span>
                  </button>

                  {editPic && (
                    <button
                      type="button"
                      onClick={() => setEditPic(null)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer"
                      title={isRtl ? 'إزالة الصورة الحالية' : 'Remove current photo'}
                    >
                      {isRtl ? 'إزالة' : 'Remove'}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(currentName);
                      setEditRole(currentRole);
                      setEditPic(currentPic);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* =========================================================================
              "SYNC EMAIL INBOX" PROMINENT BUTTON (Required in dropdown)
              ========================================================================= */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-2">
            <button
              type="button"
              onClick={() => {
                if (onSyncGmail) onSyncGmail();
              }}
              disabled={syncingGmail}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#065F46] hover:bg-[#047857] text-white text-xs font-black shadow-md shadow-emerald-950/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className={`w-4 h-4 text-amber-300 ${syncingGmail ? 'animate-spin' : ''}`} />
                <span className="text-sm font-extrabold">
                  {syncingGmail
                    ? (isRtl ? 'جاري مزامنة البريد...' : 'Syncing Inbox...')
                    : (isRtl ? 'مزامنة صندوق البريد (Gmail)' : 'Sync Email Inbox')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-[10px] text-amber-300 font-bold border border-emerald-600">
                Live IMAP
              </span>
            </button>
          </div>

          {/* =========================================================================
              ALREADY SYNCED GMAIL ACCOUNTS (Required in dropdown)
              ========================================================================= */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isRtl ? 'حسابات Gmail المتصلة:' : 'Synced Gmail Accounts'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#065F46] text-[10px] font-extrabold">
                {syncedGmailAccounts.length} Connected
              </span>
            </div>

            {syncedGmailAccounts.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>{isRtl ? 'لا يوجد بريد متصل حالياً' : 'No Gmail inbox connected'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onOpenGmailSettings) onOpenGmailSettings(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#065F46] text-white font-extrabold text-[11px] shadow-xs cursor-pointer"
                >
                  + Connect
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pe-1">
                {syncedGmailAccounts.map((acc) => (
                  <div
                    key={acc.id || acc.email}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-extrabold text-slate-800 truncate text-[11px]">
                        {acc.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onOpenGmailSettings) onOpenGmailSettings(acc.email);
                        }}
                        className="p-1 rounded-md bg-white hover:bg-emerald-50 border border-slate-300 text-[#065F46] text-[10px] font-bold transition cursor-pointer"
                        title={isRtl ? 'تعديل بيانات الحساب' : 'Edit Gmail Account'}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteGmailAccount) onDeleteGmailAccount(acc.email);
                        }}
                        className="p-1 rounded-md bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 text-[10px] font-bold transition cursor-pointer"
                        title={isRtl ? 'حذف الحساب' : 'Delete Gmail Account'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onOpenGmailSettings) onOpenGmailSettings(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-emerald-400 hover:bg-emerald-50 text-[#065F46] text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? '+ إضافة حساب Gmail آخر' : '+ Add Another Gmail'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Action: Sign Out */}
          <div className="p-3 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>PGS Oman Executive Portal</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-300 hover:border-rose-300 text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

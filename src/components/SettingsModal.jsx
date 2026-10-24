import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Mail,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  HelpCircle,
  Save,
  Edit3,
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  showToast,
  initialTab = 'company',
  initialEditEmail = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'company' | 'gmail' | 'ai'
  const [gmail, setGmail] = useState(settings?.gmail || {});
  const [ai, setAi] = useState(settings?.ai || {});
  const [companyProfile, setCompanyProfile] = useState(settings?.companyProfile || {});
  const [saving, setSaving] = useState(false);
  const [testingGmail, setTestingGmail] = useState(false);
  const [gmailTestStatus, setGmailTestStatus] = useState(null);

  // Multi-Gmail Account Editor state
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [accountPasswordInput, setAccountPasswordInput] = useState('');

  useEffect(() => {
    if (settings) {
      const g = settings.gmail || {};
      const accounts =
        Array.isArray(g.accounts) && g.accounts.length > 0
          ? g.accounts
          : g.email
          ? [{ id: 'gmail-1', email: g.email, appPassword: g.appPassword || '' }]
          : [];
      setGmail({ ...g, accounts });
      setAi(settings.ai || {});
      setCompanyProfile(settings.companyProfile || {});

      if (initialEditEmail) {
        const found = accounts.find(
          (a) => a.email.toLowerCase() === initialEditEmail.toLowerCase()
        );
        if (found) {
          setEditingAccountId(found.id);
          setAccountEmailInput(found.email);
          setAccountPasswordInput(found.appPassword || '');
        } else {
          setEditingAccountId(null);
          setAccountEmailInput('');
          setAccountPasswordInput('');
        }
      } else {
        setEditingAccountId(null);
        setAccountEmailInput('');
        setAccountPasswordInput('');
      }
    }
  }, [settings, isOpen, initialEditEmail]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleRateChange = (index, field, value) => {
    const updated = [...(companyProfile.rateCard || [])];
    updated[index] = { ...updated[index], [field]: value };
    setCompanyProfile({ ...companyProfile, rateCard: updated });
  };

  const handleAddRateItem = () => {
    const updated = [
      ...(companyProfile.rateCard || []),
      {
        id: `rc-${Date.now()}`,
        serviceName: 'New Waste Collection Service / Container',
        unit: 'Per Trip / Per Month',
        rate: '50 OMR',
        notes: 'Includes haulage and municipal disposal manifest',
      },
    ];
    setCompanyProfile({ ...companyProfile, rateCard: updated });
  };

  const handleRemoveRateItem = (index) => {
    const updated = (companyProfile.rateCard || []).filter((_, i) => i !== index);
    setCompanyProfile({ ...companyProfile, rateCard: updated });
  };

  const handleTestGmail = async () => {
    const emailToTest = accountEmailInput.trim() || gmail.accounts?.[0]?.email || gmail.email;
    const passToTest = accountPasswordInput.trim() || gmail.accounts?.[0]?.appPassword || gmail.appPassword;
    setTestingGmail(true);
    setGmailTestStatus(null);
    try {
      const res = await fetch('/api/gmail/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToTest,
          appPassword: passToTest,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      setGmailTestStatus({ ok: true, message: data.message });
    } catch (err) {
      setGmailTestStatus({ ok: false, message: err.message });
    } finally {
      setTestingGmail(false);
    }
  };

  const buildUpdatedGmailAccounts = () => {
    const currentAccounts = Array.isArray(gmail.accounts) ? [...gmail.accounts] : [];
    const trimmedEmail = accountEmailInput.trim();
    const trimmedPass = accountPasswordInput.trim();
    if (trimmedEmail) {
      if (editingAccountId) {
        const idx = currentAccounts.findIndex((a) => a.id === editingAccountId);
        if (idx >= 0) {
          currentAccounts[idx] = {
            ...currentAccounts[idx],
            email: trimmedEmail,
            appPassword: trimmedPass || currentAccounts[idx].appPassword,
          };
        } else {
          currentAccounts.push({
            id: `gmail-${Date.now()}`,
            email: trimmedEmail,
            appPassword: trimmedPass,
          });
        }
      } else {
        const existingIdx = currentAccounts.findIndex(
          (a) => a.email.toLowerCase() === trimmedEmail.toLowerCase()
        );
        if (existingIdx >= 0) {
          currentAccounts[existingIdx] = {
            ...currentAccounts[existingIdx],
            email: trimmedEmail,
            appPassword: trimmedPass || currentAccounts[existingIdx].appPassword,
          };
        } else {
          currentAccounts.push({
            id: `gmail-${Date.now()}`,
            email: trimmedEmail,
            appPassword: trimmedPass,
          });
        }
      }
    }
    return currentAccounts;
  };

  const handleAddOrUpdateAccountInList = async () => {
    if (!accountEmailInput.trim() || !accountPasswordInput.trim()) {
      showToast('Please enter both the Gmail address and 16-character App Password.', 'error');
      return;
    }
    const updatedAccounts = buildUpdatedGmailAccounts();
    const updatedGmail = {
      ...gmail,
      accounts: updatedAccounts,
      email: updatedAccounts[0]?.email || '',
      appPassword: updatedAccounts[0]?.appPassword || '',
    };
    setGmail(updatedGmail);
    setEditingAccountId(null);
    setAccountEmailInput('');
    setAccountPasswordInput('');
    await onSaveSettings({ gmail: updatedGmail, ai, companyProfile });
    showToast('Gmail account saved and synced!', 'success');
  };

  const handleDeleteAccountFromList = async (accId, accEmail) => {
    const updatedAccounts = (gmail.accounts || []).filter((a) => a.id !== accId && a.email !== accEmail);
    const updatedGmail = {
      ...gmail,
      accounts: updatedAccounts,
      email: updatedAccounts[0]?.email || '',
      appPassword: updatedAccounts[0]?.appPassword || '',
    };
    setGmail(updatedGmail);
    if (editingAccountId === accId) {
      setEditingAccountId(null);
      setAccountEmailInput('');
      setAccountPasswordInput('');
    }
    await onSaveSettings({ gmail: updatedGmail, ai, companyProfile });
    showToast(`Removed Gmail account ${accEmail}`, 'success');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updatedAccounts = buildUpdatedGmailAccounts();
      const updatedGmail = {
        ...gmail,
        accounts: updatedAccounts,
        email: updatedAccounts[0]?.email || '',
        appPassword: updatedAccounts[0]?.appPassword || '',
      };
      await onSaveSettings({ gmail: updatedGmail, ai, companyProfile });
      showToast('All settings & Gmail accounts saved successfully!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">System Setup, Company Rate Card & Gmail Connection</h2>
              <p className="text-xs text-slate-300">
                Configure your company pricing, Gmail inbox connection, and AI assistant preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'company'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            1. Company Profile & Pricing Rate Card
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'gmail'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            2. Connect Manager's Gmail
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition ${
              activeTab === 'ai'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            3. AI Engine (Gemini / OpenAI)
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'company' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
                <strong>How the AI uses this information:</strong> Whenever a client sends a waste management proposal or contract inquiry, the AI automatically inserts your company's official name, permits, and unit prices from the Rate Card below into the drafted reply.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyProfile.companyName || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Manager Name (For Email Sign-off)
                  </label>
                  <input
                    type="text"
                    value={companyProfile.managerName || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, managerName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Manager Title
                  </label>
                  <input
                    type="text"
                    value={companyProfile.managerTitle || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, managerTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Phone Numbers
                  </label>
                  <input
                    type="text"
                    value={companyProfile.phone || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Official Contact Email
                  </label>
                  <input
                    type="text"
                    value={companyProfile.email || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Standard Payment Terms
                  </label>
                  <input
                    type="text"
                    value={companyProfile.paymentTerms || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, paymentTerms: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Licenses & Environmental Certifications (Be'ah / Environment Authority / ISO)
                  </label>
                  <input
                    type="text"
                    value={companyProfile.certifications || ''}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, certifications: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Rate Card */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Standard Waste Management Service Rate Card
                    </h3>
                    <p className="text-xs text-slate-500">
                      The AI uses these unit rates when drafting commercial responses to client proposals
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRateItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Service Rate
                  </button>
                </div>

                <div className="space-y-3">
                  {(companyProfile.rateCard || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center"
                    >
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-medium text-slate-500">Service / Container Type</label>
                        <input
                          type="text"
                          value={item.serviceName}
                          onChange={(e) => handleRateChange(idx, 'serviceName', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium bg-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-medium text-slate-500">Billing Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleRateChange(idx, 'unit', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500">Standard Rate</label>
                        <input
                          type="text"
                          value={item.rate}
                          onChange={(e) => handleRateChange(idx, 'rate', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold text-emerald-700 bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500">Notes / Inclusions</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleRateChange(idx, 'notes', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveRateItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Remove service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gmail' && (
            <div className="space-y-6">
              {/* List of All Synced Gmail Accounts with Edit & Delete Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Synced Gmail Accounts ({(gmail.accounts || []).length})
                  </h3>
                  {editingAccountId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccountId(null);
                        setAccountEmailInput('');
                        setAccountPasswordInput('');
                      }}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Switch to Add New Gmail Account
                    </button>
                  )}
                </div>

                {(gmail.accounts || []).length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
                    No Gmail accounts connected yet. Enter a Gmail address and 16-character App Password below to sync one or more Gmail accounts together.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(gmail.accounts || []).map((acc, idx) => (
                      <div
                        key={acc.id || acc.email || idx}
                        className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border-2 transition ${
                          editingAccountId === acc.id
                            ? 'bg-amber-50/70 border-amber-400'
                            : 'bg-emerald-50/70 border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                              Synced Gmail Account #{idx + 1}
                            </div>
                            <div className="text-base font-extrabold text-slate-900">
                              {acc.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                            Synced ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccountId(acc.id);
                              setAccountEmailInput(acc.email);
                              setAccountPasswordInput(acc.appPassword || '');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-extrabold transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccountFromList(acc.id, acc.email)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-extrabold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Gmail Account or Edit Selected Gmail Account Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-700" />
                    <span>
                      {editingAccountId
                        ? `Edit Synced Gmail Account (${accountEmailInput})`
                        : '+ Add / Connect Another Gmail Account (Sync Multiple Gmail IDs Together)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Gmail Address
                    </label>
                    <input
                      type="email"
                      placeholder="manager@gmail.com"
                      value={accountEmailInput}
                      onChange={(e) => setAccountEmailInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      16-Character Gmail App Password
                    </label>
                    <input
                      type="password"
                      placeholder="xxxx xxxx xxxx xxxx"
                      value={accountPasswordInput}
                      onChange={(e) => setAccountPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTestGmail}
                    disabled={testingGmail}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    {testingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Test Gmail Connection
                  </button>

                  <button
                    type="button"
                    onClick={handleAddOrUpdateAccountInList}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {editingAccountId ? 'Update Synced Gmail ID' : 'Add & Sync This Gmail ID'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Easy 3-Step Gmail Setup Guide (Works for 2 or More Gmail IDs Together):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-900">
                  <li>
                    Open your Google Account Security page:{' '}
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border">myaccount.google.com/apppasswords</span>
                  </li>
                  <li>
                    Type a name like <strong>"Waste Assistant"</strong> and click <strong>Create</strong>.
                  </li>
                  <li>
                    Copy the <strong>16-letter App Password</strong> shown on screen and paste it above. You can add multiple Gmail IDs and sync all of them together.
                  </li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(gmail.syncToGmailDrafts)}
                      onChange={(e) => setGmail({ ...gmail, syncToGmailDrafts: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    Automatically save AI-generated replies to Gmail's "Drafts" folder as well
                  </label>
                  <p className="text-xs text-slate-500 pl-6">
                    When enabled, every new proposal draft will also appear inside the receiving Gmail account's Drafts folder before approval.
                  </p>
                </div>
              </div>

              {gmailTestStatus && (
                <div
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-sm ${
                    gmailTestStatus.ok
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {gmailTestStatus.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{gmailTestStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-950">
                <strong>Built-in Smart Fallback Included:</strong> Even if you leave the API key blank during testing, the software includes a built-in Waste Management AI Engine that filters emails, summarizes proposals, and drafts replies using your Rate Card automatically. Add a <strong>Google Gemini</strong> or <strong>OpenAI</strong> API key below for full LLM reasoning.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Preferred LLM Provider
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAi({ ...ai, provider: 'gemini' })}
                    className={`p-4 rounded-xl border text-left transition ${
                      ai.provider === 'gemini'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">Google Gemini API (Recommended)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fast, accurate extraction for long PDF contracts & waste schedules
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAi({ ...ai, provider: 'openai' })}
                    className={`p-4 rounded-xl border text-left transition ${
                      ai.provider === 'openai'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">OpenAI (GPT-4o / GPT-4o-mini)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Industry-standard commercial proposal drafting & summarization
                    </div>
                  </button>
                </div>
              </div>

              {ai.provider === 'gemini' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Google Gemini API Key
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={ai.geminiApiKey || ''}
                      onChange={(e) => setAi({ ...ai, geminiApiKey: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Gemini Model
                    </label>
                    <select
                      value={ai.geminiModel || 'gemini-2.5-flash'}
                      onChange={(e) => setAi({ ...ai, geminiModel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended - Fast & Smart)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={ai.openaiApiKey || ''}
                      onChange={(e) => setAi({ ...ai, openaiApiKey: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      OpenAI Model
                    </label>
                    <select
                      value={ai.openaiModel || 'gpt-4o-mini'}
                      onChange={(e) => setAi({ ...ai, openaiModel: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-Effective)</option>
                      <option value="gpt-4o">gpt-4o (Maximum Reasoning)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}

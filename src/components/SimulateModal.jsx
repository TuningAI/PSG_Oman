import React, { useState } from 'react';
import { X, Send, Paperclip, Sparkles, Loader2, FileText, CheckCircle2 } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    label: '1. Duqm Industrial Port — 2-Year Waste & Skip RFP',
    fromName: 'Eng. Salim Al-Rawahi',
    fromEmail: 's.rawahi@duqmport-logistics.om',
    companyName: 'Duqm Port Industrial Services LLC',
    subject: 'RFP: 24-Month Waste Collection & RoRo Skip Contract at Duqm Freezone',
    bodyText: `Dear Contracts Manager,

We are seeking a licensed environmental contractor for a 24-month waste management contract at our Duqm Special Economic Zone port terminal and warehouse complex.

Scope of Work required:
1. 10 x 1.1 CBM Galvanized Wheelie Bins for daily municipal solid waste collection.
2. 3 x 20 CBM RoRo containers for industrial timber, packaging scrap, and construction debris (approx. 10 trips per month).
3. 2 x 7 CBM chain-lift skips for workshop general waste (8 pulls per month).
4. Cardboard and plastic recyclable collection with monthly recycling diversion reports.

Kindly send us your commercial proposal with unit rates, Be'ah registration confirmation, and payment terms so we can present it to our tender committee this week.

Regards,
Eng. Salim Al-Rawahi
Procurement & Contracts Lead
Duqm Port Industrial Services LLC`,
  },
  {
    label: '2. Sohar Chemical Plant — Hazardous Waste Contract',
    fromName: 'Dr. Khalid Al-Zadjali',
    fromEmail: 'khalid.z@soharchem-oman.com',
    companyName: 'Sohar Specialty Chemicals SAOC',
    subject: 'Urgent Contract Inquiry: Hazardous Chemical Sludge & Sewage Tanker Disposal',
    bodyText: `Dear PGS Oman Operations Manager,

Our Sohar Industrial Estate plant requires an immediate annual service contract for:
- Hazardous chemical sludge & contaminated drum disposal (approx. 18 Metric Tons per month) with full ADR transport and Environment Authority manifest documentation.
- Industrial wastewater / sewage tanker collection (10,000 Gal) — approx. 12 trips per month.

Please share your unit rates per ton and per trip, along with confirmation of your Environment Authority hazardous waste license.

Best regards,
Dr. Khalid Al-Zadjali
HSE & Environmental Compliance Manager
Sohar Specialty Chemicals SAOC`,
  },
  {
    label: '3. Test AI Spam Filter (Unrelated Marketing Email)',
    fromName: 'Muscat Travel & Holiday Deals',
    fromEmail: 'promotions@fly-holiday-deals.com',
    companyName: 'Fly Holiday Deals',
    subject: 'Weekend Getaway: 50% Off Hotel Packages in Dubai & Salalah!',
    bodyText: `Book your luxury weekend hotel stay now and enjoy 50% off business class upgrades and resort buffets! Limited seats available this month.`,
  },
];

export default function SimulateModal({ isOpen, onClose, onSimulated, showToast }) {
  const [fromName, setFromName] = useState(PRESET_TEMPLATES[0].fromName);
  const [fromEmail, setFromEmail] = useState(PRESET_TEMPLATES[0].fromEmail);
  const [companyName, setCompanyName] = useState(PRESET_TEMPLATES[0].companyName);
  const [subject, setSubject] = useState(PRESET_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState(PRESET_TEMPLATES[0].bodyText);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const applyPreset = (preset) => {
    setFromName(preset.fromName);
    setFromEmail(preset.fromEmail);
    setCompanyName(preset.companyName);
    setSubject(preset.subject);
    setBodyText(preset.bodyText);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fromName', fromName);
      formData.append('fromEmail', fromEmail);
      formData.append('companyName', companyName);
      formData.append('subject', subject);
      formData.append('bodyText', bodyText);
      for (const file of files) {
        formData.append('attachments', file);
      }

      const res = await fetch('/api/emails/simulate', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      showToast(data.message, data.email?.isWasteProposal ? 'success' : 'info');
      onSimulated(data);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Simulate Incoming Client Email</h2>
              <p className="text-xs text-slate-300">
                Test how the AI filters waste management proposals, reads PDF/DOCX contracts, and drafts a reply
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick-Fill Test Scenarios (Click to Load):
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_TEMPLATES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-left px-3.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-slate-800 transition flex items-center justify-between"
                >
                  <span>{preset.label}</span>
                  <span className="text-[11px] text-emerald-600 font-medium">Load Template →</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sender Name</label>
              <input
                type="text"
                required
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sender Email Address</label>
              <input
                type="email"
                required
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sender Company</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Proposal / Contract Email Body</label>
            <textarea
              rows={6}
              required
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-sans leading-relaxed"
            />
          </div>

          {/* Optional PDF / DOCX Attachment Upload */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Attach Contract / RFP Document (Optional — PDF, DOCX, TXT)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    The AI will extract text from attached files and include it in the summary & reply draft
                  </div>
                </div>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.csv"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
              <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Choose File
              </span>
            </label>
            {files.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 text-xs font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {f.name} ({Math.round(f.size / 1024)} KB)
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Receive & Analyze with AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  Edit3,
  Save,
  Eye,
  Upload,
  ArrowLeft,
  Loader2,
  Check,
  AlertTriangle,
  Table,
  Layers,
  ShieldCheck,
  FileCheck2,
  BookOpen,
} from 'lucide-react';

const OQ_INSTRUCTION_PRESETS = [
  {
    id: 'oq_standard',
    label: 'Standard OQ Bid (85 OMR/Ton + 3-Yr Call-Off)',
    instruction:
      'Quote 85.000 OMR/Ton payable to OQ RPI within 7 calendar days per SoW Section 10 (50T inventory + 30T/yr), plus alternative 110.000 OMR/Ton turnkey service rate per RFQ Clause 2.1.',
    tone: 'Technical & Commercial Bid',
  },
  {
    id: 'oq_distillation',
    label: 'Emphasize 4-Stage Distillation & Flash Point 56°C HSE',
    instruction:
      'Highlight our Sohar Industrial Estate 4-stage vacuum fractional distillation for C6–C12+ oligomer (Flash Point 56°C), ATEX nitrogen blanketing, 10-day collection SLA, and 60-day recycling completion certificate.',
    tone: 'Technical & Commercial Bid',
  },
  {
    id: 'oq_premium',
    label: 'Higher Revenue Offer (95 OMR/Ton to OQ RPI)',
    instruction:
      'Increase commercial purchase offer to 95.000 OMR/Ton payable to OQ RPI per weighbridge net weight and confirm 250g pre-bid sample verification.',
    tone: 'Formal Executive Proposal',
  },
];

const GENERAL_INSTRUCTION_PRESETS = [
  {
    id: 'standard',
    label: 'Standard Official Quotation',
    instruction:
      'Prepare a complete formal quotation using our standard PGS Oman rate card and 30-day payment terms.',
    tone: 'Formal Executive Proposal',
  },
  {
    id: 'discount10',
    label: 'Apply 10% Discount',
    instruction:
      'Apply a 10% discount on monthly rates and highlight 24-hour emergency skip replacement SLA.',
    tone: 'Formal Executive Proposal',
  },
  {
    id: 'site_visit',
    label: 'Include Site Survey Offer',
    instruction:
      'Include a complimentary technical site assessment prior to bin deployment and confirm Be’ah compliance.',
    tone: 'Technical & Commercial Bid',
  },
];

function isRealDocAttachment(att) {
  return att && /\.(pdf|docx|doc|txt|md|csv)$/i.test(att.filename || '');
}

export default function DocumentAnalysisWorkspace({
  emails = [],
  initialEmail = null,
  initialAttachmentIndex = 0,
  initialStep = 'understanding',
  onBackToEmail = null,
  onEmailsUpdated = null,
  onDocumentGeneratedForEmail = null,
  showToast,
  lang = 'en',
}) {
  const isRtl = lang === 'ar';

  // Filter out bounce notifications / spam so only real client proposals appear
  const proposalEmails = emails.filter(
    (e) =>
      e.isWasteProposal &&
      e.status !== 'filtered_out' &&
      !String(e.subject || '').toLowerCase().includes('delivery status notification') &&
      !String(e.fromEmail || '').toLowerCase().includes('mailer-daemon')
  );
  const availableEmails = proposalEmails.length > 0 ? proposalEmails : emails;

  const [selectedEmailId, setSelectedEmailId] = useState(
    initialEmail?.id || availableEmails[0]?.id || ''
  );

  // Loaded document, analysis, and generated response states
  const [docRecord, setDocRecord] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [generatedResponse, setGeneratedResponse] = useState(null);

  // Loading states
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Active inspection tab for extracted intelligence
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('metadata_alerts');
  // Active tab for generated output
  const [activeOutputTab, setActiveOutputTab] = useState('structured_doc');

  // Simple user customization states
  const [activePresetId, setActivePresetId] = useState('oq_standard');
  const [userInstructions, setUserInstructions] = useState('');
  const [preferredTone, setPreferredTone] = useState('Technical & Commercial Bid');
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [isEditingResponse, setIsEditingResponse] = useState(
    initialStep === 'response_editor'
  );

  // Response inline editing state
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSections, setEditedSections] = useState([]);
  const [editedConclusion, setEditedConclusion] = useState('');
  const [pdfCacheBuster, setPdfCacheBuster] = useState(Date.now());

  const currentEmail =
    emails.find((e) => e.id === selectedEmailId) ||
    initialEmail ||
    availableEmails[0] ||
    null;

  const validDocAttachmentIndex = (currentEmail?.attachments || []).findIndex(
    isRealDocAttachment
  );
  const effectiveAttIndex =
    validDocAttachmentIndex >= 0 ? validDocAttachmentIndex : initialAttachmentIndex || 0;

  useEffect(() => {
    const targetId = initialEmail?.id || selectedEmailId || availableEmails[0]?.id;
    if (targetId) {
      setSelectedEmailId(targetId);
      handleRunAnalysis(targetId, effectiveAttIndex, false);
    }
  }, [initialEmail?.id]);

  const syncResponseEditorState = (resp) => {
    if (!resp) return;
    setEditedTitle(resp.documentTitle || '');
    setEditedSections(
      Array.isArray(resp.sections)
        ? resp.sections.map((s) => ({
            ...s,
            bulletPointsText: (s.bulletPoints || []).join('\n'),
          }))
        : []
    );
    setEditedConclusion(resp.conclusionAndNextSteps || '');
  };

  // Run AI Analysis automatically for the selected email/document
  const handleRunAnalysis = async (
    targetEmailId = selectedEmailId,
    targetAttIdx = effectiveAttIndex,
    force = false
  ) => {
    if (!targetEmailId) return;
    setAnalyzing(true);
    try {
      const res = await fetch(
        `/api/emails/${targetEmailId}/attachments/${targetAttIdx}/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Document analysis failed');

      setDocRecord(data.document);
      setAnalysis(data.analysis);
      if (data.document?.generatedResponse) {
        setGeneratedResponse(data.document.generatedResponse);
        syncResponseEditorState(data.document.generatedResponse);
      } else {
        setGeneratedResponse(null);
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Upload 1 or Multiple PDF / DOCX files simultaneously
  const handleDirectUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append('documents', file);
      }
      if (currentEmail?.id) {
        formData.append('emailId', currentEmail.id);
      }

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const analyzeRes = await fetch(
        `/api/documents/${data.document.documentId}/analyze`,
        { method: 'POST' }
      );
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analysis failed');

      setDocRecord(analyzeData.document);
      setAnalysis(analyzeData.analysis);
      setGeneratedResponse(analyzeData.document?.generatedResponse || null);
      if (showToast) {
        showToast(
          files.length > 1
            ? `Combined & analyzed ${files.length} files (${analyzeData.document.pageCount} pages total).`
            : `Uploaded & analyzed "${files[0].name}" (${analyzeData.document.pageCount} pages).`,
          'success'
        );
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Generate Complete Response Document & PDF
  const handleGenerateResponse = async (shouldReturnToEmail = true) => {
    if (!docRecord?.documentId) return;
    setGeneratingResponse(true);
    try {
      const res = await fetch(
        `/api/documents/${docRecord.documentId}/generate-response`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailId: currentEmail?.id || initialEmail?.id || null,
            userInstructions,
            preferredTone,
            responseScope: 'Comprehensive Full Response',
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate response');

      setGeneratedResponse(data.generatedResponse);
      setDocRecord(data.document);
      syncResponseEditorState(data.generatedResponse);
      setPdfCacheBuster(Date.now());

      if (onEmailsUpdated && data.emails) {
        onEmailsUpdated(data.emails);
      }

      if (shouldReturnToEmail && onDocumentGeneratedForEmail) {
        onDocumentGeneratedForEmail(
          data.generatedResponse,
          data.document,
          data.email,
          data.emails
        );
      } else {
        setShowPdfPreview(true);
        if (showToast) {
          showToast(
            'Complete 9-Section Technical & Commercial Documentation + PDF generated!',
            'success'
          );
        }
      }
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setGeneratingResponse(false);
    }
  };

  // Save manual text edits to the generated response & update PDF
  const handleSaveResponseEdits = async () => {
    if (!docRecord?.documentId || !generatedResponse) return;
    setSavingEdits(true);
    try {
      const cleanedSections = editedSections.map((s) => ({
        id: s.id,
        heading: s.heading,
        content: s.content,
        sourcePageRefs: s.sourcePageRefs || [],
        bulletPoints: String(s.bulletPointsText || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean),
      }));

      const res = await fetch(`/api/documents/${docRecord.documentId}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentTitle: editedTitle,
          sections: cleanedSections,
          conclusionAndNextSteps: editedConclusion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save edits');

      setGeneratedResponse(data.generatedResponse);
      setDocRecord(data.document);
      syncResponseEditorState(data.generatedResponse);
      setIsEditingResponse(false);
      setPdfCacheBuster(Date.now());
      if (onEmailsUpdated && data.emails) {
        onEmailsUpdated(data.emails);
      }
      if (showToast) showToast('Updated response document & PDF!', 'success');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSavingEdits(false);
    }
  };

  const isOqPackage =
    String(docRecord?.filename || '').includes('6000061376') ||
    String(docRecord?.filename || '').toLowerCase().includes('oligomer') ||
    String(analysis?.clientName || '').includes('OQ');

  const activePresets = isOqPackage ? OQ_INSTRUCTION_PRESETS : GENERAL_INSTRUCTION_PRESETS;
  const sourceDocs = analysis?.sourceDocuments || docRecord?.sourceDocuments || [];
  const metadataGrid = analysis?.keyMetadataGrid || [];
  const extractedTables = analysis?.extractedTables || [];
  const requirementsList = analysis?.mainTopicsAndRequirements || [];
  const questionsList = analysis?.questionsRequiringResponse || [];
  const contradictionsList = analysis?.missingAmbiguitiesContradictions || [];
  const sectionBreakdowns = analysis?.sectionBreakdowns || [];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 max-w-[1340px] w-full mx-auto space-y-5 overflow-y-auto"
    >
      {/* =====================================================================
          1. TOP HEADER BAR (Back Button + Mail Selector + Multi-File Upload)
         ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          {onBackToEmail && (
            <button
              type="button"
              onClick={onBackToEmail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-extrabold transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#065F46]" />
              <span>{isRtl ? 'العودة إلى البريد' : 'Back to Mail'}</span>
            </button>
          )}
          <div className="p-3 rounded-2xl bg-[#06392A] text-amber-400 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900">
                {isRtl
                  ? 'محرك الذكاء الاصطناعي لتحليل المستندات وإنشاء العروض (PDF)'
                  : 'AI Multi-Document Intelligence & Complete Documentation Builder'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#065F46] text-[11px] font-extrabold">
                Full Table, Clause & Cross-Doc Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentEmail
                ? `Active Tender / Mail: ${
                    currentEmail.companyName || currentEmail.fromName
                  } — ${currentEmail.subject}`
                : 'Select a client tender package or upload 1 or multiple PDF/DOCX files to extract all details and generate complete documentation.'}
            </p>
          </div>
        </div>

        {/* Right Side: Change Mail Dropdown + Multi-File Upload */}
        <div className="flex flex-wrap items-center gap-2.5">
          {availableEmails.length > 0 && (
            <select
              value={selectedEmailId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedEmailId(nextId);
                handleRunAnalysis(nextId, 0, false);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:border-[#065F46] focus:outline-none max-w-xs truncate"
            >
              {availableEmails.map((em) => (
                <option key={em.id} value={em.id}>
                  {em.companyName || em.fromName} — {em.subject}
                </option>
              ))}
            </select>
          )}

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06392A] hover:bg-[#065F46] text-amber-300 text-xs font-extrabold cursor-pointer transition shadow-sm">
            {uploadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <Upload className="w-4 h-4 text-amber-300" />
            )}
            <span>
              {uploadingFile
                ? 'Extracting Documents...'
                : 'Upload PDF / DOCX Files (1 or Multiple)'}
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md,.csv"
              onChange={handleDirectUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* =====================================================================
          1B. INPUT DOCUMENTS BAR (Shows Both Attached Client PDFs & Page Counts)
         ===================================================================== */}
      {!analyzing && docRecord && (
        <div className="bg-gradient-to-r from-[#06392A] via-[#064E3B] to-[#065F46] rounded-3xl p-5 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
                  {sourceDocs.length > 1
                    ? `Multi-Document Input Package (${sourceDocs.length} Files Combined)`
                    : 'Input Document Analyzed'}
                </span>
                <span className="text-xs text-emerald-200 font-semibold">
                  {docRecord.pageCount} Pages Total · {(docRecord.totalWords || 0).toLocaleString()} Words Extracted · 100% Page Traceability
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                {analysis?.documentType || docRecord.filename}
              </h2>
            </div>

            {/* Individual Source Document Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              {sourceDocs.map((sd, idx) => (
                <div
                  key={sd.documentId || idx}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white leading-tight">
                      {sd.filename}
                    </div>
                    <div className="text-[10px] text-emerald-200 font-semibold">
                      {sd.pageCount} Pages · {(sd.totalWords || 0).toLocaleString()} Words
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner While AI Reads the Mail/Documents */}
      {analyzing && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Loader2 className="w-9 h-9 animate-spin text-[#065F46] mx-auto" />
          <div className="text-base font-extrabold text-slate-900">
            AI is performing deep page-by-page extraction across your input documents...
          </div>
          <p className="text-xs text-slate-500">
            Extracting metadata, chemical lab analysis tables, 100-point evaluation criteria, mandatory clauses, and cross-document contradictions.
          </p>
        </div>
      )}

      {/* =====================================================================
          2. DEEP AI EXTRACTED INTELLIGENCE (4 Organized Inspection Tabs)
         ===================================================================== */}
      {!analyzing && docRecord && analysis && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-[#065F46]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Step 1 — Deep AI Document Extraction & Cross-Document Intelligence
                </h2>
                <p className="text-xs text-slate-500">
                  Every parameter, chemical table, scoring matrix, legal obligation, and cross-document conflict identified from the input files:
                </p>
              </div>
            </div>

            {/* 4 Clean Inspection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveAnalysisTab('metadata_alerts')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeAnalysisTab === 'metadata_alerts'
                    ? 'bg-[#06392A] text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Key Details & Critical Alerts ({metadataGrid.length + contradictionsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAnalysisTab('tables')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeAnalysisTab === 'tables'
                    ? 'bg-[#06392A] text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Extracted Lab & Evaluation Tables ({extractedTables.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAnalysisTab('requirements')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeAnalysisTab === 'requirements'
                    ? 'bg-[#06392A] text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>All Scope, HSE & Legal Clauses ({requirementsList.length + questionsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAnalysisTab('sections')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                  activeAnalysisTab === 'sections'
                    ? 'bg-[#06392A] text-amber-300 shadow-sm'
                    : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Page-by-Page Breakdown ({docRecord.pageCount} Pages)</span>
              </button>
            </div>
          </div>

          {/* Executive Purpose Banner */}
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-xs text-slate-800 leading-relaxed font-medium">
            <strong className="text-[#065F46] font-extrabold uppercase tracking-wider mr-1.5">
              Executive Synthesis:
            </strong>
            {analysis.documentPurpose}
          </div>

          {/* =================================================================
              TAB 1: KEY METADATA GRID + CRITICAL DISQUALIFICATION & CONTRADICTION ALERTS
             ================================================================= */}
          {activeAnalysisTab === 'metadata_alerts' && (
            <div className="space-y-5">
              {/* Critical Contradictions & Disqualification Warnings */}
              {contradictionsList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      AI-Detected Disqualification Warnings & Cross-Document Contradictions ({contradictionsList.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {contradictionsList.map((item, idx) => {
                      const isCritical =
                        String(item.type || '').toLowerCase().includes('disqualification') ||
                        String(item.issue || '').toLowerCase().includes('rejected');
                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex items-start justify-between gap-4 ${
                            isCritical
                              ? 'bg-red-50/90 border-red-300 text-red-950'
                              : 'bg-amber-50/90 border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                isCritical
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-600 text-white'
                              }`}
                            >
                              {item.type || 'Important Alert'}
                            </span>
                            <p className="text-xs font-bold leading-relaxed">
                              {item.issue}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-white/90 border border-slate-300 text-slate-800 text-[10px] font-extrabold shrink-0">
                            {item.pageRef}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 16-Item Executive Key Metadata Grid */}
              {metadataGrid.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Extracted Tender & Technical Control Parameters ({metadataGrid.length} Key Fields):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {metadataGrid.map((meta, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-slate-200/90 flex flex-col justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#065F46]">
                              {meta.label}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[9px] font-extrabold">
                              {meta.pageRef}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 leading-snug">
                            {meta.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 2: EXTRACTED TECHNICAL, LABORATORY & SCORING TABLES
             ================================================================= */}
          {activeAnalysisTab === 'tables' && (
            <div className="space-y-6">
              {extractedTables.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No structured tables found in this document.
                </p>
              ) : (
                extractedTables.map((tbl, tIdx) => (
                  <div
                    key={tbl.tableId || tIdx}
                    className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    <div className="bg-[#06392A] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-amber-300">
                        {tbl.tableTitle}
                      </span>
                      {tbl.sourceRef && (
                        <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-extrabold">
                          Source: {tbl.sourceRef}
                        </span>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-slate-100">
                            {(tbl.headers || []).map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="py-2.5 px-3.5 font-extrabold border-b border-slate-700 text-[11px]"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(tbl.rows || []).map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                            >
                              {(Array.isArray(row) ? row : Object.values(row)).map(
                                (cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`py-2.5 px-3.5 leading-relaxed ${
                                      cIdx === 0
                                        ? 'font-extrabold text-slate-900'
                                        : 'text-slate-700 font-medium'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                )
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* =================================================================
              TAB 3: ALL SCOPE, HSE, PERMITS & LEGAL CLAUSES
             ================================================================= */}
          {activeAnalysisTab === 'requirements' && (
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  All Extracted Technical, Operational, HSE, Commercial & Legal Clauses ({requirementsList.length}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requirementsList.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-slate-200 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-800 font-semibold leading-relaxed">
                          {req.requirement}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#065F46] text-[10px] font-extrabold">
                          {req.category || 'Technical & Operational'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-extrabold">
                          {req.pageRef}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {questionsList.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Mandatory Bid Deliverables & Questions Requiring Explicit Response ({questionsList.length}):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questionsList.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 text-[10px] font-extrabold">
                            Deliverable #{idx + 1} ({q.priority || 'High'} Priority)
                          </span>
                          <p className="text-xs font-bold text-slate-900 leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-slate-800 text-[10px] font-extrabold shrink-0">
                          {q.pageRef}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              TAB 4: PAGE-BY-PAGE / SECTION WALKTHROUGH
             ================================================================= */}
          {activeAnalysisTab === 'sections' && (
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Logical Section & Page-by-Page Breakdown ({sectionBreakdowns.length} Sections across {docRecord.pageCount} Pages):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectionBreakdowns.map((sec, idx) => (
                  <div
                    key={sec.sectionId || idx}
                    className="p-4 rounded-2xl bg-[#FAF9F6] border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#06392A]">
                        Section {sec.sectionIndex}: {sec.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#065F46] text-[10px] font-extrabold shrink-0">
                        {sec.pageRange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sec.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          3. COMPLETE AI-GENERATED DOCUMENTATION & MULTI-PAGE PDF PREVIEW
         ===================================================================== */}
      {!analyzing && docRecord && generatedResponse && (
        <div className="bg-white rounded-3xl border-2 border-[#065F46]/30 p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-[#065F46] text-xs font-extrabold flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>
                    Complete Documentation & Multi-Page PDF Ready (
                    {(generatedResponse.sections || []).length} Sections · 100% Requirements Covered)
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Ref: {generatedResponse.referenceNumber}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {generatedResponse.documentTitle}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {generatedResponse.documentSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle between reading the full structured sections vs live PDF preview */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('structured_doc')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    activeOutputTab === 'structured_doc'
                      ? 'bg-[#06392A] text-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Full Written Documentation ({(generatedResponse.sections || []).length} Sections)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('pdf_preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                    activeOutputTab === 'pdf_preview'
                      ? 'bg-[#06392A] text-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Interactive Multi-Page PDF Viewer</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingResponse(!isEditingResponse)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-extrabold text-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#065F46]" />
                <span>{isEditingResponse ? 'Close Editor' : 'Edit Documentation'}</span>
              </button>

              <a
                href={`/api/documents/${docRecord.documentId}/pdf?download=1&t=${pdfCacheBuster}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06392A] hover:bg-[#065F46] text-amber-300 text-xs font-extrabold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Complete PDF</span>
              </a>
            </div>
          </div>

          {/* Inline Editor for Generated Documentation */}
          {isEditingResponse && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Document Title:
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-sm font-bold"
                />
              </div>

              {editedSections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2"
                >
                  <input
                    type="text"
                    value={sec.heading}
                    onChange={(e) => {
                      const next = [...editedSections];
                      next[idx] = { ...next[idx], heading: e.target.value };
                      setEditedSections(next);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-extrabold text-[#06392A]"
                  />
                  <textarea
                    rows={3}
                    value={sec.content}
                    onChange={(e) => {
                      const next = [...editedSections];
                      next[idx] = { ...next[idx], content: e.target.value };
                      setEditedSections(next);
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs leading-relaxed"
                  />
                  <label className="block text-[11px] font-bold text-slate-500">
                    Detailed Bullet Points (One per line):
                  </label>
                  <textarea
                    rows={4}
                    value={sec.bulletPointsText}
                    onChange={(e) => {
                      const next = [...editedSections];
                      next[idx] = { ...next[idx], bulletPointsText: e.target.value };
                      setEditedSections(next);
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs leading-relaxed"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={savingEdits}
                  onClick={handleSaveResponseEdits}
                  className="px-5 py-2 rounded-xl bg-[#065F46] text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdits ? 'Saving & Rebuilding PDF...' : 'Save Changes & Rebuild PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 1: FULL WRITTEN DOCUMENTATION + SCHEDULE A COMMERCIAL TABLE */}
          {activeOutputTab === 'structured_doc' && (
            <div className="space-y-4">
              {/* All 9 Generated Sections */}
              <div className="space-y-4">
                {(generatedResponse.sections || []).map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-[#FAF9F6]"
                  >
                    <div className="bg-[#06392A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-amber-300">
                        {sec.heading}
                      </h4>
                      {Array.isArray(sec.sourcePageRefs) && sec.sourcePageRefs.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-white/15 text-white text-[10px] font-bold">
                          Citations: {sec.sourcePageRefs.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {sec.content && (
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                          {sec.content}
                        </p>
                      )}
                      {Array.isArray(sec.bulletPoints) && sec.bulletPoints.length > 0 && (
                        <ul className="space-y-1.5 pl-1">
                          {sec.bulletPoints.map((bp, bIdx) => (
                            <li
                              key={bIdx}
                              className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46] shrink-0 mt-0.5" />
                              <span>{bp}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Schedule A — Commercial & Weighbridge Table */}
              {generatedResponse.commercialTable && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-300">
                      {generatedResponse.commercialTable.tableTitle}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-300">
                      {generatedResponse.commercialTable.totalSummary}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                          {(generatedResponse.commercialTable.headers || []).map((h, i) => (
                            <th key={i} className="py-2.5 px-3.5 font-extrabold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(generatedResponse.commercialTable.rows || []).map((r, rIdx) => (
                          <tr key={rIdx} className="bg-white">
                            <td className="py-2.5 px-3.5 font-extrabold text-slate-900">
                              {r.itemNo}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                              {r.description}
                            </td>
                            <td className="py-2.5 px-3.5 text-slate-700 font-semibold">
                              {r.unit}
                            </td>
                            <td className="py-2.5 px-3.5 font-extrabold text-[#065F46]">
                              {r.unitRate}
                            </td>
                            <td className="py-2.5 px-3.5 font-extrabold text-slate-900">
                              {r.monthlyAmount}
                            </td>
                            <td className="py-2.5 px-3.5 text-[11px] font-bold text-slate-500">
                              {r.sourceRef}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {generatedResponse.commercialTable.notes && (
                    <div className="p-3 bg-emerald-50 border-t border-emerald-200 text-[11px] text-slate-700 font-medium">
                      <strong>Commercial Notes:</strong> {generatedResponse.commercialTable.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: LIVE MULTI-PAGE PDF EMBEDDED VIEWER */}
          {(activeOutputTab === 'pdf_preview' || showPdfPreview) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Live Multi-Page A4 PDF Document Preview:
                </span>
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="text-xs font-bold text-[#065F46] hover:underline"
                >
                  {showPdfPreview ? 'Collapse PDF Viewer' : 'Expand PDF Viewer'}
                </button>
              </div>
              {showPdfPreview && (
                <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-slate-300 bg-slate-800 shadow-inner">
                  <iframe
                    title="Response PDF Preview"
                    src={`/api/documents/${docRecord.documentId}/pdf?t=${pdfCacheBuster}`}
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          4. CUSTOMIZE & GENERATE COMPLETE DOCUMENTATION + PDF AT THE BOTTOM
         ===================================================================== */}
      {!analyzing && docRecord && (
        <div className="bg-white rounded-3xl border-2 border-[#065F46]/40 p-6 shadow-md space-y-4">
          <div className="space-y-1">
            <label className="block text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>
                Step 2 — Customize & Generate Complete Response Documentation & PDF
              </span>
            </label>
            <p className="text-xs text-slate-500">
              Select a preset or enter custom commercial/technical instructions (e.g., per-ton rate, discount, distillation notes). The AI will incorporate all extracted tables, chemical parameters, mandatory gates, and your instructions into the complete documentation and PDF.
            </p>
          </div>

          {/* Quick-Select Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {activePresets.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setActivePresetId(preset.id);
                    setUserInstructions(preset.instruction);
                    setPreferredTone(preset.tone);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-extrabold transition ${
                    active
                      ? 'bg-[#065F46] text-white border-[#065F46]'
                      : 'bg-[#FAF9F6] text-slate-700 border-slate-300 hover:border-[#065F46]'
                  }`}
                >
                  <span>{preset.label}</span>
                  {active && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Custom Instruction Input */}
          <input
            type="text"
            placeholder='e.g., "Quote 90 OMR/Ton payable to OQ RPI within 7 days and highlight our Sohar distillation capacity..."'
            value={userInstructions}
            onChange={(e) => setUserInstructions(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-[#FAF9F6] border border-slate-300 text-sm font-medium text-slate-900 focus:border-[#065F46] focus:outline-none"
          />

          {/* Action Buttons at the Bottom */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Generate & preview the full documentation right here, or attach the generated PDF directly to your drafted email reply.
            </span>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={generatingResponse}
                onClick={() => handleGenerateResponse(false)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-extrabold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {generatingResponse ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span>Generate & Preview Full Documentation Here</span>
              </button>

              <button
                type="button"
                disabled={generatingResponse}
                onClick={() => handleGenerateResponse(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#065F46] hover:bg-[#047857] text-white text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
              >
                {generatingResponse ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                <span>
                  {generatingResponse
                    ? 'Generating Complete Response Document and PDF...'
                    : 'Generate Complete Response Document and PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

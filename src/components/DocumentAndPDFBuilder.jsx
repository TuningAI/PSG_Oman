import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Upload,
  Mic,
  MicOff,
  Mail,
  CheckCircle2,
  Download,
  Eye,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Save,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Undo2,
  FolderOpen,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Maximize2,
  PanelLeft,
  Edit2,
  Info,
  X,
} from 'lucide-react';
import TopSettingsDropdown from './TopSettingsDropdown.jsx';
import UserAccountDropdown from './UserAccountDropdown.jsx';

// Resilient API fetch helper that tries the Vite proxy first, then direct localhost:3005 / 127.0.0.1:3005
async function apiFetch(endpoint, options = {}) {
  const urls = [
    endpoint,
    `http://127.0.0.1:3005${endpoint}`,
    `http://localhost:3005${endpoint}`,
  ];
  let lastError = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Failed to connect to backend server on port 3005');
}

const DEFAULT_SECTIONS_SCRATCH = [
  {
    number: '01',
    title: 'Executive Summary',
    body: `PGS Oman proposes a coordinated approach to environmental support for an industrial site in Oman. This proposal outlines a practical framework for site assessment, waste management planning and HSE coordination.\n\nThe proposed approach begins with understanding site conditions and the client's priorities. A tailored delivery plan can then define the required activities, resources and reporting arrangements.`,
    focusTitle: 'Our proposed focus',
    bullets: [
      'Assess environmental needs and identify priorities.',
      'Develop a site-specific waste management approach.',
      'Coordinate HSE planning and progress reporting.',
    ],
    calloutTitle: 'To be confirmed with the client',
    calloutBody:
      'Final scope, delivery schedule and commercial terms will be agreed after reviewing project requirements. No contractual commitments are defined in this draft.',
  },
  {
    number: '02',
    title: 'Proposed Scope',
    body: `Our operational scope covers comprehensive waste containment, scheduled skip and RoRo container collection, and certified segregation at PGS Oman's facilities in Muscat and Sohar Industrial Estate.\n\nAll movements are documented under Environment Authority and Be'ah electronic manifest protocols to ensure complete cradle-to-grave traceability.`,
    focusTitle: 'Key scope deliverables',
    bullets: [
      'Deployment of color-coded general, recyclable, and hazardous waste containers.',
      'Scheduled and on-call 24-hour replacement turnarounds.',
      'Monthly mass-balance and waste diversion certificates.',
    ],
    calloutTitle: 'Site access & logistics',
    calloutBody:
      'Container placement locations and heavy vehicle access windows will be finalized during the joint site mobilization walkthrough.',
  },
  {
    number: '03',
    title: 'Delivery Methodology',
    body: `PGS Oman executes every contract through a structured 3-phase methodology: (1) Pre-Mobilization Site & Hazard Audit, (2) Fleet & Container Commissioning, and (3) Continuous Monitoring & Compliance Reporting.\n\nFor specialized hydrocarbon or oligomer streams, closed-loop vacuum fractional distillation is utilized to achieve >98.5% in-country resource recovery.`,
    focusTitle: 'Execution milestones',
    bullets: [
      'Day 1–3: Joint HSE induction, permit alignment, and route risk assessment.',
      'Day 4–7: Positioning of certified skips, bins, and secondary containment.',
      'Ongoing: Automated weighbridge ticketing and monthly KPI review.',
    ],
    calloutTitle: 'Turnaround SLA commitment',
    calloutBody:
      'Collection requests are fulfilled within 24 hours of notification, with recycling completion certificates issued within 60 days of batch loading.',
  },
  {
    number: '04',
    title: 'HSE & Environmental Controls',
    body: `Health, Safety, and Environment (HSE) excellence is embedded across all PGS Oman operations under ISO 14001:2015 and ISO 45001:2018 certified management systems.\n\nAll vehicles are equipped with spark arrestors, spill containment kits, and IVMS tracking, operated by defensive-driving and HAZMAT-certified personnel.`,
    focusTitle: 'Mandatory safety controls',
    bullets: [
      'Full compliance with Oman Environment Authority License #EA-WM-4092 & CDAA permits.',
      'Strict adherence to Flash Point, SDS, and ADR transport protocols.',
      'Zero-harm target with mandatory toolbox talks prior to every site lift.',
    ],
    calloutTitle: 'Emergency response readiness',
    calloutBody:
      'A dedicated 24/7 Emergency Spill Response Team remains on standby across Muscat and Sohar industrial corridors.',
  },
  {
    number: '05',
    title: 'Commercial Approach',
    body: `Our commercial structure is designed for transparency and cost predictability. Rates are structured on a clear per-lift, monthly rental, or per-metric-ton weighbridge basis in Omani Rials (OMR).\n\nAll invoices are supported by calibrated weighbridge tickets, signed waste transfer notes, and official tax documentation.`,
    focusTitle: 'Commercial highlights',
    bullets: [
      'Competitive unit rates aligned with project volume and contract duration.',
      'Standard 30-day credit payment terms from certified invoice submission.',
      'Quotation validity of 90 calendar days from issue date.',
    ],
    calloutTitle: 'Tax & invoicing note',
    calloutBody:
      'All quoted rates are exclusive of 5% Oman Value Added Tax (VAT), which shall be applied in accordance with Sultanate tax regulations.',
  },
  {
    number: '06',
    title: 'Next Steps',
    body: `We welcome the opportunity to finalize the operational schedule with your project team and initiate mobilization upon formal award.\n\nOur commercial and technical leads are available for an immediate clarification meeting or joint site walkdown at your convenience.`,
    focusTitle: 'Immediate actions to proceed',
    bullets: [
      'Confirm preferred container quantities and collection frequencies.',
      'Conduct pre-mobilization site access and HSE alignment check.',
      'Issue Purchase Order / Call-Off Agreement to trigger deployment.',
    ],
    calloutTitle: 'Primary point of contact',
    calloutBody:
      'Ahmed Al-Maamari · Commercial Team · PGS Oman Environmental Services (proposals@pgsoman.com | +968 2450 8800).',
  },
];

const DEFAULT_RECENT_DOCS = [
  {
    id: 'doc-rec-1',
    name: 'Environmental Services Proposal',
    status: 'Draft',
    lastUpdated: 'Today, 10:42',
    owner: 'Ahmed A.',
    refNumber: 'PGS-DOC-2026-014',
    version: 'Version 1.0',
  },
  {
    id: 'doc-rec-2',
    name: 'Site Environmental Management Plan',
    status: 'Ready to export',
    lastUpdated: 'Yesterday, 15:20',
    owner: 'Ahmed A.',
    refNumber: 'PGS-DOC-2026-013',
    version: 'Version 2.1',
  },
  {
    id: 'doc-rec-3',
    name: 'Waste Management Capability Statement',
    status: 'Exported',
    lastUpdated: '06 Nov 2026',
    owner: 'Ahmed A.',
    refNumber: 'PGS-DOC-2026-009',
    version: 'Version 1.0',
  },
];

export default function DocumentAndPDFBuilder({
  emails = [],
  settings,
  currentUser,
  syncedGmailAccounts = [],
  syncingGmail = false,
  onSyncGmail,
  onSaveProfile,
  onDeleteGmailAccount,
  onOpenGmailSettings,
  onLogout,
  onToggleLang,
  onStartTour,
  onSimulateMail,
  onOpenSystemSettings,
  lang = 'en',
  showToast,
  onDocumentGeneratedForEmail,
}) {
  // Stepper state: 1 = Choose a starting point (Hub), 2 = Create & edit (Editor), 3 = Review & export (Preview)
  const [activeStep, setActiveStep] = useState(1);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const templateFileInputRef = useRef(null);

  // Recent documents state & filter
  const [recentDocs, setRecentDocs] = useState(DEFAULT_RECENT_DOCS);
  const [recentSearch, setRecentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Step 2: Editor state
  const [docTitle, setDocTitle] = useState('Environmental Services Proposal');
  const [docRef, setDocRef] = useState('PGS-DOC-2026-014');
  const [docVersion, setDocVersion] = useState('Version 1.0');
  const [docStatus, setDocStatus] = useState('Draft');
  const [lastSavedLabel, setLastSavedLabel] = useState('Today, 10:42');
  const [sections, setSections] = useState(DEFAULT_SECTIONS_SCRATCH);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Right AI Panel in Step 2
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [isListening, setIsListening] = useState(false);
  const [generatingSection, setGeneratingSection] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuccessBanner, setAiSuccessBanner] = useState(null);
  const [undoSectionSnapshot, setUndoSectionSnapshot] = useState(null);
  const recognitionRef = useRef(null);

  // Project context supporting files & linked email
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [linkedEmailId, setLinkedEmailId] = useState('');
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const supportingFileInputRef = useRef(null);

  // Step 3: Review & Export settings state
  const [exportFileName, setExportFileName] = useState('PGS_Environmental_Services_Proposal_v1.pdf');
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('Portrait');
  const [includeLetterhead, setIncludeLetterhead] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeDraftWatermark, setIncludeDraftWatermark] = useState(true);
  const [previewPage, setPreviewPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(75);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);

  useEffect(() => {
    loadTemplates();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    // Keep export filename synced with document title
    const clean = (docTitle || 'Document')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setExportFileName(`PGS_${clean}_v1.pdf`);
  }, [docTitle]);

  const loadTemplates = async () => {
    try {
      const res = await apiFetch('/api/templates');
      const data = await res.json();
      if (data?.templates && data.templates.length > 0) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.warn('Failed to fetch templates:', err);
    }
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'ar' ? 'ar-OM' : 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setAiPrompt((prev) =>
            prev ? `${prev.trim()} ${transcript.trim()}`.slice(0, 2000) : transcript.trim()
          );
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      showToast?.('Voice input requires Google Chrome or Edge.', 'warning');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast?.('Voice recording stopped.', 'info');
    } else {
      try {
        recognitionRef.current.lang = lang === 'ar' ? 'ar-OM' : 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
        showToast?.('Listening... Speak your project brief now.', 'info');
      } catch {
        setIsListening(false);
      }
    }
  };

  // Start From Scratch (No Template)
  const handleGenerateFromScratch = () => {
    setSelectedTemplate(null);
    setDocTitle('Environmental Services Proposal');
    setDocRef(`PGS-DOC-2026-0${Math.floor(14 + Math.random() * 80)}`);
    setDocStatus('Draft');
    setSections(DEFAULT_SECTIONS_SCRATCH);
    setActiveSectionIndex(0);
    setPreviewPage(1);
    setActiveStep(2);
  };

  // Start From a Template Card
  const handleUseTemplate = (tplObj) => {
    setSelectedTemplate(tplObj);
    const isRfq = tplObj.id === 'oq_rfq' || (tplObj.title || '').includes('6000061376');
    const title = isRfq
      ? 'OQ RFQ 6000061376 Commercial Bid Proposal'
      : (tplObj.title || '').replace(/\s*Template$/i, '');
    setDocTitle(title);
    setDocRef(isRfq ? 'PGS-OQ-6000061376-2026' : 'PGS-SOW-OLIGOMER-V3');
    setDocStatus('Draft');

    if (isRfq) {
      setSections([
        {
          number: '01',
          title: 'Executive Summary',
          body: `PGS Oman (Vendor Code 12169, JSRS Certified) submits this formal commercial and technical proposal in response to OQ Refineries and Petroleum Industries (OQ RPI) RFQ No. 6000061376 (Collective No. 9900048325).\n\nOur proposal provides a 100% in-country recycling and recovery solution for Oligomer waste at our licensed Sohar Industrial Estate facility, guaranteeing full environmental compliance and commercial value back to OQ RPI.`,
          focusTitle: 'Key bid highlights',
          bullets: [
            'Primary Offer (SoW Sec 10): 85.000 OMR / Ton payable to OQ RPI within 7 calendar days.',
            'Alternative Turnkey Service Option (RFQ Cl 2.1): 110.000 OMR / Ton (30-day credit).',
            'Full compliance with 90-day bid validity and zero deviations to OQ standard terms.',
          ],
          calloutTitle: 'To be confirmed with the client',
          calloutBody:
            'Final award schedule and initial 50 Metric Ton inventory call-off batch dates to be aligned upon contract signature.',
        },
        {
          number: '02',
          title: 'Commercial Pricing',
          body: `All quantities are determined strictly by OQ RPI calibrated weighbridge net weight (Metric Tons). Pricing covers drum/IBC loading support, ADR-certified hazardous transport, 4-stage vacuum fractional distillation, and issuance of official Recycling Certificates.\n\nTotal estimated 3-year contract value across 140 Metric Tons (50T inventory + 30T/year) is 11,900.000 OMR (excluding 5% Oman VAT).`,
          focusTitle: 'Commercial schedule breakdown',
          bullets: [
            'On-Site Inventory (50 Metric Tons): 85.000 OMR/Ton = 4,250.000 OMR.',
            '3-Year Call-Off Generation (90 Metric Tons): 85.000 OMR/Ton = 7,650.000 OMR.',
            'Weighbridge reconciliation and payment settlement within 7 calendar days.',
          ],
          calloutTitle: 'Commercial compliance note',
          calloutBody:
            'In accordance with Tawreed portal rules, this commercial submission is uploaded directly without copying individual procurement officers.',
        },
        {
          number: '03',
          title: 'HSE & Permits',
          body: `PGS Oman holds active Environment Authority (EA) Hazardous Waste License #EA-WM-4092 and Civil Defence & Ambulance Authority (CDAA) Permit #CDAA-SH-8821 for flammable hydrocarbon processing (Flash Point 56 °C).\n\nClosed-loop nitrogen blanketing, ATEX Zone 1 grounded pumps, and continuous LEL gas detection are enforced across all operations.`,
          focusTitle: 'Regulatory & HSE controls',
          bullets: [
            'Full compliance with Royal Decree No. 114/2001 and Be’ah manifest tracking.',
            'ADR-certified vacuum tankers and box trucks with spill containment kits.',
            'Zero environmental incidents or regulatory non-conformities since facility commissioning.',
          ],
          calloutTitle: 'Pre-bid sample verification',
          calloutBody:
            'PGS Oman confirms readiness to collect and analyze the 250g pre-bid oligomer sample at our Sohar laboratory.',
        },
        {
          number: '04',
          title: 'SLAs',
          body: `We commit to strict adherence to OQ RPI operational turnaround timelines and performance key performance indicators (KPIs) throughout the 3-year call-off period.\n\nEvery batch is tracked from loading at OQ RPI Suhar through distillation and final product certification.`,
          focusTitle: 'Guaranteed SLA commitments',
          bullets: [
            'Collection mobilization within 10 working days of written call-off notification.',
            'Complete recycling and issuance of Official Recycling Certificate within 60 calendar days.',
            '5-year statutory archive retention of all waste transfer, lab, and weighbridge records.',
          ],
          calloutTitle: 'Liquidated damages acceptance',
          calloutBody:
            'PGS Oman accepts OQ RPI standard SLA tracking and performance security provisions.',
        },
        {
          number: '05',
          title: 'Technical Methodology',
          body: `Incoming C6–C12+ oligomer waste is processed through PGS Oman's 4-stage vacuum fractional distillation unit at Sohar Industrial Estate, separating light C6–C9 industrial solvent naphtha (19.37%) and C10–C12+ fuel/flux blendstock (80.44%).`,
          focusTitle: 'Process advantages',
          bullets: [
            '>98.5% hydrocarbon recovery with zero landfilling or open incineration.',
            '100% in-country beneficial reuse within the Sultanate of Oman.',
            'Batch-by-batch ASTM D86, Karl Fischer moisture, and flash point certification.',
          ],
          calloutTitle: 'Facility inspection',
          calloutBody:
            'OQ RPI technical evaluators are invited to inspect our Sohar distillation plant at any time.',
        },
        {
          number: '06',
          title: 'Next Steps',
          body: `PGS Oman is ready to mobilize immediately upon contract award and complete the initial 50 Metric Ton inventory clearance ahead of schedule.`,
          focusTitle: 'Mobilization checklist',
          bullets: [
            'Collect 250g oligomer sample for lab confirmation.',
            'Conduct joint HSE & gate-pass induction at OQ RPI Suhar.',
            'Commence Batch #1 loading within 10 working days of call-off order.',
          ],
          calloutTitle: 'Authorized signatory',
          calloutBody:
            'Ahmed Al-Maamari · Commercial Team · PGS Oman Environmental Services.',
        },
      ]);
      setAiPrompt('');
    } else {
      setSections([
        {
          number: '01',
          title: 'Scope Overview',
          body: `This Technical Specification Response addresses Scope of Work (SoW V3) for the 3-Year Call-Off Contract for the Recycling, Recovery and/or Reuse of Oligomer Waste at OQ RPI Suhar.\n\nPGS Oman guarantees 100% in-country recycling and recovery of both the 50 Metric Ton on-site inventory (drums/IBCs) and the 30 Metric Ton/year ongoing generation.`,
          focusTitle: 'Scope coverage',
          bullets: [
            'Complete handling of liquid polymer C6–C12+ hydrocarbon oligomer stream.',
            'Provision of UN-approved IBCs/drums, vacuum transfer, and ADR transport.',
            '100% beneficial reuse inside the Sultanate of Oman per SoW Clause 5.a.',
          ],
          calloutTitle: 'To be confirmed with the client',
          calloutBody:
            'Exact drum/IBC staging bay coordinates at OQ RPI Suhar hazardous waste storage yard to be confirmed prior to first collection.',
        },
        {
          number: '02',
          title: 'Methodology',
          body: `Our Sohar Industrial Estate facility utilizes closed-loop 4-stage vacuum fractional distillation operating under reduced pressure to prevent thermal cracking.\n\nThe process yields two high-purity commercial cuts: Cut 1 (C6–C9 light naphtha solvent, ~19.37%) and Cut 2 (C10–C12+ industrial flux & blendstock, ~80.44%).`,
          focusTitle: 'Technical distillation stages',
          bullets: [
            'Stage 1: Reception, weighbridge logging, and 100-micron filtration.',
            'Stage 2: Pre-heating & dehydration to remove trace moisture (0.045 wt%).',
            'Stage 3 & 4: Vacuum fractionation & product stabilization with QA certification.',
          ],
          calloutTitle: 'Zero export / zero disposal guarantee',
          calloutBody:
            'No oligomer waste will be exported outside Oman or disposed of via landfilling.',
        },
        {
          number: '03',
          title: 'Resources & Equipment',
          body: `PGS Oman owns and operates a dedicated hazardous waste fleet and a 15,000 m² licensed treatment complex in Sohar Industrial Estate (Phase 4) with a capacity of 4,500 Tons/Year.`,
          focusTitle: 'Dedicated assets assigned',
          bullets: [
            '4-Stage Vacuum Fractional Distillation Unit (15 Tons/Day batch capacity).',
            'ADR-certified stainless steel vacuum tankers (25 m³) and curtain-side trucks.',
            'On-site analytical laboratory (ASTM D93 Flash Point, APHA 4500 Chlorine, Karl Fischer).',
          ],
          calloutTitle: 'Key personnel',
          calloutBody:
            'Led by Plant Manager (14 yrs experience), Senior Process Engineer (11 yrs), and NEBOSH-certified HSE Officer.',
        },
        {
          number: '04',
          title: 'HSE Controls',
          body: `Because oligomer waste exhibits a closed-cup Flash Point of 56 °C (Flammable Liquid Category 3) and 17.5% C6–C8 aromatics, rigorous vapor and static controls are enforced at every stage.`,
          focusTitle: 'Critical safety barriers',
          bullets: [
            'Closed-loop vapor recovery and nitrogen blanketing on all storage and process vessels.',
            'Continuous static grounding/earthing (<10 ohms) during drum/IBC pumping.',
            'Full flame-retardant PPE, multi-gas LEL monitors, and organic vapor respirators.',
          ],
          calloutTitle: 'Permits & licensing',
          calloutBody:
            'Operated strictly under Environment Authority License #EA-WM-4092 and CDAA Fire Safety Permit #CDAA-SH-8821.',
        },
        {
          number: '05',
          title: 'Commercial Approach',
          body: `In accordance with SoW Section 10, PGS Oman offers a direct purchase price of 85.000 OMR per Metric Ton payable to OQ RPI within 7 calendar days of weighbridge invoice.`,
          focusTitle: 'Commercial summary',
          bullets: [
            '50 Tons current inventory + 90 Tons 3-year generation = 11,900.000 OMR total value.',
            'Quantities verified strictly via OQ RPI calibrated weighbridge net weight.',
            'Compliant with 5% Oman VAT and 10% Advance Payment Bond provisions.',
          ],
          calloutTitle: ' Validity period',
          calloutBody:
            'Offer remains valid for 90 calendar days from tender submission date.',
        },
        {
          number: '06',
          title: 'Next Steps',
          body: `Upon tender award, PGS Oman will execute the 250g sample verification, complete OQ RPI site safety induction, and commence batch collection within 10 working days.`,
          focusTitle: 'Implementation timeline',
          bullets: [
            'Week 1: Contract signature, bond issuance, and joint site mobilization.',
            'Week 2: First batch collection and weighbridge ticketing at OQ RPI Suhar.',
            'Within 60 Days: Issuance of Batch #1 Certificate of Recycling & Mass Balance.',
          ],
          calloutTitle: 'Technical contact',
          calloutBody:
            'Ahmed Al-Maamari · Commercial Team · PGS Oman Environmental Services.',
        },
      ]);
      setAiPrompt('');
    }

    setAiSuccessBanner(null);
    setUndoSectionSnapshot(null);
    setActiveSectionIndex(0);
    setPreviewPage(1);
    setActiveStep(2);
  };

  // Upload Reference PDF to create a new template
  const handleUploadTemplateFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTemplate(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', `${file.name.replace(/\.[^.]+$/, '')} Template`);
    formData.append('category', 'Custom Reference');

    try {
      const res = await apiFetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload template PDF');

      if (data.templates) setTemplates(data.templates);
      showToast?.(`Extracted template structure from "${file.name}"!`, 'success');
      if (data.template) {
        handleUseTemplate(data.template);
      }
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setUploadingTemplate(false);
      if (templateFileInputRef.current) templateFileInputRef.current.value = '';
    }
  };

  // Add a new section in Step 2
  const handleAddSection = () => {
    const nextNum = String(sections.length + 1).padStart(2, '0');
    const newSec = {
      number: nextNum,
      title: `Additional Section ${sections.length + 1}`,
      body: `Enter detailed operational, technical, or commercial provisions for this section. You can type directly or use the AI assistant on the right to generate tailored text.`,
      focusTitle: 'Key points covered',
      bullets: [
        'Define specific project deliverables and timelines.',
        'Confirm applicable Oman regulatory and HSE standards.',
        'Specify resource allocation and reporting frequency.',
      ],
      calloutTitle: 'To be confirmed with the client',
      calloutBody:
        'Specific parameters for this section will be finalized during project kick-off.',
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setActiveSectionIndex(updated.length - 1);
    setLastSavedLabel('Just now');
  };

  // Update active section fields directly in the center editor
  const updateActiveSection = (field, value) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === activeSectionIndex ? { ...sec, [field]: value } : sec))
    );
    setLastSavedLabel('Just now');
  };

  const updateActiveSectionBullet = (bIdx, value) => {
    setSections((prev) =>
      prev.map((sec, idx) => {
        if (idx !== activeSectionIndex) return sec;
        const nextBullets = [...(sec.bullets || [])];
        nextBullets[bIdx] = value;
        return { ...sec, bullets: nextBullets };
      })
    );
    setLastSavedLabel('Just now');
  };

  // Undo last AI section edit
  const handleUndoAiEdit = () => {
    if (!undoSectionSnapshot) return;
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === undoSectionSnapshot.index ? { ...undoSectionSnapshot.section } : sec
      )
    );
    setUndoSectionSnapshot(null);
    setAiSuccessBanner(null);
    setLastSavedLabel('Reverted AI edit');
  };

  // Capture highlighted text inside the center editor
  const handleEditorTextSelection = () => {
    try {
      const sel = window.getSelection()?.toString()?.trim() || '';
      setSelectedText(sel.slice(0, 600));
    } catch {
      // ignore selection errors
    }
  };

  // Generate / Refine the currently selected section using the AI panel on the right
  const handleGenerateSelectedSection = async () => {
    const promptText = aiPrompt.trim();
    if (!promptText) {
      showToast?.('Please type your instructions or record a voice brief first.', 'warning');
      return;
    }

    setGeneratingSection(true);
    setAiSuccessBanner(null);

    // Check if the user's prompt explicitly names a different section in the document
    let targetIndex = activeSectionIndex;
    const lowerPrompt = promptText.toLowerCase();
    const matchedIdx = sections.findIndex(
      (s, idx) =>
        idx !== activeSectionIndex &&
        s.title &&
        s.title.length > 3 &&
        lowerPrompt.includes(s.title.toLowerCase())
    );
    if (matchedIdx !== -1) {
      targetIndex = matchedIdx;
      setActiveSectionIndex(matchedIdx);
    }

    const currentSec = sections[targetIndex] || sections[0];
    setUndoSectionSnapshot({ index: targetIndex, section: { ...currentSec, bullets: [...(currentSec.bullets || [])] } });

    try {
      const res = await apiFetch('/api/ai/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTitle,
          sectionTitle: currentSec.title,
          currentBody: currentSec.body,
          currentFocusTitle: currentSec.focusTitle,
          currentBullets: currentSec.bullets || [],
          currentCalloutTitle: currentSec.calloutTitle,
          currentCalloutBody: currentSec.calloutBody,
          selectedText,
          prompt: promptText,
          tone: aiTone,
          emailId: linkedEmailId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate section');

      const updatedTitle = data.title || currentSec.title;

      setSections((prev) =>
        prev.map((sec, idx) =>
          idx === targetIndex
            ? {
                ...sec,
                title: updatedTitle,
                body: data.body || sec.body,
                focusTitle: data.focusTitle || sec.focusTitle,
                bullets: Array.isArray(data.bullets) && data.bullets.length > 0 ? data.bullets : sec.bullets,
                calloutTitle: data.calloutTitle || sec.calloutTitle,
                calloutBody: data.calloutBody || sec.calloutBody,
              }
            : sec
        )
      );
      setLastSavedLabel('Updated by AI just now');
      setSelectedText('');
      setAiSuccessBanner({
        sectionNumber: currentSec.number,
        sectionTitle: updatedTitle,
        promptApplied: promptText,
      });
    } catch (err) {
      showToast?.(err.message || 'AI generation failed', 'error');
    } finally {
      setGeneratingSection(false);
    }
  };

  // Attach supporting file in Project Context card
  const handleAttachSupportingFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFiles((prev) => [
      ...prev,
      { name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB` },
    ]);
    showToast?.(`Attached supporting file "${file.name}" to project context.`, 'success');
    if (supportingFileInputRef.current) supportingFileInputRef.current.value = '';
  };

  // Save draft handler
  const handleSaveDraft = () => {
    setLastSavedLabel('Just now');
    setRecentDocs((prev) => {
      const exists = prev.some((d) => d.refNumber === docRef);
      if (exists) {
        return prev.map((d) =>
          d.refNumber === docRef
            ? { ...d, name: docTitle, lastUpdated: 'Just now', status: docStatus }
            : d
        );
      }
      return [
        {
          id: `doc-${Date.now()}`,
          name: docTitle,
          status: 'Draft',
          lastUpdated: 'Just now',
          owner: 'Ahmed A.',
          refNumber: docRef,
          version: docVersion,
        },
        ...prev,
      ];
    });
    showToast?.('Draft saved to Document Hub.', 'success');
  };

  // Generate & Download real PDF via backend
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const customSectionsPayload = sections.map((s, idx) => ({
        sectionNumber: idx + 1,
        title: `${s.number} ${s.title}`,
        content: `${s.body}\n\n${s.focusTitle}:\n${(s.bullets || [])
          .map((b) => `• ${b}`)
          .join('\n')}\n\n[${s.calloutTitle}]: ${s.calloutBody}`,
      }));

      const res = await apiFetch('/api/documents/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          prompt: aiPrompt,
          templateId: selectedTemplate?.templateId || null,
          emailId: linkedEmailId || null,
          preferredTone: aiTone,
          customSections: customSectionsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate PDF');

      setGeneratedPdfUrl(data.pdfUrl);
      setDocStatus('Exported');

      // Update recent documents list
      setRecentDocs((prev) => {
        const exists = prev.some((d) => d.name === docTitle);
        if (exists) {
          return prev.map((d) =>
            d.name === docTitle ? { ...d, status: 'Exported', lastUpdated: 'Just now' } : d
          );
        }
        return [
          {
            id: data.document?.documentId || `doc-${Date.now()}`,
            name: docTitle,
            status: 'Exported',
            lastUpdated: 'Just now',
            owner: 'Ahmed A.',
            refNumber: docRef,
            version: docVersion,
          },
          ...prev,
        ];
      });

      if (data.email && onDocumentGeneratedForEmail) {
        onDocumentGeneratedForEmail(
          data.generatedResponse,
          data.document,
          data.email,
          data.emails
        );
      }

      // Trigger browser download
      const link = document.createElement('a');
      link.href = `${data.pdfUrl}?download=1&t=${Date.now()}`;
      link.download = exportFileName || 'PGS_Oman_Proposal.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast?.(`Downloaded "${exportFileName}" & saved copy to Document Hub!`, 'success');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Calculate total words across sections
  const totalWords = sections.reduce((acc, s) => {
    const words = `${s.title} ${s.body} ${(s.bullets || []).join(' ')} ${s.calloutBody}`
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return acc + words;
  }, 0);

  const activeSection = sections[activeSectionIndex] || sections[0];
  const nextSection =
    activeSectionIndex < sections.length - 1 ? sections[activeSectionIndex + 1] : null;
  const previewSection = sections[Math.min(previewPage - 1, sections.length - 1)] || sections[0];
  const linkedEmailObj = emails.find((e) => e.id === linkedEmailId);

  const filteredRecentDocs = recentDocs.filter((doc) => {
    const matchesSearch =
      !recentSearch.trim() ||
      doc.name.toLowerCase().includes(recentSearch.toLowerCase()) ||
      doc.refNumber.toLowerCase().includes(recentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col min-h-full bg-[#F7F6F2] text-slate-900">
      {/* =====================================================================
          TOP BAR (Workspace > AI Document Builder + Settings & User Avatar)
         ===================================================================== */}
      <div className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-800">AI Document Builder</span>
        </div>

        <div className="flex items-center gap-3">
          {onToggleLang && (
            <TopSettingsDropdown
              lang={lang}
              onToggleLang={onToggleLang}
              onStartTour={onStartTour}
              onSimulateMail={onSimulateMail}
              onOpenSystemSettings={onOpenSystemSettings}
            />
          )}
          {onSaveProfile && (
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
          )}
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE CONTAINER
         ===================================================================== */}
      <div className="flex-1 flex flex-col px-6 lg:px-8 py-5 max-w-[1440px] w-full mx-auto space-y-5">
        {/* -------------------------------------------------------------------
            DOCUMENT STUDIO SUBHEADER + 3-STEP PROGRESS BAR
           ------------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#065F46]">
            DOCUMENT STUDIO
          </span>

          {/* 3-Step Pill Stepper */}
          <div className="flex items-center gap-6 text-xs">
            {/* Step 1: Choose a starting point */}
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {activeStep > 1 ? (
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#065F46] flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                    activeStep === 1
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  1
                </span>
              )}
              <span
                className={
                  activeStep === 1
                    ? 'font-extrabold text-slate-900'
                    : 'font-medium text-slate-500 group-hover:text-slate-800'
                }
              >
                Choose a starting point
              </span>
            </button>

            {/* Step 2: Create & edit */}
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              {activeStep > 2 ? (
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#065F46] flex items-center justify-center font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                    activeStep === 2
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-slate-200/80 text-slate-500'
                  }`}
                >
                  2
                </span>
              )}
              <span
                className={
                  activeStep === 2
                    ? 'font-extrabold text-slate-900'
                    : 'font-medium text-slate-400 group-hover:text-slate-700'
                }
              >
                Create &amp; edit
              </span>
            </button>

            {/* Step 3: Review & export */}
            <button
              type="button"
              onClick={() => {
                setDocStatus('Ready to export');
                setActiveStep(3);
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                  activeStep === 3
                    ? 'bg-[#064E3B] text-white'
                    : 'bg-slate-200/80 text-slate-500'
                }`}
              >
                3
              </span>
              <span
                className={
                  activeStep === 3
                    ? 'font-extrabold text-slate-900'
                    : 'font-medium text-slate-400 group-hover:text-slate-700'
                }
              >
                Review &amp; export
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            FRAME 1: CHOOSE A STARTING POINT (TEMPLATE & DOCUMENT HUB)
           =================================================================== */}
        {activeStep === 1 && (
          <div className="space-y-6">
            {/* Hero Emerald Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#042F24] via-[#064E3B] to-[#0B6B50] px-8 py-7 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  PRECISION IN EVERY PROPOSAL
                </div>
                <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight text-white leading-snug">
                  Generate Official PDF Documents &amp; Proposals
                </h1>
                <p className="text-sm text-emerald-100/85 font-normal">
                  Create tailored PDFs from scratch with AI voice input or use pre-approved tender templates.
                </p>
              </div>

              {/* Right Stacked Action Buttons */}
              <div className="flex flex-col gap-2.5 w-full sm:w-56 shrink-0">
                <button
                  type="button"
                  onClick={handleGenerateFromScratch}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#eab025] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate From Scratch</span>
                </button>

                <label className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer">
                  {uploadingTemplate ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#064E3B]" />
                  ) : (
                    <Upload className="w-4 h-4 text-[#064E3B]" />
                  )}
                  <span>{uploadingTemplate ? 'Uploading...' : 'Upload Template PDF'}</span>
                  <input
                    ref={templateFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleUploadTemplateFile}
                    disabled={uploadingTemplate}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Cream Notice Bar */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FDF6E7] border border-[#F5E0B5] text-xs text-[#7A5214]">
              <Info className="w-4 h-4 text-[#C27D1A] shrink-0" />
              <span className="font-medium">
                Default Reference Templates Active: OQ RFQ 6000061376 &amp; SoW Oligomer V3 ready to use.
              </span>
            </div>

            {/* Available Document Templates Section */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Available Document Templates
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Start with a reference. Tailor every section to your project.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {Math.max(2, templates.length)} reference templates
                </span>
              </div>

              {/* 2-Column Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Card 1: OQ RFQ 6000061376 Commercial Bid Template */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5">
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF4F0] text-[#065F46] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FDF3DC] text-[#8F5B0A] text-[11px] font-bold">
                        Reference Model
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-[17px] font-bold text-slate-900">
                        OQ RFQ 6000061376 Commercial Bid Template
                      </h3>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#EAF4F0] text-[#065F46] text-[11px] font-bold">
                          Tender &amp; Quotation
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Organize your commercial proposal with a consistent scope, pricing structure and supporting HSE information.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        '1. Executive Summary',
                        '2. Commercial Pricing',
                        '3. HSE & Permits',
                        '4. SLAs',
                      ].map((pill) => (
                        <span
                          key={pill}
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F2] text-slate-600 text-[11px] font-medium"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        REFERENCE FILE
                      </div>
                      <div className="text-xs font-medium text-slate-700 mt-0.5">
                        OQ_RFQ_6000061376.pdf
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUseTemplate({
                          id: 'oq_rfq',
                          templateId: 'tpl-rfq-6000061376',
                          title: 'OQ RFQ 6000061376 Commercial Bid Template',
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-[#0B5C46] hover:bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card 2: SoW Oligomer Technical Specification Template */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5">
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#EAF4F0] text-[#065F46] flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FDF3DC] text-[#8F5B0A] text-[11px] font-bold">
                        Reference Model
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-[17px] font-bold text-slate-900">
                        SoW Oligomer Technical Specification Template
                      </h3>
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#EAF4F0] text-[#065F46] text-[11px] font-bold">
                          Technical &amp; Scope
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Build a clear technical response around your proposed methodology, resources and environmental controls.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        '1. Scope Overview',
                        '2. Methodology',
                        '3. Resources & Equipment',
                        '4. HSE Controls',
                      ].map((pill) => (
                        <span
                          key={pill}
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F2] text-slate-600 text-[11px] font-medium"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        REFERENCE FILE
                      </div>
                      <div className="text-xs font-medium text-slate-700 mt-0.5">
                        SoW_Oligomer_V3.pdf
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleUseTemplate({
                          id: 'sow_oligomer',
                          templateId: 'tpl-sow-oligomer-v3',
                          title: 'SoW Oligomer Technical Specification Template',
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-[#0B5C46] hover:bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Use Template</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Any additional user-uploaded custom templates */}
                {templates
                  .filter(
                    (t) =>
                      t.templateId !== 'tpl-rfq-6000061376' &&
                      t.templateId !== 'tpl-sow-oligomer-v3'
                  )
                  .map((tpl) => (
                    <div
                      key={tpl.templateId}
                      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-[#EAF4F0] text-[#065F46] flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#065F46] text-[11px] font-bold">
                            Custom Uploaded
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-[17px] font-bold text-slate-900">{tpl.title}</h3>
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#EAF4F0] text-[#065F46] text-[11px] font-bold">
                            {tpl.category || 'Custom Structure'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {tpl.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(tpl.sections || []).slice(0, 4).map((pill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-md bg-[#F5F5F2] text-slate-600 text-[11px] font-medium"
                            >
                              {pill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            REFERENCE FILE
                          </div>
                          <div className="text-xs font-medium text-slate-700 mt-0.5">
                            {tpl.referenceFilename}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUseTemplate(tpl)}
                          className="px-4 py-2 rounded-xl bg-[#0B5C46] hover:bg-[#064E3B] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>Use Template</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Documents Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">Recent documents</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4F0] text-[#065F46] text-[11px] font-bold">
                    {filteredRecentDocs.length} documents
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
                    <input
                      type="text"
                      value={recentSearch}
                      onChange={(e) => setRecentSearch(e.target.value)}
                      placeholder="Search your documents"
                      className="ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#065F46] w-48"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setStatusFilter((prev) =>
                        prev === 'All'
                          ? 'Draft'
                          : prev === 'Draft'
                          ? 'Ready to export'
                          : prev === 'Ready to export'
                          ? 'Exported'
                          : 'All'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>{statusFilter === 'All' ? 'All statuses' : statusFilter}</span>
                  </button>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 px-6 py-2.5 bg-[#FAF9F5] border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <div className="col-span-6">DOCUMENT NAME</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-2">LAST UPDATED</div>
                <div className="col-span-2">OWNER</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-slate-100">
                {filteredRecentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setDocTitle(doc.name);
                      setDocRef(doc.refNumber);
                      setDocVersion(doc.version);
                      setDocStatus(doc.status);
                      setAiSuccessBanner(null);
                      setActiveStep(2);
                    }}
                    className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-slate-50/80 transition cursor-pointer text-xs"
                  >
                    <div className="col-span-6 flex items-center gap-3 font-semibold text-slate-800">
                      <FileText className="w-4 h-4 text-[#065F46] shrink-0" />
                      <span>{doc.name}</span>
                    </div>
                    <div className="col-span-2">
                      {doc.status === 'Draft' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FDF3DC] text-[#8F5B0A] text-[11px] font-semibold">
                          Draft
                        </span>
                      )}
                      {doc.status === 'Ready to export' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4F0] text-[#065F46] text-[11px] font-semibold">
                          Ready to export
                        </span>
                      )}
                      {doc.status === 'Exported' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4F0] text-[#065F46] text-[11px] font-semibold">
                          Exported
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-slate-500">{doc.lastUpdated}</div>
                    <div className="col-span-2 flex items-center justify-between text-slate-500">
                      <span>{doc.owner}</span>
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Subtle Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Reference files guide structure. Review all project details before issuing a document.</span>
              <span>Private to PGS Oman workspace</span>
            </div>
          </div>
        )}

        {/* ===================================================================
            FRAME 2: CREATE & EDIT (3-COLUMN AI PROPOSAL WORKSPACE)
           =================================================================== */}
        {activeStep === 2 && (
          <div className="space-y-4">
            {/* Back Link */}
            <div>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to document hub</span>
              </button>
            </div>

            {/* Document Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="text-2xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#065F46] focus:outline-none"
                  />
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FDF3DC] text-[#8F5B0A] text-[11px] font-bold">
                    {docStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {docRef} · {docVersion} · Illustrative working draft, not for issue
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600" />
                  <span>Save draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocStatus('Ready to export');
                    setPreviewPage(1);
                    setActiveStep(3);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#eab025] text-slate-950 text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </button>
              </div>
            </div>

            {/* Saved Status & Word Count Subbar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065F46]" />
                <span>All changes saved · {lastSavedLabel}</span>
              </div>
              <div>
                {sections.length} sections · {sections.length} pages · {totalWords} words
              </div>
            </div>

            {/* 3-Column Editor Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: Sections Navigation (2.5 / 12 cols -> col-span-3) */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800">Sections</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {sections.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {sections.map((sec, idx) => {
                      const isActive = idx === activeSectionIndex;
                      return (
                        <button
                          key={sec.number}
                          type="button"
                          onClick={() => setActiveSectionIndex(idx)}
                          className={`w-full text-start px-3 py-2.5 rounded-xl text-xs flex items-start gap-2.5 transition cursor-pointer ${
                            isActive
                              ? 'bg-[#EAF4F0] text-[#064E3B] font-bold'
                              : 'text-slate-600 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span
                            className={
                              isActive ? 'text-[#065F46] font-extrabold' : 'text-slate-400'
                            }
                          >
                            {sec.number}
                          </span>
                          <span className="leading-snug">{sec.title}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add section</span>
                  </button>
                </div>

                {/* Document Details Footer inside Left Sidebar */}
                <div className="pt-4 border-t border-slate-100 space-y-1.5 px-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    DOCUMENT DETAILS
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    {selectedTemplate ? selectedTemplate.title : 'Custom document PGS Oman letterhead'}
                  </div>
                  <div className="text-[11px] font-semibold text-[#065F46]">
                    {lang === 'ar' ? 'Arabic' : 'English'} · {pageSize} {orientation.toLowerCase()}
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: Rich Document Canvas (col-span-5) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
                {/* Formatting Toolbar */}
                <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-4 text-slate-500 text-xs">
                  <div className="flex items-center gap-1 font-medium text-slate-700 cursor-pointer">
                    <span>Normal text</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <button type="button" className="hover:text-slate-900 font-serif font-bold">
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="hover:text-slate-900">
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="hover:text-slate-900">
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="hover:text-slate-900">
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="hover:text-slate-900">
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="hover:text-slate-900">
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleUndoAiEdit}
                    disabled={!undoSectionSnapshot}
                    title="Undo last AI edit"
                    className="hover:text-slate-900 ms-auto disabled:opacity-30 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Editable Section Canvas Body */}
                <div
                  onMouseUp={handleEditorTextSelection}
                  onKeyUp={handleEditorTextSelection}
                  className="relative p-7 space-y-5 flex-1"
                >
                  {/* Live AI Generating Overlay on Center Document Canvas */}
                  {generatingSection && (
                    <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-[1px] flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="w-11 h-11 rounded-2xl bg-[#EAF4F0] text-[#065F46] flex items-center justify-center shadow-xs">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="text-sm font-bold text-[#06392A]">
                        Applying your AI prompt to Section {activeSection.number} ({activeSection.title})...
                      </div>
                      <div className="text-xs text-slate-500 max-w-xs">
                        Rewriting section content, key points, and callout box based on your instructions.
                      </div>
                    </div>
                  )}

                  {/* Inline AI Applied Banner (replaces confusing bottom-right popup) */}
                  {aiSuccessBanner && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-[#064E3B]">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold truncate">
                          AI updated Section {aiSuccessBanner.sectionNumber}: &ldquo;{aiSuccessBanner.sectionTitle}&rdquo;
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {undoSectionSnapshot && (
                          <button
                            type="button"
                            onClick={handleUndoAiEdit}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-[11px] font-bold text-[#064E3B] cursor-pointer"
                          >
                            Undo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAiSuccessBanner(null)}
                          className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#065F46]">
                      SECTION {activeSection.number} / {String(sections.length).padStart(2, '0')}
                    </span>
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </div>

                  <input
                    type="text"
                    value={activeSection.title}
                    onChange={(e) => updateActiveSection('title', e.target.value)}
                    className="w-full text-2xl font-bold text-[#06392A] bg-transparent focus:outline-none border-b border-transparent focus:border-slate-200 pb-1"
                  />

                  <textarea
                    rows={8}
                    value={activeSection.body}
                    onChange={(e) => updateActiveSection('body', e.target.value)}
                    className={`w-full text-xs text-slate-700 leading-relaxed bg-transparent focus:outline-none resize-y rounded-lg transition-colors ${
                      aiSuccessBanner ? 'bg-emerald-50/40 p-2 -mx-2' : ''
                    }`}
                  />

                  <div className="space-y-2.5 pt-1">
                    <input
                      type="text"
                      value={activeSection.focusTitle}
                      onChange={(e) => updateActiveSection('focusTitle', e.target.value)}
                      className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none w-full"
                    />
                    <ul className="space-y-2 ps-4 list-disc text-xs text-slate-600">
                      {(activeSection.bullets || []).map((bullet, bIdx) => (
                        <li key={bIdx}>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateActiveSectionBullet(bIdx, e.target.value)}
                            className="w-full bg-transparent focus:outline-none text-slate-600"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cream Callout Box at Bottom of Section */}
                  <div className="p-4 rounded-xl bg-[#FDF6E7] border border-[#F5E0B5] space-y-1">
                    <input
                      type="text"
                      value={activeSection.calloutTitle}
                      onChange={(e) => updateActiveSection('calloutTitle', e.target.value)}
                      className="text-[11px] font-bold text-[#8F5B0A] bg-transparent focus:outline-none w-full"
                    />
                    <textarea
                      rows={2}
                      value={activeSection.calloutBody}
                      onChange={(e) => updateActiveSection('calloutBody', e.target.value)}
                      className="w-full text-[11px] text-[#7A5214] bg-transparent focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Bottom Section Navigation Bar */}
                <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Editing section {activeSectionIndex + 1} of {sections.length}
                  </span>
                  {nextSection ? (
                    <button
                      type="button"
                      onClick={() => setActiveSectionIndex(activeSectionIndex + 1)}
                      className="font-bold text-[#065F46] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next: {nextSection.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDocStatus('Ready to export');
                        setActiveStep(3);
                      }}
                      className="font-bold text-[#065F46] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Proceed to Review &amp; export</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: AI Assistant + Project Context (col-span-4) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Card 1: Your proposal, shaped by AI */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-[#065F46]" />
                      <span>Your proposal, shaped by AI</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Describe the project in your own words. Add context before generating or refining a section.
                    </p>
                  </div>

                  {/* Prominent Voice Input Box */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`w-full py-5 px-4 rounded-xl border transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isListening
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-[#EAF4F0]/80 hover:bg-[#EAF4F0] border-[#CDE4DC]'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xs ${
                        isListening ? 'bg-rose-600 animate-pulse' : 'bg-[#065F46]'
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {isListening ? 'Listening... Click to stop' : 'Speak your project brief'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Ready to record · English or Arabic
                    </div>
                  </button>

                  {/* OR TYPE YOUR INSTRUCTIONS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        OR TYPE YOUR INSTRUCTIONS
                      </span>
                      {aiPrompt.trim() && (
                        <button
                          type="button"
                          onClick={() => setAiPrompt('')}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {selectedText && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-[11px] text-[#064E3B]">
                        <span className="truncate font-medium">
                          Editing selected text: &ldquo;{selectedText}&rdquo;
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedText('')}
                          className="text-emerald-700 hover:text-emerald-950 shrink-0 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="rounded-xl bg-[#F7F6F2] border border-slate-200/90 p-3 space-y-2">
                      <textarea
                        rows={4}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value.slice(0, 2000))}
                        placeholder={`Type instructions to edit "${activeSection.title}" (e.g., change pricing to 75 OMR/ton, add 24/7 emergency response, or rewrite in 3 bullet points)...`}
                        className="w-full text-xs text-slate-700 bg-transparent focus:outline-none resize-none leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowEmailPicker(!showEmailPicker)}
                          title="Link received client email as context"
                          className="hover:text-[#065F46] transition cursor-pointer flex items-center gap-1"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <span>
                          Target: Sec {activeSection.number} ({activeSection.title}) · {aiPrompt.length} / 2,000
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tone Selector Row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">Tone</span>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Technical">Technical</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  {/* Generate Selected Section Golden Button */}
                  <button
                    type="button"
                    onClick={handleGenerateSelectedSection}
                    disabled={generatingSection}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#eab025] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    {generatingSection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {generatingSection ? 'Generating section...' : 'Generate selected section'}
                    </span>
                  </button>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    All suggestions are drafts. Check accuracy and confirm all project-specific details.
                  </p>
                </div>

                {/* Card 2: Project context (Supporting files & Received client mail reference) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <FolderOpen className="w-4 h-4 text-[#065F46]" />
                    <span>Project context</span>
                  </div>

                  {attachedFiles.length === 0 && !linkedEmailObj ? (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      No project files attached. Add a brief or reference to guide your draft.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {linkedEmailObj && (
                        <div className="p-2.5 rounded-xl bg-[#EAF4F0]/60 border border-[#CDE4DC] flex items-start justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-bold text-[#064E3B] truncate">
                              Mail: {linkedEmailObj.companyName || linkedEmailObj.fromName}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {linkedEmailObj.subject}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLinkedEmailId('')}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {attachedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-700 truncate">{f.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ms-2">{f.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optional Email Reference Selector Drawer */}
                  {showEmailPicker && (
                    <div className="pt-1 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Reference Received Client Mail
                      </label>
                      <select
                        value={linkedEmailId}
                        onChange={(e) => {
                          setLinkedEmailId(e.target.value);
                          setShowEmailPicker(false);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:outline-none"
                      >
                        <option value="">-- Choose an incoming email --</option>
                        {emails.map((em) => (
                          <option key={em.id} value={em.id}>
                            {em.companyName || em.fromName} — {em.subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-1">
                    <label className="inline-flex items-center gap-1 text-xs font-bold text-[#065F46] hover:underline cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach supporting file</span>
                      <input
                        ref={supportingFileInputRef}
                        type="file"
                        onChange={handleAttachSupportingFile}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowEmailPicker(!showEmailPicker)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#065F46] cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Link email</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            FRAME 3: REVIEW & EXPORT (PDF PREVIEWER + EXPORT SETTINGS)
           =================================================================== */}
        {activeStep === 3 && (
          <div className="space-y-4">
            {/* Back Link */}
            <div>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to editor</span>
              </button>
            </div>

            {/* Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">Review your document</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF4F0] text-[#065F46] text-[11px] font-bold">
                    Ready to export
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {docTitle} · {docRef} · {docVersion}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Return to edit</span>
              </button>
            </div>

            {/* Main 2-Part Layout: Left Preview Window (8 cols) + Right Export Settings (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: PDF Viewer Container with Page Thumbnails & A4 Sheet */}
              <div className="lg:col-span-8 bg-[#F0EFEA] rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs flex flex-col">
                {/* Viewer Top Control Bar */}
                <div className="bg-white px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-3">
                    <PanelLeft className="w-4 h-4 text-slate-400" />
                    <div className="h-4 w-px bg-slate-200" />
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold text-slate-800">
                      Page {previewPage} of {sections.length}
                    </span>
                    <button
                      type="button"
                      disabled={previewPage >= sections.length}
                      onClick={() => setPreviewPage((p) => Math.min(sections.length, p + 1))}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                      className="px-1.5 py-0.5 hover:bg-slate-100 rounded font-bold"
                    >
                      −
                    </button>
                    <span className="font-semibold text-slate-700">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(110, z + 10))}
                      className="px-1.5 py-0.5 hover:bg-slate-100 rounded font-bold"
                    >
                      +
                    </button>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 ms-1" />
                  </div>
                </div>

                {/* Viewer Body: Left Thumbnail Strip + Center A4 Paper */}
                <div className="flex p-6 gap-6 min-h-[680px]">
                  {/* Left Thumbnail Strip */}
                  <div className="w-20 shrink-0 space-y-3 overflow-y-auto pe-1">
                    {sections.map((sec, idx) => {
                      const pageNum = idx + 1;
                      const active = pageNum === previewPage;
                      return (
                        <div key={sec.number} className="text-center space-y-1">
                          <button
                            type="button"
                            onClick={() => setPreviewPage(pageNum)}
                            className={`w-16 h-22 mx-auto rounded-md bg-white p-2 flex flex-col justify-between transition cursor-pointer shadow-2xs ${
                              active
                                ? 'ring-2 ring-[#065F46] border border-[#065F46]'
                                : 'border border-slate-200 hover:border-slate-300 opacity-80'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="h-1 w-8 bg-[#065F46] rounded-full" />
                              <div className="h-0.5 w-full bg-amber-400" />
                              <div className="h-1 w-10 bg-slate-200 rounded-full mt-1" />
                              <div className="h-1 w-full bg-slate-100 rounded-full" />
                              <div className="h-1 w-full bg-slate-100 rounded-full" />
                              <div className="h-1 w-8 bg-slate-100 rounded-full" />
                            </div>
                            <div className="h-2 w-full bg-[#FDF6E7] rounded-xs" />
                          </button>
                          <span
                            className={`text-[10px] block ${
                              active ? 'font-bold text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {pageNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Center A4 White Paper Sheet */}
                  <div className="flex-1 flex justify-center items-start overflow-auto">
                    <div
                      className="bg-white rounded-sm shadow-md border border-slate-200/70 p-10 w-full max-w-[580px] min-h-[640px] flex flex-col justify-between transition-all"
                      style={{
                        transform: `scale(${zoomLevel / 75})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      <div className="space-y-6">
                        {/* A4 Letterhead Header */}
                        {includeLetterhead && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-[#EAF4F0] text-[#065F46] flex items-center justify-center text-xs font-black">
                                  ♻
                                </span>
                                <span className="text-base font-extrabold text-[#06392A] tracking-tight">
                                  PGS Oman
                                </span>
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                ENVIRONMENTAL SERVICES SULTANATE OF OMAN
                              </span>
                            </div>
                            <div className="h-[2px] w-full bg-gradient-to-r from-[#065F46] via-[#065F46] to-[#F5B82E]" />
                          </div>
                        )}

                        {/* Document Proposal Metadata & Main Title */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#065F46]">
                            PROPOSAL · {docRef}
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900">{docTitle}</h2>
                          <div className="text-[10px] text-slate-400">
                            09 November 2026 / {docVersion}
                          </div>
                        </div>

                        {/* Active Page Section Content */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          <h3 className="text-sm font-bold text-[#06392A]">
                            {previewSection.number} {previewSection.title}
                          </h3>

                          <div className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                            {previewSection.body}
                          </div>

                          <div className="space-y-2 pt-1">
                            <div className="text-xs font-bold text-slate-900">
                              {previewSection.focusTitle}
                            </div>
                            <ul className="space-y-1.5 ps-4 list-disc text-[11px] text-slate-600">
                              {(previewSection.bullets || []).map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3.5 rounded-lg bg-[#FDF6E7] border-s-2 border-[#D99B26] space-y-1 mt-4">
                            <div className="text-[10px] font-bold text-slate-800">
                              {previewSection.calloutTitle}
                            </div>
                            <div className="text-[10px] text-slate-600 leading-relaxed">
                              {previewSection.calloutBody}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* A4 Page Footer */}
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 mt-8">
                        <span>
                          {includeDraftWatermark
                            ? 'ILLUSTRATIVE WORKING DRAFT · NOT FOR ISSUE'
                            : 'OFFICIAL PGS OMAN DOCUMENT'}
                        </span>
                        {includePageNumbers && (
                          <span>
                            {previewPage} / {sections.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Export Settings + Document Checks (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Export Settings Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Export settings</h3>
                    <SlidersHorizontal className="w-4 h-4 text-[#065F46]" />
                  </div>

                  {/* File Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 block">
                      File name
                    </label>
                    <input
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#065F46]"
                    />
                  </div>

                  {/* Page Size & Orientation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 block">
                        Page size
                      </label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none"
                      >
                        <option value="A4">A4</option>
                        <option value="Letter">Letter</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 block">
                        Orientation
                      </label>
                      <select
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none"
                      >
                        <option value="Portrait">Portrait</option>
                        <option value="Landscape">Landscape</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* Toggle 1: Company letterhead */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Company letterhead</div>
                        <div className="text-[11px] text-slate-400">PGS Oman branding</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeLetterhead(!includeLetterhead)}
                        className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                          includeLetterhead ? 'bg-[#065F46]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            includeLetterhead ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 2: Page numbers */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Page numbers</div>
                        <div className="text-[11px] text-slate-400">Footer on every page</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludePageNumbers(!includePageNumbers)}
                        className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                          includePageNumbers ? 'bg-[#065F46]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            includePageNumbers ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle 3: Draft watermark */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Draft watermark</div>
                        <div className="text-[11px] text-slate-400">
                          Keep "Not for issue" visible
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeDraftWatermark(!includeDraftWatermark)}
                        className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                          includeDraftWatermark ? 'bg-[#065F46]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            includeDraftWatermark ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Summary Line */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {sections.length} pages · PDF document
                    </span>
                    <span className="font-bold text-[#065F46]">Print ready</span>
                  </div>

                  {/* Golden Download PDF Button */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full py-3 px-4 rounded-xl bg-[#F5B82E] hover:bg-[#eab025] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                  </button>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A copy will also be saved to your document hub. This export remains a working draft.
                  </p>
                </div>

                {/* Document Checks Card */}
                <div className="bg-[#EAF4F0]/70 rounded-2xl border border-[#CDE4DC] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Document checks</span>
                    <span className="text-[11px] font-bold text-[#065F46]">4 of 4</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
                      <span>All {sections.length} sections included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
                      <span>Page layout checked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
                      <span>Letterhead applied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
                      <span>Draft label included</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    Layout checks only. Confirm technical and commercial details before client issue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

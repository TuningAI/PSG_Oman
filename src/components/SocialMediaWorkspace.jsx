import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Copy,
  Download,
  Send,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Share2,
  Loader2,
  Check,
  Building2,
  Globe,
  Hash,
  Sliders,
  ExternalLink,
  X,
  FileImage,
  Layers,
  Mic,
  MicOff,
  Save,
  FileText,
} from 'lucide-react';

const CAMPAIGN_PRESETS = [
  {
    title: '🚛 Fleet Mobilization',
    prompt:
      'Showcase our heavy-duty 30 CBM RoRo containers and 7 CBM chain-lift skip trucks deployed across Sohar Freezone and Muscat industrial hubs with 24-hour replacement SLA.',
    templateStyle: 'executive-emerald',
  },
  {
    title: '♻️ Recycling & ISO 14001',
    prompt:
      'Highlight our cardboard, plastic, and industrial scrap segregation service that provides official monthly ESG & ISO 14001 Recycling Diversion Certificates to Omani businesses.',
    templateStyle: 'eco-light',
  },
  {
    title: '🛡️ Hazardous Waste Safety',
    prompt:
      'Promote our ADR-certified hazardous sludge and chemical drum transport with full 5-part Environment Authority manifest documentation and zero-incident HSE compliance.',
    templateStyle: 'industrial-slate',
  },
  {
    title: '🏗️ Construction Site Support',
    prompt:
      'Partnering with major civil and commercial construction contractors in Muscat and Duqm for turnkey Construction & Demolition (C&D) waste removal and site sewage tankers.',
    templateStyle: 'amber-spotlight',
  },
];

const TEMPLATE_STYLES = [
  { id: 'executive-emerald', name: 'Executive Emerald', badge: 'bg-emerald-600' },
  { id: 'industrial-slate', name: 'Industrial Slate', badge: 'bg-slate-800' },
  { id: 'eco-light', name: 'Clean Eco Green', badge: 'bg-teal-600' },
  { id: 'amber-spotlight', name: 'Amber Project Card', badge: 'bg-amber-600' },
];

/**
 * Helper to wrap text on HTML5 Canvas
 */
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = (text || '').split(' ');
  let line = '';
  let linesDrawn = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      linesDrawn++;
      if (linesDrawn >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

/**
 * Helper to draw rounded rectangle on HTML5 Canvas
 */
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws a rich industrial waste-management illustration on the canvas when no custom photo is uploaded
 */
function drawGeneratedSceneIllustration(ctx, sceneType, x, y, w, h) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 24);
  ctx.clip();

  // Sky / Industrial backdrop gradient
  const skyGrad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (sceneType === 'hazardous-safety') {
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
  } else if (sceneType === 'recycling-facility') {
    skyGrad.addColorStop(0, '#064e3b');
    skyGrad.addColorStop(1, '#047857');
  } else {
    skyGrad.addColorStop(0, '#065f46');
    skyGrad.addColorStop(0.6, '#0f766e');
    skyGrad.addColorStop(1, '#115e59');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(x, y, w, h);

  // Subtle geometric grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let gx = x; gx < x + w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += 48) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  // Glowing sun / industrial radial accent
  const glow = ctx.createRadialGradient(x + w * 0.78, y + h * 0.25, 10, x + w * 0.78, y + h * 0.25, 220);
  glow.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
  glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // Distant mountain silhouette (representing Oman's Hajar Mountains landscape)
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.68);
  ctx.lineTo(x + w * 0.2, y + h * 0.48);
  ctx.lineTo(x + w * 0.45, y + h * 0.62);
  ctx.lineTo(x + w * 0.7, y + h * 0.42);
  ctx.lineTo(x + w * 0.9, y + h * 0.58);
  ctx.lineTo(x + w, y + h * 0.52);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.fill();

  // Modern Industrial Facility / Logistics Ground
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y + h * 0.64, w, h * 0.36);

  // Concrete Road & Safety Markings
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y + h * 0.76, w, h * 0.24);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.setLineDash([28, 22]);
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.88);
  ctx.lineTo(x + w, y + h * 0.88);
  ctx.stroke();
  ctx.setLineDash([]);

  // Prominent PGS Waste Management Truck & Skip Container Illustration
  const truckX = x + w * 0.18;
  const truckY = y + h * 0.52;

  // Heavy Skip / RoRo Container (Emerald Green)
  drawRoundedRect(ctx, truckX + 35, truckY - 10, 290, 118, 14);
  const containerGrad = ctx.createLinearGradient(truckX + 35, truckY, truckX + 325, truckY + 118);
  containerGrad.addColorStop(0, '#059669');
  containerGrad.addColorStop(1, '#047857');
  ctx.fillStyle = containerGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#34d399';
  ctx.stroke();

  // Container ribs
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let rib = truckX + 75; rib < truckX + 300; rib += 42) {
    ctx.fillRect(rib, truckY, 8, 98);
  }

  // Large White "PGS OMAN" on Skip
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Inter, sans-serif';
  ctx.fillText('PGS OMAN', truckX + 90, truckY + 62);
  ctx.font = '700 12px Inter, sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText('WASTE & RECYCLING SERVICES', truckX + 90, truckY + 84);

  // Truck Cab
  drawRoundedRect(ctx, truckX + 348, truckY + 25, 115, 85, 12);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Windshield
  drawRoundedRect(ctx, truckX + 395, truckY + 36, 58, 36, 6);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Cab door stripe
  ctx.fillStyle = '#10b981';
  ctx.fillRect(truckX + 355, truckY + 80, 98, 14);

  // Chassis
  ctx.fillStyle = '#334155';
  ctx.fillRect(truckX - 10, truckY + 108, 480, 16);

  // Wheels
  const wheelPositions = [truckX + 45, truckX + 125, truckX + 275, truckX + 410];
  wheelPositions.forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, truckY + 128, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wx, truckY + 128, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
  });

  // Floating ISO / Be'ah Verification Stamp on top-right of scene
  drawRoundedRect(ctx, x + w - 265, y + 22, 240, 56, 14);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText('✓ BE’AH & EA LICENSED', x + w - 245, y + 46);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillText('ISO 14001 • 24/7 FLEET SLA', x + w - 245, y + 66);

  ctx.restore();
}

export default function SocialMediaWorkspace({
  socialPosts = [],
  settings,
  onUpdateSocialPosts,
  onSaveSettings,
  showToast,
}) {
  const [selectedPostId, setSelectedPostId] = useState(socialPosts[0]?.id || null);
  const [promptInput, setPromptInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [templateStyle, setTemplateStyle] = useState('executive-emerald');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Target platforms state (controlled via top LinkedIn / Instagram buttons)
  const [activePlatforms, setActivePlatforms] = useState(['linkedin', 'instagram']);
  const [selectedHistoryTab, setSelectedHistoryTab] = useState('all'); // 'all' | 'linkedin' | 'instagram'

  // Social Account Modal state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [socialAccountsForm, setSocialAccountsForm] = useState(
    settings?.socialAccounts || {
      linkedin: {
        connected: true,
        companyPageName: 'PGS Oman — Premier Green Environmental Services LLC',
        handle: 'linkedin.com/company/pgs-oman-environmental',
      },
      instagram: {
        connected: true,
        username: '@pgs.oman.official',
        bioName: 'PGS Oman | Waste & Environmental Contracting',
      },
    }
  );

  // Rendered Poster DataURL from HTML5 Canvas
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [posterDataUrl, setPosterDataUrl] = useState('');

  // Generated Post Text Content state (with tabs, manual edit, and 1-click copy)
  const [activeContentTab, setActiveContentTab] = useState('linkedin'); // 'linkedin' | 'instagram'
  const [editablePostText, setEditablePostText] = useState('');
  const [isTextEdited, setIsTextEdited] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Speech Recognition (Voice Input Mic) state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const selectedPost =
    socialPosts.find((p) => p.id === selectedPostId) || socialPosts[0] || null;

  // Sync post content text when selected post or platform content tab changes
  useEffect(() => {
    if (!selectedPost) {
      setEditablePostText('');
      setIsTextEdited(false);
      return;
    }
    if (activeContentTab === 'linkedin') {
      setEditablePostText(selectedPost.linkedinCaption || '');
    } else {
      const igText = selectedPost.instagramCaption || '';
      const tags = Array.isArray(selectedPost.hashtags)
        ? selectedPost.hashtags.join(' ')
        : selectedPost.hashtags || '';
      setEditablePostText(tags ? `${igText}\n\n${tags}` : igText);
    }
    setIsTextEdited(false);
  }, [selectedPostId, activeContentTab, socialPosts]);

  const handleTextChange = (e) => {
    setEditablePostText(e.target.value);
    setIsTextEdited(true);
  };

  const handleCopyCurrentContent = () => {
    if (!editablePostText) {
      showToast('No generated post text to copy yet.', 'warning');
      return;
    }
    navigator.clipboard.writeText(editablePostText);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2200);
    showToast('Generated post text copied to clipboard!', 'success');
  };

  const handleSavePostContent = async () => {
    if (!selectedPost) return;
    try {
      const payload = {};
      if (activeContentTab === 'linkedin') {
        payload.linkedinCaption = editablePostText;
      } else {
        payload.instagramCaption = editablePostText;
      }

      const res = await fetch(`/api/social/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save edits');

      onUpdateSocialPosts(data.socialPosts, data.stats);
      setIsTextEdited(false);
      showToast('Post content updated and saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle Voice Input (Mic)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice recognition is not supported in this browser. Please use Chrome or Edge.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak your campaign prompt.', 'info');
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setPromptInput((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
          showToast('Voice prompt captured successfully!', 'success');
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access blocked. Please permit microphone access.', 'error');
        } else if (event.error !== 'no-speech') {
          showToast(`Voice input notice: ${event.error}`, 'warning');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      showToast('Could not start microphone: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (settings?.socialAccounts) {
      setSocialAccountsForm(settings.socialAccounts);
    }
  }, [settings?.socialAccounts]);

  // Keep selectedPostId updated if posts change
  useEffect(() => {
    if (!selectedPostId && socialPosts.length > 0) {
      setSelectedPostId(socialPosts[0].id);
    }
  }, [socialPosts, selectedPostId]);

  // Render the 1080x1080 Branded Social Media Poster on Canvas whenever selectedPost or companyProfile changes
  useEffect(() => {
    if (!selectedPost || !canvasRef.current) return;

    let isCancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    const vConfig = selectedPost.visualConfig || {};
    const style = vConfig.templateStyle || templateStyle || 'executive-emerald';
    const companyProfile = settings?.companyProfile || {};
    const photos = vConfig.uploadedPhotos || [];

    const renderCanvasPoster = async () => {
      // 1. Background Theme
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      if (style === 'industrial-slate') {
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
      } else if (style === 'eco-light') {
        bgGrad.addColorStop(0, '#064e3b');
        bgGrad.addColorStop(1, '#0f766e');
      } else if (style === 'amber-spotlight') {
        bgGrad.addColorStop(0, '#1c1917');
        bgGrad.addColorStop(1, '#292524');
      } else {
        // executive-emerald
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(0.5, '#064e3b');
        bgGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Decorative corner accent
      const accentColor = style === 'amber-spotlight' ? '#f59e0b' : '#10b981';
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, W, 14);

      // 2. Top Brand Header Bar
      drawRoundedRect(ctx, 56, 48, 64, 64, 16);
      ctx.fillStyle = accentColor;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px Inter, sans-serif';
      ctx.fillText('♻', 74, 91);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px Inter, sans-serif';
      const shortCompany = (companyProfile.companyName || 'PGS Oman').split('—')[0].trim();
      ctx.fillText(shortCompany.toUpperCase(), 138, 78);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText('ENVIRONMENTAL & WASTE MANAGEMENT CONTRACTING', 138, 105);

      // Category Badge Pill on Top Right
      const badgeText = (vConfig.categoryBadge || 'OPERATIONAL EXCELLENCE').toUpperCase();
      ctx.font = '800 17px Inter, sans-serif';
      const badgeWidth = Math.min(400, ctx.measureText(badgeText).width + 44);
      drawRoundedRect(ctx, W - 56 - badgeWidth, 56, badgeWidth, 46, 23);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = accentColor;
      ctx.stroke();

      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(badgeText, W - 56 - badgeWidth + 22, 85);

      // 3. Center Visual Area (Uploaded Photos OR Generated Waste Fleet Scene)
      const visualX = 56;
      const visualY = 142;
      const visualW = W - 112;
      const visualH = 430;

      if (photos.length > 0) {
        const loadedImgs = await Promise.all(
          photos.slice(0, 3).map(
            (p) =>
              new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = p.dataUrl;
              })
          )
        );
        const validImgs = loadedImgs.filter(Boolean);

        if (validImgs.length === 1) {
          ctx.save();
          drawRoundedRect(ctx, visualX, visualY, visualW, visualH, 24);
          ctx.clip();
          const img = validImgs[0];
          const scale = Math.max(visualW / img.width, visualH / img.height);
          const dw = img.width * scale;
          const dh = img.height * scale;
          ctx.drawImage(img, visualX + (visualW - dw) / 2, visualY + (visualH - dh) / 2, dw, dh);
          ctx.restore();
        } else if (validImgs.length >= 2) {
          const halfW = (visualW - 16) / 2;
          validImgs.slice(0, 2).forEach((img, idx) => {
            const cellX = visualX + idx * (halfW + 16);
            ctx.save();
            drawRoundedRect(ctx, cellX, visualY, halfW, visualH, 20);
            ctx.clip();
            const scale = Math.max(halfW / img.width, visualH / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            ctx.drawImage(img, cellX + (halfW - dw) / 2, visualY + (visualH - dh) / 2, dw, dh);
            ctx.restore();
          });
        } else {
          drawGeneratedSceneIllustration(ctx, vConfig.sceneIllustration, visualX, visualY, visualW, visualH);
        }

        drawRoundedRect(ctx, visualX, visualY, visualW, visualH, 24);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.stroke();
      } else {
        drawGeneratedSceneIllustration(ctx, vConfig.sceneIllustration, visualX, visualY, visualW, visualH);
      }

      // 4. Headline & Subheadline Section
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 44px Inter, sans-serif';
      const nextY = wrapCanvasText(
        ctx,
        vConfig.headline || 'Premier Waste Management Solutions Across Oman',
        56,
        635,
        W - 112,
        54,
        2
      );

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 24px Inter, sans-serif';
      wrapCanvasText(
        ctx,
        vConfig.subheadline || '24/7 Skip Collection, RoRo Containers & Full Environmental Compliance',
        56,
        nextY + 12,
        W - 112,
        34,
        2
      );

      // 5. Three Feature Highlight Badges
      const highlights = vConfig.highlights || [
        'Be’ah & EA Licensed',
        '24/7 Fleet SLA',
        'ISO 14001 Certified',
      ];
      const pillY = 835;
      const pillW = (W - 112 - 32) / 3;
      highlights.slice(0, 3).forEach((hText, i) => {
        const px = 56 + i * (pillW + 16);
        drawRoundedRect(ctx, px, pillY, pillW, 74, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('✓', px + 18, pillY + 44);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 18px Inter, sans-serif';
        wrapCanvasText(ctx, hText, px + 44, pillY + 34, pillW - 56, 22, 2);
      });

      // 6. Bottom Contact & Location Footer Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.fillRect(0, H - 108, W, 108);

      ctx.fillStyle = accentColor;
      ctx.font = '800 21px Inter, sans-serif';
      ctx.fillText(
        `📞 ${companyProfile.phone || '+968 2450 8800'}   |   ✉️ ${companyProfile.email || 'contracts@pgsoman.com'}`,
        56,
        H - 58
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 17px Inter, sans-serif';
      ctx.fillText(
        companyProfile.location || 'Muscat • Sohar • Duqm • Salalah | Sultanate of Oman',
        56,
        H - 28
      );

      if (!isCancelled) {
        setPosterDataUrl(canvas.toDataURL('image/png'));
      }
    };

    renderCanvasPoster();
    return () => {
      isCancelled = true;
    };
  }, [selectedPost, templateStyle, settings?.companyProfile]);

  // Handle uploading photos from manager's computer
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImages((prev) => [
          ...prev,
          {
            name: file.name,
            dataUrl: ev.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Uploaded ${files.length} photo(s)`, 'success');
  };

  // Generate new Social Media Post + Media Graphic
  const handleGenerateCampaign = async (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() && uploadedImages.length === 0) {
      showToast('Please type a prompt in the input bar or upload a file first.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            promptInput.trim() ||
            'Showcase our waste management fleet, 24/7 skip collection and ISO 14001 compliance across Oman.',
          uploadedImages,
          templateStyle,
          aspectRatio: '1:1',
          platforms: activePlatforms.length > 0 ? activePlatforms : ['linkedin', 'instagram'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate post');

      onUpdateSocialPosts(data.socialPosts, data.stats);
      setSelectedPostId(data.post.id);
      // Immediately display newly generated post text in the text box
      if (activeContentTab === 'linkedin') {
        setEditablePostText(data.post.linkedinCaption || '');
      } else {
        const ig = data.post.instagramCaption || '';
        const tags = Array.isArray(data.post.hashtags)
          ? data.post.hashtags.join(' ')
          : data.post.hashtags || '';
        setEditablePostText(tags ? `${ig}\n\n${tags}` : ig);
      }
      setIsTextEdited(false);
      setPromptInput('');
      setUploadedImages([]);
      showToast(data.message || 'Post & media successfully generated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Publish to LinkedIn / Instagram
  const handlePublishPost = async (postId, platforms = ['linkedin', 'instagram']) => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/social/${postId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      onUpdateSocialPosts(data.socialPosts, data.stats);
      showToast(data.message || 'Post published successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Delete a social post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this generated post from history?')) {
      return;
    }
    try {
      const res = await fetch(`/api/social/${postId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      onUpdateSocialPosts(data.socialPosts, data.stats);
      if (selectedPostId === postId) {
        const remaining = socialPosts.filter((p) => p.id !== postId);
        setSelectedPostId(remaining[0]?.id || null);
      }
      showToast('Post removed from history.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Download generated HD poster image
  const handleDownloadPoster = (postToDownload = selectedPost) => {
    if (!posterDataUrl && !postToDownload?.visualConfig?.posterDataUrl) return;
    const url = posterDataUrl || postToDownload?.visualConfig?.posterDataUrl;
    const link = document.createElement('a');
    link.download = `PGSOman_SocialMedia_${postToDownload?.id || Date.now()}.png`;
    link.href = url;
    link.click();
    showToast('Downloaded High-Resolution 1080×1080 Graphic (PNG)!', 'success');
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const handleSaveAccounts = async (e) => {
    e.preventDefault();
    try {
      await onSaveSettings({ socialAccounts: socialAccountsForm });
      setAccountModalOpen(false);
      showToast('LinkedIn & Instagram accounts updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const togglePlatform = (p) => {
    setActivePlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((item) => item !== p) : prev) : [...prev, p]
    );
  };

  const linkedinAcc = settings?.socialAccounts?.linkedin || {};
  const instagramAcc = settings?.socialAccounts?.instagram || {};

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-[1400px] w-full mx-auto space-y-6">
      {/* Hidden High-Res 1080x1080 Canvas used for rendering downloadable & previewable media graphics */}
      <canvas ref={canvasRef} className="hidden" />

      {/* =========================================================================
          TOP ROW: [ LinkedIn ]  [ Instagram ] BUTTONS (Exact Wireframe Top Container)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* LinkedIn Button */}
          <button
            type="button"
            onClick={() => togglePlatform('linkedin')}
            className={`group flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-bold text-sm transition shadow-sm ${
              activePlatforms.includes('linkedin')
                ? 'bg-[#0A66C2] text-white border-[#0A66C2] ring-2 ring-blue-400/30'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span
              className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs ${
                activePlatforms.includes('linkedin')
                  ? 'bg-white text-[#0A66C2]'
                  : 'bg-[#0A66C2] text-white'
              }`}
            >
              in
            </span>
            <div className="text-left">
              <div className="text-sm font-extrabold leading-tight">LinkedIn</div>
              <div className="text-[10px] opacity-80">
                {activePlatforms.includes('linkedin') ? '✓ Active Platform' : 'Click to Target'}
              </div>
            </div>
          </button>

          {/* Instagram Button */}
          <button
            type="button"
            onClick={() => togglePlatform('instagram')}
            className={`group flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-bold text-sm transition shadow-sm ${
              activePlatforms.includes('instagram')
                ? 'bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white border-pink-500 ring-2 ring-pink-400/30'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span
              className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs ${
                activePlatforms.includes('instagram')
                  ? 'bg-white text-pink-600'
                  : 'bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white'
              }`}
            >
              IG
            </span>
            <div className="text-left">
              <div className="text-sm font-extrabold leading-tight">Instagram</div>
              <div className="text-[10px] opacity-80">
                {activePlatforms.includes('instagram') ? '✓ Active Platform' : 'Click to Target'}
              </div>
            </div>
          </button>
        </div>

        {/* Account Details & Setup Modal Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">
              {linkedinAcc.companyPageName || 'PGS Oman Official'}
            </span>
            <span className="text-[11px] text-slate-500">
              {instagramAcc.username || '@pgs.oman.official'} • Ready
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition"
            title="Configure Connected Accounts"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Accounts</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN MIDDLE CONTAINER (Generate Social Media Post Studio)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-400/90 shadow-md p-6 lg:p-8 flex flex-col items-center">
        {/* Header of the Post Generation Box */}
        <div className="w-full pb-5 mb-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06392A] to-[#047857] flex items-center justify-center shadow-md shadow-emerald-900/20 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Generate Social Media Post using AI
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                  AI Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Create 1080×1080 branded media graphics with customized marketing captions for LinkedIn & Instagram
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Platform AI Engine</span>
            </div>
          </div>
        </div>
        
        {/* CENTER BOX: Generating Media (Matching image aspect-ratio with small gap to boundary) */}
        <div className="w-full max-w-[390px] sm:max-w-[420px] aspect-square mx-auto mb-5">
          <div className="relative w-full h-full p-2.5 sm:p-3 rounded-2xl border-2 border-slate-400/90 bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
            {generating ? (
              /* Generating State */
              <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-wide">
                    Generating Media....
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                    Creating 1080×1080 HD graphics and marketing copy...
                  </p>
                </div>
              </div>
            ) : posterDataUrl ? (
              /* Display Generated Media Image */
              <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm bg-slate-900 group flex items-center justify-center">
                <img
                  src={posterDataUrl}
                  alt="Generated Media"
                  className="w-full h-full object-cover rounded-xl"
                />

                {/* Overlay Floating Badge and Actions */}
                <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1.5 pointer-events-none">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>1080×1080 HD</span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2 opacity-95 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleDownloadPoster(selectedPost)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
                    title="Download HD PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Ready State */
              <div className="w-full h-full rounded-xl bg-slate-50 border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div className="text-sm font-extrabold text-slate-800">
                  Generating Media....
                </div>
                <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                  Enter prompt below or speak into mic to render high-resolution branded media with copy.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            GENERATED POST TEXT CONTENT BOX (Directly Below Image Generation Box)
            Includes Copy Option & Manual Edit
            ========================================================================= */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-sm overflow-hidden transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15">
            {/* Header of Content Box */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Generated Post Content
                </span>
                {/* Platform tabs */}
                <div className="flex items-center gap-1 ms-2 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('linkedin')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      activeContentTab === 'linkedin'
                        ? 'bg-[#0A66C2] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    LinkedIn
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveContentTab('instagram')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      activeContentTab === 'instagram'
                        ? 'bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Instagram
                  </button>
                </div>
              </div>

              {/* Action Buttons: Copy & Save */}
              <div className="flex items-center gap-2">
                {isTextEdited && (
                  <button
                    type="button"
                    onClick={handleSavePostContent}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                    title="Save your manual edits to this post"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Edits</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyCurrentContent}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                    copiedStatus
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Copy generated post text to clipboard"
                >
                  {copiedStatus ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="p-3 relative">
              <textarea
                value={editablePostText}
                onChange={handleTextChange}
                placeholder={
                  generating
                    ? 'AI is generating post text content...'
                    : 'Generated post text content will appear here with hashtags. You can also manually type or edit here directly...'
                }
                rows={4}
                className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent resize-y outline-none leading-relaxed font-sans"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 text-slate-500">
                  <Edit3 className="w-3 h-3 text-emerald-600" />
                  <span>Manually editable · Click above to edit captions or hashtags</span>
                </span>
                <span className="font-mono text-slate-500">
                  {editablePostText.length} characters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMBINED HORIZONTAL BAR: [ Type prompt... ] + [ Voice Mic ] + [ File Upload ] */}
        <div className="w-full max-w-3xl mb-5">
          <form onSubmit={handleGenerateCampaign} className="w-full">
            <div className="flex items-center rounded-2xl border-2 border-slate-400 bg-white shadow-sm overflow-hidden p-1.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition gap-1.5">
              {/* Text Input: Type prompt... */}
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={isListening ? 'Listening to voice prompt... speak now' : 'Type prompt or speak with mic...'}
                className="flex-1 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />

              {/* Uploaded Photos Count Indicator if any */}
              {uploadedImages.length > 0 && (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 px-2.5 py-1.5 rounded-lg text-emerald-800 text-xs font-bold shrink-0">
                  <FileImage className="w-3.5 h-3.5" />
                  <span>{uploadedImages.length} photo{uploadedImages.length > 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="ml-1 hover:text-rose-600 cursor-pointer"
                    title="Remove attached photos"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Voice Input Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border shrink-0 transition cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse ring-2 ring-rose-400/40 shadow-sm'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-300'
                }`}
                title={isListening ? 'Listening... Click to stop voice input' : 'Talk the prompt using microphone'}
                aria-label="Voice input prompt"
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 text-white animate-bounce" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-700" />
                    <span>Voice</span>
                  </>
                )}
              </button>

              {/* File Upload Button (Inside the bar on the right side) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border border-slate-300 shrink-0 transition cursor-pointer"
                title="Upload image or reference photos"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span>File Upload</span>
              </button>
            </div>
          </form>

          {/* Prompt Presets / Inspiration Pills */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Quick Ideas:
            </span>
            {CAMPAIGN_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPromptInput(preset.prompt);
                  setTemplateStyle(preset.templateStyle);
                }}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-600 font-semibold text-[11px] shrink-0 transition"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* CENTERED BUTTON DIRECTLY BELOW THE BAR: [ Generate Post ] */}
        <div className="flex justify-center w-full">
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateCampaign}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-base font-black shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Post & Media...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate Post</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* =========================================================================
          BOTTOM CONTAINER: Post Histories (Full-Width Box in Wireframe Diagram)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-400/90 shadow-md p-6 lg:p-7 flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Post Histories
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              {socialPosts.length} Generated
            </span>
          </div>

          {/* Quick Platform Filter in History */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedHistoryTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedHistoryTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Posts
            </button>
            <button
              type="button"
              onClick={() => setSelectedHistoryTab('linkedin')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedHistoryTab === 'linkedin'
                  ? 'bg-[#0A66C2] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LinkedIn
            </button>
            <button
              type="button"
              onClick={() => setSelectedHistoryTab('instagram')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedHistoryTab === 'instagram'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Instagram
            </button>
          </div>
        </div>

        {/* List of Generated Posts History */}
        {socialPosts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No generated posts in history yet.</p>
            <p className="text-xs text-slate-400 mt-1">Use the Generate Post studio above to create your first campaign!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {socialPosts
              .filter((post) => {
                if (selectedHistoryTab === 'linkedin') return (post.platforms || []).includes('linkedin');
                if (selectedHistoryTab === 'instagram') return (post.platforms || []).includes('instagram');
                return true;
              })
              .map((post) => {
                const isSelected = selectedPost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    className={`py-5 transition rounded-2xl p-4 my-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-2 border-emerald-500'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start gap-5">
                      {/* Left: Thumbnail & Selection */}
                      <button
                        type="button"
                        onClick={() => setSelectedPostId(post.id)}
                        className="relative group shrink-0 rounded-xl overflow-hidden border-2 border-slate-300 w-36 h-36 bg-slate-900 shadow-sm"
                        title="Click to view and preview in Generating Media box"
                      >
                        {post.visualConfig?.posterDataUrl || (isSelected && posterDataUrl) ? (
                          <img
                            src={post.visualConfig?.posterDataUrl || posterDataUrl}
                            alt="Post Thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-white">
                            <ImageIcon className="w-6 h-6 text-emerald-400 mb-1" />
                            <span className="text-[10px] font-bold line-clamp-2">
                              {post.visualConfig?.headline || 'PGS Graphic'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                          View
                        </div>
                      </button>

                      {/* Middle: Content details & Captions */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {post.visualConfig?.headline || post.prompt}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                post.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {post.status === 'published' ? '✓ Published' : 'Draft'}
                            </span>
                          </div>

                          {/* Platform Badges */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#0A66C2]">
                              LinkedIn
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700">
                              Instagram
                            </span>
                          </div>
                        </div>

                        {/* Prompt summary */}
                        <p className="text-xs text-slate-600 line-clamp-2">
                          <span className="font-bold text-slate-700">Prompt: </span>
                          {post.prompt}
                        </p>

                        {/* Dual Caption Boxes with 1-Click Copy */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {/* LinkedIn Caption */}
                          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-[#0A66C2] flex items-center gap-1">
                                <span className="w-4 h-4 rounded bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold">in</span>
                                LinkedIn Copy
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(post.linkedinCaption, 'LinkedIn Caption')}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#0A66C2] transition"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                              {post.linkedinCaption}
                            </p>
                          </div>

                          {/* Instagram Caption */}
                          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-pink-700 flex items-center gap-1">
                                <span className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 to-pink-600 text-white text-[9px] flex items-center justify-center font-bold">IG</span>
                                Instagram Copy & Hashtags
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyText(
                                    `${post.instagramCaption}\n\n${(post.hashtags || []).join(' ')}`,
                                    'Instagram Caption'
                                  )
                                }
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-pink-600 transition"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                              {post.instagramCaption}
                            </p>
                            <div className="text-[10px] text-pink-700 font-semibold line-clamp-1">
                              {(post.hashtags || []).join(' ')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions Column */}
                      <div className="flex lg:flex-col items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadPoster(post)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition"
                          title="Download Image"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          disabled={publishing}
                          onClick={() => handlePublishPost(post.id, ['linkedin', 'instagram'])}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                          title="Publish directly to LinkedIn & Instagram"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: Configure Manager's LinkedIn & Instagram Accounts
          ========================================================================= */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Connect LinkedIn & Instagram Accounts</h3>
                  <p className="text-xs text-slate-300">
                    Set company profile handles where AI-generated posts and media will be shared
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccounts} className="p-6 space-y-5">
              {/* LinkedIn Section */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-[#0A66C2] text-white font-black text-xs flex items-center justify-center">
                      in
                    </span>
                    <span className="text-sm font-bold text-slate-900">LinkedIn Account / Company Page</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(socialAccountsForm.linkedin?.connected)}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          linkedin: {
                            ...socialAccountsForm.linkedin,
                            connected: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-emerald-600"
                    />
                    Connected
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Company Page or Manager Profile Name
                    </label>
                    <input
                      type="text"
                      value={socialAccountsForm.linkedin?.companyPageName || ''}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          linkedin: {
                            ...socialAccountsForm.linkedin,
                            companyPageName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      LinkedIn Page URL / Handle
                    </label>
                    <input
                      type="text"
                      value={socialAccountsForm.linkedin?.handle || ''}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          linkedin: {
                            ...socialAccountsForm.linkedin,
                            handle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Instagram Section */}
              <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      IG
                    </span>
                    <span className="text-sm font-bold text-slate-900">Instagram Professional Profile</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(socialAccountsForm.instagram?.connected)}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          instagram: {
                            ...socialAccountsForm.instagram,
                            connected: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-pink-600"
                    />
                    Connected
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Instagram Username / Handle
                    </label>
                    <input
                      type="text"
                      value={socialAccountsForm.instagram?.username || ''}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          instagram: {
                            ...socialAccountsForm.instagram,
                            username: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Business Display / Bio Name
                    </label>
                    <input
                      type="text"
                      value={socialAccountsForm.instagram?.bioName || ''}
                      onChange={(e) =>
                        setSocialAccountsForm({
                          ...socialAccountsForm,
                          instagram: {
                            ...socialAccountsForm.instagram,
                            bioName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                >
                  Save Accounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

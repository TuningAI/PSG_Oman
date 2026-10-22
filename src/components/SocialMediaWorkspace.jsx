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
  Layers,
  Sliders,
  ExternalLink,
  X,
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
  glow.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
  glow.addColorStop(1, 'rgba(52, 211, 153, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // Distant industrial skyline / warehouses
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.fillRect(x + 40, y + h - 150, 160, 95);
  ctx.fillRect(x + 210, y + h - 180, 210, 125);
  ctx.fillRect(x + 440, y + h - 140, 190, 85);

  // Road surface
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y + h - 62, w, 62);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.setLineDash([24, 18]);
  ctx.beginPath();
  ctx.moveTo(x + 20, y + h - 30);
  ctx.lineTo(x + w - 20, y + h - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  // Foreground Heavy RoRo / Skip Loader Truck + Branded Container
  const truckX = x + 90;
  const truckY = y + h - 195;

  // Container body (30 CBM RoRo Green Container)
  drawRoundedRect(ctx, truckX, truckY, 340, 110, 10);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ecfdf5';
  ctx.stroke();

  // Container ribs
  ctx.fillStyle = 'rgba(6, 78, 59, 0.35)';
  for (let rx = truckX + 35; rx < truckX + 310; rx += 45) {
    ctx.fillRect(rx, truckY + 12, 12, 86);
  }

  // Container Label Badge
  drawRoundedRect(ctx, truckX + 45, truckY + 30, 245, 48, 8);
  ctx.fillStyle = '#064e3b';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText('PGS OMAN • 30 CBM RoRo', truckX + 62, truckY + 61);

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

  // Active right-side preview tab: 'preview' | 'customize'
  const [activeRightTab, setActiveRightTab] = useState('preview');
  const [previewPlatform, setPreviewPlatform] = useState('both'); // 'both' | 'linkedin' | 'instagram'

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
  const [posterDataUrl, setPosterDataUrl] = useState('');

  const selectedPost =
    socialPosts.find((p) => p.id === selectedPostId) || socialPosts[0] || null;

  useEffect(() => {
    if (settings?.socialAccounts) {
      setSocialAccountsForm(settings.socialAccounts);
    }
  }, [settings?.socialAccounts]);

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
    const style = vConfig.templateStyle || 'executive-emerald';
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

      // 3. Center Visual Area (Uploaded Manager Photos OR Generated Waste Fleet Scene)
      const visualX = 56;
      const visualY = 142;
      const visualW = W - 112;
      const visualH = 430;

      if (photos.length > 0) {
        // Load uploaded images and draw them in a clean frame or split grid
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
          // 2-Photo Split Showcase
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

        // Subtle border around photo frame
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
  }, [selectedPost, settings?.companyProfile]);

  // Handle uploading 1 or more reference photos from manager's computer
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
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
  };

  // Also allow adding photos directly to the currently selected post
  const handleAddPhotoToCurrentPost = (e) => {
    if (!selectedPost) return;
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const updatedPhotos = [
          ...(selectedPost.visualConfig?.uploadedPhotos || []),
          { name: file.name, dataUrl: ev.target.result },
        ];
        await handleUpdateCurrentPost({
          visualConfig: {
            ...selectedPost.visualConfig,
            uploadedPhotos: updatedPhotos,
          },
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // Generate new Social Media Post + Image
  const handleGenerateCampaign = async (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() && uploadedImages.length === 0) {
      showToast('Please enter a post idea/prompt or upload a photo first.', 'warning');
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
            'Showcase our waste management fleet and environmental services in action across Oman.',
          uploadedImages,
          templateStyle,
          aspectRatio: '1:1',
          platforms: ['linkedin', 'instagram'],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate campaign');

      onUpdateSocialPosts(data.socialPosts, data.stats);
      setSelectedPostId(data.post.id);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save edits to current post
  const handleUpdateCurrentPost = async (partialUpdate) => {
    if (!selectedPost) return;
    try {
      const res = await fetch(`/api/social/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      onUpdateSocialPosts(data.socialPosts, data.stats);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Publish to LinkedIn / Instagram
  const handlePublishPost = async (platforms = ['linkedin', 'instagram']) => {
    if (!selectedPost) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/social/${selectedPost.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      onUpdateSocialPosts(data.socialPosts, data.stats);
      showToast(data.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Download generated HD poster image
  const handleDownloadPoster = () => {
    if (!posterDataUrl) return;
    const link = document.createElement('a');
    link.download = `PGSOman_Social_Post_${selectedPost?.id || Date.now()}.png`;
    link.href = posterDataUrl;
    link.click();
    showToast('Downloaded High-Resolution 1080×1080 Social Post Image (PNG)!', 'success');
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
      showToast('LinkedIn & Instagram account settings saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const linkedinAcc = settings?.socialAccounts?.linkedin || {};
  const instagramAcc = settings?.socialAccounts?.instagram || {};

  return (
    <div className="flex-1 flex flex-col">
      {/* Hidden High-Res 1080x1080 Canvas used for rendering the downloadable & previewable marketing image */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Connected Social Accounts Strip */}
      <section className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* LinkedIn Account Pill */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50/80 border border-blue-200">
              <div className="w-8 h-8 rounded-lg bg-[#0A66C2] text-white font-black text-sm flex items-center justify-center">
                in
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">
                    {linkedinAcc.companyPageName || 'PGS Oman LinkedIn Page'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      linkedinAcc.connected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {linkedinAcc.connected ? '● Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{linkedinAcc.handle}</div>
              </div>
            </div>

            {/* Instagram Account Pill */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-pink-50/80 border border-pink-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                IG
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">
                    {instagramAcc.username || '@pgs.oman.official'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      instagramAcc.connected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {instagramAcc.connected ? '● Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{instagramAcc.bioName}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            Manage LinkedIn & Instagram Accounts
          </button>
        </div>
      </section>

      {/* Main 12-Column Social Media Studio Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (4 Cols): AI Prompt & Photo Uploader + Saved Campaigns */}
        <div className="lg:col-span-4 space-y-5">
          {/* AI Post & Image Creator Card */}
          <form
            onSubmit={handleGenerateCampaign}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold">1. Tell AI What You Want to Post</h2>
              </div>
              <span className="text-[11px] text-emerald-300 font-semibold">Image + Copy AI</span>
            </div>

            <div className="p-5 space-y-4">
              {/* 1-Click Preset Ideas */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Quick-Fill Campaign Ideas (1-Click):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CAMPAIGN_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPromptInput(preset.prompt);
                        setTemplateStyle(preset.templateStyle);
                      }}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-bold text-slate-800 transition truncate"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manager's Prompt Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Describe Your Post Idea, Project Milestone, or Service:
                </label>
                <textarea
                  rows={4}
                  placeholder="Example: We just deployed 15 new RoRo skip containers for a construction project in Al Khuwair. Create a post highlighting our fast 24-hour delivery and Be'ah compliance..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Upload 1 or More Photos */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Upload Site / Equipment Photos (Optional)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Upload 1 or more photos — AI will integrate them into the post image
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0">
                    + Add Photos
                  </span>
                </label>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-slate-300 h-16 bg-slate-200"
                      >
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Poster Visual Theme Selector */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Brand Poster Theme:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATE_STYLES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateStyle(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                        templateStyle === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.badge}`} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI is Designing Image & Writing Posts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Post Image & Social Captions
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Recent Generated Posts History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Generated Social Campaigns ({socialPosts.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {socialPosts.map((post) => {
                const isSelected = selectedPost?.id === post.id;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className={`w-full text-left p-3.5 transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {post.visualConfig?.headline || post.prompt}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {post.prompt}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            post.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {post.status === 'published' ? '✓ Published' : 'Draft Ready'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          LinkedIn & Instagram
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE (8 Cols): Generated Poster Image + Live LinkedIn & Instagram Previews */}
        {selectedPost && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Top Workspace Header */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold">
                  2. Review AI-Generated Post Image & Social Media Copy
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveRightTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeRightTab === 'preview'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Live Social Previews
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightTab('customize')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeRightTab === 'customize'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Edit Image Text & Captions
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Row: Generated HD Marketing Poster Preview + Quick Visual Controls */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200">
                {/* Poster Image Preview */}
                <div className="xl:col-span-6 flex flex-col items-center">
                  <div className="w-full max-w-[380px] aspect-square rounded-2xl overflow-hidden shadow-xl border-2 border-slate-300 bg-slate-900 relative">
                    {posterDataUrl ? (
                      <img
                        src={posterDataUrl}
                        alt="Generated Social Media Post Graphic"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">
                        Rendering HD Poster...
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Controls for the Generated Image */}
                <div className="xl:col-span-6 space-y-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      1080 × 1080 HD Ready-to-Post Visual
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedPost.visualConfig?.headline}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Automatically branded with your company name, permits, and contact details.
                    </p>
                  </div>

                  {/* Switch Poster Color Theme Instantly */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Switch Poster Color Theme:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATE_STYLES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            handleUpdateCurrentPost({
                              visualConfig: {
                                ...selectedPost.visualConfig,
                                templateStyle: t.id,
                              },
                            })
                          }
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                            selectedPost.visualConfig?.templateStyle === t.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${t.badge}`} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload / Replace Photo on Current Poster */}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      Add / Change Photo on Poster
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddPhotoToCurrentPost}
                        className="hidden"
                      />
                    </label>

                    {selectedPost.visualConfig?.uploadedPhotos?.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCurrentPost({
                            visualConfig: {
                              ...selectedPost.visualConfig,
                              uploadedPhotos: [],
                            },
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                      >
                        Use AI Fleet Illustration Instead
                      </button>
                    )}
                  </div>

                  {/* Download HD Image Button */}
                  <div className="pt-1 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadPoster}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      Download HD Post Image (PNG)
                    </button>
                  </div>
                </div>
              </div>

              {activeRightTab === 'customize' ? (
                /* Edit Poster Headline, Highlights & Captions Directly */
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Customize Poster Headline & Social Media Captions
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Poster Top Badge
                      </label>
                      <input
                        type="text"
                        value={selectedPost.visualConfig?.categoryBadge || ''}
                        onChange={(e) =>
                          handleUpdateCurrentPost({
                            visualConfig: {
                              ...selectedPost.visualConfig,
                              categoryBadge: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Poster Main Headline
                      </label>
                      <input
                        type="text"
                        value={selectedPost.visualConfig?.headline || ''}
                        onChange={(e) =>
                          handleUpdateCurrentPost({
                            visualConfig: {
                              ...selectedPost.visualConfig,
                              headline: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Poster Subtitle
                      </label>
                      <input
                        type="text"
                        value={selectedPost.visualConfig?.subheadline || ''}
                        onChange={(e) =>
                          handleUpdateCurrentPost({
                            visualConfig: {
                              ...selectedPost.visualConfig,
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">
                        LinkedIn Post Copy
                      </label>
                      <textarea
                        rows={8}
                        value={selectedPost.linkedinCaption || ''}
                        onChange={(e) =>
                          handleUpdateCurrentPost({ linkedinCaption: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-white leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-pink-700 mb-1">
                        Instagram Caption Copy
                      </label>
                      <textarea
                        rows={8}
                        value={selectedPost.instagramCaption || ''}
                        onChange={(e) =>
                          handleUpdateCurrentPost({ instagramCaption: e.target.value })
                        }
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Side-by-Side Live LinkedIn & Instagram Feed Previews */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* LINKEDIN POST PREVIEW CARD */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-[#0A66C2] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-white text-[#0A66C2] font-black text-xs flex items-center justify-center">
                          in
                        </span>
                        <span className="text-xs font-bold">LinkedIn Company Post</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `${selectedPost.linkedinCaption}\n\n${(selectedPost.hashtags || []).join(' ')}`,
                            'LinkedIn post text'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-3">
                        {/* Author Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                            PGS
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {linkedinAcc.companyPageName || 'PGS Oman — Environmental Services'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Official Company Update • Sultanate of Oman 🌐
                            </div>
                          </div>
                        </div>

                        {/* Caption Text */}
                        <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto pr-1">
                          {selectedPost.linkedinCaption}
                          <div className="mt-2 text-blue-700 font-semibold">
                            {(selectedPost.hashtags || []).join(' ')}
                          </div>
                        </div>

                        {/* Embedded Poster Thumbnail */}
                        {posterDataUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={posterDataUrl}
                              alt="LinkedIn visual"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={publishing}
                        onClick={() => handlePublishPost(['linkedin'])}
                        className="w-full py-2.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publish to LinkedIn Page
                      </button>
                    </div>
                  </div>

                  {/* INSTAGRAM POST PREVIEW CARD */}
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-white text-pink-600 font-black text-xs flex items-center justify-center">
                          IG
                        </span>
                        <span className="text-xs font-bold">Instagram Feed Post</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `${selectedPost.instagramCaption}\n.\n.\n${(selectedPost.hashtags || []).join(' ')}`,
                            'Instagram caption'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Caption
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-3">
                        {/* IG Author Header */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-pink-600 p-0.5">
                            <div className="w-full h-full rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                              PGS
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              {instagramAcc.username || '@pgs.oman.official'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Muscat & Sohar, Sultanate of Oman
                            </div>
                          </div>
                        </div>

                        {/* Square IG Image */}
                        {posterDataUrl && (
                          <div className="rounded-xl overflow-hidden border border-slate-200">
                            <img
                              src={posterDataUrl}
                              alt="Instagram visual"
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}

                        {/* IG Caption */}
                        <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto pr-1">
                          <span className="font-bold mr-1">
                            {instagramAcc.username || '@pgs.oman.official'}
                          </span>
                          {selectedPost.instagramCaption}
                          <div className="mt-2 text-pink-700 font-semibold">
                            {(selectedPost.hashtags || []).join(' ')}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={publishing}
                        onClick={() => handlePublishPost(['instagram'])}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publish to Instagram Feed
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom 1-Click Publish to Both Platforms Bar */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {selectedPost.status === 'published' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Published to LinkedIn & Instagram{' '}
                      {selectedPost.publishedAt
                        ? `on ${new Date(selectedPost.publishedAt).toLocaleString()}`
                        : ''}
                    </span>
                  ) : (
                    <span>
                      Ready for Manager Approval • Will post image + tailored captions to LinkedIn & Instagram
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => handlePublishPost(['linkedin', 'instagram'])}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Approve & Publish to LinkedIn + Instagram
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal to Connect / Configure Manager's LinkedIn & Instagram Accounts */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Connect LinkedIn & Instagram Accounts</h3>
                  <p className="text-xs text-slate-300">
                    Configure the company profiles where AI-generated posts and images will be shared
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
                    <span className="w-6 h-6 rounded bg-gradient-to-tr from-amber-500 to-pink-600 text-white font-black text-xs flex items-center justify-center">
                      IG
                    </span>
                    <span className="text-sm font-bold text-slate-900">Instagram Business Account</span>
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
                      className="rounded text-emerald-600"
                    />
                    Connected
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Instagram Handle (@username)
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
                      Profile Display Title
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Connected Accounts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

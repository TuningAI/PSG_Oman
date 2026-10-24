/**
 * AI Engine for:
 * 1. Waste Management Email Filtering, Proposal Extraction, Summarization, and Response Drafting.
 * 2. Social Media Marketing Assistant (LinkedIn & Instagram Post Copy + Visual Poster Generation).
 */

function formatRateCardText(rateCard = []) {
  if (!Array.isArray(rateCard) || rateCard.length === 0) return 'Standard commercial rates apply.';
  return rateCard
    .map((item, idx) => `${idx + 1}. ${item.serviceName} | Unit: ${item.unit} | Rate: ${item.rate} (${item.notes || ''})`)
    .join('\n');
}

function buildSystemPrompt(companyProfile, tonePreset = 'Accept & Send Quotation', customInstructions = '', filterRules = {}) {
  const rateCardStr = formatRateCardText(companyProfile.rateCard);
  const customExtractionPrompt = filterRules?.customPrompt?.trim();

  return `You are an expert AI Office Support & Contracts Assistant for the General Manager of a Waste Management Contracting Company:
Company Name: ${companyProfile.companyName}
Manager Name: ${companyProfile.managerName} (${companyProfile.managerTitle})
Phone: ${companyProfile.phone}
Email: ${companyProfile.email}
Location: ${companyProfile.location}
Certifications & Permits: ${companyProfile.certifications}
Payment Terms: ${companyProfile.paymentTerms}

OFFICIAL COMPANY SERVICE RATE CARD:
${rateCardStr}

${customExtractionPrompt ? `CRITICAL USER EMAIL EXTRACTION RULES & PROMPT:
"${customExtractionPrompt}"
Evaluate the incoming email strictly according to the criteria above. If the email matches these criteria, set "isWasteProposal": true so it is collected into the manager's primary inbox.\n` : ''}
YOUR TASK:
1. Analyze the incoming email (and any extracted attachment text).
2. Determine if the email matches the Extraction Rules or is related to Waste Management Proposals, RFQs, Quotations, Waste Collection Inquiries, or Contract Documentation ("isWasteProposal": true/false).
3. If "isWasteProposal" is true:
   - Summarize the proposal clearly in 3 concise bullet points ("executiveSummary").
   - Extract structured details: wasteStreamsLabel, siteLocationsLabel, binsVolumeLabel, contractDurationLabel, estimatedMonthlyValue.
   - Draft a reply tailored to the action preset: "${tonePreset}".
   ${customInstructions ? `- IMPORTANT MANAGER INSTRUCTION TO APPLY: "${customInstructions}"` : ''}

Return strictly valid JSON:
{
  "isWasteProposal": boolean,
  "category": "New Proposal / RFP" | "Contract Documentation" | "Rate Inquiry / Quotation" | "Unrelated / Marketing",
  "urgency": "High" | "Medium" | "Low",
  "companyName": "string",
  "relevanceScore": number,
  "relevanceReason": "string",
  "executiveSummary": ["point 1", "point 2", "point 3"],
  "extractedDetails": {
    "wasteStreamsLabel": "string",
    "siteLocationsLabel": "string",
    "binsVolumeLabel": "string",
    "contractDurationLabel": "string",
    "estimatedMonthlyValue": "string"
  },
  "draftSubject": "string",
  "introText": "Greeting and opening paragraph",
  "pricingTable": [
    { "service": "Service description & qty", "amount": "1,248.000" }
  ],
  "totalLabel": "2,129 OMR/month",
  "outroText": "Closing terms and signature"
}`;
}

async function callGeminiAPI(apiKey, model, systemPrompt, userPrompt, inlineImages = []) {
  const modelName = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const parts = [{ text: userPrompt }];
  for (const img of inlineImages) {
    if (img.base64 && img.mimeType) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.25, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');
  return JSON.parse(rawText);
}

async function callOpenAIAPI(apiKey, model, systemPrompt, userPrompt) {
  const modelName = model || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from OpenAI API');
  return JSON.parse(rawText);
}

function checkWhitelistMatch(fromEmail = '', filterRules = {}) {
  const emailClean = (fromEmail || '').toLowerCase().trim();
  const domain = emailClean.split('@')[1] || '';

  const allowedSenders = Array.isArray(filterRules.allowedSenders) ? filterRules.allowedSenders : [];
  for (const s of allowedSenders) {
    if (s && emailClean === s.toLowerCase().trim()) {
      return { matched: true, reason: `Whitelisted Sender: ${s}` };
    }
  }

  const allowedDomains = Array.isArray(filterRules.allowedDomains) ? filterRules.allowedDomains : [];
  for (const d of allowedDomains) {
    const cleanD = d.replace(/^@/, '').toLowerCase().trim();
    if (cleanD && (domain === cleanD || domain.endsWith('.' + cleanD))) {
      return { matched: true, reason: `Whitelisted Domain: @${cleanD}` };
    }
  }

  return { matched: false };
}

function smartLocalAnalyzeAndDraft(emailData, companyProfile, tonePreset = 'Accept & Send Quotation', customInstructions = '', filterRules = {}) {
  const combinedText = `${emailData.subject || ''}\n${emailData.bodyText || ''}\n${
    (emailData.attachments || []).map((a) => `${a.filename}: ${a.extractedText || ''}`).join('\n')
  }`;
  const lower = combinedText.toLowerCase();

  const whitelist = checkWhitelistMatch(emailData.fromEmail, filterRules);

  const baseKeywords = [
    'waste', 'skip', 'roro', 'bin', 'disposal', 'garbage', 'refuse', 'sludge', 'hazardous',
    'recycl', 'landfill', 'sewage', 'tanker', 'rfp', 'rfq', 'tender', 'quotation', 'contract',
    'manifest', 'be\'ah', 'beah', 'environmental', 'collection', 'cbm', 'scrap', 'debris',
    'cardboard', 'industrial', 'proposal', 'amc', 'warehouse', 'quote', 'contracting'
  ];

  // Extract extra keywords from user's custom prompt if provided
  let customKeywords = [];
  if (filterRules?.customPrompt) {
    const words = filterRules.customPrompt.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const stopwords = new Set(['the', 'and', 'all', 'any', 'from', 'with', 'for', 'that', 'this', 'into', 'our', 'mail', 'mails', 'email', 'emails', 'inbox', 'extract', 'automatically', 'filter', 'ignore']);
    customKeywords = words.filter((w) => !stopwords.has(w));
  }
  const allKeywords = Array.from(new Set([...baseKeywords, ...customKeywords]));

  const matchedKeywords = allKeywords.filter((k) => lower.includes(k));
  const isWasteProposal = whitelist.matched || matchedKeywords.length >= 2;

  let inferredCompany = emailData.companyName || '';
  if (!inferredCompany && emailData.fromEmail) {
    const domain = emailData.fromEmail.split('@')[1] || '';
    const domainBase = domain.split('.')[0] || 'Client Organization';
    inferredCompany =
      domainBase.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) + ' LLC';
  }

  if (!isWasteProposal) {
    return {
      isWasteProposal: false,
      category: 'Unrelated / Marketing',
      urgency: 'Low',
      companyName: inferredCompany || 'External Sender',
      relevanceScore: 5,
      relevanceReason: 'Not related to waste management proposals or extraction rules.',
      executiveSummary: ['Automatically filtered out by AI: Unrelated marketing or non-proposal email.'],
      extractedDetails: {},
      draftSubject: '',
      draftBody: '',
    };
  }

  const firstName = (emailData.fromName || 'Valued Partner').split(' ')[0].replace(/^Eng\.|^Dr\.|^Mr\.|^Ms\./i, '').trim() || 'Salim';
  const existingDetails = emailData.aiAnalysis?.extractedDetails || {};
  const locationsStr = existingDetails.siteLocationsLabel || 'Ghala & Rusayl';
  const durationStr = existingDetails.contractDurationLabel || '12 months from 1 Nov 2026';

  const defaultTable = emailData.draft?.pricingTable || [
    { service: 'General waste · 6 bins × 208', amount: '1,248.000' },
    { service: 'Cardboard · 2 bins × 240.500', amount: '481.000' },
    { service: '6 m³ skips · 2 lifts × 200', amount: '400.000' },
  ];
  let defaultTotal = emailData.draft?.totalLabel || existingDetails.estimatedMonthlyValue || '2,129 OMR/month';
  if (customInstructions) {
    const priceMatch = customInstructions.match(/(\d[\d,.]*)\s*(?:OMR|rial|ريال)?/i);
    if (priceMatch && (customInstructions.toLowerCase().includes('price') || customInstructions.toLowerCase().includes('omr') || customInstructions.toLowerCase().includes('total') || customInstructions.includes('سعر') || customInstructions.includes('ريال'))) {
      defaultTotal = `${priceMatch[1]} OMR/month`;
    }
  }

  const customLine = customInstructions
    ? `\n\nSpecial Commercial Note / Updated Terms:\n• ${customInstructions.trim()}`
    : '';
  const managerName = companyProfile.managerName || 'Ahmed Al Kindi';
  const managerTitle = companyProfile.managerTitle || 'General Manager · PGS Oman';

  let draftSubject = `Quotation | ${locationsStr.split(',')[0]} waste collection`;
  let introText = `Dear ${firstName},\n\nThank you for your RFQ. We are pleased to quote for your ${locationsStr} facilities for ${durationStr}.${customLine}`;
  let pricingTable = defaultTable;
  let totalLabel = defaultTotal;
  let outroText = `General waste: 3× weekly; cardboard: weekly; skips: 2 lifts/month. Payment: 30 days. Please confirm to arrange mobilisation.\n\nKind regards, ${managerName}\n${managerTitle}`;

  if (tonePreset === 'Request Site Inquiry / Visit' || tonePreset === 'Request Site Inspection') {
    draftSubject = `Site Visit & Technical Assessment | ${locationsStr.split(',')[0]} waste collection`;
    introText = `Dear ${firstName},\n\nThank you for your RFQ regarding waste collection at ${locationsStr}. Prior to finalising container placement for ${durationStr}, our operations engineer would like to conduct a brief site visit.${customLine}`;
    outroText = `Indicative rates are shown above. Please confirm if tomorrow at 10:00 AM suits your site team for the inspection.\n\nKind regards, ${managerName}\n${managerTitle}`;
  } else if (tonePreset === 'Ask for Missing Specs' || tonePreset === 'Ask for Waste Volume & Specs') {
    draftSubject = `Clarification on Waste Specifications | ${locationsStr.split(',')[0]}`;
    introText = `Dear ${firstName},\n\nThank you for your enquiry for ${locationsStr}. Could you kindly confirm your preferred skip access hours and exact waste bay dimensions so we can finalise your contract schedule?${customLine}`;
    outroText = `Standard schedule rates apply above (Payment: 30 days). We will issue the final contract upon your confirmation.\n\nKind regards, ${managerName}\n${managerTitle}`;
  } else if (tonePreset === 'Approve Contract Terms') {
    draftSubject = `Contract Terms Approved | ${locationsStr.split(',')[0]} waste management`;
    introText = `Dear ${firstName},\n\nThank you for sending the contract documentation for ${locationsStr} (${durationStr}). We formally confirm our acceptance of the scope, Be'ah manifest compliance, and commercial schedule below.${customLine}`;
    outroText = `Payment terms: 30 days. Our fleet is ready for mobilisation upon receiving the countersigned agreement.\n\nKind regards, ${managerName}\n${managerTitle}`;
  }

  const tableLines = pricingTable.map((r) => `• ${r.service}: ${r.amount} OMR`).join('\n');
  const draftBody = `${introText}\n\n${tableLines}\nTotal · excluding VAT: ${totalLabel}\n\n${outroText}`;

  return {
    isWasteProposal: true,
    category: emailData.category || 'New Proposal / RFP',
    urgency: emailData.urgency || 'High',
    companyName: inferredCompany || 'Client Organization',
    relevanceScore: 99,
    relevanceReason: 'Matched waste management RFQ and contract scope.',
    executiveSummary: emailData.aiAnalysis?.executiveSummary || [
      `${inferredCompany} needs waste collection at ${locationsStr}.`,
      'Collect general waste 3× weekly and cardboard weekly; remove 2 skips monthly.',
      `${durationStr}. Please submit quotation prior to deadline.`,
    ],
    extractedDetails: {
      wasteStreamsLabel: existingDetails.wasteStreamsLabel || 'General + cardboard',
      siteLocationsLabel: locationsStr,
      binsVolumeLabel: existingDetails.binsVolumeLabel || '8 × 1,100 L; 2 × 6 m³',
      contractDurationLabel: durationStr,
      estimatedMonthlyValue: totalLabel,
      ...existingDetails,
    },
    draftSubject,
    introText,
    pricingTable,
    totalLabel,
    outroText,
    draftBody,
  };
}

export async function analyzeEmailAndGenerateDraft({
  emailData,
  settings,
  tonePreset = 'Accept & Send Quotation',
  customInstructions = '',
}) {
  const companyProfile = settings.companyProfile;
  const aiSettings = settings.ai || {};
  const filterRules = settings.filterRules || {};
  const whitelist = checkWhitelistMatch(emailData.fromEmail, filterRules);

  const attachmentsText = (emailData.attachments || [])
    .map((att, i) => `--- ATTACHMENT ${i + 1}: ${att.filename} ---\n${att.extractedText || ''}`)
    .join('\n\n');

  const userPrompt = `INCOMING EMAIL:
From: ${emailData.fromName || ''} <${emailData.fromEmail || ''}>
Subject: ${emailData.subject || ''}
Body:
${emailData.bodyText || ''}
${attachmentsText}
Action Preset: "${tonePreset}"
${customInstructions ? `Manager Instruction: "${customInstructions}"` : ''}
${whitelist.matched ? `\nSPECIAL OVERRIDE: Sender matches ${whitelist.reason}. This email MUST be classified as "isWasteProposal": true and extracted.` : ''}`;

  const systemPrompt = buildSystemPrompt(companyProfile, tonePreset, customInstructions, filterRules);

  try {
    if (aiSettings.provider === 'gemini' && aiSettings.geminiApiKey?.trim()) {
      const result = await callGeminiAPI(aiSettings.geminiApiKey.trim(), aiSettings.geminiModel, systemPrompt, userPrompt);
      if (whitelist.matched) {
        result.isWasteProposal = true;
        result.relevanceReason = (result.relevanceReason ? result.relevanceReason + ' | ' : '') + whitelist.reason;
      }
      return { ...result, usedProvider: `Google Gemini (${aiSettings.geminiModel || 'gemini-2.5-flash'})` };
    }
    if (aiSettings.provider === 'openai' && aiSettings.openaiApiKey?.trim()) {
      const result = await callOpenAIAPI(aiSettings.openaiApiKey.trim(), aiSettings.openaiModel, systemPrompt, userPrompt);
      if (whitelist.matched) {
        result.isWasteProposal = true;
        result.relevanceReason = (result.relevanceReason ? result.relevanceReason + ' | ' : '') + whitelist.reason;
      }
      return { ...result, usedProvider: `OpenAI (${aiSettings.openaiModel || 'gpt-4o-mini'})` };
    }
  } catch (err) {
    console.warn('Live LLM API call failed, falling back to Smart Built-in AI Engine:', err.message);
  }

  const fallbackResult = smartLocalAnalyzeAndDraft(emailData, companyProfile, tonePreset, customInstructions, filterRules);
  if (whitelist.matched) {
    fallbackResult.isWasteProposal = true;
    fallbackResult.relevanceReason = (fallbackResult.relevanceReason ? fallbackResult.relevanceReason + ' | ' : '') + whitelist.reason;
  }
  return { ...fallbackResult, usedProvider: 'Built-in Smart Waste-AI Engine' };
}

export async function generateSocialMediaCampaign({
  prompt = '',
  uploadedImages = [],
  settings,
  templateStyle = 'executive-emerald',
  aspectRatio = '1:1',
}) {
  const companyProfile = settings.companyProfile || {};
  const aiSettings = settings.ai || {};

  const socialSystemPrompt = `You are an expert B2B & Brand Social Media Marketing Director for:
Company Name: ${companyProfile.fullLegalName || companyProfile.companyName}
Location: ${companyProfile.location}
Certifications: ${companyProfile.certifications}
Phone: ${companyProfile.phone}
Email: ${companyProfile.email}

Return strictly valid JSON:
{
  "categoryBadge": "2-4 word uppercase badge",
  "headline": "Punchy poster headline (6-11 words max)",
  "subheadline": "Compelling 1-sentence subtitle",
  "highlights": ["Badge 1", "Badge 2", "Badge 3"],
  "sceneIllustration": "fleet-trucks" | "recycling-facility" | "construction-roro" | "hazardous-safety",
  "linkedinCaption": "Full professional B2B LinkedIn post",
  "instagramCaption": "Engaging Instagram caption with emojis",
  "hashtags": ["#PGSOman", "#WasteManagementOman", "#OmanVision2040"]
}`;

  try {
    if (aiSettings.provider === 'gemini' && aiSettings.geminiApiKey?.trim()) {
      const inlineImages = uploadedImages
        .map((img) => {
          const match = (img.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
          return match ? { mimeType: match[1], base64: match[2] } : null;
        })
        .filter(Boolean);

      const result = await callGeminiAPI(
        aiSettings.geminiApiKey.trim(),
        aiSettings.geminiModel,
        socialSystemPrompt,
        prompt,
        inlineImages
      );
      return { ...result, usedProvider: `Google Gemini (${aiSettings.geminiModel || 'gemini-2.5-flash'})` };
    }
    if (aiSettings.provider === 'openai' && aiSettings.openaiApiKey?.trim()) {
      const result = await callOpenAIAPI(aiSettings.openaiApiKey.trim(), aiSettings.openaiModel, socialSystemPrompt, prompt);
      return { ...result, usedProvider: `OpenAI (${aiSettings.openaiModel || 'gpt-4o-mini'})` };
    }
  } catch (err) {
    console.warn('Fallback Social AI used:', err.message);
  }

  const lower = (prompt || '').toLowerCase();
  let sceneIllustration = 'fleet-trucks';
  let categoryBadge = 'OPERATIONAL EXCELLENCE';
  let headline = 'Reliable Industrial Waste Management Across Oman';
  let subheadline = 'Certified Skip Collection, RoRo Haulage & Turnkey Environmental Compliance';
  let highlights = ['Be’ah & EA Licensed Contractor', '24/7 GPS-Tracked Fleet SLA', 'ISO 14001 & 45001 Certified'];

  if (lower.includes('hazard') || lower.includes('chemical') || lower.includes('sludge')) {
    sceneIllustration = 'hazardous-safety';
    categoryBadge = 'HSE & HAZARDOUS WASTE COMPLIANCE';
    headline = 'Safe, Manifested Hazardous & Industrial Waste Disposal';
    subheadline = 'ADR-Certified Transport & Cradle-to-Grave Environment Authority Documentation';
    highlights = ['ADR-Certified Hazmat Fleet', '5-Part EA Waste Manifests', 'Zero-Incident HSE Track Record'];
  } else if (lower.includes('recycl') || lower.includes('iso') || lower.includes('cardboard')) {
    sceneIllustration = 'recycling-facility';
    categoryBadge = 'SUSTAINABILITY & CIRCULAR ECONOMY';
    headline = 'Turning Industrial Waste into Certified Sustainability Impact';
    subheadline = 'Comprehensive Segregation, Baler Recovery & Monthly ESG Diversion Certificates';
    highlights = ['ISO 14001 Diversion Reports', 'Cardboard & Plastic Recovery', 'Supporting Oman Vision 2040'];
  }

  if (prompt.trim().length > 10 && prompt.trim().length < 75) {
    headline = prompt.trim().replace(/\.$/, '');
  }

  const cleanPromptSummary = prompt.trim() || 'Delivering certified waste management across Muscat, Sohar, Duqm, and Salalah';

  return {
    categoryBadge,
    headline,
    subheadline,
    highlights,
    sceneIllustration,
    linkedinCaption: `At ${companyProfile.fullLegalName || 'PGS Oman'}, we are committed to setting the benchmark for industrial waste management across the Sultanate of Oman. 🇴🇲♻️\n\n📌 Spotlight: ${cleanPromptSummary}\n\n✅ ${highlights[0]}\n✅ ${highlights[1]}\n✅ ${highlights[2]}\n\n📞 Contact our Contracts Desk: ${companyProfile.phone} | ${companyProfile.email}`,
    instagramCaption: `${headline} 🚛♻️🇴🇲\n\n${cleanPromptSummary}!\n\n🔹 ${highlights[0]}\n🔹 ${highlights[1]}\n🔹 ${highlights[2]}\n\n📩 DM us or email ${companyProfile.email} for a fast quotation!`,
    hashtags: ['#PGSOman', '#WasteManagementOman', '#OmanVision2040', '#BeahCompliance', '#SustainableOman', '#MuscatBusiness'],
    usedProvider: 'Built-in Smart Social Marketing AI',
  };
}

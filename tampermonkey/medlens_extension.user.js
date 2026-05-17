// ==UserScript==
// @name         MedLens Analyzer
// @namespace    http://medlens.local/
// @version      4.0
// @description  Analyzes PDFs (including local file:// PDFs) and medical pages using MedLens AI.
// @author       MedLens
// @match        *://*/*
// @match        *://*/*.pdf
// @match        *://*/*.pdf?*
// @match        file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      medlensfrontendbackendrepo-production.up.railway.app
// @connect      *
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js
// ==/UserScript==

(function () {
  'use strict';

  const BACKEND_URL = 'https://medlensfrontendbackendrepo-production.up.railway.app';

  GM_addStyle(`
    #ml-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 2147483646;
      background: linear-gradient(135deg, #2d9cad, #3cb8cc);
      color: #04111a;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-weight: 700;
      font-size: 13px;
      border: none;
      border-radius: 999px;
      padding: 13px 22px;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(45,156,173,0.45);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: ml-float 3s ease-in-out infinite;
    }
    #ml-fab:hover {
      transform: translateY(-2px) scale(1.06);
      box-shadow: 0 6px 36px rgba(45,156,173,0.65);
      animation-play-state: paused;
    }
    @keyframes ml-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    #ml-fab .ml-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #04111a;
      animation: ml-pulse 2s infinite;
    }
    @keyframes ml-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    #ml-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 520px;
      max-height: 90vh;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: rgba(7, 30, 46, 0.97);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(45, 156, 173, 0.2);
      border-radius: 22px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(45,156,173,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #f5f4ef;
    }
    #ml-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(45,156,173,0.15);
      background: rgba(12,45,69,0.6);
      flex-shrink: 0;
    }
    #ml-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #ml-logo {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: rgba(45,156,173,0.15);
      border: 1px solid rgba(45,156,173,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      color: #3cb8cc;
    }
    #ml-title {
      font-size: 16px;
      font-weight: 800;
      color: #f5f4ef;
      letter-spacing: -0.01em;
    }
    #ml-title span { color: #3cb8cc; }
    #ml-close {
      cursor: pointer;
      color: rgba(255,255,255,0.45);
      font-size: 18px;
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      line-height: 1;
    }
    #ml-close:hover {
      color: white;
      background: rgba(255,255,255,0.08);
    }

    #ml-body {
      overflow-y: auto;
      flex: 1;
      padding: 18px 20px;
      scrollbar-width: thin;
      scrollbar-color: #2d9cad rgba(255,255,255,0.05);
    }
    #ml-body::-webkit-scrollbar { width: 4px; }
    #ml-body::-webkit-scrollbar-thumb { background: #2d9cad; border-radius: 2px; }

    #ml-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px 16px;
      text-align: center;
    }
    .ml-scan-bar {
      width: 100%;
      height: 3px;
      background: rgba(255,255,255,0.05);
      border-radius: 99px;
      overflow: hidden;
    }
    .ml-scan-fill {
      height: 100%;
      width: 35%;
      background: linear-gradient(90deg, transparent, #3cb8cc, transparent);
      border-radius: 99px;
      animation: ml-scan 1.8s ease-in-out infinite;
    }
    @keyframes ml-scan {
      0% { transform: translateX(-200%); }
      100% { transform: translateX(500%); }
    }
    .ml-loading-title {
      font-size: 17px;
      font-weight: 800;
      color: #f5f4ef;
    }
    .ml-loading-step {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 11px;
      color: rgba(45,156,173,0.65);
      min-height: 16px;
    }
    .ml-spinner {
      width: 28px;
      height: 28px;
      border: 2px solid rgba(45,156,173,0.2);
      border-top-color: #3cb8cc;
      border-radius: 50%;
      animation: ml-spin 0.7s linear infinite;
    }
    @keyframes ml-spin { to { transform: rotate(360deg); } }

    .ml-section { margin-bottom: 18px; }
    .ml-section-label {
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ml-summary-box {
      background: rgba(12,45,69,0.4);
      border: 1px solid rgba(45,156,173,0.1);
      border-radius: 14px;
      padding: 16px 18px;
      font-size: 14px;
      line-height: 1.8;
      color: rgba(204,230,236,0.88);
      max-height: 280px;
      overflow-y: auto;
    }
    .ml-summary-box h3, .ml-summary-box strong {
      color: #e0f7fa;
      font-size: 14px;
    }
    .ml-finding-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(45,156,173,0.08);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.7;
      color: rgba(204,230,236,0.85);
    }
    .ml-finding-card:last-child { margin-bottom: 0; }
    .ml-urgency-card {
      border-radius: 16px;
      padding: 16px 18px;
      border: 1px solid;
      position: relative;
      overflow: hidden;
    }
    .ml-urgency-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: currentColor;
      opacity: 0.6;
    }
    .ml-urgency-level {
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 4px;
      letter-spacing: 0.02em;
    }
    .ml-urgency-label {
      font-size: 14px;
      opacity: 0.75;
      margin-bottom: 12px;
    }
    .ml-progress-track {
      width: 100%;
      height: 7px;
      background: rgba(255,255,255,0.08);
      border-radius: 99px;
      overflow: hidden;
    }
    .ml-progress-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .ml-confidence {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      margin-top: 8px;
    }
    .ml-reason-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      color: rgba(255,255,255,0.62);
      line-height: 1.65;
    }
    .ml-override-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .ml-kw-chip {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(214,48,49,0.15);
      border: 1px solid rgba(214,48,49,0.35);
      color: #ff7675;
    }
    .ml-disclaimer {
      background: rgba(253,203,110,0.07);
      border: 1px solid rgba(253,203,110,0.2);
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 13px;
      color: rgba(253,203,110,0.72);
      line-height: 1.55;
    }
    .ml-chat-messages {
      max-height: 180px;
      overflow-y: auto;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ml-msg-user {
      align-self: flex-end;
      background: rgba(45,156,173,0.18);
      border: 1px solid rgba(45,156,173,0.25);
      border-radius: 12px 12px 3px 12px;
      padding: 7px 11px;
      font-size: 14px;
      color: #e0f7fa;
      max-width: 85%;
      white-space: pre-wrap;
    }
    .ml-msg-bot {
      align-self: flex-start;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px 12px 12px 3px;
      padding: 7px 11px;
      font-size: 14px;
      color: rgba(204,230,236,0.84);
      max-width: 90%;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .ml-msg-typing {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 11px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      color: rgba(45,156,173,0.65);
    }
    .ml-chat-input-row {
      display: flex;
      gap: 8px;
    }
    .ml-chat-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 9px 13px;
      color: #f5f4ef;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .ml-chat-input:focus { border-color: rgba(45,156,173,0.45); }
    .ml-chat-input::placeholder { color: rgba(255,255,255,0.28); }
    .ml-send-btn {
      background: rgba(45,156,173,0.2);
      border: 1px solid rgba(45,156,173,0.35);
      border-radius: 10px;
      color: #3cb8cc;
      cursor: pointer;
      padding: 0 15px;
      font-size: 15px;
      transition: background 0.15s, color 0.15s;
      display: flex;
      align-items: center;
    }
    .ml-send-btn:hover { background: rgba(45,156,173,0.35); color: #fff; }
    .ml-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .ml-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .ml-suggestion-btn {
      background: rgba(45,156,173,0.08);
      border: 1px solid rgba(45,156,173,0.22);
      border-radius: 999px;
      color: rgba(45,156,173,0.88);
      font-family: inherit;
      font-size: 13px;
      padding: 4px 11px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .ml-suggestion-btn:hover { background: rgba(45,156,173,0.2); color: #a8e8f0; }
    .ml-error {
      text-align: center;
      padding: 24px 16px;
      color: rgba(255,118,117,0.86);
      font-size: 13px;
      line-height: 1.6;
    }
    .ml-retry-btn {
      margin-top: 12px;
      background: rgba(214,48,49,0.15);
      border: 1px solid rgba(214,48,49,0.3);
      border-radius: 10px;
      color: #ff7675;
      font-family: inherit;
      font-size: 12px;
      padding: 8px 18px;
      cursor: pointer;
    }
    .ml-retry-btn:hover { background: rgba(214,48,49,0.25); }
    .ml-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 4px 0 14px;
    }
    .ml-gloss {
      color: #3cb8cc;
      border-bottom: 1px dotted rgba(45,156,173,0.5);
      cursor: help;
      position: relative;
    }
    .ml-gloss:hover { color: #a8e8f0; }
    .ml-gloss .ml-tip {
      display: none;
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(7,30,46,0.97);
      border: 1px solid rgba(45,156,173,0.3);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 12px;
      line-height: 1.5;
      color: rgba(224,247,250,0.9);
      white-space: normal;
      width: 220px;
      z-index: 99;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      pointer-events: none;
    }
    .ml-gloss .ml-tip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: rgba(45,156,173,0.3);
    }
    .ml-gloss:hover .ml-tip { display: block; }
    .ml-hash-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0,206,201,0.08);
      border: 1px solid rgba(0,206,201,0.2);
      border-radius: 99px;
      padding: 4px 12px;
      font-size: 11px;
      font-family: ui-monospace, Consolas, monospace;
      color: rgba(0,206,201,0.8);
      cursor: pointer;
      transition: background 0.15s;
    }
    .ml-hash-badge:hover { background: rgba(0,206,201,0.15); }
  `);

  const URGENCY = {
    VERY_LOW: { color: '#00cec9', bg: 'rgba(0,206,201,0.1)', border: 'rgba(0,206,201,0.25)', label: 'No significant issue', progress: 5 },
    LOW: { color: '#00b894', bg: 'rgba(0,184,148,0.1)', border: 'rgba(0,184,148,0.25)', label: 'Manageable / routine care', progress: 25 },
    MODERATE: { color: '#fdcb6e', bg: 'rgba(253,203,110,0.1)', border: 'rgba(253,203,110,0.25)', label: 'Monitor condition', progress: 50 },
    HIGH: { color: '#e17055', bg: 'rgba(225,112,85,0.1)', border: 'rgba(225,112,85,0.25)', label: 'Visit doctor soon', progress: 75 },
    CRITICAL: { color: '#d63031', bg: 'rgba(214,48,49,0.1)', border: 'rgba(214,48,49,0.25)', label: 'Immediate medical attention needed', progress: 100 },
  };

  const SUGGESTED_QUESTIONS = [
    'Is this serious?',
    'What should I do next?',
    'What does this mean?',
    'Should I be worried?',
  ];

  let sessionId = null;
  let chatHistory = [];
  let isChatting = false;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function createPanel() {
    if ($('ml-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'ml-panel';
    panel.innerHTML = `
      <div id="ml-header">
        <div id="ml-header-left">
          <div id="ml-logo">ML</div>
          <div>
            <span id="ml-title">Med<span>Lens</span></span>
            <div style="font-size:10px;color:rgba(45,156,173,0.6);font-family:ui-monospace,Consolas,monospace;margin-top:1px;">AI Generated Summary</div>
          </div>
        </div>
        <button id="ml-close" title="Close">✕</button>
      </div>
      <div id="ml-body"></div>
    `;
    document.body.appendChild(panel);
    $('ml-close').onclick = () => {
      panel.remove();
      showFAB();
    };
  }

  function setBody(html) {
    if ($('ml-body')) $('ml-body').innerHTML = html;
  }

  const SECTION_ICONS = {
    'report overview': '📄',
    'key findings': '🔍',
    'clinical significance': '⚕️',
    'important abnormalities': '⚠️',
    'what to discuss': '🩺',
    'disclaimer': '📋',
    'questions to discuss': '🩺',
    'what this means': '💡',
  };

  function getSectionIcon(title) {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(SECTION_ICONS)) {
      if (lower.includes(key)) return icon;
    }
    return '📌';
  }

  const MEDICAL_GLOSSARY = {
    'hydronephrosis': 'Swelling of the kidney caused by urine backup',
    'hydroureter': 'Abnormal widening of the ureter (tube from kidney to bladder)',
    'pelviectasis': 'Mild widening of the kidney\'s urine collection area',
    'edema': 'Swelling caused by excess fluid trapped in body tissues',
    'malignant': 'Cancerous — can invade nearby tissue and spread',
    'benign': 'Not cancerous — does not spread to other body parts',
    'metastasis': 'Spread of cancer from its original site to other parts',
    'lesion': 'An area of abnormal tissue caused by injury or disease',
    'nodule': 'A small, solid lump that can be felt or seen on imaging',
    'cyst': 'A fluid-filled sac, usually not cancerous',
    'tumor': 'An abnormal growth — can be benign or malignant',
    'fracture': 'A break or crack in a bone',
    'stenosis': 'Abnormal narrowing of a passage in the body',
    'thrombosis': 'Formation of a blood clot inside a blood vessel',
    'aneurysm': 'An abnormal bulge in the wall of a blood vessel',
    'effusion': 'Abnormal fluid accumulation in a body cavity',
    'pneumothorax': 'Collapsed lung — air between lung and chest wall',
    'atelectasis': 'Partial or complete collapse of a lung',
    'consolidation': 'Lung area filled with fluid/infection instead of air',
    'cardiomegaly': 'Enlarged heart',
    'hepatomegaly': 'Enlarged liver',
    'splenomegaly': 'Enlarged spleen',
    'lymphadenopathy': 'Swollen or enlarged lymph nodes',
    'hernia': 'Organ pushing through a weak spot in muscle or tissue',
    'pancreatitis': 'Inflammation of the pancreas',
    'cirrhosis': 'Severe scarring of the liver',
    'fibrosis': 'Thickening and scarring of tissue',
    'calcification': 'Buildup of calcium deposits in body tissue',
    'scoliosis': 'Sideways curvature of the spine',
    'osteoporosis': 'Condition where bones become weak and brittle',
    'arthritis': 'Inflammation of joints causing pain and stiffness',
    'biopsy': 'Test where a tissue sample is removed for examination',
    'bilateral': 'Affecting both sides of the body',
    'anterior': 'Located at the front of the body',
    'posterior': 'Located at the back of the body',
    'enhancement': 'How tissue absorbs contrast dye — changes may indicate abnormality',
    'anastomosis': 'Surgical connection between two structures',
    'obstruction': 'A blockage preventing normal flow',
    'inflammation': 'Body\'s response to injury — redness, swelling, pain',
    'chronic': 'Long-lasting or recurring condition',
    'acute': 'Sudden onset, often severe but short-lasting',
    'impression': 'Radiologist\'s overall conclusion about findings',
    'labrum': 'A ring of cartilage around the edge of a joint socket',
    'labral': 'Related to the labrum (cartilage rim around a joint)',
    'chondral': 'Related to cartilage — the smooth tissue covering bone ends',
    'cartilage': 'Smooth, flexible tissue that covers the ends of bones at joints',
    'delamination': 'Separation or peeling of cartilage layers from bone',
    'femoral': 'Related to the femur (thigh bone)',
    'acetabular': 'Related to the acetabulum (hip socket)',
    'ligament': 'A tough band of tissue connecting bones at a joint',
    'tendon': 'A tough cord of tissue connecting muscle to bone',
    'meniscus': 'C-shaped cartilage cushion in the knee joint',
    'rotator cuff': 'Group of muscles and tendons stabilizing the shoulder joint',
    'disc herniation': 'When a spinal disc bulges or ruptures pressing on nerves',
    'degeneration': 'Gradual breakdown or deterioration of tissue',
    'osteophyte': 'A bony growth (bone spur) at the edge of a joint',
    'subluxation': 'Partial dislocation of a joint',
    'avascular necrosis': 'Death of bone tissue due to lack of blood supply',
    'gadolinium': 'A contrast dye used in MRI scans to improve image detail',
    'saline': 'A sterile saltwater solution used in medical procedures',
    'arthrogram': 'An imaging test where dye is injected into a joint',
    'collagen': 'Main structural protein in skin, bone, cartilage, and tendons',
    'alpha angle': 'A measurement of the shape of the femoral head and neck',
    'ropivacaine': 'A local anesthetic used to numb specific body areas',
    'synovial': 'Related to the membrane lining joints, producing lubricating fluid',
    'dilation': 'Widening or enlargement beyond normal size',
    'whipple procedure': 'Major surgery to remove the head of the pancreas and surrounding structures',
  };

  function applyGlossaryToText(text) {
    let out = text;
    for (const [term, definition] of Object.entries(MEDICAL_GLOSSARY)) {
      const regex = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})\\b`, 'gi');
      if (regex.test(out)) {
        out = out.replace(regex, `<span class="ml-gloss">$1<span class="ml-tip">${escapeHTML(definition)}</span></span>`);
      }
    }
    return out;
  }

  function renderMarkdown(text) {
    let out = text;
    // Convert **bold** to teal highlighted spans
    out = out.replace(/\*\*(.+?)\*\*/g, '<span style="color:#3cb8cc;font-weight:700;">$1</span>');
    // Convert remaining *text* to subtle emphasis
    out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em style="color:rgba(224,247,250,0.9);font-style:normal;">$1</em>');
    // Clean up any stray asterisks
    out = out.replace(/\*{1,2}/g, '');
    // Apply glossary tooltips
    out = applyGlossaryToText(out);
    return out;
  }

  function formatSummary(rawSummary) {
    const escaped = escapeHTML(rawSummary);
    const lines = escaped.split(/\n/);
    let sections = [];
    let currentTitle = '';
    let currentContent = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,4}\s+(.+)/);
      if (headingMatch) {
        if (currentTitle || currentContent.length) {
          sections.push({ title: currentTitle, content: currentContent.join('\n') });
        }
        currentTitle = headingMatch[1].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentTitle || currentContent.length) {
      sections.push({ title: currentTitle, content: currentContent.join('\n') });
    }

    if (sections.length <= 1) {
      return `<div class="ml-finding-card">${renderMarkdown(escaped).replace(/\n/g, '<br>')}</div>`;
    }

    return sections.map(s => {
      if (!s.title && !s.content.trim()) return '';
      const icon = s.title ? getSectionIcon(s.title) : '📌';
      const title = s.title
        ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;border-bottom:1px solid rgba(45,156,173,0.1);padding-bottom:8px;">
            <span style="font-size:15px;">${icon}</span>
            <span style="font-size:14px;font-weight:700;color:#e0f7fa;letter-spacing:0.01em;">${s.title}</span>
          </div>`
        : '';
      let bodyHTML = '';
      const contentLines = s.content.trim().split('\n');
      let currentParagraph = [];

      const flushParagraph = () => {
        if (!currentParagraph.length) return;
        const text = currentParagraph.join(' ').trim();
        if (text) {
          bodyHTML += `<div style="background:rgba(255,255,255,0.02);border-left:2px solid rgba(45,156,173,0.15);padding:8px 12px;margin:6px 0;border-radius:0 8px 8px 0;font-size:13.5px;line-height:1.75;color:rgba(204,230,236,0.82);">${renderMarkdown(text)}</div>`;
        }
        currentParagraph = [];
      };

      for (const cl of contentLines) {
        const bulletMatch = cl.match(/^\s*[\*\-•]\s+(.+)/);
        if (bulletMatch) {
          flushParagraph();
          const item = renderMarkdown(bulletMatch[1]);
          bodyHTML += `<div style="display:flex;gap:8px;margin:4px 0 4px 4px;font-size:13.5px;line-height:1.7;color:rgba(204,230,236,0.85);"><span style="color:#3cb8cc;flex-shrink:0;margin-top:2px;">●</span><span>${item}</span></div>`;
        } else if (cl.trim() === '') {
          flushParagraph();
        } else {
          currentParagraph.push(cl.trim());
        }
      }
      flushParagraph();

      return (title || bodyHTML) ? `<div class="ml-finding-card">${title}${bodyHTML}</div>` : '';
    }).join('');
  }

  // Chrome UI strings to strip from extracted text
  const CHROME_UI_NOISE = [
    'Fit to page', 'Fit to width', 'Automatic', 'Page navigation',
    'Thumbnails', 'Document outline', 'Attachments', 'Layers',
    'Two page view', 'Annotations', 'Document properties', 'Present',
    'Rotate clockwise', 'Rotate counterclockwise', 'Download', 'Print',
    'More actions', 'Zoom in', 'Zoom out', 'Open with',
  ];

  function cleanExtractedText(raw) {
    let text = raw || '';
    // Remove common Chrome PDF viewer UI noise
    for (const noise of CHROME_UI_NOISE) {
      text = text.split(noise).join('');
    }
    // Remove isolated short lines that look like page numbers or zoom levels
    text = text.replace(/\b\d+\s*\/\s*\d+\b/g, ''); // "1 / 2"
    text = text.replace(/\b\d+%/g, ''); // "100%"
    return text.replace(/\s+/g, ' ').trim();
  }

  function extractPDFViewerText() {
    // Strategy 1: Try Chrome PDF viewer shadow DOM (Chrome 97+ uses web-based viewer)
    const viewers = document.querySelectorAll('pdf-viewer, embed[type*="pdf"]');
    for (const v of viewers) {
      try {
        if (v.shadowRoot) {
          const allText = v.shadowRoot.textContent || '';
          if (allText.length > 100) return cleanExtractedText(allText);
        }
      } catch (e) { /* shadow root may be closed */ }
    }

    // Strategy 2: Programmatic Select All → read selection
    try {
      const prevSelection = window.getSelection().toString();
      document.execCommand('selectAll');
      const selectedText = window.getSelection().toString();
      // Restore previous selection state
      if (!prevSelection) window.getSelection().removeAllRanges();
      if (selectedText && selectedText.length > 100) {
        return cleanExtractedText(selectedText);
      }
    } catch (e) { /* selectAll may fail on some pages */ }

    // Strategy 3: Regular body text with noise filtering
    const bodyText = document.body?.innerText || document.body?.textContent || '';
    return cleanExtractedText(bodyText);
  }

  function getPageText() {
    // For PDF pages, use the multi-strategy extractor
    if (isPDFPage()) {
      return extractPDFViewerText();
    }
    // For normal pages, simple extraction
    const text = document.body?.innerText || document.body?.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  const STEPS = [
    'Reading report text...',
    'Sending to MedLens AI...',
    'Generating patient summary...',
    'Classifying urgency level...',
    'Almost done...',
  ];

  function showLoading(sourceInfo) {
    setBody(`
      <div id="ml-loading">
        <div class="ml-scan-bar"><div class="ml-scan-fill"></div></div>
        <div class="ml-spinner"></div>
        <div class="ml-loading-title">Analyzing your report</div>
        <div class="ml-loading-step" id="ml-step">Processing ${sourceInfo}...</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px;">This may take 15-30 seconds</div>
      </div>
    `);

    let i = 0;
    const interval = setInterval(() => {
      const el = $('ml-step');
      if (el && i < STEPS.length) {
        el.textContent = STEPS[i++];
      } else {
        clearInterval(interval);
      }
    }, 3500);

    return () => clearInterval(interval);
  }

  function showResult(data) {
    sessionId = data.session_id;
    chatHistory = [];

    const u = data.urgency;
    const cfg = URGENCY[u.level] || URGENCY.MODERATE;
    const conf = u.confidence !== null ? `Confidence: ${Math.round(u.confidence * 100)}%` : '';
    const overrideHTML = u.override_applied && u.override_keywords?.length
      ? `<div style="margin-top:6px;font-size:10px;color:rgba(255,118,117,0.7);">Safety override:</div>
         <div class="ml-override-row">${u.override_keywords.map((k) => `<span class="ml-kw-chip">${escapeHTML(k)}</span>`).join('')}</div>`
      : '';
    const suggestionsHTML = SUGGESTED_QUESTIONS
      .map((q) => `<button class="ml-suggestion-btn" data-q="${escapeHTML(q)}">${escapeHTML(q)}</button>`)
      .join('');

    setBody(`
      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">⚡</span> Urgency level</div>
        <div class="ml-urgency-card" style="background:${cfg.bg};border-color:${cfg.border};color:${cfg.color};">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div class="ml-urgency-level">${escapeHTML(u.level.replace('_', ' '))}</div>
              <div class="ml-urgency-label">${escapeHTML(cfg.label)}</div>
            </div>
            ${conf ? `<div style="background:rgba(255,255,255,0.08);border-radius:99px;padding:4px 12px;font-size:12px;font-family:ui-monospace,Consolas,monospace;color:rgba(255,255,255,0.5);">${escapeHTML(conf)}</div>` : ''}
          </div>
          <div class="ml-progress-track">
            <div class="ml-progress-fill" id="ml-prog" style="width:0%;background:${cfg.color};"></div>
          </div>
          ${overrideHTML}
        </div>
      </div>

      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">💬</span> Why this urgency?</div>
        <div class="ml-reason-box">${escapeHTML(u.reason)}</div>
      </div>

      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">📋</span> Report analysis</div>
        ${formatSummary(data.summary)}
      </div>

      <div class="ml-section">
        <div class="ml-disclaimer">
          ⚕️ AI-generated analysis only. Not a medical diagnosis. Consult a qualified doctor.
        </div>
      </div>

      ${data.report_hash ? `
      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">🔐</span> Report integrity</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span class="ml-hash-badge" id="ml-copy-hash" title="Click to copy full hash">
            ✓ Verified · ${escapeHTML(data.report_hash.slice(0, 12))}…
          </span>
          <span style="font-size:11px;color:rgba(255,255,255,0.3);">SHA-256 fingerprint</span>
        </div>
      </div>
      ` : ''}

      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">🆘</span> Emergency health card</div>
        <button id="ml-qr-btn" style="
          width:100%;padding:10px;
          background:rgba(214,48,49,0.08);border:1px solid rgba(214,48,49,0.2);
          border-radius:12px;color:rgba(255,118,117,0.9);font-size:13px;font-weight:600;
          cursor:pointer;font-family:inherit;transition:background 0.15s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        ">🆘 Generate Emergency QR Card</button>
        <div id="ml-qr-result"></div>
      </div>

      <div class="ml-divider"></div>

      <div class="ml-section">
        <div class="ml-section-label"><span style="font-size:14px;">💭</span> Ask about this report</div>
        <div class="ml-suggestions" id="ml-suggestions">${suggestionsHTML}</div>
        <div class="ml-chat-messages" id="ml-chat-msgs"></div>
        <div class="ml-chat-input-row">
          <input class="ml-chat-input" id="ml-chat-inp" placeholder="Ask a follow-up question..." />
          <button class="ml-send-btn" id="ml-send-btn">Send</button>
        </div>
      </div>
    `);

    setTimeout(() => {
      const prog = $('ml-prog');
      if (prog) prog.style.width = cfg.progress + '%';
    }, 200);

    chatHistory.push({
      role: 'assistant',
      content: `Hi. Your report shows ${u.level.replace('_', ' ')} urgency. Ask me anything about it.`,
    });
    renderChat();

    document.querySelectorAll('.ml-suggestion-btn').forEach((btn) => {
      btn.onclick = () => doChat(btn.dataset.q);
    });

    const copyHash = $('ml-copy-hash');
    if (copyHash && data.report_hash) {
      copyHash.onclick = () => {
        navigator.clipboard.writeText(data.report_hash).then(() => {
          copyHash.innerHTML = '✓ Copied!';
          setTimeout(() => {
            copyHash.innerHTML = `✓ Verified · ${escapeHTML(data.report_hash.slice(0, 12))}…`;
          }, 1500);
        });
      };
    }

    const qrBtn = $('ml-qr-btn');
    if (qrBtn) {
      qrBtn.onclick = () => {
        qrBtn.disabled = true;
        qrBtn.innerHTML = '<div class="ml-spinner" style="width:14px;height:14px;border-width:1.5px;"></div> Generating...';

        GM_xmlhttpRequest({
          method: 'POST',
          url: `${BACKEND_URL}/api/emergency-card`,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ session_id: sessionId }),
          onload: (response) => {
            if (response.status !== 200) {
              qrBtn.innerHTML = '❌ Failed — try again';
              qrBtn.disabled = false;
              return;
            }
            try {
              const info = JSON.parse(response.responseText);
              const qrText = JSON.stringify({
                name: info.patient_name,
                conditions: info.conditions,
                blood: info.blood_type,
                allergies: info.allergies,
                meds: info.medications,
                alert: info.emergency_notes,
                urgency: info.urgency,
                by: 'MedLens AI',
              });

              const qr = qrcode(0, 'M');
              qr.addData(qrText.slice(0, 500));
              qr.make();

              const resultDiv = $('ml-qr-result');
              if (resultDiv) {
                resultDiv.innerHTML = `
                  <div style="margin-top:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(45,156,173,0.1);border-radius:14px;padding:16px;text-align:center;">
                    <div style="font-size:13px;font-weight:700;color:#e0f7fa;margin-bottom:8px;">🆘 Emergency Health Card</div>
                    <div style="background:white;display:inline-block;padding:8px;border-radius:8px;margin-bottom:10px;">
                      ${qr.createImgTag(4, 0)}
                    </div>
                    <div style="text-align:left;font-size:12px;line-height:1.7;color:rgba(204,230,236,0.82);">
                      <div><span style="color:#3cb8cc;font-weight:600;">Name:</span> ${escapeHTML(info.patient_name)}</div>
                      <div><span style="color:#3cb8cc;font-weight:600;">Conditions:</span> ${escapeHTML(info.conditions.join(', '))}</div>
                      <div><span style="color:#3cb8cc;font-weight:600;">Blood Type:</span> ${escapeHTML(info.blood_type)}</div>
                      <div><span style="color:#3cb8cc;font-weight:600;">Allergies:</span> ${escapeHTML(info.allergies)}</div>
                      <div><span style="color:#3cb8cc;font-weight:600;">Medications:</span> ${escapeHTML(info.medications)}</div>
                      <div style="margin-top:6px;padding:6px 10px;background:rgba(214,48,49,0.08);border-radius:8px;border:1px solid rgba(214,48,49,0.15);color:rgba(255,118,117,0.9);font-size:11px;">
                        ⚠️ ${escapeHTML(info.emergency_notes)}
                      </div>
                    </div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:8px;">Scan QR with any phone camera to view info</div>
                  </div>
                `;
              }
              qrBtn.style.display = 'none';
            } catch {
              qrBtn.innerHTML = '❌ Error generating card';
              qrBtn.disabled = false;
            }
          },
          onerror: () => {
            qrBtn.innerHTML = '❌ Network error — try again';
            qrBtn.disabled = false;
          },
        });
      };
    }

    $('ml-send-btn').onclick = () => {
      const val = $('ml-chat-inp').value.trim();
      if (val) doChat(val);
    };
    $('ml-chat-inp').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const val = $('ml-chat-inp').value.trim();
        if (val) doChat(val);
      }
    });
  }

  function renderChat() {
    const box = $('ml-chat-msgs');
    if (!box) return;
    box.innerHTML = chatHistory.map((m) =>
      `<div class="${m.role === 'user' ? 'ml-msg-user' : 'ml-msg-bot'}">${escapeHTML(m.content)}</div>`,
    ).join('');
    box.scrollTop = box.scrollHeight;
  }

  function getAPIError(response) {
    try {
      const data = JSON.parse(response.responseText);
      return data.detail || data.message || `Request failed with status ${response.status}.`;
    } catch {
      return `Request failed with status ${response.status}.`;
    }
  }

  function doChat(question) {
    if (isChatting || !sessionId || !question) return;
    isChatting = true;

    const inp = $('ml-chat-inp');
    const btn = $('ml-send-btn');
    if (inp) inp.value = '';
    if (btn) btn.disabled = true;

    chatHistory.push({ role: 'user', content: question });
    renderChat();

    const box = $('ml-chat-msgs');
    if (box) {
      const typing = document.createElement('div');
      typing.className = 'ml-msg-typing';
      typing.id = 'ml-typing';
      typing.innerHTML = '<div class="ml-spinner" style="width:14px;height:14px;border-width:1.5px;"></div> Reviewing report...';
      box.appendChild(typing);
      box.scrollTop = box.scrollHeight;
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: `${BACKEND_URL}/api/chat`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ session_id: sessionId, message: question }),
      onload: (response) => {
        const typing = $('ml-typing');
        if (typing) typing.remove();

        if (response.status !== 200) {
          chatHistory.push({ role: 'assistant', content: getAPIError(response) });
        } else {
          try {
            const data = JSON.parse(response.responseText);
            chatHistory.push({ role: 'assistant', content: data.answer || 'No response received.' });
          } catch {
            chatHistory.push({ role: 'assistant', content: 'Could not parse response.' });
          }
        }

        renderChat();
        isChatting = false;
        if (btn) btn.disabled = false;
      },
      onerror: () => {
        const typing = $('ml-typing');
        if (typing) typing.remove();
        chatHistory.push({ role: 'assistant', content: 'Network error. Could not reach MedLens backend.' });
        renderChat();
        isChatting = false;
        if (btn) btn.disabled = false;
      },
    });
  }

  function showError(msg) {
    setBody(`
      <div class="ml-error">
        <div style="font-size:28px;margin-bottom:10px;">!</div>
        <div>${escapeHTML(msg)}</div>
        <button class="ml-retry-btn" id="ml-retry">Try Again</button>
      </div>
    `);
    $('ml-retry').onclick = () => startAnalysis();
  }

  function isPDFPage() {
    const url = window.location.href.toLowerCase();
    return url.endsWith('.pdf') || url.includes('.pdf?') || url.includes('.pdf#') ||
           (url.startsWith('file:') && url.includes('.pdf'));
  }

  function startAnalysis() {
    if (isPDFPage()) {
      startPDFAnalysis();
    } else {
      startTextAnalysis();
    }
  }

  function showFilePicker(pdfUrl, stopSteps) {
    stopSteps();
    const fileName = decodeURIComponent(
      pdfUrl.split('/').pop().split('?')[0].split('#')[0] || 'this PDF'
    );
    setBody(`
      <div style="text-align:center;padding:24px 16px;">
        <div style="font-size:28px;margin-bottom:12px;">📄</div>
        <div style="font-size:13px;color:#e0f7fa;margin-bottom:6px;font-weight:700;">Local PDF Detected</div>
        <div style="font-size:11.5px;color:rgba(255,255,255,0.55);line-height:1.6;margin-bottom:18px;">
          Chrome blocks direct file reading for security.<br>
          Click below and select <strong style="color:#3cb8cc;">${escapeHTML(fileName)}</strong> to analyze it.
        </div>
        <label id="ml-file-label" style="
          display:inline-flex;align-items:center;gap:8px;
          background:rgba(45,156,173,0.18);border:1px solid rgba(45,156,173,0.4);
          border-radius:12px;padding:11px 22px;cursor:pointer;
          color:#3cb8cc;font-size:13px;font-weight:700;
          transition:background 0.15s;
        ">
          📁 Select PDF File
          <input type="file" id="ml-file-input" accept=".pdf,application/pdf"
            style="display:none;" />
        </label>
        <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:12px;">
          Only .pdf files are accepted
        </div>
      </div>
    `);

    const fileInput = $('ml-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          showError('Please select a PDF file.');
          return;
        }

        const newStop = showLoading('PDF file');
        const reader = new FileReader();
        reader.onload = function () {
          uploadPDFToBackend(reader.result, pdfUrl, newStop);
        };
        reader.onerror = function () {
          newStop();
          showError('Could not read the selected file.');
        };
        reader.readAsArrayBuffer(file);
      });
    }
  }

  function uploadPDFToBackend(arrayBuffer, pdfUrl, stopSteps) {
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const fileName = decodeURIComponent(
      pdfUrl.split('/').pop().split('?')[0].split('#')[0] || 'report.pdf'
    );

    // Build multipart form data manually for GM_xmlhttpRequest
    const boundary = '----MedLensBoundary' + Date.now();
    const header = '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
      'Content-Type: application/pdf\r\n\r\n';
    const footer = '\r\n--' + boundary + '--\r\n';

    // Combine header + pdf bytes + footer into one arraybuffer
    const headerBytes = new TextEncoder().encode(header);
    const footerBytes = new TextEncoder().encode(footer);
    const pdfBytes = new Uint8Array(arrayBuffer);
    const body = new Uint8Array(headerBytes.length + pdfBytes.length + footerBytes.length);
    body.set(headerBytes, 0);
    body.set(pdfBytes, headerBytes.length);
    body.set(footerBytes, headerBytes.length + pdfBytes.length);

    GM_xmlhttpRequest({
      method: 'POST',
      url: `${BACKEND_URL}/api/analyze`,
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      },
      data: body.buffer,
      responseType: 'text',
      onload: (response) => {
        stopSteps();
        if (response.status !== 200) {
          try {
            const err = JSON.parse(response.responseText);
            showError(err.detail || err.message || 'Analysis failed (status ' + response.status + ')');
          } catch {
            showError('Analysis failed with status ' + response.status);
          }
          return;
        }
        try {
          const data = JSON.parse(response.responseText);
          showResult(data);
        } catch {
          showError('Unexpected response from backend.');
        }
      },
      onerror: () => {
        stopSteps();
        showError('Could not reach MedLens backend. Make sure Railway is running.');
      },
    });
  }

  const MEDICAL_KEYWORDS = [
    'patient', 'findings', 'impression', 'clinical', 'diagnosis',
    'examination', 'history', 'physician', 'radiology', 'report',
    'contrast', 'mri', 'ct scan', 'x-ray', 'ultrasound',
    'abdomen', 'kidney', 'liver', 'lung', 'brain', 'spine',
    'surgery', 'procedure', 'treatment', 'medication', 'prescription',
    'blood', 'biopsy', 'pathology', 'lab', 'result',
  ];

  function looksLikeMedicalText(text) {
    const lower = text.toLowerCase();
    let matches = 0;
    for (const kw of MEDICAL_KEYWORDS) {
      if (lower.includes(kw)) matches++;
    }
    return matches >= 3;
  }

  function sendTextToBackend(text) {
    const stopSteps = showLoading(text.length + ' characters extracted');

    GM_xmlhttpRequest({
      method: 'POST',
      url: `${BACKEND_URL}/api/analyze-text`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ text }),
      onload: (response) => {
        stopSteps();
        if (response.status !== 200) {
          showError(getAPIError(response));
          return;
        }
        try {
          const data = JSON.parse(response.responseText);
          showResult(data);
        } catch {
          showError('Unexpected response from backend.');
        }
      },
      onerror: () => {
        stopSteps();
        showError('Could not reach MedLens backend. Make sure Railway is running.');
      },
    });
  }

  function showPastePanel() {
    setBody(`
      <div style="padding:22px 20px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="
            width:48px;height:48px;margin:0 auto 12px;
            background:rgba(45,156,173,0.12);border:1px solid rgba(45,156,173,0.25);
            border-radius:14px;display:flex;align-items:center;justify-content:center;
            font-size:22px;
          ">📋</div>
          <div style="font-size:17px;color:#f5f4ef;font-weight:800;letter-spacing:-0.01em;">Paste Report Text</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-top:4px;">
            Chrome blocks direct PDF reading for security
          </div>
        </div>

        <div style="
          background:rgba(12,45,69,0.45);border:1px solid rgba(45,156,173,0.12);
          border-radius:12px;padding:14px 16px;margin-bottom:16px;
        ">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.35);margin-bottom:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;">How to copy text</div>

          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
            <span style="background:rgba(45,156,173,0.2);color:#3cb8cc;font-size:12px;font-weight:800;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</span>
            <span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Click on the PDF page behind this panel</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
            <span style="background:rgba(45,156,173,0.2);color:#3cb8cc;font-size:12px;font-weight:800;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</span>
            <span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Press <kbd style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:5px;font-size:12px;font-family:ui-monospace,Consolas,monospace;color:#e0f7fa;">Ctrl + A</kbd> to select all</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
            <span style="background:rgba(45,156,173,0.2);color:#3cb8cc;font-size:12px;font-weight:800;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</span>
            <span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Press <kbd style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:5px;font-size:12px;font-family:ui-monospace,Consolas,monospace;color:#e0f7fa;">Ctrl + C</kbd> to copy</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="background:rgba(45,156,173,0.2);color:#3cb8cc;font-size:12px;font-weight:800;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</span>
            <span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Click the box below &amp; press <kbd style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:5px;font-size:12px;font-family:ui-monospace,Consolas,monospace;color:#e0f7fa;">Ctrl + V</kbd></span>
          </div>
        </div>

        <textarea id="ml-paste-area" placeholder="Paste your report text here (Ctrl+V)..."
          style="
            width:100%;height:130px;resize:vertical;
            background:rgba(255,255,255,0.05);
            border:1px solid rgba(45,156,173,0.25);
            border-radius:12px;padding:14px 16px;
            color:#f5f4ef;font-family:inherit;font-size:14px;
            line-height:1.6;outline:none;box-sizing:border-box;
            transition:border-color 0.2s;
          "></textarea>

        <button id="ml-paste-analyze" style="
          width:100%;margin-top:12px;padding:14px;
          background:linear-gradient(135deg,rgba(45,156,173,0.25),rgba(45,156,173,0.15));
          border:1px solid rgba(45,156,173,0.4);
          border-radius:12px;color:#3cb8cc;font-size:15px;font-weight:700;
          cursor:pointer;font-family:inherit;
          transition:background 0.2s,transform 0.15s;
          letter-spacing:0.01em;
        ">✨ Analyze Report</button>

        <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:10px;text-align:center;">
          Your text is sent securely to MedLens AI for analysis
        </div>
      </div>
    `);

    const area = $('ml-paste-area');
    const btn = $('ml-paste-analyze');

    if (area) {
      area.addEventListener('focus', function() {
        this.style.borderColor = 'rgba(45,156,173,0.5)';
      });
      area.addEventListener('blur', function() {
        this.style.borderColor = 'rgba(45,156,173,0.25)';
      });
    }

    if (btn) {
      btn.addEventListener('mouseover', function() {
        this.style.background = 'rgba(45,156,173,0.35)';
      });
      btn.addEventListener('mouseout', function() {
        this.style.background = 'rgba(45,156,173,0.2)';
      });
      btn.onclick = () => {
        const pastedText = (area?.value || '').trim();
        if (!pastedText || pastedText.length < 50) {
          area.style.borderColor = 'rgba(214,48,49,0.5)';
          area.setAttribute('placeholder', 'Please paste the report text first (at least 50 characters)...');
          return;
        }
        sendTextToBackend(pastedText);
      };
    }
  }

  function startPDFAnalysis() {
    const pdfUrl = window.location.href;
    const isLocal = pdfUrl.startsWith('file:');
    const stopSteps = showLoading('PDF file');

    if (isLocal) {
      // For local file:// PDFs, try to extract visible text
      stopSteps();
      const text = extractPDFViewerText();

      // Check if extracted text is actual medical content (not Chrome UI garbage)
      if (text && text.length >= 100 && looksLikeMedicalText(text)) {
        sendTextToBackend(text);
      } else {
        // Chrome's PDF viewer blocks text access — show paste panel
        showPastePanel();
      }
    } else {
      // For remote URLs, use GM_xmlhttpRequest to bypass CORS
      GM_xmlhttpRequest({
        method: 'GET',
        url: pdfUrl,
        responseType: 'arraybuffer',
        onload: (response) => {
          if (response.status !== 200 && response.status !== 0) {
            stopSteps();
            showError('Could not fetch PDF file. Status: ' + response.status);
            return;
          }
          if (!response.response || response.response.byteLength === 0) {
            stopSteps();
            showError('PDF file appears to be empty.');
            return;
          }
          uploadPDFToBackend(response.response, pdfUrl, stopSteps);
        },
        onerror: () => {
          stopSteps();
          showError('Could not fetch the remote PDF file.');
        },
      });
    }
  }

  function startTextAnalysis() {
    const text = getPageText();

    if (!text || text.length < 50) {
      showError('Could not read enough text from this page. Make sure the page has selectable text content.');
      return;
    }

    const stopSteps = showLoading(text.length + ' characters');

    GM_xmlhttpRequest({
      method: 'POST',
      url: `${BACKEND_URL}/api/analyze-text`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ text }),
      onload: (response) => {
        stopSteps();
        if (response.status !== 200) {
          showError(getAPIError(response));
          return;
        }

        try {
          const data = JSON.parse(response.responseText);
          showResult(data);
        } catch {
          showError('Unexpected response from backend.');
        }
      },
      onerror: () => {
        stopSteps();
        showError('Could not reach MedLens backend. Make sure Railway is running.');
      },
    });
  }

  function shouldShowOnThisPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    // Always show on PDF pages and file:// URLs
    if (url.includes('.pdf') || url.startsWith('file:')) return true;
    if (title.includes('.pdf')) return true;

    // For normal web pages, check for medical content
    const bodyText = (document.body?.innerText || '').slice(0, 3000).toLowerCase();
    return (
      bodyText.includes('patient:') ||
      bodyText.includes('findings') ||
      bodyText.includes('impression') ||
      bodyText.includes('clinical information')
    );
  }

  function showFAB() {
    if (!shouldShowOnThisPage()) return;
    if ($('ml-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'ml-fab';
    fab.innerHTML = '<div class="ml-dot"></div> Analyze with MedLens';
    fab.onclick = () => {
      fab.remove();
      createPanel();
      startAnalysis();
    };
    document.body.appendChild(fab);
  }

  function boot() {
    if (document.body) showFAB();
  }

  boot();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);

  let attempts = 0;
  const bootTimer = setInterval(() => {
    attempts += 1;
    boot();
    if ($('ml-fab') || attempts >= 20) clearInterval(bootTimer);
  }, 500);
})();

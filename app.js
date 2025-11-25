const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("chat-folder");
const zipInput = document.getElementById("chat-zip");
const txtInput = document.getElementById("chat-txt");
const fileStatus = document.getElementById("file-status");
const groupTypeSelect = document.getElementById("group-type");
const groupTypeOtherInput = document.getElementById("group-type-other");
const generateBtn = document.getElementById("generate-btn");
const loadingBox = document.getElementById("loading");
const errorBox = document.getElementById("generation-errors");
const rankingPanel = document.getElementById("ranking-panel");
const rankedList = document.getElementById("ranked-list");
const availableList = document.getElementById("available-list");
const submitRankingsBtn = document.getElementById("submit-rankings");
const rankingError = document.getElementById("ranking-error");
const rankingSummary = document.getElementById("ranking-summary");
const ruleCardTemplate = document.getElementById("rule-card-template");
const rankingNote = document.getElementById("ranking-note");
const loadingSpinner = loadingBox?.querySelector(".spinner") || null;
const loadingText = loadingBox?.querySelector(".loading-text") || null;
// Landing / instructions / upload elements
const landingPanel = document.getElementById("landing-panel");
const consentPanel = document.getElementById("consent-panel");
const instructionsPanel = document.getElementById("instructions-panel");
const uploadPanel = document.getElementById("upload-panel");
const groupPanel = document.getElementById("group-panel");
const generationPanel = document.getElementById("generation-panel");
const startBtn = document.getElementById("start-btn");
const consentAgreeBtn = document.getElementById("consent-agree-btn");
const consentDeclineBtn = document.getElementById("consent-decline-btn");
const downloadConsentPdfBtn = document.getElementById("download-consent-pdf");
const consentRead = document.getElementById("consent-read");
const consentAge = document.getElementById("consent-age");
const consentVoluntary = document.getElementById("consent-voluntary");
const consentConfidential = document.getElementById("consent-confidential");
const consentAgree = document.getElementById("consent-agree");
const instructionsBtn = document.getElementById("instructions-btn");
const approveBtn = document.getElementById("approve-btn");
const transcriptPreview = document.getElementById("transcript-preview");
const sourceIdField = document.getElementById("source-id-field");
const sourceIdInput = document.getElementById("source-id");
const sourceIdLabel = document.getElementById("source-id-label");
const proceedInstruction = document.getElementById("proceed-instruction");
// Demographic fields
const demoAge = document.getElementById("demo-age");
const demoGender = document.getElementById("demo-gender");
const demoLocation = document.getElementById("demo-location");
const demoLanguages = document.getElementById("demo-languages");
const demoEducation = document.getElementById("demo-education");
const demoWaFrequency = document.getElementById("demo-wa-frequency");
const demoWaGroups = document.getElementById("demo-wa-groups");
const demoWaAdminGroups = document.getElementById("demo-wa-admin-groups");
const demoModerationExp = document.getElementById("demo-moderation-exp");
const demoAdminDuration = document.getElementById("demo-admin-duration");
const demoWritingConfidence = document.getElementById("demo-writing-confidence");
const demoExplanationSkill = document.getElementById("demo-explanation-skill");
const demoAttentionCheck = document.getElementById("demo-attention-check");

let chatFile = null;
let parsedMessages = [];
let contextualWindow = [];
let allRules = [];
let availableRules = [];
let rankedRules = [];
let loadingResetTimer = null;
// Map of original pre-merge rules by id for summary introspection
let originalsById = new Map();
let meetsActivityCriteria = true;
let wasDragging = false;
let consentGiven = false;
let consentTimestamp = null;
let consentApproved = false;
let pseudoMap = new Map();
let sourceType = null;
let sourceId = null;
let lastGenerated = null;
let deviceType = null;
let transcriptMeta = null;
let rulesGenerated = false;

const MAX_SELECTED_RULES = 7;
const MAX_CONTEXT_CHARS = 300000;
const DRAG_RULE_ID = "text/x-rule-id";
const DRAG_RULE_SOURCE = "text/x-rule-source";
const ZIP_FILE_REGEX = /\.zip$/i;
const GEMINI_MODEL = "models/gemini-2.5-pro";
const GEMINI_FLASH_MODEL = "models/gemini-2.5-flash";

function setLoadingState(state) {
  if (!loadingBox) return;

  if (loadingResetTimer) {
    clearTimeout(loadingResetTimer);
    loadingResetTimer = null;
  }

  if (state === "loading") {
    if (loadingSpinner) {
      loadingSpinner.style.display = "";
    }
    if (loadingText) {
      loadingText.textContent = "Please wait for 1 minute...";
    }
    loadingBox.hidden = false;
    loadingBox.dataset.state = "loading";
    return;
  }

  if (state === "ready") {
    if (loadingSpinner) {
      loadingSpinner.style.display = "none";
    }
    if (loadingText) {
      loadingText.textContent = "Rules ready! Drag them into the ranking zone.";
    }
    loadingBox.hidden = false;
    loadingBox.dataset.state = "ready";
    loadingResetTimer = window.setTimeout(() => {
      if (loadingBox.dataset.state === "ready") {
        setLoadingState("idle");
      }
    }, 1200);
    return;
  }

  loadingBox.hidden = true;
  delete loadingBox.dataset.state;
  if (loadingSpinner) {
    loadingSpinner.style.display = "";
  }
  if (loadingText) {
    loadingText.textContent = "Suggesting some rules...";
  }
}

rankedList.dataset.emptyMessage = "Drag rules here to rank them (max 7).";
availableList.dataset.emptyMessage = "Generate rules to begin.";
rankedList.classList.add("empty");
availableList.classList.add("empty");
const initialDropZoneMarkup = dropZone.innerHTML;

const GENERIC_PROMPT_TEMPLATE = ({ groupType }) => `You are assisting with the generation of governance guidelined for WhatsApp groups.

Task: Provide exactly six governance guidelines that would be suitable for a WhatsApp group categorised as "${groupType}". Each rule must be a single, self-contained statement (one short self-contained sentence) describing the expectation or restriction. For each rule, also provide a short "reason" sentence.

Requirements:
- Balance prescriptive guidance (what members should do) and restrictive guidance (what members must avoid).
- Focus on broadly applicable group norms that you think would be applicable for "${groupType}" type, from your own prior knowledge.
- For each rule include a neutral, general "reason" that explains the benefit of the rule without implying knowledge of any specific or anedotal knowledge of any particular group, transcript, or participants.
- Keep tone neutral and reasoning abstract (i.e., reasons should read like universal justifications, not case-specific commentary).
- Keep each statement concise and actionable; avoid duplicates and numbering.

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Rule statement",
      "reason": "Neutral, general justification"
    }
  ]
}`;

function buildContextualPrompt({ groupType, stats, messages }) {
  const lines = messages.map((msg) => JSON.stringify({
    timestamp: msg.timestampIso,
    sender: pseudoOf(msg.sender),
    mediaType: msg.mediaType,
    content: redactContent(msg.raw),
  }));
  const messagesBlock = lines.join("\n");

  const participantLines = stats.topParticipants
    .map((entry) => `- ${entry.name}: ${entry.count} messages`)
    .join("\n");

  const mediaBreakdown = Object.entries(stats.mediaCounts)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const trimmingNote = stats.trimmedMessages > 0
    ? `- Older messages trimmed to meet token budget: ${stats.trimmedMessages}\n- Approximate characters sent: ${stats.approxChars}`
    : "- No trimming required for token budget";

  return `You are assisting with the generation of governance guidelined for WhatsApp groups.

Context summary:
- Group type: ${groupType}
- Observation window: ${stats.windowStart} to ${stats.windowEnd}
- Total messages analysed: ${stats.totalMessages}
- Participants observed (${stats.topParticipants.length} of ${stats.distinctParticipants}):\n${participantLines}
- Media breakdown: ${mediaBreakdown}
- Notable activity notes: ${stats.activityNotes}
- Token budget note:\n${trimmingNote}

Below is a transcript excerpt containing the most recent ${messages.length} rows from the selected window. Each row is JSON with timestamp, sender, mediaType (text|image|video|audio|document|link|system), and content. Use it extensively to understand recurring topics, conflicts, and norms.
${messagesBlock}

Task: Create exactly six different governance rules tailored to the observed behaviours. Express each rule as a single, self-contained statement (one short self-contained sentence) that sets clear expectations or boundaries for the group. For each rule, also provide a short "reason" sentence.

Requirements:
- Each rule must be grounded in patterns surfaced by the transcript, but do not mention the transcript, chat logs, participants, or the analysis process. Do not write "this group" or otherwise reveal that these rules come from a specific dataset.
- Mix prescriptive and restrictive guidance.
- Reference specific behaviours only when they appear in the excerpt, but phrase the accompanying "reason" in neutral, general and abstract justification rather than explicit references to the observed messages.
- Keep the tone constructive and neutral; avoid naming individuals or exposing personal data.
- Keep reasons comparable in tone and level of abstraction to the generic variant so that the two sets can be compared fairly.
- Avoid numbering, bullet symbols, or extra commentary.

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Rule statement",
      "reason": "Neutral, general justification grounded in patterns"
    }
  ]
}`;
}

// Build a metadata-only prompt using the same structure as contextual, but without exposing raw text content.
function buildMetadataOnlyPrompt({ groupType, stats, messages }) {
  const lines = messages.map((msg) => {
    const meta = {
      timestamp: msg.timestampIso,
      sender: pseudoOf(msg.sender),
      mediaType: msg.mediaType,
    };

    // For text-like entries (including links/system/deleted), include only word and character counts.
    if (msg.mediaType === "text" || msg.mediaType === "link" || msg.mediaType === "system" || msg.mediaType === "deleted") {
      const words = countWords(msg.raw);
      const chars = countCodePoints(msg.raw);
      meta.content = { words, chars };
    } else if (msg.mediaType === "image" || msg.mediaType === "video" || msg.mediaType === "audio" || msg.mediaType === "document") {
      const filename = extractFilename(msg.raw);
      meta.content = filename ? { mediaType: msg.mediaType, filename } : { mediaType: msg.mediaType };
    } else {
      // Fallback: do not expose text, still provide counts only.
      meta.content = { words: countWords(msg.raw), chars: countCodePoints(msg.raw) };
    }

    return JSON.stringify(meta);
  });

  const messagesBlock = lines.join("\n");

  const participantLines = stats.topParticipants
    .map((entry) => `- ${entry.name}: ${entry.count} messages`)
    .join("\n");

  const mediaBreakdown = Object.entries(stats.mediaCounts)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const trimmingNote = stats.trimmedMessages > 0
    ? `- Older messages trimmed to meet token budget: ${stats.trimmedMessages}\n- Approximate characters sent: ${stats.approxChars}`
    : "- No trimming required for token budget";

  return `You are assisting with the generation of governance guidelined for WhatsApp groups.

Context summary (no message content provided):
- Group type: ${groupType}
- Observation window: ${stats.windowStart} to ${stats.windowEnd}
- Total messages analysed: ${stats.totalMessages}
- Participants observed (${stats.topParticipants.length} of ${stats.distinctParticipants}):\n${participantLines}
- Media breakdown: ${mediaBreakdown}
- Notable activity notes: ${stats.activityNotes}
- Token budget note:\n${trimmingNote}

Below is a transcript excerpt where each row is JSON with timestamp, sender, mediaType, and a content object that contains only metadata (word and character counts for text/link/system/deleted messages; and mediaType plus filename when available for media messages). No raw message text or URLs are included.
${messagesBlock}

Task: Create exactly six governance rules based only on these metadata signals that you think are the most relevant or important. Express each rule as a single, self-contained statement (one short self-contained sentence) that sets clear expectations or boundaries for the group. For each rule, also provide a short "reason" sentence.

Requirements:
- Do not infer or reference any specific message content, quotes, or topics. Base rules solely on activity patterns and metadata.
- Mix prescriptive and restrictive guidance.
- Keep the tone constructive and neutral; avoid naming individuals or exposing any personal data.
- Reasons should be phrased in neutral general terms and be comparable in tone and abstraction to the other variants.
- Avoid numbering, bullet symbols, or extra commentary.

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Rule statement",
      "reason": "Neutral, general justification grounded in metadata"
    }
  ]
}`;
}

function parseChatFile(contents) {
  const lines = contents.split(/\r?\n/);
  const messages = [];
  const participants = new Map();
  let current = null;

  // [MM/DD/YY, 10:33:52 PM] Name: Text
  const BRACKET_RE = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^\]]+)\]\s(.+?):\s([\s\S]*)$/;
  // MM/DD/YY, 10:33:52 PM - Name: Text  (hyphen/en-dash/em-dash)
  const HYPHEN_RE  = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^-–—]+)\s*[-–—]\s(.+?):\s([\s\S]*)$/;

  for (const raw of lines) {
    if (!raw.trim()) continue;

    // Normalize hidden/odd chars WhatsApp inserts
    const line = raw
      .replace(/[\u200e\u200f]/g, "")       // LRM/RLM
      .replace(/\u202f|\u00A0/g, " ");      // (narrow) NBSP → space

    let m = line.match(BRACKET_RE) || line.match(HYPHEN_RE);
    if (m) {
      let [, mm, dd, yy, timePart, sender, body] = m;

      // Normalize date (swap if clearly DD/MM)
      let y = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
      let month = Number(mm), day = Number(dd);
      if (month > 12 && day <= 12) [month, day] = [day, month];

      const t = parseTimePart(timePart);
      if (!t) {
        // If the time is weird, treat this as a continuation line
        if (current) {
          current.raw += `\n${raw.trim()}`;
          current.preview = createPreview(current.raw);
        }
        continue;
      }

      const ts = new Date(y, month - 1, day, t.hh, t.mm, t.ss);
      const text = (body ?? "").trim();

      const entry = {
        timestamp: ts,
        timestampIso: ts.toISOString(),
        sender: sender.trim(),
        raw: text,
        preview: createPreview(text),
        mediaType: inferMediaType(text),
      };

      messages.push(entry);
      participants.set(entry.sender, (participants.get(entry.sender) ?? 0) + 1);
      current = entry;
    } else if (current) {
      // Multi-line continuation
      current.raw += `\n${line.trim()}`;
      current.preview = createPreview(current.raw);
    }
  }

  messages.sort((a, b) => a.timestamp - b.timestamp);
  return { messages, participants };
}

// More robust parser that supports both iOS (_chat.txt, bracket format) and Android (named chat file, hyphen format,
// including event lines without a colon) and DD/MM vs MM/DD heuristics.
function parseChatFileRobust(contents) {
  const lines = contents.split(/\r?\n/);
  const messages = [];
  const participants = new Map();
  let current = null;

  const BRACKET_RE = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^\]]+)\]\s(.+?):\s([\s\S]*)$/;
  const HYPHEN_RE  = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^-–—]+)\s*[-–—]\s(.+?):\s([\s\S]*)$/;
  const HYPHEN_EVENT_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*([^-–—]+)\s*[-–—]\s([\s\S]+)$/;

  // Heuristic: mark DD/MM if any date's first token > 12
  let preferDayFirst = false;
  for (let i = 0; i < lines.length && i < 1000; i += 1) {
    const probe = String(lines[i]).replace(/[\u200e\u200f]/g, "").trim();
    let mmdd = probe.match(/^\[(\d{1,2})\/(\d{1,2})\//) || probe.match(/^(\d{1,2})\/(\d{1,2})\//);
    if (mmdd) {
      const first = Number(mmdd[1]);
      if (first > 12) { preferDayFirst = true; break; }
    }
  }

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const line = raw
      .replace(/[\u200e\u200f]/g, "")
      .replace(/\u202f|\u00A0/g, " ");

    let m = line.match(BRACKET_RE) || line.match(HYPHEN_RE);
    if (m) {
      let [, mm, dd, yy, timePart, sender, body] = m;
      let y = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
      let month = Number(mm), day = Number(dd);
      if (preferDayFirst || (month > 12 && day <= 12)) [month, day] = [day, month];

      const t = parseTimePart(timePart);
      if (!t) {
        if (current) {
          current.raw += `\n${raw.trim()}`;
          current.preview = createPreview(current.raw);
        }
        continue;
      }

      const ts = new Date(y, month - 1, day, t.hh, t.mm, t.ss);
      const text = (body ?? "").trim();
      const entry = {
        timestamp: ts,
        timestampIso: ts.toISOString(),
        sender: sender.trim(),
        raw: text,
        preview: createPreview(text),
        mediaType: inferMediaType(text),
      };
      messages.push(entry);
      participants.set(entry.sender, (participants.get(entry.sender) ?? 0) + 1);
      current = entry;
      continue;
    }

    m = line.match(HYPHEN_EVENT_RE);
    if (m) {
      let [, mm, dd, yy, timePart, body] = m;
      let y = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
      let month = Number(mm), day = Number(dd);
      if (preferDayFirst || (month > 12 && day <= 12)) [month, day] = [day, month];

      const t = parseTimePart(timePart);
      if (!t) {
        if (current) {
          current.raw += `\n${raw.trim()}`;
          current.preview = createPreview(current.raw);
        }
        continue;
      }

      const ts = new Date(y, month - 1, day, t.hh, t.mm, t.ss);
      const text = (body ?? "").trim();
      const entry = {
        timestamp: ts,
        timestampIso: ts.toISOString(),
        sender: "(system)",
        raw: text,
        preview: createPreview(text),
        mediaType: inferMediaType(text),
      };
      messages.push(entry);
      current = entry;
      continue;
    }

    if (current) {
      current.raw += `\n${line.trim()}`;
      current.preview = createPreview(current.raw);
    }
  }

  messages.sort((a, b) => a.timestamp - b.timestamp);
  return { messages, participants };
}

// Accepts "10:33:52 PM", "10:33 PM", "22:33:52" (handles dots & NNBSP)
function parseTimePart(timePart) {
  const clean = String(timePart).replace(/[.\u202f\u00A0]/g, " ").replace(/\s+/g, " ").trim();
  let m, hh = 0, mm = 0, ss = 0;

  // AM/PM
  if ((m = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)$/i))) {
    hh = +m[1]; mm = +m[2]; ss = +(m[3] || 0);
    const pm = /PM/i.test(m[4]);
    if (hh === 12) hh = pm ? 12 : 0;
    else if (pm) hh += 12;
    return { hh, mm, ss };
  }
  // 24h
  if ((m = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/))) {
    return { hh: +m[1], mm: +m[2], ss: +(m[3] || 0) };
  }
  return null;
}



// Keep/adjust your helpers as needed
function inferMediaType(s) {
  const l = (s || "").toLowerCase().replace(/[\u200e\u200f]/g, "");
  if (/\bimage omitted\b/.test(l)) return "image";
  if (/\bvideo omitted\b/.test(l)) return "video";
  if (/\baudio omitted\b/.test(l)) return "audio";
  if (/\bdocument omitted\b/.test(l)) return "document";
  if (/<media omitted>/.test(l)) return "image";
  if (/\bthis message was deleted\b|\byou deleted this message\b/.test(l)) return "deleted";
  if (/https?:\/\//.test(l)) return "link";
  if (/\b(changed this group's|changed the group|created group|left|were added|was added|added|removed|settings)\b/.test(l)) return "system";
  return "text";
}

function createPreview(s) {
  return String(s || "").replace(/\s+/g, " ").slice(0, 140);
}


function computeContextWindow(messages) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const sixMonthMessages = messages.filter((msg) => msg.timestamp >= sixMonthsAgo);
  const lastThreeHundred = messages.slice(-300);

  if (sixMonthMessages.length >= 300) {
    return sixMonthMessages;
  }

  return lastThreeHundred;
}

// Check transcript eligibility based on activity criteria
function checkTranscriptEligibility(messages) {
  const result = {
    ok: true,
    spanDays: 0,
    totalMessages: messages.length,
    uniqueParticipants: 0,
    last30Count: 0,
    last30Avg: 0,
    earliestIso: null,
    latestIso: null,
    // individual checks
    spanOk: false,
    totalOk: false,
    uniqueOk: false,
    recentOk: false,
  };

  if (!messages.length) {
    result.ok = false;
    return result;
  }

  const msDay = 24 * 60 * 60 * 1000;
  const earliest = messages[0].timestamp;
  const latest = messages[messages.length - 1].timestamp;
  result.spanDays = Math.floor((latest - earliest) / msDay);
  result.earliestIso = messages[0].timestampIso;
  result.latestIso = messages[messages.length - 1].timestampIso;

  const last30Start = new Date(latest.getTime() - 30 * msDay);
  const last30 = messages.filter((m) => m.timestamp >= last30Start);
  result.last30Count = last30.length;
  result.last30Avg = last30.length / 30;

  const unique = new Set();
  for (const m of messages) {
    if (m.sender && m.sender !== "(system)") unique.add(m.sender);
  }
  result.uniqueParticipants = unique.size;

  // Thresholds (updated): span >= 90 days; total >= 500; unique >= 3; last 30 days count >= 50
  result.spanOk = result.spanDays >= 90;
  result.totalOk = result.totalMessages >= 500;
  result.uniqueOk = result.uniqueParticipants >= 3;
  result.recentOk = result.last30Count >= 50;
  result.ok = result.spanOk && result.totalOk && result.uniqueOk && result.recentOk;
  return result;
}

// Heuristic device inference from content format
function inferDeviceType(contents) {
  try {
    const sample = String(contents).slice(0, 20000).split(/\r?\n/).slice(0, 500);
    let bracket = 0, hyphen = 0;
    const BR = /^\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*[^\]]+\]\s.+?:\s/;
    const HY = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s*[^-–—]+\s*[-–—]\s.+?:\s/;
    for (const line of sample) {
      const s = line.replace(/[\u200e\u200f]/g, '').trim();
      if (BR.test(s)) bracket += 1; else if (HY.test(s)) hyphen += 1;
      if (bracket + hyphen > 20) break;
    }
    if (bracket > hyphen && bracket >= 2) return 'ios';
    if (hyphen > bracket && hyphen >= 2) return 'android';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function enforceCharacterBudget(messages, maxChars) {
  if (!messages.length) {
    return {
      retained: [],
      trimmed: 0,
      approxChars: 0,
    };
  }

  let total = 0;
  const retainedReversed = [];

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const jsonLine = JSON.stringify({
      timestamp: message.timestampIso,
      sender: message.sender,
      mediaType: message.mediaType,
      content: message.raw,
    });
    const size = jsonLine.length + 1;

    if (total + size > maxChars && retainedReversed.length) {
      break;
    }

    total += size;
    retainedReversed.push(message);
  }

  const retained = retainedReversed.reverse();
  const trimmedCount = messages.length - retained.length;

  if (!retained.length && messages.length) {
    const lastMessage = messages[messages.length - 1];
    return {
      retained: [lastMessage],
      trimmed: messages.length - 1,
      approxChars: JSON.stringify({
        timestamp: lastMessage.timestampIso,
        sender: lastMessage.sender,
        mediaType: lastMessage.mediaType,
        content: lastMessage.raw,
      }).length,
    };
  }

  return {
    retained,
    trimmed: trimmedCount,
    approxChars: total,
  };
}

function pickWhatsAppTxt(zip) {
  const allEntries = Object.keys(zip.files);
  const fileNames = allEntries.filter(n => !zip.files[n].dir);
  if (!fileNames.length) return null;

  // Try to detect a single top-level folder (Android export)
  const topLevelDirs = new Set();
  for (const n of fileNames) {
    const seg = n.split("/")[0];
    if (seg && n.includes("/")) topLevelDirs.add(seg);
  }

  const stripDuplicateSuffix = (s) => s.replace(/\s*\(\d+\)\s*$/, "");

  // If there are clear top-level dirs, look for <dir>/<dir>.txt or <dir>/<dirWithoutSuffix>.txt or <dirWithoutSuffix>.txt
  for (const dir of Array.from(topLevelDirs)) {
    const base = stripDuplicateSuffix(dir);
    const candidates = [
      `${dir}/${dir}.txt`,
      `${dir}/${base}.txt`,
      `${base}.txt`,
    ];
    for (const cand of candidates) {
      if (fileNames.includes(cand)) return cand;
    }
  }

  // Fall back to heuristic scoring
  const scored = fileNames.map(n => {
    const L = n.toLowerCase();
    let score = 0;
    if (L.endsWith("_chat.txt")) score += 1000;
    if (/(^|\/)whatsapp chat( with)? /.test(L)) score += 200;
    if (L.endsWith(".txt")) score += 20;
    if (L.includes("chat")) score += 10;
    if (/\/(media|stickers|animated_gifs|photos|videos|audio|documents)\//.test(L)) score -= 100;
    if (/readme|manifest/.test(L)) score -= 50;
    // Prefer shallower paths
    const depth = (n.match(/\//g) || []).length;
    score -= depth;
    return { n, score };
  }).sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].n : null;
}

// Choose the most likely chat .txt from a folder selection
function chooseChatFileFromList(fileList) {
  // Normalize candidates with scoring similar to zip picker
  const candidates = fileList.map((f) => {
    const path = (f.webkitRelativePath || f.name || "");
    const L = path.toLowerCase();
    let score = 0;
    if (L.endsWith("/_chat.txt") || L === "_chat.txt") score += 1000;
    if (/(^|\/)whatsapp chat( with)? /.test(L)) score += 200;
    if (L.endsWith(".txt")) score += 20;
    if (L.includes("chat")) score += 10;
    if (/\/(media|stickers|animated_gifs|photos|videos|audio|documents)\//.test(L)) score -= 100;
    if (/readme|manifest/.test(L)) score -= 50;
    // Prefer shallower paths
    const depth = (path.match(/\//g) || []).length;
    if (depth === 0) score += 300; // likely root-level .txt in selected folder
    score -= depth;
    return { file: f, score, path };
  }).filter(c => c.path.toLowerCase().endsWith('.txt'))
    .sort((a, b) => b.score - a.score);

  return candidates.length ? candidates[0].file : null;
}

async function extractChatFromZip(zipFile) {
  if (typeof JSZip === "undefined") {
    throw new Error("Zip support is unavailable. Please refresh the page and try again.");
  }
  const arrayBuffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const entryName = pickWhatsAppTxt(zip);
  if (!entryName) throw new Error("Could not find a WhatsApp .txt inside the selected zip file.");

  const chatContents = await zip.files[entryName].async("string");
  const extractedFile = new File([chatContents], entryName, { type: "text/plain" });
  return { file: extractedFile, entryName };
}


async function loadChatFile(chat, displayLabel) {
  try {
    const contents = await chat.text();
    // Use robust parser that supports iOS and Android formats
    const { messages } = parseChatFileRobust(contents);
    parsedMessages = messages;
    const initialWindow = computeContextWindow(messages);
    const budget = enforceCharacterBudget(initialWindow, MAX_CONTEXT_CHARS);
    contextualWindow = budget.retained;

    fileStatus.textContent = `Chat loaded successfully.`;
    fileStatus.style.color = "";
    dropZone.setAttribute("aria-label", `Chat ready`);
    dropZone.classList.add("loaded", "ready");
    dropZone.innerHTML = `
      <p class="dz-instructions"><strong>Chat detected.</strong></p>
      <p class="dz-hint">Drop another zip or chat .txt to replace it.</p>
    `;
    dropZone.tabIndex = 0;
    dropZone.removeAttribute("aria-hidden");
    dropZone.style.pointerEvents = "";

    // Build pseudonym map across full transcript and count contextual participants with pseudonyms
    pseudoMap = buildPseudonymMap(parsedMessages);
    const contextualParticipants = new Map();
    for (const msg of contextualWindow) {
      const name = pseudoOf(msg.sender);
      contextualParticipants.set(name, (contextualParticipants.get(name) ?? 0) + 1);
    }

    const stats = buildStats(contextualWindow, contextualParticipants, {
      trimmedMessages: budget.trimmed,
      approxChars: budget.approxChars,
    });
    dropZone.dataset.stats = JSON.stringify(stats);

    // Eligibility check using full transcript (not just context window)
    const elig = checkTranscriptEligibility(parsedMessages);
    meetsActivityCriteria = elig.ok;
    deviceType = inferDeviceType(contents);
    transcriptMeta = {
      deviceType,
      totalMessages: elig.totalMessages,
      uniqueParticipants: elig.uniqueParticipants,
      earliestIso: elig.earliestIso,
      latestIso: elig.latestIso,
      last30Count: elig.last30Count,
      last30Avg: Number(elig.last30Avg.toFixed(2)),
      spanDays: elig.spanDays,
    };
    if (!elig.ok) {
      const bullets = [];
      if (!elig.spanOk) bullets.push(`- spans at least 90 days (current: ${elig.spanDays} days)`);
      if (!elig.totalOk) bullets.push(`- has at least 500 total messages (current: ${elig.totalMessages})`);
      if (!elig.uniqueOk) bullets.push(`- has at least 3 unique participants (current: ${elig.uniqueParticipants})`);
      if (!elig.recentOk) bullets.push(`- has at least 50 messages in the last 30 days (current: ${elig.last30Count})`);

      fileStatus.style.color = "var(--error)";
      fileStatus.textContent = [
        "This transcript doesn’t meet the minimum activity criteria.",
        "Upload a chat that:",
        ...bullets,
      ].join(" \n");
    }

    // Render transcript preview and enable approval if eligible
    renderTranscriptPreview(parsedMessages);
    updateApproveButtonState();
    return true;
  } catch (error) {
    console.error("Failed to read chat file", error);
    fileStatus.textContent = `Failed to read ${displayLabel}.`;
    fileStatus.style.color = "var(--error)";
    resetDropZone();
    parsedMessages = [];
    contextualWindow = [];
    meetsActivityCriteria = false;
    return false;
  }
}

function resetDropZone() {
  dropZone.innerHTML = initialDropZoneMarkup;
  dropZone.classList.remove("loaded", "ready");
  dropZone.setAttribute("aria-label", "Drop WhatsApp zip or chat .txt here");
  dropZone.tabIndex = 0;
  dropZone.style.pointerEvents = "";
  delete dropZone.dataset.stats;
  meetsActivityCriteria = true;
}

function clearRulesUI() {
  allRules = [];
  availableRules = [];
  rankedRules = [];
  rankedList.innerHTML = "";
  availableList.innerHTML = "";
  rankedList.classList.add("empty");
  availableList.classList.add("empty");
  rankedList.dataset.emptyMessage = "Drag rules here to rank them (max 7).";
  availableList.dataset.emptyMessage = "Generate rules to begin.";
  rankingPanel.hidden = true;
  rankingSummary.hidden = true;
  rankingSummary.innerHTML = "";
  rankingError.textContent = "";
  if (rankingNote) {
    rankingNote.hidden = true;
    rankingNote.textContent = "";
  }
  // Reset generation state
  rulesGenerated = false;
  generateBtn.textContent = "Click here for some suggestive guidelines";
  if (proceedInstruction) {
    proceedInstruction.hidden = true;
  }
}

function buildStats(messages, participantsMap, extras = {}) {
  if (!messages.length) {
    return {
      totalMessages: 0,
      windowStart: "n/a",
      windowEnd: "n/a",
      topParticipants: [],
      mediaCounts: {},
      distinctParticipants: participantsMap.size,
      activityNotes: "No messages available",
      trimmedMessages: extras.trimmedMessages ?? 0,
      approxChars: extras.approxChars ?? 0,
    };
  }

  const mediaCounts = messages.reduce((acc, msg) => {
    acc[msg.mediaType] = (acc[msg.mediaType] ?? 0) + 1;
    return acc;
  }, {});

  const participants = Array.from(participantsMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const distinctParticipants = participantsMap.size;
  const windowStart = new Date(messages[0].timestampIso).toISOString();
  const windowEnd = new Date(messages[messages.length - 1].timestampIso).toISOString();

  const activityNotes = createActivityNotes(messages);

  return {
    totalMessages: messages.length,
    windowStart,
    windowEnd,
    topParticipants: participants,
    mediaCounts,
    distinctParticipants,
    activityNotes,
    trimmedMessages: extras.trimmedMessages ?? 0,
    approxChars: extras.approxChars ?? 0,
  };
}

function createActivityNotes(messages) {
  if (!messages.length) return "No activity recorded.";

  const hourBuckets = new Array(24).fill(0);
  for (const msg of messages) {
    hourBuckets[msg.timestamp.getHours()] += 1;
  }

  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const offHourActivity = hourBuckets.slice(0, 6).reduce((a, b) => a + b, 0);
  const daySpan = (messages[messages.length - 1].timestamp - messages[0].timestamp) / (1000 * 60 * 60 * 24);

  const notes = [
    `Peak posting hour: ${peakHour}:00`,
    `Messages in 12am-5am window: ${offHourActivity}`,
    `Coverage span: ${daySpan.toFixed(1)} days`,
  ];

  return notes.join("; ");
}


async function callGemini({ prompt, model = GEMINI_MODEL }) {
  const resp = await fetch("/webhook3/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, temperature: 0.65, topP: 0.9 }),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Gemini proxy error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.text || "";
}

// Build a merge prompt for Gemini Flash to combine near-similar rules.
function buildMergePrompt(rules) {
  // rules: [{ id, source, text, reason }]
  const items = rules.map(r => ({ id: r.id, source: r.source, text: r.text, reason: r.reason || "" }));
  const payloadLines = items.map(obj => JSON.stringify(obj)).join("\n");

  return `You will be given a list of governance rules for a real WhatsApp group generated from 3 different context types (Just assume these are 3 different sources). Some rules may be near-duplicates (paraphrases or minor wording changes) while others are distinct.

Goal: Merge near-similar rules so that only unique rules remain.

Guidance for "near-similar":
- Consider rules near-similar if they enforce the exact expectation or restriction with only phrasing/synonym changes, or trivial scope/qualifier differences that do not materially change the meaning.
- Do not merge if a rule adds a substantive new condition, targets a different behavior (e.g., promotions vs. off-topic vs. late-night messages), contradicts another or if they are a different rule altogether albeit for the same intended behavior.
- Prefer the clearest, most concise wording as the canonical text.
- Provide a single short, neutral reason for each merged rule that stays comparable in tone to the originals.

Input rules (one JSON per line):
${payloadLines}

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Canonical merged rule text",
      "reason": "Short neutral justification",
      "from": ["generic-1", "contextual-3", "metadata-2"]
    }
  ]
}`;
}

// Parse merged response and map original ids to their source categories
function parseMergedRules(rawText, idToSource) {
  const cleansed = String(rawText || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  let parsed;
  try {
    parsed = JSON.parse(cleansed);
  } catch (e) {
    console.error("Failed to parse merged JSON", e, rawText);
    throw new Error("Could not parse merged JSON response.");
  }
  if (!parsed || !Array.isArray(parsed.rules)) {
    throw new Error("Merged response missing 'rules' array.");
  }
  const unique = [];
  for (let i = 0; i < parsed.rules.length; i += 1) {
    const r = parsed.rules[i] || {};
    const text = typeof r.text === "string" ? r.text.trim() : "";
    const reason = typeof r.reason === "string" ? r.reason.trim() : undefined;
    const from = Array.isArray(r.from) ? r.from.filter(x => typeof x === "string" && x.trim()).map(String) : [];
    if (!text) throw new Error(`Merged rule ${i + 1} has empty text.`);
    if (!from.length) throw new Error(`Merged rule ${i + 1} missing 'from' list.`);

    const sources = Array.from(new Set(from.map(id => idToSource.get(id)).filter(Boolean)));
    if (!sources.length) throw new Error(`Merged rule ${i + 1} references unknown ids.`);

    unique.push({
      id: `merged-${i + 1}`,
      text,
      reason,
      source: "merged",
      sources,      // categories: ["generic", "contextual", "metadata"]
      origIds: from // original ids preserved for traceability
    });
  }
  return unique;
}



function parseRules(rawText) {
  const cleansed = rawText.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
  try {
    const parsed = JSON.parse(cleansed);
    if (!Array.isArray(parsed.rules)) {
      throw new Error("Missing 'rules' array in response.");
    }
    return parsed.rules.map((rule, index) => {
      if (typeof rule === "string") {
        const text = rule.trim();
        if (!text) {
          throw new Error(`Rule ${index + 1} is empty.`);
        }
        return { text };
      }

      if (rule && typeof rule.text === "string") {
        const text = rule.text.trim();
        if (!text) {
          throw new Error(`Rule ${index + 1} is empty.`);
        }
        const reason = typeof rule.reason === "string" ? rule.reason.trim() : undefined;
        return reason ? { text, reason } : { text };
      }

      throw new Error(`Rule ${index + 1} is missing the 'text' property.`);
    });
  } catch (error) {
    console.error("Failed to parse Gemini response", error, rawText);
    throw new Error("Could not parse Gemini JSON response.");
  }
}

// Unicode-aware character counting (code points) to support UTF-8 and Indic scripts.
function countCodePoints(text) {
  if (!text) return 0;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      let count = 0;
      for (const _ of seg.segment(text)) count += 1;
      return count;
    }
  } catch {}
  return Array.from(text).length;
}

// Word counting with Intl.Segmenter when available; falls back to a Unicode-aware split.
function countWords(text) {
  if (!text) return 0;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const seg = new Intl.Segmenter(undefined, { granularity: "word" });
      let count = 0;
      for (const part of seg.segment(text)) {
        if (part.isWordLike) count += 1;
      }
      return count;
    }
  } catch {}
  // Fallback: split on whitespace, Unicode-aware
  return (String(text).trim().match(/[^\s]+/gu) || []).length;
}

// Best-effort filename extraction from message text for media lines
function extractFilename(text) {
  if (!text) return undefined;
  const s = String(text);
  const wa = s.match(/\b(?:IMG|VID|AUD|DOC|PTT)-\d{8}-WA\d+\.(?:jpe?g|png|gif|webp|heic|heif|mp4|mov|3gp|m4a|opus|pdf|docx?|xlsx?|pptx?)\b/i);
  if (wa) return wa[0];
  const any = s.match(/([\w\s()\-\[\]{}]+\.(?:jpe?g|png|gif|webp|heic|heif|mp4|mov|3gp|m4a|mp3|opus|wav|pdf|docx?|xlsx?|pptx?|zip|rar|7z|txt|apk|csv))/i);
  if (any) return any[1];
  return undefined;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clearRankingSummary() {
  rankingSummary.hidden = true;
  rankingSummary.innerHTML = "";
}

function renderRuleLists() {
  rankingPanel.hidden = false;
  rankingError.textContent = "";
  clearRankingSummary();

  // If we were still showing a loading spinner, hide it once rules are visible
  if (loadingBox && loadingBox.dataset && loadingBox.dataset.state === "loading") {
    setLoadingState("idle");
  }

  if (rankingNote) {
    if (allRules.length) {
      rankingNote.textContent = "Rank the rules you would set for your group from the suggestions below.";
      rankingNote.hidden = false;
    } else {
      rankingNote.hidden = true;
      rankingNote.textContent = "";
    }
  }

  rankedList.innerHTML = "";
  availableList.innerHTML = "";

  rankedList.dataset.emptyMessage = rankedRules.length
    ? ""
    : "Drag rules here to rank them (max 7).";
  availableList.dataset.emptyMessage = availableRules.length
    ? ""
    : "All rules have been ranked.";

  rankedList.classList.toggle("empty", rankedRules.length === 0);
  availableList.classList.toggle("empty", availableRules.length === 0);

  rankedRules.forEach((rule, index) => {
    rankedList.appendChild(createRuleCard(rule, { isRanked: true, rank: index + 1 }));
  });

  availableRules.forEach((rule) => {
    availableList.appendChild(createRuleCard(rule, { isRanked: false }));
  });
}

function createRuleCard(rule, options) {
  const { isRanked, rank } = options;
  const fragment = ruleCardTemplate.content.cloneNode(true);
  const card = fragment.firstElementChild;
  const rankEl = card.querySelector(".rule-rank");
  const textEl = card.querySelector(".rule-text");
  const reasonEl = card.querySelector(".rule-reason");

  textEl.textContent = rule.text;
  if (reasonEl) {
    if (rule.reason) {
      reasonEl.textContent = rule.reason;
      reasonEl.hidden = false;
    } else {
      reasonEl.textContent = "";
      reasonEl.hidden = true;
    }
  }
  card.dataset.ruleId = rule.id;
  card.dataset.list = isRanked ? "ranked" : "available";

  if (isRanked) {
    card.classList.add("is-ranked");
    rankEl.textContent = String(rank);
    const aria = rule.reason ? `Rank ${rank}: ${rule.text}. Reason: ${rule.reason}` : `Rank ${rank}: ${rule.text}`;
    card.setAttribute("aria-label", aria);
  } else {
    card.classList.remove("is-ranked");
    rankEl.textContent = "";
    const aria = rule.reason ? `${rule.text}. Reason: ${rule.reason}` : rule.text;
    card.setAttribute("aria-label", aria);
  }

  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);
  card.addEventListener("click", handleCardClick);

  if (isRanked) {
    const actions = document.createElement("div");
    actions.className = "rule-actions";
    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "rule-action rule-action-up";
    upBtn.setAttribute("aria-label", "Move up");
    upBtn.textContent = "▲";
    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      moveRankedBy(rule.id, -1);
    });
    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "rule-action rule-action-down";
    downBtn.setAttribute("aria-label", "Move down");
    downBtn.textContent = "▼";
    downBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      moveRankedBy(rule.id, +1);
    });
    actions.append(upBtn, downBtn);
    card.appendChild(actions);
  }

  return card;
}

function handleDragStart(event) {
  const card = event.currentTarget;
  const ruleId = card.dataset.ruleId;
  const source = card.dataset.list;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(DRAG_RULE_ID, ruleId);
  event.dataTransfer.setData(DRAG_RULE_SOURCE, source);
  event.dataTransfer.setData("text/plain", card.textContent || "rule");
  requestAnimationFrame(() => {
    card.classList.add("dragging");
  });
  wasDragging = true;
}

function handleDragEnd(event) {
  const card = event.currentTarget;
  card.classList.remove("dragging");
  setTimeout(() => { wasDragging = false; }, 50);
}

function handleCardClick(event) {
  if (wasDragging) return;
  const card = event.currentTarget;
  const ruleId = card.dataset.ruleId;
  const list = card.dataset.list;
  if (!ruleId || !list) return;
  if (list === "available") {
    if (rankedRules.length >= MAX_SELECTED_RULES) {
      rankingError.textContent = `You can rank up to ${MAX_SELECTED_RULES} rules.`;
      return;
    }
    addRuleToRanked(ruleId, rankedRules.length);
  } else if (list === "ranked") {
    moveRuleToAvailable(ruleId, availableRules.length);
  }
}

function moveRankedBy(ruleId, delta) {
  const idx = rankedRules.findIndex((r) => r.id === ruleId);
  if (idx === -1) return;
  const newIdx = Math.min(Math.max(0, idx + delta), rankedRules.length - 1);
  if (newIdx === idx) return;
  const [rule] = rankedRules.splice(idx, 1);
  rankedRules.splice(newIdx, 0, rule);
  renderRuleLists();
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  event.currentTarget.classList.add("dragover");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("dragover");
}

function handleRankedDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("dragover");

  const ruleId = event.dataTransfer.getData(DRAG_RULE_ID);
  const source = event.dataTransfer.getData(DRAG_RULE_SOURCE);

  if (!ruleId) return;

  const targetIndex = getDropIndex(event.currentTarget, event.clientY);

  if (source === "ranked") {
    reorderRankedRule(ruleId, targetIndex);
  } else {
    addRuleToRanked(ruleId, targetIndex);
  }
}

function handleAvailableDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("dragover");

  const ruleId = event.dataTransfer.getData(DRAG_RULE_ID);
  const source = event.dataTransfer.getData(DRAG_RULE_SOURCE);

  if (!ruleId || source !== "ranked") return;

  const targetIndex = getDropIndex(event.currentTarget, event.clientY);
  moveRuleToAvailable(ruleId, targetIndex);
}

function getDropIndex(container, clientY) {
  const cards = Array.from(container.querySelectorAll(".rule-card"));
  for (let index = 0; index < cards.length; index += 1) {
    const rect = cards[index].getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (clientY < midpoint) {
      return index;
    }
  }
  return cards.length;
}

function reorderRankedRule(ruleId, targetIndex) {
  const currentIndex = rankedRules.findIndex((rule) => rule.id === ruleId);
  if (currentIndex === -1) return;

  let destination = targetIndex;
  if (destination > currentIndex) {
    destination -= 1;
  }

  if (destination === currentIndex || destination < 0) {
    return;
  }

  const [rule] = rankedRules.splice(currentIndex, 1);
  rankedRules.splice(destination, 0, rule);
  renderRuleLists();
}

function addRuleToRanked(ruleId, targetIndex) {
  if (rankedRules.length >= MAX_SELECTED_RULES) {
    rankingError.textContent = `You can rank up to ${MAX_SELECTED_RULES} rules.`;
    return;
  }

  const ruleIndex = availableRules.findIndex((rule) => rule.id === ruleId);
  if (ruleIndex === -1) return;

  const [rule] = availableRules.splice(ruleIndex, 1);
  const destination = Math.min(Math.max(targetIndex, 0), rankedRules.length);
  rankedRules.splice(destination, 0, rule);
  renderRuleLists();
}

function moveRuleToAvailable(ruleId, targetIndex) {
  const currentIndex = rankedRules.findIndex((rule) => rule.id === ruleId);
  if (currentIndex === -1) return;

  const [rule] = rankedRules.splice(currentIndex, 1);
  const destination = Math.min(Math.max(targetIndex, 0), availableRules.length);
  availableRules.splice(destination, 0, rule);
  renderRuleLists();
}

function updateGenerateButtonState() {
  // If rules have already been generated, keep button disabled
  if (rulesGenerated) {
    generateBtn.disabled = true;
    return;
  }

  const hasFile = Boolean(chatFile);
  const selected = groupTypeSelect.value;
  const otherOk = selected === "Other" ? Boolean(groupTypeOtherInput && groupTypeOtherInput.value.trim()) : true;
  const hasGroupType = Boolean(selected) && otherOk;
  generateBtn.disabled = !(hasFile && hasGroupType && parsedMessages.length && meetsActivityCriteria && consentApproved);
}

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  const files = Array.from(event.dataTransfer.files || []);
  assignChatFile(files);
});

rankedList.addEventListener("dragover", handleDragOver);
rankedList.addEventListener("dragleave", handleDragLeave);
rankedList.addEventListener("drop", handleRankedDrop);

availableList.addEventListener("dragover", handleDragOver);
availableList.addEventListener("dragleave", handleDragLeave);
availableList.addEventListener("drop", handleAvailableDrop);

if (fileInput) {
  fileInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    assignChatFile(files);
  });
}

if (zipInput) {
  zipInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    assignChatFile(files);
  });
}
if (txtInput) {
  txtInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    assignChatFile(files);
  });
}

function refreshGroupTypeOtherVisibility() {
  const showOther = groupTypeSelect.value === "Other";
  const field = document.getElementById("group-type-other-field");
  if (field) {
    field.hidden = !showOther;
  }
  if (groupTypeOtherInput) {
    groupTypeOtherInput.disabled = !showOther;
    if (showOther) {
      // Focus shortly to avoid blocking layout thrash
      setTimeout(() => groupTypeOtherInput.focus(), 0);
    }
  }
  updateGenerateButtonState();
}

groupTypeSelect.addEventListener("change", refreshGroupTypeOtherVisibility);
if (groupTypeOtherInput) {
  groupTypeOtherInput.addEventListener("input", updateGenerateButtonState);
}
// Initialize visibility on load
refreshGroupTypeOtherVisibility();

async function assignChatFile(fileList) {
  if (!fileList.length) {
    return;
  }

  const zipFile = fileList.find((file) => ZIP_FILE_REGEX.test(file.name));
  if (zipFile) {
    try {
      fileStatus.textContent = `Processing ${zipFile.name}...`;
      fileStatus.style.color = "";
      const { file, entryName } = await extractChatFromZip(zipFile);
      chatFile = file;
      const success = await loadChatFile(chatFile, `${zipFile.name} > ${entryName}`);
      if (success) {
        clearRulesUI();
        setLoadingState("idle");
      } else {
        chatFile = null;
      }
    } catch (error) {
      console.error("Failed to process zip file", error);
      fileStatus.textContent = error.message || "Failed to process zip file.";
      fileStatus.style.color = "var(--error)";
      chatFile = null;
      parsedMessages = [];
      contextualWindow = [];
      resetDropZone();
    }

    if (zipInput) { zipInput.value = ""; }
    if (txtInput) { txtInput.value = ""; }
    if (fileInput) { fileInput.value = ""; }
    updateGenerateButtonState();
    return;
  }

  const chat = chooseChatFileFromList(fileList);

  if (!chat) {
    fileStatus.textContent = "Could not find a WhatsApp chat .txt in the selected folder.";
    fileStatus.style.color = "var(--error)";
    chatFile = null;
    parsedMessages = [];
    contextualWindow = [];
    resetDropZone();
    updateGenerateButtonState();
    return;
  }

  chatFile = chat;
  const label = chat.webkitRelativePath || chat.name;
  fileStatus.textContent = `Loading ${label}...`;
  fileStatus.style.color = "";
  const success = await loadChatFile(chatFile, label);
  if (success) {
    clearRulesUI();
    setLoadingState("idle");
  } else {
    chatFile = null;
  }

  if (fileInput) { fileInput.value = ""; }
  if (zipInput) { zipInput.value = ""; }
  if (txtInput) { txtInput.value = ""; }
  updateGenerateButtonState();
}

generateBtn.addEventListener("click", async () => {
  if (!chatFile || !parsedMessages.length || !contextualWindow.length) {
    return;
  }

  const selectedType = groupTypeSelect.value;
  const groupType = selectedType === "Other" && groupTypeOtherInput ? (groupTypeOtherInput.value.trim() || "Other") : selectedType;

  errorBox.textContent = "";
  setLoadingState("loading");
  generateBtn.disabled = true;
  clearRulesUI();
  availableList.dataset.emptyMessage = "Loading new rules...";

  const stats = JSON.parse(dropZone.dataset.stats || "{}");

  try {
    const genericPrompt = GENERIC_PROMPT_TEMPLATE({ groupType });
    const contextualPrompt = buildContextualPrompt({ groupType, stats, messages: contextualWindow });
    const metadataPrompt = buildMetadataOnlyPrompt({ groupType, stats, messages: contextualWindow });

    const [genericRaw, contextualRaw, metadataRaw] = await Promise.all([
      callGemini({ prompt: genericPrompt }),
      callGemini({ prompt: contextualPrompt }),
      callGemini({ prompt: metadataPrompt }),
    ]);

    const genericRules = parseRules(genericRaw).map((rule, index) => ({
      ...rule,
      id: `generic-${index + 1}`,
      source: "generic",
    }));

    const contextualRules = parseRules(contextualRaw).map((rule, index) => ({
      ...rule,
      id: `contextual-${index + 1}`,
      source: "contextual",
    }));

    const metadataRules = parseRules(metadataRaw).map((rule, index) => ({
      ...rule,
      id: `metadata-${index + 1}`,
      source: "metadata",
    }));

    const originals = [...genericRules, ...contextualRules, ...metadataRules];
    originalsById = new Map(originals.map(r => [r.id, r]));
    // Build id->source index for merged mapping
    const idToSource = new Map(originals.map(r => [r.id, r.source]));

    // Merge near-similar rules using Gemini Flash (same gen params)
    const mergePrompt = buildMergePrompt(originals);
    const mergedRaw = await callGemini({ prompt: mergePrompt, model: GEMINI_FLASH_MODEL });
    const merged = parseMergedRules(mergedRaw, idToSource);

    // remember for submission storage
    lastGenerated = {
      generic: genericRules,
      contextual: contextualRules,
      metadata: metadataRules,
      merged,
      stats,
      groupType,
    };

    allRules = shuffle(merged);
    availableRules = [...allRules];
    rankedRules = [];
    renderRuleLists();
    setLoadingState("idle");

    // Mark rules as generated and show proceed instruction
    rulesGenerated = true;
    generateBtn.disabled = true;
    generateBtn.textContent = "Guidelines Generated";
    if (proceedInstruction) {
      proceedInstruction.hidden = false;
    }
  } catch (error) {
    console.error(error);
    errorBox.textContent = error.message;
    availableList.dataset.emptyMessage = "Generation failed. Please try again.";
    availableList.classList.add("empty");
    rankedList.dataset.emptyMessage = "Drag rules here to rank them (max 7).";
    rankedList.classList.add("empty");
    if (rankingNote) {
      rankingNote.hidden = true;
      rankingNote.textContent = "";
    }
    setLoadingState("idle");
  } finally {
    updateGenerateButtonState();
  }
});

submitRankingsBtn.addEventListener("click", () => {
  rankingError.textContent = "";

  if (!allRules.length) {
    rankingError.textContent = "Generate rules before submitting rankings.";
    return;
  }

  if (!rankedRules.length) {
    rankingError.textContent = "Drag at least one rule into the ranking zone.";
    return;
  }

  const rankedWithOrder = rankedRules.map((rule, index) => ({
    rule,
    rank: index + 1,
  }));
  const totalRanked = rankedWithOrder.length;

  const hasSrc = (rule, type) => Array.isArray(rule.sources) ? rule.sources.includes(type) : rule.source === type;
  const genericSelections = rankedWithOrder
    .filter((item) => hasSrc(item.rule, "generic"))
    .map((item) => `#${item.rank}`);
  const contextualSelections = rankedWithOrder
    .filter((item) => hasSrc(item.rule, "contextual"))
    .map((item) => `#${item.rank}`);
  const metadataSelections = rankedWithOrder
    .filter((item) => hasSrc(item.rule, "metadata"))
    .map((item) => `#${item.rank}`);

  const genericCount = genericSelections.length;
  const contextualCount = contextualSelections.length;
  const metadataCount = metadataSelections.length;
  const genericProportion = ((genericCount / totalRanked) * 100).toFixed(1);
  const contextualProportion = ((contextualCount / totalRanked) * 100).toFixed(1);
  const metadataProportion = ((metadataCount / totalRanked) * 100).toFixed(1);

  rankingSummary.innerHTML = "";

  const heading = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = "Top selections";
  heading.appendChild(strong);

  const list = document.createElement("pre");
  list.textContent = rankedWithOrder
    .map((item) => `#${item.rank} — ${item.rule.text}`)
    .join("\n");

  const genericSelectionsLine = document.createElement("p");
  genericSelectionsLine.textContent = `Generic selections: ${genericSelections.length ? genericSelections.join(", ") : "None"}`;

  const contextualSelectionsLine = document.createElement("p");
  contextualSelectionsLine.textContent = `Contextual selections: ${contextualSelections.length ? contextualSelections.join(", ") : "None"}`;

  const metadataSelectionsLine = document.createElement("p");
  metadataSelectionsLine.textContent = `Metadata-only selections: ${metadataSelections.length ? metadataSelections.join(", ") : "None"}`;

  const genericLine = document.createElement("p");
  genericLine.textContent = `Generic rules selected: ${genericCount}/${totalRanked} (${genericProportion}%)`;

  const contextualLine = document.createElement("p");
  contextualLine.textContent = `Contextual rules selected: ${contextualCount}/${totalRanked} (${contextualProportion}%)`;

  const metadataLine = document.createElement("p");
  metadataLine.textContent = `Metadata-only rules selected: ${metadataCount}/${totalRanked} (${metadataProportion}%)`;

  rankingSummary.append(
    heading,
    list,
    genericSelectionsLine,
    contextualSelectionsLine,
    metadataSelectionsLine,
    genericLine,
    contextualLine,
    metadataLine,
  );
  rankingSummary.hidden = false;

  // Merged rules (all) section is rendered below; ranked-only breakdown removed per request

  // Print all merged rules with their originating rules and counts, regardless of ranking
  try {
    const uniqCount = allRules.length;
    const origCount = originalsById.size; // expected 18
    const mergedAway = Math.max(0, origCount - uniqCount);

    const allHeading = document.createElement("p");
    const strong3 = document.createElement("strong");
    strong3.textContent = "Merged rules (all)";
    allHeading.appendChild(strong3);
    rankingSummary.append(allHeading);

    const statsLine = document.createElement("p");
    statsLine.textContent = `Original rules: ${origCount}. Unique after merge: ${uniqCount}. Total merged: ${mergedAway}.`;
    rankingSummary.append(statsLine);

    allRules.forEach((rule, idx) => {
      const block = document.createElement("div");
      const title = document.createElement("p");
      const reason = rule.reason ? ` (Reason: ${rule.reason})` : "";
      title.textContent = `${idx + 1}. ${rule.text}${reason}`;
      block.appendChild(title);

      if (Array.isArray(rule.origIds) && rule.origIds.length) {
        const ul = document.createElement("ul");
        rule.origIds.forEach((oid) => {
          const li = document.createElement("li");
          const orig = originalsById.get(oid);
          if (orig) {
            const parts = [`[${orig.source}]`, orig.text];
            if (orig.reason) parts.push(`— ${orig.reason}`);
            li.textContent = parts.join(" ");
          } else {
            li.textContent = `${oid} (original not available)`;
          }
          ul.appendChild(li);
        });
        block.appendChild(ul);
      }
      rankingSummary.append(block);
    });
  } catch (e) {
    console.error("Failed to build merged all-rules list", e);
  }

  // After rendering results, store the submission (non-blocking)
  try {
    const payload = buildSubmissionPayload({ rankedWithOrder, genericSelections, contextualSelections, metadataSelections });
    storeSubmission(payload).catch((e) => console.error('Store failed', e));
  } catch (e) {
    console.error('Failed to build/store submission', e);
  }
});

function buildSubmissionPayload({ rankedWithOrder, genericSelections, contextualSelections, metadataSelections }) {
  const sessionId = getOrCreateSessionId();
  const ranked = rankedWithOrder.map(item => ({
    rank: item.rank,
    text: item.rule.text,
    reason: item.rule.reason,
    sources: item.rule.sources || [item.rule.source],
    origIds: item.rule.origIds || [],
  }));
  const previewLines = (transcriptPreview?.textContent || '').split('\n');
  return {
    sessionId,
    sourceType,
    sourceId,
    consent: {
      given: consentGiven,
      timestamp: consentTimestamp,
      readForm: consentRead?.checked || false,
      ageConfirmed: consentAge?.checked || false,
      voluntaryUnderstood: consentVoluntary?.checked || false,
      confidentialityUnderstood: consentConfidential?.checked || false,
      agreeToParticipate: consentAgree?.checked || false,
    },
    demographics: {
      age: demoAge?.value || '',
      gender: demoGender?.value || '',
      location: demoLocation?.value || '',
      languages: demoLanguages?.value || '',
      education: demoEducation?.value || '',
      whatsappFrequency: demoWaFrequency?.value || '',
      whatsappGroups: demoWaGroups?.value || '',
      whatsappAdminGroups: demoWaAdminGroups?.value || '',
      moderationExperience: demoModerationExp?.value || '',
      adminDuration: demoAdminDuration?.value || '',
      writingConfidence: demoWritingConfidence?.value || '',
      explanationSkill: demoExplanationSkill?.value || '',
      attentionCheck: demoAttentionCheck?.value || '',
    },
    transcript: transcriptMeta || {},
    groupType: lastGenerated?.groupType || (groupTypeSelect.value || ''),
    stats: lastGenerated?.stats || JSON.parse(dropZone.dataset.stats || '{}'),
    eligibility: { meetsActivityCriteria },
    pseudonymMap: Object.fromEntries(pseudoMap),
    preview: previewLines,
    generated: {
      generic: lastGenerated?.generic || [],
      contextual: lastGenerated?.contextual || [],
      metadata: lastGenerated?.metadata || [],
      merged: lastGenerated?.merged || [],
    },
    ranking: {
      ranked,
      genericSelections,
      contextualSelections,
      metadataSelections,
    },
    createdAt: new Date().toISOString(),
  };
}

function getOrCreateSessionId() {
  try {
    const key = 'wra_session_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      const bytes = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }
}

async function storeSubmission(data) {
  const resp = await fetch('/webhook3/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`Store error ${resp.status}: ${t}`);
  }
  return await resp.json();
}

updateGenerateButtonState();

// ---------- Landing / Consent flow ----------
function getSelectedSource() {
  const radios = document.querySelectorAll('input[name="source"]');
  for (const r of radios) { if (r.checked) return r.value; }
  return null;
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.name === 'source') {
    const v = getSelectedSource();
    if (!sourceIdField) return;
    if (v) {
      sourceIdField.hidden = false;
      if (sourceIdLabel) {
        sourceIdLabel.textContent = v === 'research' ? 'Enter your code' : (v === 'prolific' ? 'Enter your Prolific ID' : 'Enter your Clickworker ID');
      }
    }
    updateStartButtonState();
  }
});

if (instructionsBtn) {
  instructionsBtn.addEventListener('click', () => {
    if (instructionsPanel) instructionsPanel.hidden = true;
    if (uploadPanel) uploadPanel.hidden = false;
  });
}

if (sourceIdInput) {
  sourceIdInput.addEventListener('input', () => {
    updateStartButtonState();
  });
}

function updateStartButtonState() {
  if (!startBtn) return;
  const v = getSelectedSource();
  const idVal = (sourceIdInput?.value || '').trim();
  startBtn.disabled = !(v && idVal);
}

// Initialize disabled state on load
updateStartButtonState();

// Validate demographic fields
function validateDemographics() {
  if (!demoAge || !demoGender || !demoLocation || !demoLanguages || !demoEducation ||
      !demoWaFrequency || !demoWaGroups || !demoWaAdminGroups || !demoModerationExp ||
      !demoAdminDuration || !demoWritingConfidence ||
      !demoExplanationSkill || !demoAttentionCheck) {
    return false;
  }

  const age = demoAge.value.trim();
  const gender = demoGender.value;
  const location = demoLocation.value.trim();
  const languages = demoLanguages.value.trim();
  const education = demoEducation.value;
  const waFreq = demoWaFrequency.value;
  const waGroups = demoWaGroups.value;
  const waAdminGroups = demoWaAdminGroups.value;
  const modExp = demoModerationExp.value;
  const adminDur = demoAdminDuration.value;
  const writingConf = demoWritingConfidence.value;
  const explainSkill = demoExplanationSkill.value;
  const attCheck = demoAttentionCheck.value;

  return age && gender && location && languages && education && waFreq &&
         waGroups && waAdminGroups && modExp && adminDur &&
         writingConf && explainSkill && attCheck;
}

// Update approve button based on all conditions
function updateApproveButtonState() {
  if (!approveBtn) return;
  const hasChat = meetsActivityCriteria && parsedMessages.length > 0;
  const hasDemographics = validateDemographics();
  approveBtn.disabled = !(hasChat && hasDemographics);
}

// Add event listeners to demographic fields
[demoAge, demoGender, demoLocation, demoLanguages, demoEducation,
 demoWaFrequency, demoWaGroups, demoWaAdminGroups, demoModerationExp,
 demoAdminDuration, demoWritingConfidence,
 demoExplanationSkill, demoAttentionCheck].forEach(field => {
  if (field) {
    field.addEventListener('change', updateApproveButtonState);
    field.addEventListener('input', updateApproveButtonState);
  }
});

// Consent form validation and navigation
function updateConsentButtonState() {
  if (!consentAgreeBtn) return;
  const allChecked = consentRead?.checked && consentAge?.checked &&
                     consentVoluntary?.checked && consentConfidential?.checked &&
                     consentAgree?.checked;
  consentAgreeBtn.disabled = !allChecked;
}

// Add event listeners to consent checkboxes
[consentRead, consentAge, consentVoluntary, consentConfidential, consentAgree].forEach(checkbox => {
  if (checkbox) {
    checkbox.addEventListener('change', updateConsentButtonState);
  }
});

// Landing page: Start button navigation
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (landingPanel) landingPanel.hidden = true;
    if (consentPanel) consentPanel.hidden = false;
  });
}

// Consent page: Agree button
if (consentAgreeBtn) {
  consentAgreeBtn.addEventListener('click', () => {
    consentGiven = true;
    consentTimestamp = new Date().toISOString();
    if (consentPanel) consentPanel.hidden = true;
    if (instructionsPanel) instructionsPanel.hidden = false;
  });
}

// Consent page: Decline button
if (consentDeclineBtn) {
  consentDeclineBtn.addEventListener('click', () => {
    alert('You must agree to participate to continue with this study. Thank you for your interest.');
    window.location.reload();
  });
}

// PDF Download functionality
if (downloadConsentPdfBtn) {
  downloadConsentPdfBtn.addEventListener('click', async () => {
    try {
      // Disable button during generation
      downloadConsentPdfBtn.disabled = true;
      downloadConsentPdfBtn.textContent = 'Generating PDF...';

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.padding = '20px';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.color = 'black';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.fontSize = '12px';
      pdfContainer.style.lineHeight = '1.6';

      // Page 1: Landing/Source ID
      const page1 = document.createElement('div');
      page1.style.marginBottom = '40px';
      page1.innerHTML = `
        <h1 style="font-size: 20px; margin-bottom: 10px;">WhatsApp Guidelines Evaluation</h1>
        <p style="margin-bottom: 10px;"><strong>Participant Information</strong></p>
        <p style="margin-bottom: 5px;">Source: ${sourceType || 'Not specified'}</p>
        <p style="margin-bottom: 5px;">ID/Code: ${sourceId || 'Not specified'}</p>
        <p style="margin-bottom: 5px;">Date: ${new Date().toLocaleDateString()}</p>
      `;

      // Page 2: Consent Form - clone and clean
      const consentClone = consentPanel.cloneNode(true);
      // Remove buttons from clone
      const buttonsInClone = consentClone.querySelectorAll('button');
      buttonsInClone.forEach(btn => btn.remove());
      // Remove checkboxes (show as checked text instead)
      const checkboxLabels = consentClone.querySelectorAll('.options label');
      checkboxLabels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox) {
          const isChecked = checkbox.checked;
          checkbox.remove();
          label.innerHTML = (isChecked ? '☑ ' : '☐ ') + label.textContent;
        }
      });

      pdfContainer.appendChild(page1);
      pdfContainer.appendChild(consentClone);

      // Temporarily add to body (hidden)
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      document.body.appendChild(pdfContainer);

      // Generate PDF
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `WhatsApp_Study_Consent_${sourceId || 'participant'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(pdfContainer).save();

      // Clean up
      document.body.removeChild(pdfContainer);
      downloadConsentPdfBtn.disabled = false;
      downloadConsentPdfBtn.textContent = 'Download PDF Copy';
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try using your browser\'s print function (Ctrl+P or Cmd+P) to save as PDF.');
      downloadConsentPdfBtn.disabled = false;
      downloadConsentPdfBtn.textContent = 'Download PDF Copy';
    }
  });
}

// Initialize page state - ensure only landing panel is visible
(function initializePageState() {
  // Hide header initially
  const mainHeader = document.getElementById('main-header');
  if (mainHeader) mainHeader.hidden = true;

  // Show only landing panel
  if (landingPanel) landingPanel.hidden = false;
  if (consentPanel) consentPanel.hidden = true;
  if (instructionsPanel) instructionsPanel.hidden = true;
  if (uploadPanel) uploadPanel.hidden = true;
  if (groupPanel) groupPanel.hidden = true;
  if (generationPanel) generationPanel.hidden = true;
  if (rankingPanel) rankingPanel.hidden = true;

  // Ensure source-id-field is hidden initially
  if (sourceIdField) sourceIdField.hidden = true;
})();

if (approveBtn) {
  approveBtn.addEventListener('click', () => {
    if (!parsedMessages.length || !meetsActivityCriteria) {
      alert('Please provide an eligible chat first.');
      return;
    }
    if (!validateDemographics()) {
      alert('Please complete all demographic questions before continuing.');
      return;
    }
    consentApproved = true;
    if (uploadPanel) uploadPanel.hidden = true;
    if (groupPanel) groupPanel.hidden = false;
    if (generationPanel) generationPanel.hidden = false;
    updateGenerateButtonState();
  });
}

function renderTranscriptPreview(messages) {
  if (!transcriptPreview) return;
  const show = messages.slice(-50);
  const lines = show.map(msg => {
    const ts = new Date(msg.timestampIso);
    const yyyy = ts.getFullYear();
    const mm = String(ts.getMonth()+1).padStart(2,'0');
    const dd = String(ts.getDate()).padStart(2,'0');
    const hh = String(ts.getHours()).padStart(2,'0');
    const mi = String(ts.getMinutes()).padStart(2,'0');
    const who = pseudoOf(msg.sender);
    const body = msg.mediaType && msg.mediaType !== 'text' ? `[${msg.mediaType}]` : redactContent(msg.raw || '');
    return `[${yyyy}-${mm}-${dd} ${hh}:${mi}] ${who}: ${body}`;
  });
  transcriptPreview.textContent = lines.join('\n');
}

function buildPseudonymMap(messages) {
  const map = new Map();
  let i = 1;
  for (const msg of messages) {
    const name = msg.sender;
    if (!name || name === '(system)') continue;
    if (!map.has(name)) {
      const label = `User ${String(i).padStart(2,'0')}`;
      map.set(name, label);
      i += 1;
    }
  }
  return map;
}

function pseudoOf(name) {
  if (!name || name === '(system)') return name;
  return pseudoMap.get(name) || 'User ??';
}

// Redact URLs, emails, and phone-like numbers from content
function redactContent(text) {
  if (!text) return text;
  let out = String(text);
  // URLs
  out = out.replace(/https?:\/\/[^\s]+/gi, '[URL]');
  // Emails
  out = out.replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]');
  // Phone-like numbers (+country codes, spaces, dashes, parentheses, length >= 7)
  out = out.replace(/\+?\d[\d\s\-()]{6,}\d/g, '[PHONE]');
  return out;
}

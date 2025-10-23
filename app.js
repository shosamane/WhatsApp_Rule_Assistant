const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("chat-folder");
const zipInput = document.getElementById("chat-zip");
const fileStatus = document.getElementById("file-status");
const groupTypeSelect = document.getElementById("group-type");
const modelProviderSelect = document.getElementById("model-provider");
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

let chatFile = null;
let parsedMessages = [];
let contextualWindow = [];
let allRules = [];
let availableRules = [];
let rankedRules = [];
let loadingResetTimer = null;

const MAX_SELECTED_RULES = 7;
const MAX_CONTEXT_CHARS = 300000;
const DRAG_RULE_ID = "text/x-rule-id";
const DRAG_RULE_SOURCE = "text/x-rule-source";
const ZIP_FILE_REGEX = /\.zip$/i;
const MODEL_CONFIG = {
  gemini: { model: "models/gemini-2.5-pro" },
  openai: { model: "gpt-4.1" },
};

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
      loadingText.textContent = "Suggesting some rules...";
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
    }, 2500);
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

const GENERIC_PROMPT_TEMPLATE = ({ groupType }) => `You are assisting with an experiment that compares generic versus context-aware governance rules for WhatsApp groups.

Task: Provide exactly eight governance rules that would be suitable for a WhatsApp group categorised as "${groupType}". Each rule must be a single, self-contained statement (one or two short sentences) describing the expectation or restriction.

Requirements:
- Balance prescriptive guidance (what members should do) and restrictive guidance (what members must avoid).
- Focus on broadly applicable group norms without referencing any transcript, participant, or analysis process.
- Keep each statement concise, actionable, and neutral in tone. Avoid duplicates and numbering.

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Rule statement"
    }
  ]
}`;

function buildContextualPrompt({ groupType, stats, messages }) {
  const lines = messages.map((msg) => JSON.stringify({
    timestamp: msg.timestampIso,
    sender: msg.sender,
    mediaType: msg.mediaType,
    content: msg.raw,
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

  return `You are assisting with an experiment comparing generic versus context-aware governance rules for WhatsApp groups.

Context summary:
- Group type: ${groupType}
- Observation window: ${stats.windowStart} to ${stats.windowEnd}
- Total messages analysed: ${stats.totalMessages}
- Participants observed (${stats.topParticipants.length} of ${stats.distinctParticipants}):\n${participantLines}
- Media breakdown: ${mediaBreakdown}
- Notable activity notes: ${stats.activityNotes}
- Token budget note:\n${trimmingNote}

Below is a transcript excerpt containing the most recent ${messages.length} rows from the selected window. Each row is JSON with timestamp, sender, mediaType (text|image|video|audio|document|link|system), and content (redacted on client when needed). Use it to understand recurring topics, conflicts, and norms.
${messagesBlock}

Task: Create exactly eight governance rules tailored to the observed behaviours. Express each rule as a single, self-contained statement (one or two short sentences) that sets clear expectations or boundaries for the group.

Requirements:
- Each rule must be grounded in patterns surfaced by the transcript, but do not mention the transcript or the analysis process.
- Mix prescriptive and restrictive guidance.
- Reference specific behaviours only when they appear in the excerpt (e.g., late-night forwards, media flooding, off-topic promotions, other similar behavior) and state them as direct rules.
- Keep tone constructive and neutral; avoid naming individuals or exposing personal data.
- Avoid numbering, bullet symbols, or extra commentary.

Return JSON only in this schema:
{
  "rules": [
    {
      "text": "Rule statement"
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
        type: inferMediaType(text),
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
  if (/\bthis message was deleted\b/.test(l)) return "deleted";
  if (/changed this group's (icon|name)/i.test(l)) return "event";
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
  const names = Object.keys(zip.files).filter(n => !zip.files[n].dir);
  // Prefer the canonical name, otherwise fall back to any chat-like .txt
  const scored = names.map(n => {
    const L = n.toLowerCase();
    let score = 0;
    if (L.endsWith("_chat.txt")) score += 100;
    if (L.endsWith(".txt")) score += 10;
    if (L.includes("chat")) score += 5;
    return { n, score };
  }).sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].n : null;
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
    const { messages } = parseChatFile(contents);
    parsedMessages = messages;
    const initialWindow = computeContextWindow(messages);
    const budget = enforceCharacterBudget(initialWindow, MAX_CONTEXT_CHARS);
    contextualWindow = budget.retained;

    const trimNote = budget.trimmed > 0
      ? ` Context window trimmed by ${budget.trimmed} older messages to fit Gemini token limits.`
      : "";

    fileStatus.textContent = `Parsed ${messages.length} messages from ${displayLabel}. Context window: ${contextualWindow.length} rows.${trimNote}`;
    fileStatus.style.color = "";
    dropZone.setAttribute("aria-label", `${contextualWindow.length} messages ready`);
    dropZone.classList.add("loaded", "ready");
    dropZone.innerHTML = `
      <p class="dz-instructions"><strong>Chat detected.</strong></p>
      <p class="dz-hint">Messages parsed: ${messages.length}. Drop another folder or zip to replace it.</p>
    `;
    dropZone.tabIndex = 0;
    dropZone.removeAttribute("aria-hidden");
    dropZone.style.pointerEvents = "";

    const contextualParticipants = new Map();
    for (const msg of contextualWindow) {
      contextualParticipants.set(msg.sender, (contextualParticipants.get(msg.sender) ?? 0) + 1);
    }

    const stats = buildStats(contextualWindow, contextualParticipants, {
      trimmedMessages: budget.trimmed,
      approxChars: budget.approxChars,
    });
    dropZone.dataset.stats = JSON.stringify(stats);
    return true;
  } catch (error) {
    console.error("Failed to read chat file", error);
    fileStatus.textContent = `Failed to read ${displayLabel}.`;
    fileStatus.style.color = "var(--error)";
    resetDropZone();
    parsedMessages = [];
    contextualWindow = [];
    return false;
  }
}

function resetDropZone() {
  dropZone.innerHTML = initialDropZoneMarkup;
  dropZone.classList.remove("loaded", "ready");
  dropZone.setAttribute("aria-label", "Drop WhatsApp export folder or zip here");
  dropZone.tabIndex = 0;
  dropZone.style.pointerEvents = "";
  delete dropZone.dataset.stats;
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


async function callRuleModel({ provider = "gemini", prompt, model, temperature = 0.65, topP = 0.9 }) {
  const resp = await fetch("/webhook3/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, prompt, model, temperature, topP }),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Generation proxy error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.text || "";
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
        return { text };
      }

      throw new Error(`Rule ${index + 1} is missing the 'text' property.`);
    });
  } catch (error) {
    console.error("Failed to parse Gemini response", error, rawText);
    throw new Error("Could not parse Gemini JSON response.");
  }
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

  textEl.textContent = rule.text;
  card.dataset.ruleId = rule.id;
  card.dataset.list = isRanked ? "ranked" : "available";

  if (isRanked) {
    card.classList.add("is-ranked");
    rankEl.textContent = String(rank);
    card.setAttribute("aria-label", `Rank ${rank}: ${rule.text}`);
  } else {
    card.classList.remove("is-ranked");
    rankEl.textContent = "";
    card.setAttribute("aria-label", rule.text);
  }

  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

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
}

function handleDragEnd(event) {
  const card = event.currentTarget;
  card.classList.remove("dragging");
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
  const hasFile = Boolean(chatFile);
  const hasGroupType = Boolean(groupTypeSelect.value);
  generateBtn.disabled = !(hasFile && hasGroupType && parsedMessages.length);
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

fileInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  assignChatFile(files);
});

if (zipInput) {
  zipInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files || []);
    assignChatFile(files);
  });
}

groupTypeSelect.addEventListener("change", updateGenerateButtonState);
if (modelProviderSelect) {
  modelProviderSelect.addEventListener("change", updateGenerateButtonState);
}

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

    if (zipInput) {
      zipInput.value = "";
    }
    fileInput.value = "";
    updateGenerateButtonState();
    return;
  }

  const chat = fileList.find((file) => (
    file.name === "_chat.txt"
    || (file.webkitRelativePath && file.webkitRelativePath.endsWith("/_chat.txt"))
  ));

  if (!chat) {
    fileStatus.textContent = "Could not find _chat.txt in the selected folder.";
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

  fileInput.value = "";
  if (zipInput) {
    zipInput.value = "";
  }
  updateGenerateButtonState();
}

generateBtn.addEventListener("click", async () => {
  if (!chatFile || !parsedMessages.length || !contextualWindow.length) {
    return;
  }

  const groupType = groupTypeSelect.value;
  const provider = modelProviderSelect?.value || "gemini";
  const providerModel = MODEL_CONFIG[provider]?.model;

  errorBox.textContent = "";
  setLoadingState("loading");
  generateBtn.disabled = true;
  clearRulesUI();
  availableList.dataset.emptyMessage = "Loading new rules...";

  const stats = JSON.parse(dropZone.dataset.stats || "{}");

  try {
    const genericPrompt = GENERIC_PROMPT_TEMPLATE({ groupType });
    const contextualPrompt = buildContextualPrompt({ groupType, stats, messages: contextualWindow });

    const [genericRaw, contextualRaw] = await Promise.all([
      callRuleModel({ provider, prompt: genericPrompt, model: providerModel }),
      callRuleModel({ provider, prompt: contextualPrompt, model: providerModel }),
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

    allRules = shuffle([...genericRules, ...contextualRules]);
    availableRules = [...allRules];
    rankedRules = [];
    renderRuleLists();
    setLoadingState("ready");
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

  const genericSelections = rankedWithOrder
    .filter((item) => item.rule.source === "generic")
    .map((item) => `#${item.rank}`);
  const contextualSelections = rankedWithOrder
    .filter((item) => item.rule.source === "contextual")
    .map((item) => `#${item.rank}`);

  const genericCount = genericSelections.length;
  const contextualCount = contextualSelections.length;
  const genericProportion = ((genericCount / totalRanked) * 100).toFixed(1);
  const contextualProportion = ((contextualCount / totalRanked) * 100).toFixed(1);

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

  const genericLine = document.createElement("p");
  genericLine.textContent = `Generic rules selected: ${genericCount}/${totalRanked} (${genericProportion}%)`;

  const contextualLine = document.createElement("p");
  contextualLine.textContent = `Contextual rules selected: ${contextualCount}/${totalRanked} (${contextualProportion}%)`;

  rankingSummary.append(
    heading,
    list,
    genericSelectionsLine,
    contextualSelectionsLine,
    genericLine,
    contextualLine,
  );
  rankingSummary.hidden = false;
});

updateGenerateButtonState();

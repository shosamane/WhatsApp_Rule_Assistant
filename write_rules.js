// Experiment 2 - Write Rules Page Logic

// Session management
function getOrCreateSessionId() {
  try {
    const key = 'exp2_session_id';
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

// WhatsApp version assignment
function assignWhatsAppVersion() {
  // Check if version already assigned
  let version = sessionStorage.getItem('exp2_whatsapp_version');
  if (version) {
    console.log('[WhatsApp Version] Already assigned:', version);
    return parseInt(version);
  }

  // Randomly assign version (1, 2, or 3)
  version = Math.floor(Math.random() * 3) + 1;

  // Define version labels
  const versionLabels = {
    1: 'Unknown Number → Political → Product',
    2: 'Political → Product → Unknown Number',
    3: 'Product → Unknown Number → Political'
  };

  sessionStorage.setItem('exp2_whatsapp_version', version.toString());
  sessionStorage.setItem('exp2_whatsapp_version_label', versionLabels[version]);

  console.log('[WhatsApp Version] Assigned:', version, '-', versionLabels[version]);
  return version;
}

// Initialize version on page load
assignWhatsAppVersion();

// Elements
const condition1Radio = document.getElementById('condition1');
const condition2Radio = document.getElementById('condition2');
const condition1UI = document.getElementById('condition1-ui');
const condition2UI = document.getElementById('condition2-ui');
const humanOnlyTextarea = document.getElementById('human-only-textarea');
const userPromptInput = document.getElementById('user-prompt');
const generateBtnC2 = document.getElementById('generate-btn-c2');
const loadingC2 = document.getElementById('loading-c2');
const errorMessageC2 = document.getElementById('error-message-c2');
const aiRulesC2 = document.getElementById('ai-rules-c2');
const backBtn = document.getElementById('back-btn');
const continueBtn = document.getElementById('continue-btn');

// State
let currentCondition = '2'; // Default to Human + AI
let generatedRulesHistory = []; // Store all generated rules for condition 2

// Condition switching
function switchCondition(conditionValue) {
  currentCondition = conditionValue;

  if (conditionValue === '1') {
    condition1UI.classList.add('active');
    condition2UI.classList.remove('active');
  } else {
    condition1UI.classList.remove('active');
    condition2UI.classList.add('active');
  }

  sessionStorage.setItem('exp2_condition', conditionValue);
  updateContinueButton();
}

condition1Radio.addEventListener('change', () => switchCondition('1'));
condition2Radio.addEventListener('change', () => switchCondition('2'));

// Update continue button state
function updateContinueButton() {
  if (currentCondition === '1') {
    // Human Only: require some text
    const hasRules = humanOnlyTextarea.value.trim().length > 0;
    continueBtn.disabled = !hasRules;
  } else {
    // Human + AI: require final rules (either generated or manually entered)
    const hasRules = aiRulesC2.value.trim().length > 0;
    continueBtn.disabled = !hasRules;
  }
}

// Add input listeners
humanOnlyTextarea.addEventListener('input', updateContinueButton);
aiRulesC2.addEventListener('input', updateContinueButton);
userPromptInput.addEventListener('input', updateContinueButton);

// Call Gemini API
async function callGemini(prompt) {
  const resp = await fetch('/webhook3/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: 'models/gemini-2.0-flash-exp', // Using Gemini Flash
      temperature: 0.7,
      topP: 0.9,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.text || '';
}

// Generate rules for Condition 2 (Human + AI)
generateBtnC2.addEventListener('click', async () => {
  const userPrompt = userPromptInput.value.trim();

  if (!userPrompt) {
    errorMessageC2.textContent = 'Please enter a prompt for the AI.';
    errorMessageC2.classList.add('active');
    return;
  }

  errorMessageC2.classList.remove('active');
  generateBtnC2.disabled = true;
  loadingC2.classList.add('active');
  aiRulesC2.value = '';

  try {
    const fullPrompt = `You are helping create rules for a family WhatsApp group. The user will describe what kind of rules they want, and you should generate clear, actionable rules.

User's request: ${userPrompt}

Please provide 3-5 clear, actionable rules based on the user's request. Format the rules as a numbered list.`;

    const result = await callGemini(fullPrompt);
    aiRulesC2.value = result;

    // Store generated rules
    generatedRulesHistory.push({
      prompt: userPrompt,
      generated: result,
      timestamp: new Date().toISOString()
    });

    // Save to session storage
    sessionStorage.setItem('exp2_user_prompt', userPrompt);
    sessionStorage.setItem('exp2_generated_rules', result);

    updateContinueButton();
  } catch (error) {
    console.error('Generation error:', error);
    errorMessageC2.textContent = `Error: ${error.message}`;
    errorMessageC2.classList.add('active');
  } finally {
    generateBtnC2.disabled = false;
    loadingC2.classList.remove('active');
  }
});

// Back button
backBtn.addEventListener('click', () => {
  // Save current progress before going back
  saveProgress('write_rules_back').then(() => {
    window.location.href = 'exp2_consent.html';
  });
});

// Continue button
continueBtn.addEventListener('click', () => {
  // Save final rules
  if (currentCondition === '1') {
    sessionStorage.setItem('exp2_final_rules', humanOnlyTextarea.value.trim());
    sessionStorage.removeItem('exp2_user_prompt');
    sessionStorage.removeItem('exp2_generated_rules');
  } else {
    sessionStorage.setItem('exp2_final_rules', aiRulesC2.value.trim());
  }

  // Save to backend and navigate
  saveProgress('write_rules_complete').then(() => {
    window.location.href = 'exp2_demographics.html';
  });
});

// Save progress to backend
async function saveProgress(pageName) {
  try {
    const sessionId = getOrCreateSessionId();
    const whatsappVersion = sessionStorage.getItem('exp2_whatsapp_version');
    const whatsappVersionLabel = sessionStorage.getItem('exp2_whatsapp_version_label');

    const payload = {
      sessionId,
      pageName,
      experimentType: 'experiment2',
      recruitment: {
        source: sessionStorage.getItem('exp2_recruitment_source'),
        participantId: sessionStorage.getItem('exp2_participant_id'),
        urlIdentifier: sessionStorage.getItem('exp2_url_identifier')
      },
      whatsappVersion: {
        version: whatsappVersion,
        label: whatsappVersionLabel
      },
      condition: currentCondition,
      rules: {
        userPrompt: sessionStorage.getItem('exp2_user_prompt') || null,
        generatedRules: sessionStorage.getItem('exp2_generated_rules') || null,
        finalRules: sessionStorage.getItem('exp2_final_rules') || (currentCondition === '1' ? humanOnlyTextarea.value.trim() : aiRulesC2.value.trim()),
        generationHistory: currentCondition === '2' ? generatedRulesHistory : null
      },
      timestamps: {
        writeRulesComplete: pageName === 'write_rules_complete' ? new Date().toISOString() : null
      },
      updatedAt: new Date().toISOString(),
      progressStatus: pageName
    };

    const resp = await fetch('/webhook3/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`Store error ${resp.status}`);
    }

    const result = await resp.json();
    console.log('[saveProgress] Success:', result);
    return result;
  } catch (error) {
    console.error('[saveProgress] Error:', error);
    // Don't block user progress if save fails
  }
}

// Load saved data on page load (if returning from demographics)
window.addEventListener('DOMContentLoaded', () => {
  const savedCondition = sessionStorage.getItem('exp2_condition');
  if (savedCondition) {
    currentCondition = savedCondition;
    if (savedCondition === '1') {
      condition1Radio.checked = true;
      const savedRules = sessionStorage.getItem('exp2_final_rules');
      if (savedRules) {
        humanOnlyTextarea.value = savedRules;
      }
    } else {
      condition2Radio.checked = true;
      const savedPrompt = sessionStorage.getItem('exp2_user_prompt');
      const savedGenerated = sessionStorage.getItem('exp2_generated_rules');
      const savedFinal = sessionStorage.getItem('exp2_final_rules');

      if (savedPrompt) userPromptInput.value = savedPrompt;
      if (savedGenerated) aiRulesC2.value = savedGenerated;
      if (savedFinal) aiRulesC2.value = savedFinal;
    }
    switchCondition(savedCondition);
  } else {
    // Default to condition 2
    switchCondition('2');
  }

  updateContinueButton();
});

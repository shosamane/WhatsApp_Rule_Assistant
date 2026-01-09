// Experiment 2B - Rating Page Logic

// Session management
function getOrCreateSessionId() {
  try {
    const key = 'exp2b_session_id';
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

// Set WhatsApp version to Version 1 for consistency across all Experiment 2B participants
function setWhatsAppVersion() {
  // Always use Version 1 (Unknown Number → Political → Product) for Experiment 2B
  sessionStorage.setItem('exp2_whatsapp_version', '1');
  console.log('[Exp2B] Set WhatsApp version to 1 for consistency');
}

// Initialize WhatsApp version on page load
setWhatsAppVersion();

// Elements
const progressIndicator = document.getElementById('progress-indicator');
const rulesAText = document.getElementById('rules-a-text');
const rulesBText = document.getElementById('rules-b-text');
const viewChatBtn = document.getElementById('view-chat-btn');
const drawer = document.getElementById('whatsapp-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const nextBtn = document.getElementById('next-btn');
const errorMessage = document.getElementById('error-message');

// Rating inputs
const clarityInputs = document.querySelectorAll('input[name="clarity"]');
const contextInputs = document.querySelectorAll('input[name="contextualFit"]');
const toneInputs = document.querySelectorAll('input[name="tone"]');
const enforceInputs = document.querySelectorAll('input[name="enforceability"]');
const legitimacyInputs = document.querySelectorAll('input[name="perceivedLegitimacy"]');

// State
let currentPairIndex = 0;
let pairs = [];
let allRatings = [];
let participantId = null;

// Fisher-Yates shuffle
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize
async function init() {
  console.log('[Init] Starting Experiment 2B rating page');

  // Get participant ID from session storage
  participantId = sessionStorage.getItem('exp2b_participant_id');
  if (!participantId) {
    console.error('[Init] No participant ID found');
    showError('Session expired. Please return to the consent page.');
    return;
  }

  console.log('[Init] Participant ID:', participantId);

  // Fetch rules from backend
  try {
    const response = await fetch('/webhook3/api/get-rules-for-comparison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Init] Received rules:', data);

    const c1Rules = data.condition1 || [];
    const c2Rules = data.condition2 || [];

    console.log('[Init] C1 rules count:', c1Rules.length);
    console.log('[Init] C2 rules count:', c2Rules.length);

    if (c1Rules.length === 0 || c2Rules.length === 0) {
      showError('Not enough rules available for comparison. Please contact support.');
      return;
    }

    // Generate pairs
    pairs = generatePairs(c1Rules, c2Rules);
    console.log('[Init] Generated', pairs.length, 'pairs');

    if (pairs.length === 0) {
      showError('Not enough rules available for comparison. Please contact support.');
      return;
    }

    // Display first pair
    displayPair(0);

    // Save initial progress
    await saveProgress('rating_started');

  } catch (error) {
    console.error('[Init] Error:', error);
    showError('Failed to load comparison data. Please refresh the page or contact support.');
  }
}

// Generate pairs with randomization
function generatePairs(c1Rules, c2Rules) {
  console.log('[generatePairs] Shuffling rules...');

  // Shuffle both arrays
  const shuffledC1 = shuffle(c1Rules);
  const shuffledC2 = shuffle(c2Rules);

  // Take minimum of both counts, max 10
  const numPairs = Math.min(shuffledC1.length, shuffledC2.length, 10);
  console.log('[generatePairs] Creating', numPairs, 'pairs');

  const generatedPairs = [];
  for (let i = 0; i < numPairs; i++) {
    // Randomly assign which condition appears as Rules A vs Rules B
    const leftIsC1 = Math.random() < 0.5;

    generatedPairs.push({
      pairIndex: i + 1,
      rulesA: leftIsC1 ? shuffledC1[i] : shuffledC2[i],
      rulesB: leftIsC1 ? shuffledC2[i] : shuffledC1[i]
    });

    console.log(`[generatePairs] Pair ${i + 1}: A=${leftIsC1 ? 'C1' : 'C2'}, B=${leftIsC1 ? 'C2' : 'C1'}`);
  }

  return generatedPairs;
}

// Display current pair
function displayPair(index) {
  console.log('[displayPair] Displaying pair', index + 1);

  const pair = pairs[index];

  // Update progress indicator
  progressIndicator.textContent = `Comparison ${index + 1} of ${pairs.length}`;

  // Update rules text
  rulesAText.textContent = pair.rulesA.text || 'No rules available';
  rulesBText.textContent = pair.rulesB.text || 'No rules available';

  // Clear all radio selections
  clearRatings();

  // Update button text
  if (index === pairs.length - 1) {
    nextBtn.textContent = 'SUBMIT AND COMPLETE';
  } else {
    nextBtn.textContent = 'NEXT COMPARISON';
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

// Clear all rating selections
function clearRatings() {
  clarityInputs.forEach(input => input.checked = false);
  contextInputs.forEach(input => input.checked = false);
  toneInputs.forEach(input => input.checked = false);
  enforceInputs.forEach(input => input.checked = false);
  legitimacyInputs.forEach(input => input.checked = false);
  nextBtn.disabled = true;
  hideError();
}

// Check if all ratings are selected
function validateRatings() {
  const claritySelected = Array.from(clarityInputs).some(input => input.checked);
  const contextSelected = Array.from(contextInputs).some(input => input.checked);
  const toneSelected = Array.from(toneInputs).some(input => input.checked);
  const enforceSelected = Array.from(enforceInputs).some(input => input.checked);
  const legitimacySelected = Array.from(legitimacyInputs).some(input => input.checked);

  return claritySelected && contextSelected && toneSelected && enforceSelected && legitimacySelected;
}

// Get current ratings
function getCurrentRatings() {
  return {
    clarity: Array.from(clarityInputs).find(input => input.checked)?.value || null,
    contextualFit: Array.from(contextInputs).find(input => input.checked)?.value || null,
    tone: Array.from(toneInputs).find(input => input.checked)?.value || null,
    enforceability: Array.from(enforceInputs).find(input => input.checked)?.value || null,
    perceivedLegitimacy: Array.from(legitimacyInputs).find(input => input.checked)?.value || null
  };
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('active');
}

// Hide error message
function hideError() {
  errorMessage.classList.remove('active');
}

// Drawer functionality
viewChatBtn.addEventListener('click', () => {
  drawer.classList.add('open');
  drawerOverlay.classList.add('active');
});

closeDrawerBtn.addEventListener('click', () => {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('active');
});

drawerOverlay.addEventListener('click', () => {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('active');
});

// Enable/disable next button based on validation
[...clarityInputs, ...contextInputs, ...toneInputs, ...enforceInputs, ...legitimacyInputs].forEach(input => {
  input.addEventListener('change', () => {
    if (validateRatings()) {
      nextBtn.disabled = false;
      hideError();
    } else {
      nextBtn.disabled = true;
    }
  });
});

// Next/Submit button
nextBtn.addEventListener('click', async () => {
  if (!validateRatings()) {
    showError('Please answer all five questions before continuing.');
    return;
  }

  // Save current ratings
  const ratings = getCurrentRatings();
  const pair = pairs[currentPairIndex];

  allRatings.push({
    pairIndex: pair.pairIndex,
    rulesA: {
      sessionId: pair.rulesA.sessionId,
      condition: pair.rulesA.condition,
      text: pair.rulesA.text
    },
    rulesB: {
      sessionId: pair.rulesB.sessionId,
      condition: pair.rulesB.condition,
      text: pair.rulesB.text
    },
    ratings: ratings,
    timestamp: new Date().toISOString()
  });

  console.log('[Next] Saved ratings for pair', currentPairIndex + 1);

  // Check if this was the last pair
  if (currentPairIndex === pairs.length - 1) {
    // Save all ratings and complete
    console.log('[Next] Completing study with', allRatings.length, 'comparisons');

    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting...';

    try {
      await saveProgress('rating_complete');
      console.log('[Next] Navigating to completion page');
      window.location.href = 'exp2b_completion.html';
    } catch (error) {
      console.error('[Next] Error saving final ratings:', error);
      showError('Failed to submit. Please try again.');
      nextBtn.disabled = false;
      nextBtn.textContent = 'SUBMIT AND COMPLETE';
    }
  } else {
    // Move to next pair
    currentPairIndex++;
    displayPair(currentPairIndex);

    // Save intermediate progress
    saveProgress('rating_in_progress').catch(err => {
      console.warn('[Next] Failed to save intermediate progress:', err);
    });
  }
});

// Save progress to backend
async function saveProgress(pageName) {
  try {
    const sessionId = getOrCreateSessionId();
    const recruitmentSource = sessionStorage.getItem('exp2b_recruitment_source');
    const urlIdentifier = sessionStorage.getItem('exp2b_url_identifier');

    const payload = {
      sessionId,
      pageName,
      experimentType: 'experiment2b',
      recruitment: {
        source: recruitmentSource,
        participantId: participantId,
        urlIdentifier: urlIdentifier
      },
      comparisons: allRatings,
      timestamps: {
        consentComplete: sessionStorage.getItem('exp2b_consent_timestamp'),
        recruitmentComplete: sessionStorage.getItem('exp2b_recruitment_timestamp'),
        ratingStarted: sessionStorage.getItem('exp2b_rating_started') || (pageName === 'rating_started' ? new Date().toISOString() : null),
        ratingComplete: pageName === 'rating_complete' ? new Date().toISOString() : null
      },
      updatedAt: new Date().toISOString(),
      progressStatus: pageName
    };

    // Save rating started timestamp
    if (pageName === 'rating_started' && !sessionStorage.getItem('exp2b_rating_started')) {
      sessionStorage.setItem('exp2b_rating_started', new Date().toISOString());
    }

    const resp = await fetch('/webhook3/api/store-exp2b', {
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
    throw error;
  }
}

// Initialize on page load
init();

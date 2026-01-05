// Experiment 2 - Consent Page Logic

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

// Elements
const consentPanel = document.getElementById('consent-panel');
const recruitmentPanel = document.getElementById('recruitment-panel');
const consentAgreeBtn = document.getElementById('consent-agree-btn');
const consentDeclineBtn = document.getElementById('consent-decline-btn');
const recruitmentSourceRadios = document.querySelectorAll('input[name="recruitment-source"]');
const sourceIdField = document.getElementById('source-id-field');
const sourceIdInput = document.getElementById('source-id');
const sourceIdLabel = document.getElementById('source-id-label');
const continueBtn = document.getElementById('continue-btn');

// State
let consentGiven = false;
let recruitmentSource = null;
let participantId = null;
let urlIdentifier = null;

// Extract URL identifier from query string if present (for Clickworker unique URLs)
(() => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const newSession = urlParams.get('new');

    // If 'new' parameter is present, clear all exp2 session data for a fresh start
    if (newSession !== null) {
      console.log('[Init] New session requested, clearing previous data');
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('exp2_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }

    if (codeParam) {
      urlIdentifier = codeParam;
      console.log('[Init] URL identifier found:', urlIdentifier);
    }
  } catch (e) {
    console.error('[Init] Error parsing URL parameters:', e);
  }
})();

// Validate URL identifier on page load
async function validateUrlIdentifier() {
  if (urlIdentifier === null) {
    return true; // Direct access is valid
  }

  try {
    const resp = await fetch('/webhook3/api/validate-url-identifier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urlIdentifier })
    });

    const data = await resp.json();

    if (!data.valid) {
      // Hide all content and show error
      document.body.innerHTML = `
        <div style="max-width: 600px; margin: 4rem auto; padding: 2rem; text-align: center; font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;">
          <h1 style="color: #c62828; margin-bottom: 1rem;">Invalid Access Link</h1>
          <p style="font-size: 1.1rem; line-height: 1.6; color: #333;">
            ${data.reason === 'already_used'
              ? 'This link has already been used and is no longer valid.'
              : 'The link you used is invalid or does not exist.'}
          </p>
          <p style="font-size: 1rem; line-height: 1.6; color: #666; margin-top: 1.5rem;">
            Please contact the study administrator for assistance.
          </p>
        </div>
      `;
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Init] Validation error:', err);
    // Allow access on validation error to avoid blocking legitimate users
    return true;
  }
}

// Initialize
validateUrlIdentifier();

// Consent handling
consentAgreeBtn.addEventListener('click', () => {
  consentGiven = true;

  // Save to session storage
  sessionStorage.setItem('exp2_consent', 'true');
  sessionStorage.setItem('exp2_consent_timestamp', new Date().toISOString());

  // Save to backend
  saveProgress('consent');

  // Show recruitment panel
  consentPanel.hidden = true;
  recruitmentPanel.hidden = false;
});

consentDeclineBtn.addEventListener('click', () => {
  alert('Thank you for your interest. You may now close this window.');
  // Optionally save decline to backend
  saveProgress('consent_declined');
  window.close();
});

// Recruitment source handling
recruitmentSourceRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    recruitmentSource = e.target.value;
    sourceIdField.hidden = false;

    // Update label based on source
    if (recruitmentSource === 'clickworker') {
      sourceIdLabel.textContent = 'Your Clickworker ID';
      sourceIdInput.placeholder = 'Enter your Clickworker ID';
    } else if (recruitmentSource === 'prolific') {
      sourceIdLabel.textContent = 'Your Prolific ID';
      sourceIdInput.placeholder = 'Enter your Prolific ID';
    } else if (recruitmentSource === 'referral') {
      sourceIdLabel.textContent = 'Researcher-provided code';
      sourceIdInput.placeholder = 'Enter the code provided by the researcher';
    }

    updateContinueButton();
  });
});

sourceIdInput.addEventListener('input', updateContinueButton);

function updateContinueButton() {
  const hasSource = recruitmentSource !== null;
  const hasId = sourceIdInput.value.trim().length > 0;
  continueBtn.disabled = !(hasSource && hasId);
}

// Continue to next page
continueBtn.addEventListener('click', () => {
  participantId = sourceIdInput.value.trim();

  // Save to session storage
  sessionStorage.setItem('exp2_recruitment_source', recruitmentSource);
  sessionStorage.setItem('exp2_participant_id', participantId);
  if (urlIdentifier) {
    sessionStorage.setItem('exp2_url_identifier', urlIdentifier);
  }

  // Save to backend
  saveProgress('recruitment_complete').then(() => {
    // Navigate to page 2
    window.location.href = 'write_rules.html';
  });
});

// Save progress to backend
async function saveProgress(pageName) {
  try {
    const sessionId = getOrCreateSessionId();
    const payload = {
      sessionId,
      pageName,
      experimentType: 'experiment2',
      consent: consentGiven ? {
        given: true,
        timestamp: sessionStorage.getItem('exp2_consent_timestamp')
      } : null,
      recruitment: (recruitmentSource && participantId) ? {
        source: recruitmentSource,
        participantId: participantId,
        urlIdentifier: urlIdentifier
      } : null,
      timestamps: {
        consentComplete: consentGiven ? new Date().toISOString() : null,
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

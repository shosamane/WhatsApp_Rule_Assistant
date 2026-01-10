// Experiment 2B - Completion Page Logic

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

// Elements
const completionMessage = document.getElementById('completion-message');
const errorPanel = document.getElementById('error-panel');
const errorText = document.getElementById('error-text');

// Initialize completion page
async function init() {
  console.log('[Completion] Initializing completion page');

  try {
    // Get recruitment info
    const recruitmentSource = sessionStorage.getItem('exp2b_recruitment_source');
    const participantId = sessionStorage.getItem('exp2b_participant_id');
    const urlIdentifier = sessionStorage.getItem('exp2b_url_identifier');

    if (!recruitmentSource || !participantId) {
      throw new Error('Missing recruitment information. Please ensure you completed all previous steps.');
    }

    console.log('[Completion] Recruitment source:', recruitmentSource);
    console.log('[Completion] Participant ID:', participantId);

    // Generate completion code (if needed)
    let completionCode = null;
    if (recruitmentSource !== 'prolific') {
      console.log('[Completion] Generating completion code...');
      completionCode = await generateCompletionCode(recruitmentSource, participantId, urlIdentifier);
      console.log('[Completion] Completion code:', completionCode);
    }

    // Save final completion status
    await saveProgress('completed', completionCode);

    // Display appropriate completion message
    displayCompletionMessage(recruitmentSource, completionCode);

  } catch (error) {
    console.error('[Completion] Error:', error);
    showError(error.message || 'An unexpected error occurred.');
  }
}

// Generate completion code
async function generateCompletionCode(platform, userId, urlIdentifier) {
  // Prolific participants don't need a completion code - they use the redirect link
  if (platform === 'prolific') {
    console.log('[generateCompletionCode] Prolific user - no code needed');
    return null;
  }

  console.log('[generateCompletionCode] Requesting code for platform:', platform, 'userId:', userId);

  try {
    const body = { platform, userId };
    if (urlIdentifier !== null && urlIdentifier !== undefined) {
      body.urlIdentifier = parseInt(urlIdentifier, 10);
      console.log('[generateCompletionCode] Including urlIdentifier:', body.urlIdentifier);
    }

    const resp = await fetch('/webhook3/api/get-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      console.error('[generateCompletionCode] Server error:', errorData);
      throw new Error(errorData.hint || 'Failed to retrieve completion code.');
    }

    const data = await resp.json();
    console.log('[generateCompletionCode] Successfully received code:', data.code);
    return data.code;
  } catch (error) {
    console.error('[generateCompletionCode] Error getting completion code:', error);
    throw new Error(error.message || 'Unable to generate completion code. Please contact support.');
  }
}

// Display completion message based on recruitment source
function displayCompletionMessage(source, code) {
  if (source === 'prolific') {
    // Prolific participants: show redirect link
    completionMessage.innerHTML = `
      <h2 style="color: #1565C0; margin-bottom: 1.5rem; text-align: center;">Thank You for Completing the Study!</h2>
      <p style="margin: 1.5rem 0; text-align: center; font-size: 1.1rem;">
        Your responses have been submitted successfully.
      </p>
      <p style="margin: 1.5rem 0; font-size: 1.1rem; text-align: center;">
        <strong>Please click the link below to return to Prolific and complete your submission:</strong>
      </p>
      <p style="margin: 2rem 0; text-align: center;">
        <a href="https://app.prolific.com/submissions/complete?cc=CLX3FCT2"
           target="_blank"
           style="display: inline-block; background: #1565C0; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1.1rem; transition: all 0.2s;">
          Complete Prolific Submission
        </a>
      </p>
      <p style="margin: 1rem 0; color: #666; font-size: 0.95rem; text-align: center;">
        You must click this link to receive your payment.
      </p>
    `;
  } else {
    // Clickworker and Referral participants: show completion code
    completionMessage.innerHTML = `
      <h2 style="color: #1565C0; margin-bottom: 1.5rem; text-align: center;">Thank You for Completing the Study!</h2>
      ${code ? `
        <div style="background: #f0f7ff; padding: 2rem; border-radius: 8px; margin: 2rem 0; border: 2px solid #1565C0;">
          <p style="font-size: 1.1rem; margin-bottom: 1rem; text-align: center;">
            Your completion code is:
          </p>
          <p style="font-size: 2rem; font-weight: 700; color: #1565C0; text-align: center; letter-spacing: 2px; font-family: monospace;">
            ${code}
          </p>
        </div>
        <p style="margin: 1.5rem 0; text-align: center; font-size: 1.05rem;">
          Please copy this code and enter it in ${source === 'clickworker' ? 'Clickworker' : 'the platform you were recruited from'} to receive your compensation.
        </p>
        ${source === 'referral' ? `
          <p style="margin: 1.5rem 0; text-align: center; background: #fffbea; padding: 1rem; border-radius: 6px; border-left: 4px solid #f59e0b;">
            If you were referred by the researchers, please email this code to <a href="mailto:sh1779@scarletmail.rutgers.edu" style="color: #1565C0; font-weight: 600;">sh1779@scarletmail.rutgers.edu</a> to process your payment.
          </p>
        ` : ''}
      ` : `
        <p style="margin: 1.5rem 0; text-align: center; color: #666;">
          Your responses have been recorded successfully.
        </p>
      `}
      <p style="margin: 2rem 0; text-align: center; color: #666;">
        You may now close this window.
      </p>
      <p style="margin: 2rem 0; text-align: center; color: #999; font-size: 0.9rem;">
        If you have any questions or concerns, please contact: <a href="mailto:sh1779@scarletmail.rutgers.edu" style="color: #1565C0;">sh1779@scarletmail.rutgers.edu</a>
      </p>
    `;
  }
}

// Show error
function showError(message) {
  errorText.textContent = message;
  errorPanel.hidden = false;
  completionMessage.innerHTML = '<h2 style="color: #c33; text-align: center;">Unable to Complete</h2>';
}

// Save progress to backend
async function saveProgress(pageName, completionCode = null) {
  try {
    const sessionId = getOrCreateSessionId();
    const recruitmentSource = sessionStorage.getItem('exp2b_recruitment_source');
    const participantId = sessionStorage.getItem('exp2b_participant_id');
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
      completionCode: completionCode,
      timestamps: {
        consentComplete: sessionStorage.getItem('exp2b_consent_timestamp'),
        recruitmentComplete: sessionStorage.getItem('exp2b_recruitment_timestamp'),
        ratingStarted: sessionStorage.getItem('exp2b_rating_started'),
        ratingComplete: sessionStorage.getItem('exp2b_rating_complete') || new Date().toISOString(),
        studyComplete: new Date().toISOString()
      },
      updatedAt: new Date().toISOString(),
      progressStatus: pageName
    };

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
    // Don't throw - completion should still show even if save fails
  }
}

// Initialize on page load
init();

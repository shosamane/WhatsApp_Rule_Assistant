// Experiment 2 - Demographics Page Logic

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
const demoAgeFinal = document.getElementById('demo-age-final');
const demoGenderFinal = document.getElementById('demo-gender-final');
const demoLocationFinal = document.getElementById('demo-location-final');
const demoEducationFinal = document.getElementById('demo-education-final');
const demoWaFrequencyFinal = document.getElementById('demo-wa-frequency-final');
const demoWaAdminGroupsFinal = document.getElementById('demo-wa-admin-groups-final');
const demoAdminDurationFinal = document.getElementById('demo-admin-duration-final');
const demoRulesConfidenceFinal = document.getElementById('demo-rules-confidence-final');
const demoRulesControlFinal = document.getElementById('demo-rules-control-final');
const demoRulesEaseFinal = document.getElementById('demo-rules-ease-final');
const demoRulesSatisfactionFinal = document.getElementById('demo-rules-satisfaction-final');
const demoAttentionCheckFinal = document.getElementById('demo-attention-check-final');
const submitFinalBtn = document.getElementById('submit-final');
const backBtn = document.getElementById('back-btn');
const finalSubmissionMessage = document.getElementById('final-submission-message');

// Store the correct attention check answer
let correctAttentionCheckAnswer = null;

// Update question text based on condition (add "with the help of AI" for condition 2)
function updateQuestionTextForCondition() {
  const condition = sessionStorage.getItem('exp2_condition');

  // If condition 2 (Human + AI), add "with the help of AI" to question text
  if (condition === '2') {
    const rulesConfidenceText = document.getElementById('rules-confidence-text');
    const rulesControlText = document.getElementById('rules-control-text');
    const rulesEaseText = document.getElementById('rules-ease-text');
    const rulesSatisfactionText = document.getElementById('rules-satisfaction-text');

    if (rulesConfidenceText) {
      rulesConfidenceText.textContent = 'I feel confident that the rules I wrote with the help of AI is appropriate for the group.';
    }
    if (rulesControlText) {
      rulesControlText.textContent = 'I felt I was in control of what rules I wanted to write with the help of AI.';
    }
    if (rulesEaseText) {
      rulesEaseText.textContent = 'I found it easy to write rules with the help of AI.';
    }
    if (rulesSatisfactionText) {
      rulesSatisfactionText.textContent = 'I feel satisfied with the set of rules I wrote with the help of AI.';
    }

    console.log('[Demographics] Updated question text for Condition 2 (Human + AI)');
  } else {
    console.log('[Demographics] Using default question text for Condition 1 (Human Only)');
  }
}

// Initialize demographics randomization (attention check and field order)
function initializeDemographicsRandomization() {
  // Only run once
  if (correctAttentionCheckAnswer !== null) {
    console.log('[Demographics] Already randomized, skipping');
    return;
  }

  console.log('[Demographics] Starting randomization...');

  // Randomly select the correct attention check answer
  const attentionCheckOptions = [
    'Strongly Disagree',
    'Disagree',
    'Somewhat Agree',
    'Agree',
    'Strongly Agree'
  ];

  const randomIndex = Math.floor(Math.random() * attentionCheckOptions.length);
  correctAttentionCheckAnswer = attentionCheckOptions[randomIndex];

  console.log('[Demographics] Randomly selected correct answer:', correctAttentionCheckAnswer);

  // Update the attention check question text
  const attentionCheckQuestion = document.getElementById('attention-check-question');
  if (attentionCheckQuestion) {
    attentionCheckQuestion.textContent = `If you are reading this question carefully, please select "${correctAttentionCheckAnswer}"`;
    console.log('[Demographics] Updated question text');
  } else {
    console.warn('[Demographics] Could not find attention-check-question element');
  }

  // Randomly position the attention check among other fields
  const randomizableContainer = document.getElementById('randomizable-fields');
  const attentionCheckField = document.getElementById('attention-check-field');

  if (randomizableContainer && attentionCheckField) {
    const allFields = Array.from(randomizableContainer.children);
    console.log('[Demographics] Found', allFields.length, 'total fields');

    // Remove attention check from its current position
    const attentionCheckIndex = allFields.indexOf(attentionCheckField);
    if (attentionCheckIndex !== -1) {
      allFields.splice(attentionCheckIndex, 1);
      console.log('[Demographics] Removed attention check from position', attentionCheckIndex);
    }

    // Randomly select a position (0 to allFields.length, inclusive)
    const randomPosition = Math.floor(Math.random() * (allFields.length + 1));
    console.log('[Demographics] Inserting attention check at position', randomPosition);

    // Insert attention check at random position
    if (randomPosition === allFields.length) {
      // Insert at end
      randomizableContainer.appendChild(attentionCheckField);
    } else {
      // Insert before the field at randomPosition
      randomizableContainer.insertBefore(attentionCheckField, allFields[randomPosition]);
    }

    console.log('[Demographics] Attention check repositioned successfully');
  } else {
    console.warn('[Demographics] Could not find container or attention check field');
  }
}

// Validate demographics
function validateFinalDemographics() {
  if (!demoAgeFinal || !demoGenderFinal || !demoLocationFinal ||
      !demoEducationFinal || !demoWaFrequencyFinal ||
      !demoWaAdminGroupsFinal || !demoAdminDurationFinal ||
      !demoRulesConfidenceFinal || !demoRulesControlFinal ||
      !demoRulesEaseFinal || !demoRulesSatisfactionFinal || !demoAttentionCheckFinal) {
    return false;
  }

  const age = demoAgeFinal.value.trim();
  const gender = demoGenderFinal.value;
  const location = demoLocationFinal.value.trim();
  const education = demoEducationFinal.value;
  const waFreq = demoWaFrequencyFinal.value;
  const waAdminGroups = demoWaAdminGroupsFinal.value;
  const adminDur = demoAdminDurationFinal.value;
  const rulesConf = demoRulesConfidenceFinal.value;
  const rulesControl = demoRulesControlFinal.value;
  const rulesEase = demoRulesEaseFinal.value;
  const rulesSat = demoRulesSatisfactionFinal.value;
  const attCheck = demoAttentionCheckFinal.value;

  return age && gender && location && education && waFreq &&
         waAdminGroups && adminDur && rulesConf && rulesControl &&
         rulesEase && rulesSat && attCheck;
}

// Enable/disable submit button based on validation
function updateSubmitButton() {
  submitFinalBtn.disabled = !validateFinalDemographics();
}

// Add input listeners
[demoAgeFinal, demoGenderFinal, demoLocationFinal, demoEducationFinal,
 demoWaFrequencyFinal, demoWaAdminGroupsFinal, demoAdminDurationFinal,
 demoRulesConfidenceFinal, demoRulesControlFinal, demoRulesEaseFinal,
 demoRulesSatisfactionFinal, demoAttentionCheckFinal].forEach(el => {
  if (el) {
    el.addEventListener('input', updateSubmitButton);
    el.addEventListener('change', updateSubmitButton);
  }
});

// Back button
backBtn.addEventListener('click', () => {
  // Save current progress before going back
  saveProgress('demographics_back').then(() => {
    window.location.href = 'write_rules.html';
  });
});

// Submit final demographics
submitFinalBtn.addEventListener('click', async () => {
  if (!validateFinalDemographics()) {
    alert('Please fill in all fields before submitting.');
    return;
  }

  // Check attention check
  const attentionCheckPassed = demoAttentionCheckFinal.value === correctAttentionCheckAnswer;
  console.log('[Submit] Attention check:', demoAttentionCheckFinal.value, 'Expected:', correctAttentionCheckAnswer, 'Passed:', attentionCheckPassed);

  // Disable submit button to prevent double submission
  submitFinalBtn.disabled = true;
  submitFinalBtn.textContent = 'Submitting...';

  try {
    // Get completion code
    const recruitmentSource = sessionStorage.getItem('exp2_recruitment_source');
    const participantId = sessionStorage.getItem('exp2_participant_id');
    const urlIdentifier = sessionStorage.getItem('exp2_url_identifier');

    let completionCode = null;
    if (recruitmentSource && participantId) {
      completionCode = await generateCompletionCode(recruitmentSource, participantId, urlIdentifier);
    }

    // Save final demographics to backend
    await saveProgress('demographics_complete', completionCode, attentionCheckPassed);

    // Show completion message
    finalSubmissionMessage.hidden = false;

    // Different messages for different recruitment sources
    if (recruitmentSource === 'prolific') {
      // Prolific participants: show redirect link
      finalSubmissionMessage.innerHTML = `
        <h3 style="color: #1565C0; margin-bottom: 1rem;">Thank you for completing the study!</h3>
        <p style="margin: 1rem 0;">Your responses have been submitted successfully.</p>
        <p style="margin: 1rem 0; font-size: 1.1rem;">
          <strong>Please click the link below to return to Prolific and complete your submission:</strong>
        </p>
        <p style="margin: 1rem 0;">
          <a href="https://app.prolific.com/submissions/complete?cc=CCJ1SIAW"
             target="_blank"
             style="display: inline-block; background: #1565C0; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 1.1rem;">
            Complete Prolific Submission
          </a>
        </p>
        <p style="margin: 1rem 0; color: #666; font-size: 0.95rem;">
          You must click this link to receive your payment.
        </p>
      `;
    } else {
      // Clickworker and Referral participants: show completion code
      finalSubmissionMessage.innerHTML = `
        <h3 style="color: #1565C0; margin-bottom: 1rem;">Thank you for completing the study!</h3>
        ${completionCode ? `
          <p style="font-size: 1.1rem; margin-bottom: 1rem;">
            Your completion code is: <strong style="font-size: 1.3rem; color: #1565C0;">${completionCode}</strong>
          </p>
          <p style="margin-bottom: 1rem;">
            Please copy this code and enter it in ${recruitmentSource === 'clickworker' ? 'Clickworker' : 'the platform you were recruited from'} to receive your compensation.
          </p>
          ${recruitmentSource === 'referral' ? `
            <p style="margin-bottom: 1rem;">
              If you were referred by the researchers, please email this code to <a href="mailto:sh1779@scarletmail.rutgers.edu" style="color: #1565C0;">sh1779@scarletmail.rutgers.edu</a> to process your payment.
            </p>
          ` : ''}
        ` : ''}
        <p>You may now close this window.</p>
      `;
    }

    // Hide the form
    document.getElementById('demographics-panel').querySelector('#randomizable-fields').style.display = 'none';
    submitFinalBtn.style.display = 'none';
    backBtn.style.display = 'none';

  } catch (error) {
    console.error('[Submit] Error:', error);
    alert('An error occurred while submitting. Please try again or contact support.');
    submitFinalBtn.disabled = false;
    submitFinalBtn.textContent = 'Submit';
  }
});

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

// Save progress to backend
async function saveProgress(pageName, completionCode = null, attentionCheckPassed = null) {
  try {
    const sessionId = getOrCreateSessionId();

    // Get data from previous pages (stored in sessionStorage by write_rules.js)
    const condition = sessionStorage.getItem('exp2_condition');
    const whatsappVersion = sessionStorage.getItem('exp2_whatsapp_version');
    const whatsappVersionLabel = sessionStorage.getItem('exp2_whatsapp_version_label');
    const userPrompt = sessionStorage.getItem('exp2_user_prompt');
    const generatedRules = sessionStorage.getItem('exp2_generated_rules');
    const finalRules = sessionStorage.getItem('exp2_final_rules');

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
      condition: condition,
      rules: {
        userPrompt: userPrompt,
        generatedRules: generatedRules,
        finalRules: finalRules
      },
      demographics: {
        age: demoAgeFinal.value,
        gender: demoGenderFinal.value,
        location: demoLocationFinal.value,
        education: demoEducationFinal.value,
        whatsappFrequency: demoWaFrequencyFinal.value,
        whatsappAdminGroups: demoWaAdminGroupsFinal.value,
        adminDuration: demoAdminDurationFinal.value,
        rulesConfidence: demoRulesConfidenceFinal.value,
        rulesControl: demoRulesControlFinal.value,
        rulesEase: demoRulesEaseFinal.value,
        rulesSatisfaction: demoRulesSatisfactionFinal.value,
        attentionCheck: demoAttentionCheckFinal.value,
        attentionCheckExpected: correctAttentionCheckAnswer,
        attentionCheckPassed: attentionCheckPassed
      },
      completionCode: completionCode,
      timestamps: {
        demographicsComplete: new Date().toISOString()
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

// Initialize randomization on page load
initializeDemographicsRandomization();

// Update question text based on condition
updateQuestionTextForCondition();

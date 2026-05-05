// Experiment 2B - Demographics Page Logic

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
const demoAge = document.getElementById('demo-age');
const demoGender = document.getElementById('demo-gender');
const demoLocation = document.getElementById('demo-location');
const demoEducation = document.getElementById('demo-education');
const demoWaFrequency = document.getElementById('demo-wa-frequency');
const demoWaAdminGroups = document.getElementById('demo-wa-admin-groups');
const demoAdminDuration = document.getElementById('demo-admin-duration');
const demoActiveAdmin = document.getElementById('demo-active-admin');
const demoGroupType = document.getElementById('demo-group-type');
const demoAttentionCheck = document.getElementById('demo-attention-check');
const submitBtn = document.getElementById('submit-btn');
const submissionMessage = document.getElementById('submission-message');

// Store the correct attention check answer
let correctAttentionCheckAnswer = null;

// Initialize attention check randomization
function initializeRandomization() {
  if (correctAttentionCheckAnswer !== null) return;

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
  }

  // Randomly position the attention check among other fields
  const randomizableContainer = document.getElementById('randomizable-fields');
  const attentionCheckField = document.getElementById('attention-check-field');

  if (randomizableContainer && attentionCheckField) {
    const allFields = Array.from(randomizableContainer.children);

    // Remove attention check from its current position
    const attentionCheckIndex = allFields.indexOf(attentionCheckField);
    if (attentionCheckIndex !== -1) {
      allFields.splice(attentionCheckIndex, 1);
    }

    // Randomly select a position (0 to allFields.length, inclusive)
    const randomPosition = Math.floor(Math.random() * (allFields.length + 1));
    console.log('[Demographics] Inserting attention check at position', randomPosition);

    if (randomPosition === allFields.length) {
      randomizableContainer.appendChild(attentionCheckField);
    } else {
      randomizableContainer.insertBefore(attentionCheckField, allFields[randomPosition]);
    }
  }
}

// Validate all fields
function validate() {
  const age = demoAge.value.trim();
  const gender = demoGender.value;
  const location = demoLocation.value.trim();
  const education = demoEducation.value;
  const waFreq = demoWaFrequency.value;
  const waAdminGroups = demoWaAdminGroups.value;
  const adminDur = demoAdminDuration.value;
  const activeAdmin = demoActiveAdmin.value;
  const groupType = demoGroupType.value.trim();
  const attCheck = demoAttentionCheck.value;

  return age && gender && location && education && waFreq &&
         waAdminGroups && adminDur && activeAdmin && groupType && attCheck;
}

// Enable/disable submit button
function updateSubmitButton() {
  submitBtn.disabled = !validate();
}

// Add input listeners
[demoAge, demoGender, demoLocation, demoEducation,
 demoWaFrequency, demoWaAdminGroups, demoAdminDuration,
 demoActiveAdmin, demoGroupType, demoAttentionCheck].forEach(el => {
  if (el) {
    el.addEventListener('input', updateSubmitButton);
    el.addEventListener('change', updateSubmitButton);
  }
});

// Submit demographics
submitBtn.addEventListener('click', async () => {
  if (!validate()) {
    alert('Please fill in all fields before submitting.');
    return;
  }

  const attentionCheckPassed = demoAttentionCheck.value === correctAttentionCheckAnswer;
  console.log('[Submit] Attention check:', demoAttentionCheck.value, 'Expected:', correctAttentionCheckAnswer, 'Passed:', attentionCheckPassed);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // Save demographics
    await saveProgress('demographics_complete', attentionCheckPassed);

    // Navigate to completion page
    window.location.href = 'exp2b_completion.html';

  } catch (error) {
    console.error('[Submit] Error:', error);
    alert('An error occurred while submitting. Please try again or contact support.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

// Save progress to backend
async function saveProgress(pageName, attentionCheckPassed = null) {
  try {
    const sessionId = getOrCreateSessionId();

    const payload = {
      sessionId,
      pageName,
      experimentType: 'experiment2b',
      recruitment: {
        source: sessionStorage.getItem('exp2b_recruitment_source'),
        participantId: sessionStorage.getItem('exp2b_participant_id'),
        urlIdentifier: sessionStorage.getItem('exp2b_url_identifier')
      },
      demographics: {
        age: demoAge.value,
        gender: demoGender.value,
        location: demoLocation.value,
        education: demoEducation.value,
        whatsappFrequency: demoWaFrequency.value,
        whatsappAdminGroups: demoWaAdminGroups.value,
        adminDuration: demoAdminDuration.value,
        activeAdmin: demoActiveAdmin.value,
        groupType: demoGroupType.value,
        attentionCheck: demoAttentionCheck.value,
        attentionCheckExpected: correctAttentionCheckAnswer,
        attentionCheckPassed: attentionCheckPassed
      },
      timestamps: {
        consentComplete: sessionStorage.getItem('exp2b_consent_timestamp'),
        recruitmentComplete: sessionStorage.getItem('exp2b_recruitment_timestamp'),
        conversationRead: sessionStorage.getItem('exp2b_conversation_read_timestamp'),
        ratingStarted: sessionStorage.getItem('exp2b_rating_started'),
        ratingComplete: sessionStorage.getItem('exp2b_rating_complete'),
        demographicsComplete: new Date().toISOString()
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
    throw error;
  }
}

// Initialize on page load
initializeRandomization();

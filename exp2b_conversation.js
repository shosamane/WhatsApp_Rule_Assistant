// Experiment 2B - Conversation Reading Page Logic

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
const continueBtn = document.getElementById('continue-btn');
const scrollIcon = document.getElementById('scroll-icon');
const scrollText = document.getElementById('scroll-text');

// Listen for scroll-to-bottom message from WhatsApp mock iframe
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'whatsapp_scrolled_to_bottom') {
    console.log('[Conversation] User scrolled to bottom of WhatsApp conversation');

    sessionStorage.setItem('exp2b_scrolled_to_bottom', 'true');
    sessionStorage.setItem('exp2b_scrolled_to_bottom_timestamp', new Date().toISOString());

    // Update UI
    continueBtn.disabled = false;
    scrollIcon.textContent = '\u2713';
    scrollIcon.className = 'req-icon done';
    scrollText.textContent = 'Conversation read — you may now continue';
    scrollText.className = 'req-text done';
  }
});

// Check if already scrolled (e.g., user navigated back)
if (sessionStorage.getItem('exp2b_scrolled_to_bottom') === 'true') {
  continueBtn.disabled = false;
  scrollIcon.textContent = '\u2713';
  scrollIcon.className = 'req-icon done';
  scrollText.textContent = 'Conversation read — you may now continue';
  scrollText.className = 'req-text done';
}

// Continue to ratings
continueBtn.addEventListener('click', async () => {
  continueBtn.disabled = true;
  continueBtn.textContent = 'Loading...';

  sessionStorage.setItem('exp2b_conversation_read_timestamp', new Date().toISOString());
  await saveProgress('conversation_read');
  window.location.href = 'exp2b_rating.html';
});

// Save progress to backend
async function saveProgress(pageName) {
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
      scrollTracking: {
        scrolledToBottom: sessionStorage.getItem('exp2b_scrolled_to_bottom') === 'true',
        scrolledToBottomTimestamp: sessionStorage.getItem('exp2b_scrolled_to_bottom_timestamp')
      },
      timestamps: {
        consentComplete: sessionStorage.getItem('exp2b_consent_timestamp'),
        recruitmentComplete: sessionStorage.getItem('exp2b_recruitment_timestamp'),
        conversationRead: new Date().toISOString()
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
  }
}

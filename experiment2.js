// Mock WhatsApp group messages (as provided)
const messages = [
  {
    id: '1',
    sender: 'Aunt Meena',
    content: "Anyone awake? Just finished watching Jawan on Netflix",
    timestamp: '1:23 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '2',
    sender: 'Uncle Raju',
    content: "Yes! I'm watching it right now. Shah Rukh is amazing as always 🔥",
    timestamp: '1:25 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '3',
    sender: 'You',
    content: "Can't sleep either... the movie is so good!",
    timestamp: '1:27 AM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '4',
    sender: 'Aunt Chinni',
    content: "You all should sleep! It's so late 😴",
    timestamp: '1:30 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '5',
    sender: 'Mom',
    content: "Good morning everyone! ☀️",
    timestamp: '7:15 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '6',
    sender: 'Dad',
    content: "Good morning 🙏",
    timestamp: '7:18 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '7',
    sender: 'Grand Uncle Basu',
    content: "Morning to all. How is everyone doing?",
    timestamp: '8:45 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '8',
    sender: 'You',
    content: "This message was deleted",
    timestamp: '9:12 AM',
    isOwn: true,
    type: 'deleted',
  },
  {
    id: '9',
    sender: 'Uncle Raju',
    content: "https://www.facebook.com/share/story123",
    timestamp: '10:30 AM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      title: 'Morning Motivation',
      description: 'Start your day with positive thoughts and energy',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      url: 'facebook.com',
      source: 'FACEBOOK',
    },
  },
  {
    id: '10',
    sender: 'Aunt Meena',
    content: "Priya got admitted to IIT! So proud 🎉👏",
    timestamp: '11:45 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '11',
    sender: 'Mom',
    content: "Congratulations! That's wonderful news! 🥳",
    timestamp: '11:47 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '12',
    sender: 'Uncle Vijay',
    content: "🇮🇳 PROUD MOMENT FOR INDIA 🇮🇳\n\nUnder the visionary leadership of Hon'ble Prime Minister Shri Narendra Modi ji, India has achieved remarkable progress in infrastructure development. Our highways, metros, and bullet trains are world-class now.\n\n#ProgressiveIndia #Development",
    timestamp: '12:15 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '13',
    sender: 'Uncle Vijay',
    content: '',
    timestamp: '12:16 PM',
    isOwn: false,
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1661061964697-e75fc01e003c',
  },
  {
    id: '14',
    sender: 'Grand Uncle Basu',
    content: "Very good Vijay 👍",
    timestamp: '12:20 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '15',
    sender: 'Aunt Chinni',
    content: "When is the next family gathering? We should plan something",
    timestamp: '2:30 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '16',
    sender: 'Dad',
    content: "How about next Sunday? We can meet at our place",
    timestamp: '2:35 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '17',
    sender: 'You',
    content: "Sounds good to me!",
    timestamp: '2:40 PM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '18',
    sender: 'Aunt Meena',
    content: "This message was deleted",
    timestamp: '3:15 PM',
    isOwn: false,
    type: 'deleted',
  },
  {
    id: '19',
    sender: 'Uncle Raju',
    content: "https://www.instagram.com/p/abc123",
    timestamp: '4:00 PM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      title: 'Delicious Homemade Sweets',
      description: 'Traditional Indian mithai recipes',
      image: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e',
      url: 'instagram.com',
      source: 'INSTAGRAM',
    },
  },
  {
    id: '20',
    sender: 'Mom',
    content: "I'll make these for Sunday! 😊",
    timestamp: '4:05 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '21',
    sender: 'Uncle Suresh',
    content: "🎊 SPECIAL DIWALI OFFER 🎊\n\n✨ Premium Quality LED Lights\n✨ 50% OFF on all decorative items\n✨ Free home delivery in Bangalore\n\nContact: 98765-43210\nVisit our store in Jayanagar\n\nLimited stock! Order now! 🪔",
    timestamp: '5:30 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '22',
    sender: 'Aunt Chinni',
    content: "Suresh bhai, will visit your store tomorrow 👍",
    timestamp: '5:35 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '23',
    sender: 'You',
    content: "https://www.instagram.com/reel/xyz789",
    timestamp: '6:00 PM',
    isOwn: true,
    type: 'link',
    linkPreview: {
      title: 'Funny Moments Compilation',
      description: 'Watch this hilarious video!',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
      url: 'instagram.com',
      source: 'INSTAGRAM',
    },
  },
  {
    id: '24',
    sender: 'Uncle Raju',
    content: "😂😂😂",
    timestamp: '6:10 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '25',
    sender: 'Grand Uncle Basu',
    content: "Has anyone seen my glasses? Can't find them anywhere 👓",
    timestamp: '7:45 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '26',
    sender: 'Aunt Meena',
    content: "Check on top of your head Basu uncle 😄",
    timestamp: '7:47 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '27',
    sender: 'Grand Uncle Basu',
    content: "Oh! Found them 😅 Thank you!",
    timestamp: '7:50 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '28',
    sender: 'Aunt Chinni',
    content: "https://www.facebook.com/watch/video456",
    timestamp: '8:15 PM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      title: 'Beautiful Rangoli Designs',
      description: 'Learn traditional kolam patterns',
      image: 'https://images.unsplash.com/photo-1649140041688-0f75446e707e',
      url: 'facebook.com',
      source: 'FACEBOOK',
    },
  },
  {
    id: '29',
    sender: 'Dad',
    content: "Don't forget to bring the documents on Sunday",
    timestamp: '9:00 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '30',
    sender: 'You',
    content: "Sure Dad, I'll bring them",
    timestamp: '9:05 PM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '31',
    sender: 'Uncle Raju',
    content: "https://www.instagram.com/p/def456",
    timestamp: '10:30 PM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      title: 'Weekend Travel Vlog',
      description: 'Amazing places to visit in South India',
      image: 'https://images.unsplash.com/photo-1661061964697-e75fc01e003c',
      url: 'instagram.com',
      source: 'INSTAGRAM',
    },
  },
  {
    id: '32',
    sender: 'Aunt Meena',
    content: "Anyone still awake? Just finished watching Jawan again 😅",
    timestamp: '11:45 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '33',
    sender: 'You',
    content: "Haha Aunt Meena! You really love that movie 😄",
    timestamp: '11:47 PM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '34',
    sender: 'Uncle Vijay',
    content: "You all should sleep now. Good night everyone 🌙",
    timestamp: '11:50 PM',
    isOwn: false,
    type: 'text',
  },
];

// Convert messages to text format for LLM
function messagesToText() {
  return messages.map(msg => {
    if (msg.type === 'deleted') {
      return `[${msg.timestamp}] ${msg.sender}: <deleted message>`;
    } else if (msg.type === 'image') {
      return `[${msg.timestamp}] ${msg.sender}: <sent an image>`;
    } else if (msg.type === 'link') {
      return `[${msg.timestamp}] ${msg.sender}: ${msg.content}`;
    } else {
      return `[${msg.timestamp}] ${msg.sender}: ${msg.content}`;
    }
  }).join('\n');
}

// DOM elements
const conditionRadios = document.querySelectorAll('input[name="condition"]');
const condition1UI = document.getElementById('condition1-ui');
const condition2UI = document.getElementById('condition2-ui');
const condition3UI = document.getElementById('condition3-ui');

const userPromptInput = document.getElementById('user-prompt');
const generateBtnC2 = document.getElementById('generate-btn-c2');
const loadingC2 = document.getElementById('loading-c2');
const aiRulesC2 = document.getElementById('ai-rules-c2');
const errorMessageC2 = document.getElementById('error-message-c2');

const generateBtnC3 = document.getElementById('generate-btn-c3');
const loadingC3 = document.getElementById('loading-c3');
const aiRulesC3 = document.getElementById('ai-rules-c3');
const errorMessageC3 = document.getElementById('error-message-c3');

// Switch between conditions
function switchCondition(conditionNumber) {
  condition1UI.classList.remove('active');
  condition2UI.classList.remove('active');
  condition3UI.classList.remove('active');

  if (conditionNumber === '1') {
    condition1UI.classList.add('active');
  } else if (conditionNumber === '2') {
    condition2UI.classList.add('active');
  } else if (conditionNumber === '3') {
    condition3UI.classList.add('active');
  }
}

// Event listeners for radio buttons
conditionRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    switchCondition(e.target.value);
  });
});

// Call Gemini API
async function callGemini(prompt) {
  const resp = await fetch('/webhook3/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: 'models/gemini-2.5-flash',
      temperature: 0.7,
      topP: 0.9
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return data.text || '';
}

// Condition 2: Human + AI
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
    const messagesContext = messagesToText();
    const fullPrompt = `You are helping create rules for a family WhatsApp group. Below is the conversation history from the group:

${messagesContext}

User's request: ${userPrompt}

Please provide clear, actionable rules based on the user's request and the conversation context. Format the rules as a numbered list.`;

    const result = await callGemini(fullPrompt);
    aiRulesC2.value = result;
  } catch (error) {
    console.error('Generation error:', error);
    errorMessageC2.textContent = `Error: ${error.message}`;
    errorMessageC2.classList.add('active');
  } finally {
    generateBtnC2.disabled = false;
    loadingC2.classList.remove('active');
  }
});

// Condition 3: LLM Only (using contextual prompt from Experiment 1)
generateBtnC3.addEventListener('click', async () => {
  errorMessageC3.classList.remove('active');
  generateBtnC3.disabled = true;
  loadingC3.classList.add('active');
  aiRulesC3.value = '';

  try {
    const messagesContext = messagesToText();

    // Use the contextual prompt format from Experiment 1
    const fullPrompt = `Your task is to suggest rules for guiding user behavior and activities in WhatsApp groups.

Below is an excerpt from a family WhatsApp group. Each message shows the timestamp, sender, and content. Use it extensively to understand recurring topics, conflicts, and norms.

${messagesContext}

Task: Create exactly five distinct rules tailored to the observed group behaviours. Express each rule as a single, self-contained statement (one short self-contained sentence) that sets clear expectations or boundaries for the group. For each rule, also provide a short "reason" sentence.

Requirements:
- Each rule must be grounded in patterns surfaced by the conversation, but do not mention the transcript, chat logs, participants, or the analysis process. Do not write "this group" or otherwise reveal that these rules come from a specific dataset.
- Mix of prescriptive and restrictive rules.
- Reference specific behaviours only when they appear in the excerpt, but phrase the accompanying "reason" in neutral, general and abstract justification rather than explicit references to the observed messages.
- Keep the tone constructive and neutral; avoid naming individuals or exposing personal data.
- Keep reasons generic enough in tone and level of abstraction. The rules themselves should still be grounded from observations in the conversation.
- Avoid numbering, bullet symbols, or extra commentary.

Provide the rules in a clear, readable format with each rule followed by its reason.`;

    const result = await callGemini(fullPrompt);
    aiRulesC3.value = result;
  } catch (error) {
    console.error('Generation error:', error);
    errorMessageC3.textContent = `Error: ${error.message}`;
    errorMessageC3.classList.add('active');
  } finally {
    generateBtnC3.disabled = false;
    loadingC3.classList.remove('active');
  }
});

// Initialize with Condition 2 selected
switchCondition('2');

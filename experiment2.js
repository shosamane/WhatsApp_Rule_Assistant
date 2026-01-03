// Mock WhatsApp group messages - New Year 2026 Family Group
const messages = [
  // January 1st - Morning Wishes
  {
    id: '1',
    sender: 'Dad',
    content: 'Happy New Year everyone! May 2026 bring joy, health and prosperity to our family 🎊🎉',
    timestamp: '12:01 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '2',
    sender: 'Mom',
    content: 'Happy New Year! God bless everyone ❤️🙏',
    timestamp: '12:02 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '3',
    sender: 'Raju Uncle',
    content: '',
    timestamp: '12:05 AM',
    isOwn: false,
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1758844899473-c7e6153e31cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwyMDI2JTIwbmV3JTIweWVhciUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc2NzQ3MDQxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    isForwarded: true,
  },
  {
    id: '4',
    sender: 'Meena Aunty',
    content: 'Wishing everyone a blessed New Year! May all your dreams come true 🌟✨',
    timestamp: '6:30 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '5',
    sender: 'Basu Grand Uncle',
    content: '🌅 "Every sunrise is an invitation to brighten someone\'s day." \n\nHappy New Year to the entire family! Stay blessed 🙏',
    timestamp: '7:15 AM',
    isOwn: false,
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwbW9ybmluZyUyMGluc3BpcmF0aW9uYWx8ZW58MXx8fHwxNzY3NDY1MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    isForwarded: true,
  },
  {
    id: '6',
    sender: 'Chinni Aunty',
    content: 'Good morning! Sending love and warm wishes 💐',
    timestamp: '8:00 AM',
    isOwn: false,
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXJzJTIwZ3JlZXRpbmd8ZW58MXx8fHwxNzY3NDY1MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '7',
    sender: 'You',
    content: 'Happy New Year everyone! ❤️🎊',
    timestamp: '9:00 AM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '8',
    sender: 'Vijay Uncle',
    content: '💪 "Success is not final, failure is not fatal: it is the courage to continue that counts."\n- Winston Churchill\n\nHappy New Year family! Let\'s make 2026 amazing!',
    timestamp: '9:30 AM',
    isOwn: false,
    type: 'image',
    imageUrl: 'https://images.unsplash.com/photo-1552508744-1696d4464960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RpdmF0aW9uYWwlMjBxdW90ZXxlbnwxfHx8fDE3Njc0NjUyMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    isForwarded: true,
  },
  {
    id: '9',
    sender: 'Prem Bhaiyya',
    content: 'Happy New Year everyone! 🎉',
    timestamp: '10:15 AM',
    isOwn: false,
    type: 'text',
  },

  // Noon - Unknown number added
  {
    id: '10',
    sender: '',
    content: 'Prem Bhaiyya added +91 98765 43210',
    timestamp: '12:30 PM',
    isOwn: false,
    type: 'system',
  },
  {
    id: '11',
    sender: 'Meena Aunty',
    content: 'Who is this? Prem beta, who did you add?',
    timestamp: '12:32 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '12',
    sender: 'Raju Uncle',
    content: 'Yes, who is this new person?',
    timestamp: '12:45 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '13',
    sender: 'You',
    content: 'Hey Prem, is your phone with you? You aren\'t replying to my texts',
    timestamp: '1:00 PM',
    isOwn: true,
    type: 'text',
  },
  {
    id: '14',
    sender: 'Chinni Aunty',
    content: 'Maybe he\'s busy?',
    timestamp: '1:15 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '15',
    sender: 'Prem Bhaiyya',
    content: 'Sorry everyone! I added my new number. My old SIM stopped working so I got a new one. This is my new number now 📱',
    timestamp: '1:30 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '16',
    sender: 'Raju Uncle',
    content: 'Oh I see. I didn\'t know anybody could just add any person to the group like this',
    timestamp: '1:35 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '17',
    sender: 'Prem Bhaiyya',
    content: 'Yes uncle, sorry for the confusion. I should have informed everyone first',
    timestamp: '1:40 PM',
    isOwn: false,
    type: 'text',
  },

  // Afternoon filler
  {
    id: '18',
    sender: 'Mom',
    content: 'What should I make for dinner tonight?',
    timestamp: '3:00 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '19',
    sender: 'Meena Aunty',
    content: 'Make something special! It\'s New Year after all 😊',
    timestamp: '3:05 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '20',
    sender: 'You',
    content: 'This message was deleted',
    timestamp: '4:00 PM',
    isOwn: true,
    type: 'deleted',
  },
  {
    id: '21',
    sender: 'Basu Grand Uncle',
    content: 'Taking my evening walk. Beautiful weather today 🚶‍♂️',
    timestamp: '5:30 PM',
    isOwn: false,
    type: 'text',
  },

  // Evening - Instagram link with political content
  {
    id: '22',
    sender: 'Prem Bhaiyya',
    content: 'Haha this is hilarious! Congress doesn\'t know what hit them 😂😂',
    timestamp: '8:15 PM',
    isOwn: false,
    type: 'link',
    isForwarded: false,
    linkPreview: {
      type: 'instagram',
      contactName: '~Bharatiya Janta Party',
      contactNumber: '+91 11 2334 4444',
      title: 'BJP Official',
      description: 'Another historic win! Congress left fumbling once again 😂🔥 #BJPVictory #CongressFails',
      thumbnail: 'https://images.unsplash.com/photo-1666244454829-7f0889ec5783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXdhbGklMjBsaWdodHN8ZW58MXx8fHwxNzY3NDY1MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      videoLength: '1:23',
    },
  },
  {
    id: '23',
    sender: 'Vijay Uncle',
    content: 'True that! 💪🇮🇳',
    timestamp: '8:20 PM',
    isOwn: false,
    type: 'text',
  },

  // Night time - filler
  {
    id: '24',
    sender: 'Chinni Aunty',
    content: 'Dinner was lovely! Thank you didi 💕',
    timestamp: '9:45 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '25',
    sender: 'Mom',
    content: 'Glad you enjoyed it! 😊',
    timestamp: '9:50 PM',
    isOwn: false,
    type: 'text',
  },

  // Late night - Political argument starts (Jan 1st, 11:30 PM onwards)
  {
    id: '26',
    sender: 'Suresh Uncle',
    content: 'Did anyone see the AQI levels in Delhi today? 450! Absolutely toxic. This is what happens under "development" 🤦‍♂️',
    timestamp: '11:30 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '27',
    sender: 'Suresh Uncle',
    content: 'And the rupee hit 85 to the dollar. Wow, what amazing economic management! 👏 Our country is really "vikas-ing" na Prem beta?',
    timestamp: '11:32 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '28',
    sender: 'Prem Bhaiyya',
    content: 'Uncle, you can\'t blame everything on the government. These are global issues',
    timestamp: '11:35 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '29',
    sender: 'Suresh Uncle',
    content: 'Global issues? 😂 Then why does your party take credit when oil prices drop? Can\'t have it both ways beta',
    timestamp: '11:37 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '30',
    sender: 'Prem Bhaiyya',
    content: 'At least we\'re trying to develop infrastructure. What did Congress do in 70 years?',
    timestamp: '11:40 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '31',
    sender: 'Suresh Uncle',
    content: 'Oh the famous "70 saal" argument. Very original. Meanwhile people can\'t breathe in their own capital city 🙄',
    timestamp: '11:42 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '32',
    sender: 'Prem Bhaiyya',
    content: 'This is what happens when people get their education from WhatsApp University. No wonder you don\'t understand basic economics uncle. Maybe if you had proper education you\'d get it',
    timestamp: '11:45 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '33',
    sender: 'Suresh Uncle',
    content: 'Education?? Your so-called PM is the one who\'s uneducated! Entire degree is fake! And you\'re talking to me about education you little s***? F*** you and your b******* party!',
    timestamp: '11:47 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '34',
    sender: '',
    content: 'Dad removed Suresh Uncle',
    timestamp: '11:48 PM',
    isOwn: false,
    type: 'system',
  },

  // Silence until next morning - Jan 2nd
  {
    id: '35',
    sender: 'Mom',
    content: 'Good morning everyone',
    timestamp: '7:00 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '36',
    sender: 'Meena Aunty',
    content: 'Good morning 🌅',
    timestamp: '7:30 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '37',
    sender: 'Prem Bhaiyya',
    content: 'Good morning everyone. I want to apologize for last night. I shouldn\'t have said those things to Suresh uncle. I completely stepped out of line and disrespected an elder. It was wrong of me to behave that way in the heat of the moment. I\'m very sorry to the entire family. 🙏',
    timestamp: '9:00 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '38',
    sender: 'Basu Grand Uncle',
    content: 'It takes courage to apologize Prem. Well done beta',
    timestamp: '9:05 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '39',
    sender: '',
    content: 'Dad added Suresh Uncle',
    timestamp: '9:15 AM',
    isOwn: false,
    type: 'system',
  },
  {
    id: '40',
    sender: 'Suresh Uncle',
    content: 'I also want to apologize. I lost my temper and used very inappropriate language. That was completely unacceptable. Sorry Prem, sorry everyone. I shouldn\'t have let a political discussion get so heated. We\'re family first. 🙏',
    timestamp: '9:20 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '41',
    sender: 'Dad',
    content: 'Let\'s move past this. We\'re all family here. No more political arguments please 🙏',
    timestamp: '9:25 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '42',
    sender: 'Chinni Aunty',
    content: 'Yes, family is more important than politics ❤️',
    timestamp: '9:30 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '43',
    sender: 'You',
    content: 'Glad everything is sorted 😊',
    timestamp: '9:35 AM',
    isOwn: true,
    type: 'text',
  },

  // Jan 2nd - Rest of the day filler
  {
    id: '44',
    sender: 'Raju Uncle',
    content: '',
    timestamp: '11:00 AM',
    isOwn: false,
    type: 'link',
    isForwarded: true,
    linkPreview: {
      type: 'facebook',
      contactName: '~Motivational Quotes',
      contactNumber: '+91 22 4455 6677',
      title: 'Daily Wisdom',
      description: '"Family is not an important thing. It\'s everything." - Michael J. Fox ❤️👨‍👩‍👧‍👦',
      thumbnail: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXJzJTIwZ3JlZXRpbmd8ZW58MXx8fHwxNzY3NDY1MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  },
  {
    id: '45',
    sender: 'Meena Aunty',
    content: 'Beautiful message 💕',
    timestamp: '11:15 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '46',
    sender: 'Mom',
    content: 'Planning to visit the temple tomorrow morning. Anyone wants to join?',
    timestamp: '2:00 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '47',
    sender: 'Chinni Aunty',
    content: 'I\'ll come! What time?',
    timestamp: '2:05 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '48',
    sender: 'Mom',
    content: '6 AM. We can go for breakfast after',
    timestamp: '2:10 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '49',
    sender: 'Basu Grand Uncle',
    content: '',
    timestamp: '5:00 PM',
    isOwn: false,
    type: 'link',
    isForwarded: true,
    linkPreview: {
      type: 'instagram',
      contactName: '~Good Morning India',
      contactNumber: '+91 80 9988 7766',
      title: 'Morning Wishes',
      description: 'Start each day with a grateful heart 🙏✨ #Blessed #Gratitude #NewYear',
      thumbnail: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwbW9ybmluZyUyMGluc3BpcmF0aW9uYWx8ZW58MXx8fHwxNzY3NDY1MjEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      videoLength: '0:45',
    },
  },
  {
    id: '50',
    sender: 'Meena Aunty',
    content: 'This message was deleted',
    timestamp: '6:30 PM',
    isOwn: false,
    type: 'deleted',
  },
  {
    id: '51',
    sender: 'Vijay Uncle',
    content: 'Anyone watching the cricket match?',
    timestamp: '8:00 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '52',
    sender: 'Dad',
    content: 'Yes! India is playing well 🏏',
    timestamp: '8:05 PM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '53',
    sender: 'You',
    content: 'Great match! 🇮🇳',
    timestamp: '8:30 PM',
    isOwn: true,
    type: 'text',
  },

  // Jan 3rd morning
  {
    id: '54',
    sender: 'Mom',
    content: 'Good morning! Heading to temple now 🙏',
    timestamp: '5:45 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '55',
    sender: 'Chinni Aunty',
    content: 'On my way! See you there',
    timestamp: '5:50 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '56',
    sender: 'Basu Grand Uncle',
    content: 'Good morning everyone. Have a blessed day 🌞',
    timestamp: '7:00 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '57',
    sender: 'Mom',
    content: 'Look what I found! Garden pots on such discount 🪴🌿',
    timestamp: '8:15 AM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      type: 'product',
      contactName: '',
      contactNumber: '',
      title: 'Premium Ceramic Plant Pots Set of 4 - Garden Decor',
      description: '⭐⭐⭐⭐☆ 4.2/5 | 7 ratings | CLEARANCE SALE',
      thumbnail: 'https://images.unsplash.com/photo-1759252571361-431588684beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBwb3RzJTIwcGxhbnRlcnN8ZW58MXx8fHwxNzY3NDY5MDU1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      price: '₹899',
      originalPrice: '₹2,499',
      discount: '64% OFF',
      rating: '4.2',
    },
  },
  {
    id: '58',
    sender: 'Mom',
    content: '',
    timestamp: '8:16 AM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      type: 'product',
      contactName: '',
      contactNumber: '',
      title: 'Heavy Duty Garden Tool Set - Spade Rake Fork 3-Piece',
      description: '⭐⭐⭐⭐⭐ 4.6/5 | 5 ratings | LIMITED STOCK',
      thumbnail: 'https://images.unsplash.com/photo-1724773689174-a2475dcf4ffd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjB0b29scyUyMHNwYWRlfGVufDF8fHx8MTc2NzQ2OTA1Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      price: '₹1,299',
      originalPrice: '₹3,999',
      discount: '68% OFF',
      rating: '4.6',
    },
  },
  {
    id: '59',
    sender: 'Mom',
    content: '',
    timestamp: '8:17 AM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      type: 'product',
      contactName: '',
      contactNumber: '',
      title: 'Vintage Watering Can Metal 2L Capacity - Rust Proof',
      description: '⭐⭐⭐⭐ 4.0/5 | 3 ratings | MEGA SALE',
      thumbnail: 'https://images.unsplash.com/photo-1667992714862-df8713baf8c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmluZyUyMGNhbiUyMGdhcmRlbnxlbnwxfHx8fDE3Njc0NjkwNTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      price: '₹699',
      originalPrice: '₹1,799',
      discount: '61% OFF',
      rating: '4.0',
    },
  },
  {
    id: '60',
    sender: 'Mom',
    content: '',
    timestamp: '8:18 AM',
    isOwn: false,
    type: 'link',
    linkPreview: {
      type: 'product',
      contactName: '',
      contactNumber: '',
      title: 'Gardening Gloves with Tools Kit - Professional Grade',
      description: '⭐⭐⭐⭐⭐ 4.5/5 | 9 ratings | FLASH DEAL',
      thumbnail: 'https://images.unsplash.com/photo-1599778150914-88e98e0c3a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBnbG92ZXMlMjB0b29sc3xlbnwxfHx8fDE3Njc0NjkwNTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      price: '₹499',
      originalPrice: '₹1,499',
      discount: '67% OFF',
      rating: '4.5',
    },
  },
  {
    id: '61',
    sender: 'Mom',
    content: 'Haha Black Friday has come to India too! 😄 Everything on such crazy clearance. Got all of these for my balcony garden 🌱',
    timestamp: '8:20 AM',
    isOwn: false,
    type: 'text',
  },
  {
    id: '62',
    sender: 'Mom',
    content: 'Should get delivery in 2-3 days they said 📦',
    timestamp: '8:22 AM',
    isOwn: false,
    type: 'text',
  },
];

// Convert messages to text format for LLM
function messagesToText() {
  return messages.map(msg => {
    if (msg.type === 'system') {
      return `[${msg.timestamp}] SYSTEM: ${msg.content}`;
    } else if (msg.type === 'deleted') {
      return `[${msg.timestamp}] ${msg.sender}: <deleted message>`;
    } else if (msg.type === 'image') {
      const fwdText = msg.isForwarded ? ' (forwarded)' : '';
      return `[${msg.timestamp}] ${msg.sender}: <sent an image>${fwdText}${msg.content ? ' - ' + msg.content : ''}`;
    } else if (msg.type === 'link') {
      const fwdText = msg.isForwarded ? ' (forwarded)' : '';
      const preview = msg.linkPreview;
      if (preview) {
        return `[${msg.timestamp}] ${msg.sender}: <shared link>${fwdText}\nTitle: ${preview.title}\nDescription: ${preview.description}`;
      }
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

const userPromptInput = document.getElementById('user-prompt');
const generateBtnC2 = document.getElementById('generate-btn-c2');
const loadingC2 = document.getElementById('loading-c2');
const aiRulesC2 = document.getElementById('ai-rules-c2');
const errorMessageC2 = document.getElementById('error-message-c2');

// Switch between conditions
function switchCondition(conditionNumber) {
  condition1UI.classList.remove('active');
  condition2UI.classList.remove('active');

  if (conditionNumber === '1') {
    condition1UI.classList.add('active');
  } else if (conditionNumber === '2') {
    condition2UI.classList.add('active');
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
      model: 'models/gemini-2.0-flash-exp',
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

// Initialize with Condition 2 selected
switchCondition('2');

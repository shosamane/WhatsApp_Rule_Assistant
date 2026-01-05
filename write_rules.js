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
const whatsappVersion = assignWhatsAppVersion();

// Listen for messages from WhatsApp mock iframe
window.addEventListener('message', (event) => {
  // Handle version selection
  if (event.data && event.data.type === 'whatsapp_version_selected') {
    const version = event.data.version;
    console.log(`[write_rules] WhatsApp mock selected version: ${version}`);

    // Store the version that was actually displayed
    sessionStorage.setItem('exp2_whatsapp_version', version.toString());

    const versionLabels = {
      1: 'Unknown Number → Political → Product',
      2: 'Political → Product → Unknown Number',
      3: 'Product → Unknown Number → Political'
    };
    sessionStorage.setItem('exp2_whatsapp_version_label', versionLabels[version]);

    console.log(`[write_rules] Stored version ${version}: ${versionLabels[version]}`);
  }

  // Handle scroll to bottom tracking
  if (event.data && event.data.type === 'whatsapp_scrolled_to_bottom') {
    console.log('[write_rules] User scrolled to bottom of WhatsApp conversation');

    // Store that user has read the full conversation
    sessionStorage.setItem('exp2_scrolled_to_bottom', 'true');
    sessionStorage.setItem('exp2_scrolled_to_bottom_timestamp', new Date().toISOString());

    // Update submit button state and requirements indicator
    updateSubmitButtonState();
    updateRequirementsIndicator();
  }
});

// WhatsApp Message Data - All 3 Versions
// VERSION 1: Unknown Number → Political → Product
const messagesV1 = [
  { sender: 'Dad', content: 'Happy New Year everyone! May 2026 bring joy, health and prosperity to our family 🎊🎉', timestamp: '12:01 AM', type: 'text' },
  { sender: 'Mom', content: 'Happy New Year! God bless everyone ❤️🙏', timestamp: '12:02 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '12:05 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1758844899473-c7e6153e31cc', isForwarded: true },
  { sender: 'Meena', content: 'Wishing everyone a blessed New Year! May all your dreams come true 🌟✨', timestamp: '6:30 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '🌅 "Every sunrise is an invitation to brighten someone\'s day." \n\nHappy New Year to the entire family! Stay blessed 🙏', timestamp: '7:15 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', isForwarded: true },
  { sender: 'Chinni Aunty', content: 'Good morning! Sending love and warm wishes 💐', timestamp: '8:00 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' },
  { sender: 'You', content: 'Happy New Year everyone! ❤️🎊', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Vijay Uncle', content: '💪 "Success is not final, failure is not fatal: it is the courage to continue that counts."\n- Winston Churchill\n\nHappy New Year family! Let\'s make 2026 amazing!', timestamp: '9:30 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1552508744-1696d4464960', isForwarded: true },
  { sender: 'Prem Bhaiyya', content: 'Happy New Year everyone! 🎉', timestamp: '10:15 AM', type: 'text' },
  { sender: '', content: 'Prem Bhaiyya added +91 98765 43210', timestamp: '12:30 PM', type: 'system' },
  { sender: 'Meena', content: 'Who is this? Prem beta, who did you add?', timestamp: '12:32 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Yes, who is this new person?', timestamp: '12:45 PM', type: 'text' },
  { sender: 'You', content: 'Hey Prem, is your phone with you? You aren\'t replying to my texts', timestamp: '1:00 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Maybe he\'s busy?', timestamp: '1:15 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Sorry everyone! I added my new number. My old SIM stopped working so I got a new one. This is my new number now 📱', timestamp: '1:30 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Oh I see. I didn\'t know anybody could just add any person to the group like this', timestamp: '1:35 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Yes uncle, sorry for the confusion. I should have informed everyone first', timestamp: '1:40 PM', type: 'text' },
  { sender: 'Mom', content: 'What should I make for dinner tonight?', timestamp: '3:00 PM', type: 'text' },
  { sender: 'Meena', content: 'Make something special! It\'s New Year after all 😊', timestamp: '3:05 PM', type: 'text' },
  { sender: 'You', content: 'This message was deleted', timestamp: '4:00 PM', type: 'deleted' },
  { sender: 'Basu Grand Uncle', content: 'Taking my evening walk. Beautiful weather today 🚶‍♂️', timestamp: '5:30 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Haha this is hilarious! Congress doesn\'t know what hit them 😂😂', timestamp: '8:15 PM', type: 'link', linkPreview: { type: 'instagram', contactName: '~Bharatiya Janta Party', title: 'BJP Official', description: 'Another historic win! Congress left fumbling once again 😂🔥 #BJPVictory #CongressFails', thumbnail: 'https://images.unsplash.com/photo-1666244454829-7f0889ec5783', videoLength: '1:23' } },
  { sender: 'Vijay Uncle', content: 'True that! 💪🇮🇳', timestamp: '8:20 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Dinner was lovely! Thank you didi 💕', timestamp: '9:45 PM', type: 'text' },
  { sender: 'Mom', content: 'Glad you enjoyed it! 😊', timestamp: '9:50 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Did anyone see the AQI levels in Delhi today? 450! Absolutely toxic. This is what happens under "development" 🤦‍♂️', timestamp: '11:30 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'And the rupee hit 85 to the dollar. Wow, what amazing economic management! 👏 Our country is really "vikas-ing" na Prem beta?', timestamp: '11:32 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Uncle, you can\'t blame everything on the government. These are global issues', timestamp: '11:35 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Global issues? 😂 Then why does your party take credit when oil prices drop? Can\'t have it both ways beta', timestamp: '11:37 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'At least we\'re trying to develop infrastructure. What did Congress do in 70 years?', timestamp: '11:40 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Oh the famous "70 saal" argument. Very original. Meanwhile people can\'t breathe in their own capital city 🙄', timestamp: '11:42 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'This is what happens when people get their education from WhatsApp University. No wonder you don\'t understand basic economics uncle. Maybe if you had proper education you\'d get it', timestamp: '11:45 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Education?? Your so-called PM is the one who\'s uneducated! Entire degree is fake! And you\'re talking to me about education you little s***? F*** you and your b******* party!', timestamp: '11:47 PM', type: 'text' },
  { sender: '', content: 'Dad removed Suresh Uncle', timestamp: '11:48 PM', type: 'system' },
  { sender: 'Mom', content: 'Good morning everyone', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Meena', content: 'Good morning 🌅', timestamp: '7:30 AM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Good morning everyone. I want to apologize for last night. I shouldn\'t have said those things to Suresh uncle. I completely stepped out of line and disrespected an elder. It was wrong of me to behave that way in the heat of the moment. I\'m very sorry to the entire family. 🙏', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'It takes courage to apologize Prem. Well done beta', timestamp: '9:05 AM', type: 'text' },
  { sender: '', content: 'Dad added Suresh Uncle', timestamp: '9:15 AM', type: 'system' },
  { sender: 'Suresh Uncle', content: 'I also want to apologize. I lost my temper and used very inappropriate language. That was completely unacceptable. Sorry Prem, sorry everyone. I shouldn\'t have let a political discussion get so heated. We\'re family first. 🙏', timestamp: '9:20 AM', type: 'text' },
  { sender: 'Dad', content: 'Let\'s move past this. We\'re all family here. No more political arguments please 🙏', timestamp: '9:25 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Yes, family is more important than politics ❤️', timestamp: '9:30 AM', type: 'text' },
  { sender: 'You', content: 'Glad everything is sorted 😊', timestamp: '9:35 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '11:00 AM', type: 'link', isForwarded: true, linkPreview: { type: 'facebook', contactName: '~Motivational Quotes', title: 'Daily Wisdom', description: '"Family is not an important thing. It\'s everything." - Michael J. Fox ❤️👨‍👩‍👧‍👦', thumbnail: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' } },
  { sender: 'Meena', content: 'Beautiful message 💕', timestamp: '11:15 AM', type: 'text' },
  { sender: 'Mom', content: 'Planning to visit the temple tomorrow morning. Anyone wants to join?', timestamp: '2:00 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'I\'ll come! What time?', timestamp: '2:05 PM', type: 'text' },
  { sender: 'Mom', content: '6 AM. We can go for breakfast after', timestamp: '2:10 PM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '', timestamp: '5:00 PM', type: 'link', isForwarded: true, linkPreview: { type: 'instagram', contactName: '~Good Morning India', title: 'Morning Wishes', description: 'Start each day with a grateful heart 🙏✨ #Blessed #Gratitude #NewYear', thumbnail: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', videoLength: '0:45' } },
  { sender: 'Meena', content: 'This message was deleted', timestamp: '6:30 PM', type: 'deleted' },
  { sender: 'Vijay Uncle', content: 'Anyone watching the cricket match?', timestamp: '8:00 PM', type: 'text' },
  { sender: 'Dad', content: 'Yes! India is playing well 🏏', timestamp: '8:05 PM', type: 'text' },
  { sender: 'You', content: 'Great match! 🇮🇳', timestamp: '8:30 PM', type: 'text' },
  { sender: 'Mom', content: 'Good morning! Heading to temple now 🙏', timestamp: '5:45 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'On my way! See you there', timestamp: '5:50 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'Good morning everyone. Have a blessed day 🌞', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Mom', content: 'Look what I found! Garden pots on such discount 🪴🌿', timestamp: '8:15 AM', type: 'link', linkPreview: { type: 'product', title: 'Premium Ceramic Plant Pots Set of 4 - Garden Decor', description: '⭐⭐⭐⭐☆ 4.2/5 | 7 ratings | CLEARANCE SALE', thumbnail: 'https://images.unsplash.com/photo-1759252571361-431588684beb', price: '₹899', originalPrice: '₹2,499', discount: '64% OFF', rating: '4.2' } },
  { sender: 'Mom', content: '', timestamp: '8:16 AM', type: 'link', linkPreview: { type: 'product', title: 'Heavy Duty Garden Tool Set - Spade Rake Fork 3-Piece', description: '⭐⭐⭐⭐⭐ 4.6/5 | 5 ratings | LIMITED STOCK', thumbnail: 'https://images.unsplash.com/photo-1724773689174-a2475dcf4ffd', price: '₹1,299', originalPrice: '₹3,999', discount: '68% OFF', rating: '4.6' } },
  { sender: 'Mom', content: '', timestamp: '8:17 AM', type: 'link', linkPreview: { type: 'product', title: 'Vintage Watering Can Metal 2L Capacity - Rust Proof', description: '⭐⭐⭐⭐ 4.0/5 | 3 ratings | MEGA SALE', thumbnail: 'https://images.unsplash.com/photo-1667992714862-df8713baf8c6', price: '₹699', originalPrice: '₹1,799', discount: '61% OFF', rating: '4.0' } },
  { sender: 'Mom', content: '', timestamp: '8:18 AM', type: 'link', linkPreview: { type: 'product', title: 'Gardening Gloves with Tools Kit - Professional Grade', description: '⭐⭐⭐⭐⭐ 4.5/5 | 9 ratings | FLASH DEAL', thumbnail: 'https://images.unsplash.com/photo-1599778150914-88e98e0c3a3e', price: '₹499', originalPrice: '₹1,499', discount: '67% OFF', rating: '4.5' } },
  { sender: 'Mom', content: 'Haha Black Friday has come to India too! 😄 Everything on such crazy clearance. Got all of these for my balcony garden 🌱', timestamp: '8:20 AM', type: 'text' },
  { sender: 'Mom', content: 'Should get delivery in 2-3 days they said 📦', timestamp: '8:22 AM', type: 'text' }
];

// VERSION 2: Political → Product → Unknown Number
const messagesV2 = [
  { sender: 'Dad', content: 'Happy New Year everyone! May 2026 bring joy, health and prosperity to our family 🎊🎉', timestamp: '12:01 AM', type: 'text' },
  { sender: 'Mom', content: 'Happy New Year! God bless everyone ❤️🙏', timestamp: '12:02 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '12:05 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1758844899473-c7e6153e31cc', isForwarded: true },
  { sender: 'Meena', content: 'Wishing everyone a blessed New Year! May all your dreams come true 🌟✨', timestamp: '6:30 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '🌅 "Every sunrise is an invitation to brighten someone\'s day." \n\nHappy New Year to the entire family! Stay blessed 🙏', timestamp: '7:15 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', isForwarded: true },
  { sender: 'Chinni Aunty', content: 'Good morning! Sending love and warm wishes 💐', timestamp: '8:00 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' },
  { sender: 'You', content: 'Happy New Year everyone! ❤️🎊', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Vijay Uncle', content: '💪 "Success is not final, failure is not fatal: it is the courage to continue that counts."\n- Winston Churchill\n\nHappy New Year family! Let\'s make 2026 amazing!', timestamp: '9:30 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1552508744-1696d4464960', isForwarded: true },
  { sender: 'Prem Bhaiyya', content: 'Happy New Year everyone! 🎉', timestamp: '10:15 AM', type: 'text' },
  { sender: 'Mom', content: 'What should I make for lunch today?', timestamp: '11:30 AM', type: 'text' },
  { sender: 'Meena', content: 'Something light! We all ate so much last night 😊', timestamp: '11:45 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'I\'m going for a walk. Be back by 2 PM', timestamp: '1:00 PM', type: 'text' },
  { sender: 'You', content: 'This message was deleted', timestamp: '3:30 PM', type: 'deleted' },
  { sender: 'Prem Bhaiyya', content: 'Haha this is hilarious! Congress doesn\'t know what hit them 😂😂', timestamp: '8:15 PM', type: 'link', linkPreview: { type: 'instagram', contactName: '~Bharatiya Janta Party', title: 'BJP Official', description: 'Another historic win! Congress left fumbling once again 😂🔥 #BJPVictory #CongressFails', thumbnail: 'https://images.unsplash.com/photo-1666244454829-7f0889ec5783', videoLength: '1:23' } },
  { sender: 'Vijay Uncle', content: 'True that! 💪🇮🇳', timestamp: '8:20 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Dinner was lovely! Thank you didi 💕', timestamp: '9:45 PM', type: 'text' },
  { sender: 'Mom', content: 'Glad you enjoyed it! 😊', timestamp: '9:50 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Did anyone see the AQI levels in Delhi today? 450! Absolutely toxic. This is what happens under "development" 🤦‍♂️', timestamp: '11:30 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'And the rupee hit 85 to the dollar. Wow, what amazing economic management! 👏 Our country is really "vikas-ing" na Prem beta?', timestamp: '11:32 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Uncle, you can\'t blame everything on the government. These are global issues', timestamp: '11:35 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Global issues? 😂 Then why does your party take credit when oil prices drop? Can\'t have it both ways beta', timestamp: '11:37 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'At least we\'re trying to develop infrastructure. What did Congress do in 70 years?', timestamp: '11:40 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Oh the famous "70 saal" argument. Very original. Meanwhile people can\'t breathe in their own capital city 🙄', timestamp: '11:42 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'This is what happens when people get their education from WhatsApp University. No wonder you don\'t understand basic economics uncle. Maybe if you had proper education you\'d get it', timestamp: '11:45 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Education?? Your so-called PM is the one who\'s uneducated! Entire degree is fake! And you\'re talking to me about education you little s***? F*** you and your b******* party!', timestamp: '11:47 PM', type: 'text' },
  { sender: '', content: 'Dad removed Suresh Uncle', timestamp: '11:48 PM', type: 'system' },
  { sender: 'Mom', content: 'Good morning everyone', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Meena', content: 'Good morning 🌅', timestamp: '7:30 AM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Good morning everyone. I want to apologize for last night. I shouldn\'t have said those things to Suresh uncle. I completely stepped out of line and disrespected an elder. It was wrong of me to behave that way in the heat of the moment. I\'m very sorry to the entire family. 🙏', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'It takes courage to apologize Prem. Well done beta', timestamp: '9:05 AM', type: 'text' },
  { sender: '', content: 'Dad added Suresh Uncle', timestamp: '9:15 AM', type: 'system' },
  { sender: 'Suresh Uncle', content: 'I also want to apologize. I lost my temper and used very inappropriate language. That was completely unacceptable. Sorry Prem, sorry everyone. I shouldn\'t have let a political discussion get so heated. We\'re family first. 🙏', timestamp: '9:20 AM', type: 'text' },
  { sender: 'Dad', content: 'Let\'s move past this. We\'re all family here. No more political arguments please 🙏', timestamp: '9:25 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Yes, family is more important than politics ❤️', timestamp: '9:30 AM', type: 'text' },
  { sender: 'You', content: 'Glad everything is sorted 😊', timestamp: '9:35 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '11:00 AM', type: 'link', isForwarded: true, linkPreview: { type: 'facebook', contactName: '~Motivational Quotes', title: 'Daily Wisdom', description: '"Family is not an important thing. It\'s everything." - Michael J. Fox ❤️👨‍👩‍👧‍👦', thumbnail: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' } },
  { sender: 'Meena', content: 'Beautiful message 💕', timestamp: '11:15 AM', type: 'text' },
  { sender: 'Mom', content: 'Look what I found! Garden pots on such discount 🪴🌿', timestamp: '2:15 PM', type: 'link', linkPreview: { type: 'product', title: 'Premium Ceramic Plant Pots Set of 4 - Garden Decor', description: '⭐⭐⭐⭐☆ 4.2/5 | 7 ratings | CLEARANCE SALE', thumbnail: 'https://images.unsplash.com/photo-1759252571361-431588684beb', price: '₹899', originalPrice: '₹2,499', discount: '64% OFF', rating: '4.2' } },
  { sender: 'Mom', content: '', timestamp: '2:16 PM', type: 'link', linkPreview: { type: 'product', title: 'Heavy Duty Garden Tool Set - Spade Rake Fork 3-Piece', description: '⭐⭐⭐⭐⭐ 4.6/5 | 5 ratings | LIMITED STOCK', thumbnail: 'https://images.unsplash.com/photo-1724773689174-a2475dcf4ffd', price: '₹1,299', originalPrice: '₹3,999', discount: '68% OFF', rating: '4.6' } },
  { sender: 'Mom', content: '', timestamp: '2:17 PM', type: 'link', linkPreview: { type: 'product', title: 'Vintage Watering Can Metal 2L Capacity - Rust Proof', description: '⭐⭐⭐⭐ 4.0/5 | 3 ratings | MEGA SALE', thumbnail: 'https://images.unsplash.com/photo-1667992714862-df8713baf8c6', price: '₹699', originalPrice: '₹1,799', discount: '61% OFF', rating: '4.0' } },
  { sender: 'Mom', content: '', timestamp: '2:18 PM', type: 'link', linkPreview: { type: 'product', title: 'Gardening Gloves with Tools Kit - Professional Grade', description: '⭐⭐⭐⭐⭐ 4.5/5 | 9 ratings | FLASH DEAL', thumbnail: 'https://images.unsplash.com/photo-1599778150914-88e98e0c3a3e', price: '₹499', originalPrice: '₹1,499', discount: '67% OFF', rating: '4.5' } },
  { sender: 'Mom', content: 'Haha Black Friday has come to India too! 😄 Everything on such crazy clearance. Got all of these for my balcony garden 🌱', timestamp: '2:20 PM', type: 'text' },
  { sender: 'Mom', content: 'Should get delivery in 2-3 days they said 📦', timestamp: '2:22 PM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '', timestamp: '5:00 PM', type: 'link', isForwarded: true, linkPreview: { type: 'instagram', contactName: '~Good Morning India', title: 'Morning Wishes', description: 'Start each day with a grateful heart 🙏✨ #Blessed #Gratitude #NewYear', thumbnail: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', videoLength: '0:45' } },
  { sender: 'Meena', content: 'This message was deleted', timestamp: '6:30 PM', type: 'deleted' },
  { sender: 'Vijay Uncle', content: 'Anyone watching the cricket match?', timestamp: '8:00 PM', type: 'text' },
  { sender: 'Dad', content: 'Yes! India is playing well 🏏', timestamp: '8:05 PM', type: 'text' },
  { sender: 'You', content: 'Great match! 🇮🇳', timestamp: '8:30 PM', type: 'text' },
  { sender: 'Mom', content: 'Planning to visit the temple this morning. Anyone wants to join?', timestamp: '6:00 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'I\'ll come! Give me 15 minutes', timestamp: '6:05 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'Good morning everyone. Have a blessed day 🌞', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Mom', content: 'Back from temple. Such a peaceful morning 🙏', timestamp: '8:30 AM', type: 'text' },
  { sender: '', content: 'Prem Bhaiyya added +91 98765 43210', timestamp: '12:30 PM', type: 'system' },
  { sender: 'Meena', content: 'Who is this? Prem beta, who did you add?', timestamp: '12:32 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Yes, who is this new person?', timestamp: '12:45 PM', type: 'text' },
  { sender: 'You', content: 'Hey Prem, is your phone with you? You aren\'t replying to my texts', timestamp: '1:00 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Maybe he\'s busy?', timestamp: '1:15 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Sorry everyone! I added my new number. My old SIM stopped working so I got a new one. This is my new number now 📱', timestamp: '1:30 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Oh I see. I didn\'t know anybody could just add any person to the group like this', timestamp: '1:35 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Yes uncle, sorry for the confusion. I should have informed everyone first', timestamp: '1:40 PM', type: 'text' },
  { sender: 'Dad', content: 'What a busy day! Finally some rest 😌', timestamp: '7:00 PM', type: 'text' },
  { sender: 'You', content: 'Same here! Good night everyone 🌙', timestamp: '10:30 PM', type: 'text' }
];

// VERSION 3: Product → Unknown Number → Political
const messagesV3 = [
  { sender: 'Dad', content: 'Happy New Year everyone! May 2026 bring joy, health and prosperity to our family 🎊🎉', timestamp: '12:01 AM', type: 'text' },
  { sender: 'Mom', content: 'Happy New Year! God bless everyone ❤️🙏', timestamp: '12:02 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '12:05 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1758844899473-c7e6153e31cc', isForwarded: true },
  { sender: 'Meena', content: 'Wishing everyone a blessed New Year! May all your dreams come true 🌟✨', timestamp: '6:30 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '🌅 "Every sunrise is an invitation to brighten someone\'s day." \n\nHappy New Year to the entire family! Stay blessed 🙏', timestamp: '7:15 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', isForwarded: true },
  { sender: 'Chinni Aunty', content: 'Good morning! Sending love and warm wishes 💐', timestamp: '8:00 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' },
  { sender: 'You', content: 'Happy New Year everyone! ❤️🎊', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Vijay Uncle', content: '💪 "Success is not final, failure is not fatal: it is the courage to continue that counts."\n- Winston Churchill\n\nHappy New Year family! Let\'s make 2026 amazing!', timestamp: '9:30 AM', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1552508744-1696d4464960', isForwarded: true },
  { sender: 'Prem Bhaiyya', content: 'Happy New Year everyone! 🎉', timestamp: '10:15 AM', type: 'text' },
  { sender: 'Mom', content: 'What should I make for lunch today?', timestamp: '11:30 AM', type: 'text' },
  { sender: 'Meena', content: 'Something special! It\'s New Year after all 😊', timestamp: '11:45 AM', type: 'text' },
  { sender: 'Mom', content: 'Look what I found! Garden pots on such discount 🪴🌿', timestamp: '2:00 PM', type: 'link', linkPreview: { type: 'product', title: 'Premium Ceramic Plant Pots Set of 4 - Garden Decor', description: '⭐⭐⭐⭐☆ 4.2/5 | 7 ratings | CLEARANCE SALE', thumbnail: 'https://images.unsplash.com/photo-1759252571361-431588684beb', price: '₹899', originalPrice: '₹2,499', discount: '64% OFF', rating: '4.2' } },
  { sender: 'Mom', content: '', timestamp: '2:01 PM', type: 'link', linkPreview: { type: 'product', title: 'Heavy Duty Garden Tool Set - Spade Rake Fork 3-Piece', description: '⭐⭐⭐⭐⭐ 4.6/5 | 5 ratings | LIMITED STOCK', thumbnail: 'https://images.unsplash.com/photo-1724773689174-a2475dcf4ffd', price: '₹1,299', originalPrice: '₹3,999', discount: '68% OFF', rating: '4.6' } },
  { sender: 'Mom', content: '', timestamp: '2:02 PM', type: 'link', linkPreview: { type: 'product', title: 'Vintage Watering Can Metal 2L Capacity - Rust Proof', description: '⭐⭐⭐⭐ 4.0/5 | 3 ratings | MEGA SALE', thumbnail: 'https://images.unsplash.com/photo-1667992714862-df8713baf8c6', price: '₹699', originalPrice: '₹1,799', discount: '61% OFF', rating: '4.0' } },
  { sender: 'Mom', content: '', timestamp: '2:03 PM', type: 'link', linkPreview: { type: 'product', title: 'Gardening Gloves with Tools Kit - Professional Grade', description: '⭐⭐⭐⭐⭐ 4.5/5 | 9 ratings | FLASH DEAL', thumbnail: 'https://images.unsplash.com/photo-1599778150914-88e98e0c3a3e', price: '₹499', originalPrice: '₹1,499', discount: '67% OFF', rating: '4.5' } },
  { sender: 'Mom', content: 'Haha Black Friday has come to India too! 😄 Everything on such crazy clearance. Got all of these for my balcony garden 🌱', timestamp: '2:05 PM', type: 'text' },
  { sender: 'Mom', content: 'Should get delivery in 2-3 days they said 📦', timestamp: '2:07 PM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'Going for my evening walk soon', timestamp: '3:00 PM', type: 'text' },
  { sender: 'You', content: 'This message was deleted', timestamp: '3:30 PM', type: 'deleted' },
  { sender: 'Basu Grand Uncle', content: 'Back from my walk. Beautiful weather today 🚶‍♂️', timestamp: '6:30 PM', type: 'text' },
  { sender: 'Mom', content: 'What should I make for dinner tonight?', timestamp: '7:00 PM', type: 'text' },
  { sender: 'Meena', content: 'Something special! It\'s New Year after all 😊', timestamp: '7:05 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Dinner was lovely! Thank you didi 💕', timestamp: '9:45 PM', type: 'text' },
  { sender: 'Mom', content: 'Glad you enjoyed it! 😊', timestamp: '9:50 PM', type: 'text' },
  { sender: 'You', content: 'Good night everyone! 🌙', timestamp: '10:30 PM', type: 'text' },
  { sender: 'Mom', content: 'Good morning everyone', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Meena', content: 'Good morning 🌅', timestamp: '7:30 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'Good morning everyone. Have a blessed day 🌞', timestamp: '8:00 AM', type: 'text' },
  { sender: 'Raju Uncle', content: '', timestamp: '10:00 AM', type: 'link', isForwarded: true, linkPreview: { type: 'facebook', contactName: '~Motivational Quotes', title: 'Daily Wisdom', description: '"Family is not an important thing. It\'s everything." - Michael J. Fox ❤️👨‍👩‍👧‍👦', thumbnail: 'https://images.unsplash.com/photo-1599577011266-9c006a93c294' } },
  { sender: 'Meena', content: 'Beautiful message 💕', timestamp: '10:15 AM', type: 'text' },
  { sender: 'Mom', content: 'Planning to visit the temple tomorrow morning. Anyone wants to join?', timestamp: '2:00 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'I\'ll come! What time?', timestamp: '2:05 PM', type: 'text' },
  { sender: 'Mom', content: '6 AM. We can go for breakfast after', timestamp: '2:10 PM', type: 'text' },
  { sender: '', content: 'Prem Bhaiyya added +91 98765 43210', timestamp: '4:30 PM', type: 'system' },
  { sender: 'Meena', content: 'Who is this? Prem beta, who did you add?', timestamp: '4:32 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Yes, who is this new person?', timestamp: '4:45 PM', type: 'text' },
  { sender: 'You', content: 'Hey Prem, is your phone with you? You aren\'t replying to my texts', timestamp: '5:00 PM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Maybe he\'s busy?', timestamp: '5:15 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Sorry everyone! I added my new number. My old SIM stopped working so I got a new one. This is my new number now 📱', timestamp: '5:30 PM', type: 'text' },
  { sender: 'Raju Uncle', content: 'Oh I see. I didn\'t know anybody could just add any person to the group like this', timestamp: '5:35 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Yes uncle, sorry for the confusion. I should have informed everyone first', timestamp: '5:40 PM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: '', timestamp: '7:00 PM', type: 'link', isForwarded: true, linkPreview: { type: 'instagram', contactName: '~Good Morning India', title: 'Evening Wishes', description: 'Start each day with a grateful heart 🙏✨ #Blessed #Gratitude #NewYear', thumbnail: 'https://images.unsplash.com/photo-1644880878516-9674d4b520b8', videoLength: '0:45' } },
  { sender: 'Vijay Uncle', content: 'Anyone watching the cricket match?', timestamp: '8:00 PM', type: 'text' },
  { sender: 'Dad', content: 'Yes! India is playing well 🏏', timestamp: '8:05 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Haha this is hilarious! Congress doesn\'t know what hit them 😂😂', timestamp: '8:15 PM', type: 'link', linkPreview: { type: 'instagram', contactName: '~Bharatiya Janta Party', title: 'BJP Official', description: 'Another historic win! Congress left fumbling once again 😂🔥 #BJPVictory #CongressFails', thumbnail: 'https://images.unsplash.com/photo-1666244454829-7f0889ec5783', videoLength: '1:23' } },
  { sender: 'Vijay Uncle', content: 'True that! 💪🇮🇳', timestamp: '8:20 PM', type: 'text' },
  { sender: 'Meena', content: 'This message was deleted', timestamp: '9:30 PM', type: 'deleted' },
  { sender: 'Suresh Uncle', content: 'Did anyone see the AQI levels in Delhi today? 450! Absolutely toxic. This is what happens under "development" 🤦‍♂️', timestamp: '11:30 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'And the rupee hit 85 to the dollar. Wow, what amazing economic management! 👏 Our country is really "vikas-ing" na Prem beta?', timestamp: '11:32 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Uncle, you can\'t blame everything on the government. These are global issues', timestamp: '11:35 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Global issues? 😂 Then why does your party take credit when oil prices drop? Can\'t have it both ways beta', timestamp: '11:37 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'At least we\'re trying to develop infrastructure. What did Congress do in 70 years?', timestamp: '11:40 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Oh the famous "70 saal" argument. Very original. Meanwhile people can\'t breathe in their own capital city 🙄', timestamp: '11:42 PM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'This is what happens when people get their education from WhatsApp University. No wonder you don\'t understand basic economics uncle. Maybe if you had proper education you\'d get it', timestamp: '11:45 PM', type: 'text' },
  { sender: 'Suresh Uncle', content: 'Education?? Your so-called PM is the one who\'s uneducated! Entire degree is fake! And you\'re talking to me about education you little s***? F*** you and your b******* party!', timestamp: '11:47 PM', type: 'text' },
  { sender: '', content: 'Dad removed Suresh Uncle', timestamp: '11:48 PM', type: 'system' },
  { sender: 'Mom', content: 'Good morning! Heading to temple now 🙏', timestamp: '5:45 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'On my way! See you there', timestamp: '5:50 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'Good morning everyone. Have a blessed day 🌞', timestamp: '7:00 AM', type: 'text' },
  { sender: 'Mom', content: 'Back from temple. Such a peaceful morning 🙏', timestamp: '7:30 AM', type: 'text' },
  { sender: 'Prem Bhaiyya', content: 'Good morning everyone. I want to apologize for last night. I shouldn\'t have said those things to Suresh uncle. I completely stepped out of line and disrespected an elder. It was wrong of me to behave that way in the heat of the moment. I\'m very sorry to the entire family. 🙏', timestamp: '9:00 AM', type: 'text' },
  { sender: 'Basu Grand Uncle', content: 'It takes courage to apologize Prem. Well done beta', timestamp: '9:05 AM', type: 'text' },
  { sender: '', content: 'Dad added Suresh Uncle', timestamp: '9:15 AM', type: 'system' },
  { sender: 'Suresh Uncle', content: 'I also want to apologize. I lost my temper and used very inappropriate language. That was completely unacceptable. Sorry Prem, sorry everyone. I shouldn\'t have let a political discussion get so heated. We\'re family first. 🙏', timestamp: '9:20 AM', type: 'text' },
  { sender: 'Dad', content: 'Let\'s move past this. We\'re all family here. No more political arguments please 🙏', timestamp: '9:25 AM', type: 'text' },
  { sender: 'Chinni Aunty', content: 'Yes, family is more important than politics ❤️', timestamp: '9:30 AM', type: 'text' },
  { sender: 'You', content: 'Glad everything is sorted 😊', timestamp: '9:35 AM', type: 'text' }
];

// Convert messages to text format preserving all context
function convertMessagesToText(messages) {
  return messages.map(msg => {
    if (msg.type === 'text') {
      return `[${msg.timestamp}] ${msg.sender}: ${msg.content}`;
    } else if (msg.type === 'image') {
      const fwd = msg.isForwarded ? ' (Forwarded)' : '';
      const imageInfo = msg.imageUrl ? ` [Image: ${msg.imageUrl}]` : '';
      return `[${msg.timestamp}] ${msg.sender}:${imageInfo}${fwd}${msg.content ? ' - ' + msg.content : ''}`;
    } else if (msg.type === 'link') {
      const fwd = msg.isForwarded ? ' (Forwarded)' : '';
      const preview = msg.linkPreview;
      if (preview.type === 'product') {
        return `[${msg.timestamp}] ${msg.sender}: [Product Link] ${preview.title} - ${preview.description} - Price: ${preview.price}, Was: ${preview.originalPrice}, Discount: ${preview.discount}, Rating: ${preview.rating}${msg.content ? ' - ' + msg.content : ''}`;
      } else {
        const videoInfo = preview.videoLength ? ` (Video ${preview.videoLength})` : '';
        return `[${msg.timestamp}] ${msg.sender}:${fwd} [${preview.type} Link] ${preview.contactName} - ${preview.title} - ${preview.description}${videoInfo}${msg.content ? ' - ' + msg.content : ''}`;
      }
    } else if (msg.type === 'system') {
      return `[${msg.timestamp}] SYSTEM: ${msg.content}`;
    } else if (msg.type === 'deleted') {
      return `[${msg.timestamp}] ${msg.sender}: [Deleted message]`;
    }
    return '';
  }).join('\n');
}

// Get the WhatsApp messages for the assigned version
function getWhatsAppMessages() {
  const version = parseInt(sessionStorage.getItem('exp2_whatsapp_version') || '1');
  const messagesMap = {
    1: messagesV1,
    2: messagesV2,
    3: messagesV3
  };
  return messagesMap[version] || messagesV1;
}

// Elements
const condition1UI = document.getElementById('condition1-ui');
const condition2UI = document.getElementById('condition2-ui');
const humanOnlyTextarea = document.getElementById('human-only-textarea');
const userPromptInput = document.getElementById('user-prompt');
const generateBtnC2 = document.getElementById('generate-btn-c2');
const submitBtnC2 = document.getElementById('submit-btn-c2');
const loadingC2 = document.getElementById('loading-c2');
const errorMessageC1 = document.getElementById('error-message-c1');
const errorMessageC2 = document.getElementById('error-message-c2');
const aiRulesC2 = document.getElementById('ai-rules-c2');
// Buttons removed - Submit button now handles everything

// State
let currentCondition = null; // Will be randomly assigned
let generatedRulesHistory = []; // Store all generated rules for condition 2
let rulesSubmitted = false; // Track if rules have been submitted

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
  rulesSubmitted = false; // Reset submission state when switching conditions
}

// Randomly assign condition with equal probability (0.5 each)
function assignRandomCondition() {
  const randomCondition = Math.random() < 0.5 ? '1' : '2';
  console.log(`[Condition Assignment] Randomly assigned condition: ${randomCondition === '1' ? 'Human Only' : 'Human + AI'}`);
  return randomCondition;
}

// Check if user can submit
function canSubmit() {
  const hasScrolled = sessionStorage.getItem('exp2_scrolled_to_bottom') === 'true';

  let hasRules = false;
  let hasEnoughWords = false;
  let hasPromptedAI = false;

  if (currentCondition === '1') {
    // Human Only: Check for at least 15 words
    const text = humanOnlyTextarea ? humanOnlyTextarea.value.trim() : '';
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    hasRules = text.length > 0;
    hasEnoughWords = wordCount >= 15;
  } else {
    // Human + AI: Only check if user has prompted AI at least once
    hasPromptedAI = sessionStorage.getItem('exp2_generated_rules') !== null;
    hasRules = hasPromptedAI; // For condition 2, having prompted AI is sufficient
  }

  const canSubmitNow = currentCondition === '1'
    ? (hasScrolled && hasEnoughWords)
    : (hasScrolled && hasPromptedAI);

  return {
    hasScrolled,
    hasRules,
    hasEnoughWords,
    hasPromptedAI,
    canSubmit: canSubmitNow
  };
}

// Update submit button state (visual styling only, button remains clickable)
function updateSubmitButtonState() {
  const submitBtn = currentCondition === '1' ? submitBtnC1 : submitBtnC2;
  if (!submitBtn) return;

  const { canSubmit: canSubmitNow } = canSubmit();

  // Keep button enabled so clicks work, but style it to look disabled
  submitBtn.disabled = false;

  // Update styling based on whether user can submit
  if (!canSubmitNow) {
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.style.background = '#ccc';
  } else {
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.background = '#25D366';
  }
}

// Update requirements indicator in real-time
function updateRequirementsIndicator() {
  const { hasScrolled, hasEnoughWords, hasPromptedAI } = canSubmit();

  if (currentCondition === '1') {
    // Human Only condition
    const reqScrollEl = document.getElementById('req-scroll-c1');
    const reqRulesEl = document.getElementById('req-rules-c1');
    const requirementsEl = document.getElementById('requirements-c1');

    if (reqScrollEl && reqRulesEl && requirementsEl) {
      // Update scroll requirement
      if (hasScrolled) {
        reqScrollEl.classList.add('completed');
      } else {
        reqScrollEl.classList.remove('completed');
      }

      // Update rules requirement
      if (hasEnoughWords) {
        reqRulesEl.classList.add('completed');
      } else {
        reqRulesEl.classList.remove('completed');
      }

      // Update overall indicator
      if (hasScrolled && hasEnoughWords) {
        requirementsEl.classList.add('all-complete');
        requirementsEl.innerHTML = '<span style="font-size: 16px; margin-right: 4px;">✓</span> Ready to submit!';
      } else {
        requirementsEl.classList.remove('all-complete');
      }
    }
  } else {
    // Human + AI condition
    const reqScrollEl = document.getElementById('req-scroll-c2');
    const reqAiEl = document.getElementById('req-ai-c2');
    const requirementsEl = document.getElementById('requirements-c2');

    if (reqScrollEl && reqAiEl && requirementsEl) {
      // Update scroll requirement
      if (hasScrolled) {
        reqScrollEl.classList.add('completed');
      } else {
        reqScrollEl.classList.remove('completed');
      }

      // Update AI prompt requirement
      if (hasPromptedAI) {
        reqAiEl.classList.add('completed');
      } else {
        reqAiEl.classList.remove('completed');
      }

      // Update overall indicator
      if (hasScrolled && hasPromptedAI) {
        requirementsEl.classList.add('all-complete');
        requirementsEl.innerHTML = '<span style="font-size: 16px; margin-right: 4px;">✓</span> Ready to submit!';
      } else {
        requirementsEl.classList.remove('all-complete');
      }
    }
  }
}

// Add input listeners to update submit button state and requirements
if (humanOnlyTextarea) {
  humanOnlyTextarea.addEventListener('input', () => {
    rulesSubmitted = false;
    updateSubmitButtonState();
    updateRequirementsIndicator();
  });
}

if (aiRulesC2) {
  aiRulesC2.addEventListener('input', () => {
    rulesSubmitted = false;
    updateSubmitButtonState();
    updateRequirementsIndicator();
  });
}

if (userPromptInput) {
  userPromptInput.addEventListener('input', () => {
    updateSubmitButtonState();
    updateRequirementsIndicator();
  });
}

// Call Gemini API with full message context
async function callGemini(prompt) {
  const messages = getWhatsAppMessages();
  const messagesContext = convertMessagesToText(messages);

  const fullPrompt = `You are helping create rules for a family WhatsApp group. Below is the full conversation history from the group:

===== WHATSAPP GROUP CONVERSATION =====
${messagesContext}
===== END OF CONVERSATION =====

User's request: ${prompt}

Please provide 3-5 clear, actionable rules based on the user's request and the conversation context above. Format the rules as a numbered list. Consider the group dynamics, issues that arose, and what guidelines would help maintain a healthy group environment.`;

  const resp = await fetch('/webhook3/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      model: 'models/gemini-2.5-pro',
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
  rulesSubmitted = false; // Reset submission when generating new rules

  try {
    const result = await callGemini(userPrompt);
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

    // Update requirements indicator since AI has been prompted
    updateSubmitButtonState();
    updateRequirementsIndicator();

  } catch (error) {
    console.error('Generation error:', error);
    errorMessageC2.textContent = `Error: ${error.message}`;
    errorMessageC2.classList.add('active');
  } finally {
    generateBtnC2.disabled = false;
    loadingC2.classList.remove('active');
  }
});

// Submit button for Condition 2
if (submitBtnC2) {
  submitBtnC2.addEventListener('click', () => {
    const { canSubmit: canSubmitNow } = canSubmit();

    // Check if user can submit
    if (!canSubmitNow) {
      // Requirements indicator already shows what's needed
      return;
    }

    const rules = aiRulesC2.value.trim();
    sessionStorage.setItem('exp2_final_rules', rules);
    sessionStorage.setItem('exp2_timestamp_submit', new Date().toISOString());

    // Visual feedback
    submitBtnC2.textContent = 'Submitting...';
    submitBtnC2.disabled = true;

    // Save to database and navigate to demographics
    saveProgress('write_rules_complete').then(() => {
      window.location.href = 'exp2_demographics.html';
    }).catch((error) => {
      console.error('Error saving progress:', error);
      alert('Failed to save your progress. Please try again.');
      submitBtnC2.textContent = 'Submit and continue';
      submitBtnC2.disabled = false;
    });
  });
}

// Submit button for Condition 1 (if exists)
const submitBtnC1 = document.getElementById('submit-btn-c1');
if (submitBtnC1) {
  submitBtnC1.addEventListener('click', () => {
    const { canSubmit: canSubmitNow } = canSubmit();

    // Check if user can submit
    if (!canSubmitNow) {
      // Requirements indicator already shows what's needed
      return;
    }

    const rules = humanOnlyTextarea.value.trim();
    sessionStorage.setItem('exp2_final_rules', rules);
    sessionStorage.setItem('exp2_timestamp_submit', new Date().toISOString());

    // Visual feedback
    submitBtnC1.textContent = 'Submitting...';
    submitBtnC1.disabled = true;

    // Save to database and navigate to demographics
    saveProgress('write_rules_complete').then(() => {
      window.location.href = 'exp2_demographics.html';
    }).catch((error) => {
      console.error('Error saving progress:', error);
      alert('Failed to save your progress. Please try again.');
      submitBtnC1.textContent = 'Submit and continue';
      submitBtnC1.disabled = false;
    });
  });
}


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
        label: whatsappVersionLabel,
        scrolledToBottom: sessionStorage.getItem('exp2_scrolled_to_bottom') === 'true',
        scrolledToBottomTimestamp: sessionStorage.getItem('exp2_scrolled_to_bottom_timestamp') || null
      },
      condition: currentCondition,
      rules: {
        userPrompt: sessionStorage.getItem('exp2_user_prompt') || null,
        generatedRules: sessionStorage.getItem('exp2_generated_rules') || null,
        finalRules: sessionStorage.getItem('exp2_final_rules') || (currentCondition === '1' ? humanOnlyTextarea.value.trim() : aiRulesC2.value.trim()),
        generationHistory: currentCondition === '2' ? generatedRulesHistory : null
      },
      timestamps: {
        writeRulesSubmitted: pageName === 'write_rules_submitted' ? new Date().toISOString() : (sessionStorage.getItem('exp2_timestamp_submit') || null),
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
    // User has already been assigned a condition, restore it
    currentCondition = savedCondition;
    if (savedCondition === '1') {
      const savedRules = sessionStorage.getItem('exp2_final_rules');
      if (savedRules) {
        humanOnlyTextarea.value = savedRules;
        rulesSubmitted = true; // Assume previously saved means submitted
      }
    } else {
      const savedPrompt = sessionStorage.getItem('exp2_user_prompt');
      const savedGenerated = sessionStorage.getItem('exp2_generated_rules');
      const savedFinal = sessionStorage.getItem('exp2_final_rules');

      if (savedPrompt) userPromptInput.value = savedPrompt;
      if (savedGenerated) aiRulesC2.value = savedGenerated;
      if (savedFinal) {
        aiRulesC2.value = savedFinal;
        rulesSubmitted = true; // Assume previously saved means submitted
      }
    }
    switchCondition(savedCondition);
  } else {
    // First time visitor: randomly assign condition with equal probability
    const assignedCondition = assignRandomCondition();
    switchCondition(assignedCondition);
  }

  // Disable paste in specific textareas
  // Condition 1 (Human Only): disable paste in the rules textarea
  if (humanOnlyTextarea) {
    humanOnlyTextarea.addEventListener('paste', (e) => {
      e.preventDefault();
      console.log('[Paste Prevention] Paste disabled in Human Only textarea');
    });
  }

  // Condition 2 (Human + AI): disable paste in the prompt textarea only
  // (paste is allowed in ai-rules-c2 for editing)
  if (userPromptInput) {
    userPromptInput.addEventListener('paste', (e) => {
      e.preventDefault();
      console.log('[Paste Prevention] Paste disabled in prompt textarea');
    });
  }

  // Initialize submit button state and requirements indicator
  updateSubmitButtonState();
  updateRequirementsIndicator();
});

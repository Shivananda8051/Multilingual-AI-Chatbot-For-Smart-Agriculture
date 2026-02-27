// Utility functions for the server

/**
 * Format phone number to standard format
 */
exports.formatPhone = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  return phone;
};

/**
 * Generate a random OTP
 */
exports.generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Paginate results
 */
exports.paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
};

/**
 * Create pagination response
 */
exports.paginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
};

/**
 * Sanitize user object for response
 */
exports.sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.otp;
  delete userObj.__v;
  return userObj;
};

/**
 * Extract hashtags from text
 */
exports.extractHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  if (!matches) return [];
  return matches.map(tag => tag.slice(1).toLowerCase());
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Sleep/delay utility
 */
exports.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate email format
 */
exports.isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone format (Indian)
 */
exports.isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith('91'));
};

/**
 * Common error messages in multiple languages
 */
const errorMessages = {
  // General errors
  'Server error': {
    en: 'Server error',
    hi: 'सर्वर त्रुटि',
    ta: 'சர்வர் பிழை',
    te: 'సర్వర్ లోపం',
    kn: 'ಸರ್ವರ್ ದೋಷ',
    ml: 'സെർവർ പിശക്',
    bn: 'সার্ভার ত্রুটি',
    mr: 'सर्व्हर त्रुटी'
  },
  'Not found': {
    en: 'Not found',
    hi: 'नहीं मिला',
    ta: 'கண்டுபிடிக்கப்படவில்லை',
    te: 'కనుగొనబడలేదు',
    kn: 'ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'കണ്ടെത്തിയില്ല',
    bn: 'পাওয়া যায়নি',
    mr: 'सापडले नाही'
  },
  'Unauthorized': {
    en: 'Unauthorized',
    hi: 'अनधिकृत',
    ta: 'அங்கீகரிக்கப்படவில்லை',
    te: 'అనధికారం',
    kn: 'ಅನಧಿಕೃತ',
    ml: 'അനധികൃതം',
    bn: 'অননুমোদিত',
    mr: 'अनधिकृत'
  },
  'Access denied': {
    en: 'Access denied',
    hi: 'पहुंच अस्वीकृत',
    ta: 'அணுகல் மறுக்கப்பட்டது',
    te: 'యాక్సెస్ నిరాకరించబడింది',
    kn: 'ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ',
    ml: 'പ്രവേശനം നിരസിച്ചു',
    bn: 'অ্যাক্সেস অস্বীকৃত',
    mr: 'प्रवेश नाकारला'
  },

  // Auth errors
  'Invalid credentials': {
    en: 'Invalid credentials',
    hi: 'अमान्य क्रेडेंशियल्स',
    ta: 'தவறான சான்றுகள்',
    te: 'చెల్లని ఆధారాలు',
    kn: 'ಅಮಾನ್ಯ ರುಜುವಾತುಗಳು',
    ml: 'അസാധുവായ ക്രെഡൻഷ്യലുകൾ',
    bn: 'অবৈধ শংসাপত্র',
    mr: 'अवैध क्रेडेंशियल्स'
  },
  'User not found': {
    en: 'User not found',
    hi: 'उपयोगकर्ता नहीं मिला',
    ta: 'பயனர் கண்டுபிடிக்கப்படவில்லை',
    te: 'వినియోగదారు కనుగొనబడలేదు',
    kn: 'ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല',
    bn: 'ব্যবহারকারী পাওয়া যায়নি',
    mr: 'वापरकर्ता सापडला नाही'
  },
  'Invalid OTP': {
    en: 'Invalid OTP',
    hi: 'अमान्य OTP',
    ta: 'தவறான OTP',
    te: 'చెల్లని OTP',
    kn: 'ಅಮಾನ್ಯ OTP',
    ml: 'അസാധുവായ OTP',
    bn: 'অবৈধ OTP',
    mr: 'अवैध OTP'
  },
  'OTP expired': {
    en: 'OTP expired',
    hi: 'OTP समाप्त हो गया',
    ta: 'OTP காலாவதியானது',
    te: 'OTP గడువు ముగిసింది',
    kn: 'OTP ಅವಧಿ ಮುಗಿದಿದೆ',
    ml: 'OTP കാലഹരണപ്പെട്ടു',
    bn: 'OTP মেয়াদ শেষ',
    mr: 'OTP कालबाह्य'
  },

  // Post/Comment errors
  'Post not found': {
    en: 'Post not found',
    hi: 'पोस्ट नहीं मिला',
    ta: 'பதிவு கண்டுபிடிக்கப்படவில்லை',
    te: 'పోస్ట్ కనుగొనబడలేదు',
    kn: 'ಪೋಸ್ಟ್ ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'പോസ്റ്റ് കണ്ടെത്തിയില്ല',
    bn: 'পোস্ট পাওয়া যায়নি',
    mr: 'पोस्ट सापडला नाही'
  },
  'Comment not found': {
    en: 'Comment not found',
    hi: 'टिप्पणी नहीं मिली',
    ta: 'கருத்து கண்டுபிடிக்கப்படவில்லை',
    te: 'వ్యాఖ్య కనుగొనబడలేదు',
    kn: 'ಕಾಮೆಂಟ್ ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'കമന്റ് കണ്ടെത്തിയില്ല',
    bn: 'মন্তব্য পাওয়া যায়নি',
    mr: 'टिप्पणी सापडली नाही'
  },
  'Failed to create post': {
    en: 'Failed to create post',
    hi: 'पोस्ट बनाने में विफल',
    ta: 'பதிவை உருவாக்க முடியவில்லை',
    te: 'పోస్ట్ సృష్టించడంలో విఫలమైంది',
    kn: 'ಪೋಸ್ಟ್ ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ',
    ml: 'പോസ്റ്റ് സൃഷ്ടിക്കുന്നതിൽ പരാജയപ്പെട്ടു',
    bn: 'পোস্ট তৈরি করতে ব্যর্থ',
    mr: 'पोस्ट तयार करण्यात अयशस्वी'
  },

  // IoT errors
  'Device not found': {
    en: 'Device not found',
    hi: 'डिवाइस नहीं मिला',
    ta: 'சாதனம் கண்டுபிடிக்கப்படவில்லை',
    te: 'పరికరం కనుగొనబడలేదు',
    kn: 'ಸಾಧನ ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'ഉപകരണം കണ്ടെത്തിയില്ല',
    bn: 'ডিভাইস পাওয়া যায়নি',
    mr: 'डिव्हाइस सापडले नाही'
  },
  'Failed to get sensor data': {
    en: 'Failed to get sensor data',
    hi: 'सेंसर डेटा प्राप्त करने में विफल',
    ta: 'சென்சார் தரவை பெற முடியவில்லை',
    te: 'సెన్సార్ డేటా పొందడంలో విఫలమైంది',
    kn: 'ಸೆನ್ಸಾರ್ ಡೇಟಾ ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ',
    ml: 'സെൻസർ ഡാറ്റ ലഭിക്കുന്നതിൽ പരാജയപ്പെട്ടു',
    bn: 'সেন্সর ডেটা পেতে ব্যর্থ',
    mr: 'सेन्सर डेटा मिळवण्यात अयशस्वी'
  },

  // Weather errors
  'Failed to get weather data': {
    en: 'Failed to get weather data',
    hi: 'मौसम डेटा प्राप्त करने में विफल',
    ta: 'வானிலை தரவை பெற முடியவில்லை',
    te: 'వాతావరణ డేటా పొందడంలో విఫలమైంది',
    kn: 'ಹವಾಮಾನ ಡೇಟಾ ಪಡೆಯಲು ವಿಫಲವಾಗಿದೆ',
    ml: 'കാലാവസ്ഥ ഡാറ്റ ലഭിക്കുന്നതിൽ പരാജയപ്പെട്ടു',
    bn: 'আবহাওয়া ডেটা পেতে ব্যর্থ',
    mr: 'हवामान डेटा मिळवण्यात अयशस्वी'
  },

  // Notification errors
  'Notification not found': {
    en: 'Notification not found',
    hi: 'सूचना नहीं मिली',
    ta: 'அறிவிப்பு கண்டுபிடிக்கப்படவில்லை',
    te: 'నోటిఫికేషన్ కనుగొనబడలేదు',
    kn: 'ಅಧಿಸೂಚನೆ ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'അറിയിപ്പ് കണ്ടെത്തിയില്ല',
    bn: 'বিজ্ঞপ্তি পাওয়া যায়নি',
    mr: 'सूचना सापडली नाही'
  },

  // Reel errors
  'Reel not found': {
    en: 'Reel not found',
    hi: 'रील नहीं मिला',
    ta: 'ரீல் கண்டுபிடிக்கப்படவில்லை',
    te: 'రీల్ కనుగొనబడలేదు',
    kn: 'ರೀಲ್ ಕಂಡುಬಂದಿಲ್ಲ',
    ml: 'റീൽ കണ്ടെത്തിയില്ല',
    bn: 'রিল পাওয়া যায়নি',
    mr: 'रील सापडले नाही'
  },

  // Disease detection errors
  'Failed to analyze image': {
    en: 'Failed to analyze image',
    hi: 'छवि विश्लेषण में विफल',
    ta: 'படத்தை பகுப்பாய்வு செய்ய முடியவில்லை',
    te: 'చిత్రాన్ని విశ్లేషించడంలో విఫలమైంది',
    kn: 'ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಲು ವಿಫಲವಾಗಿದೆ',
    ml: 'ചിത്രം വിശകലനം ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു',
    bn: 'ছবি বিশ্লেষণে ব্যর্থ',
    mr: 'प्रतिमा विश्लेषणात अयशस्वी'
  },

  // Success messages
  'Success': {
    en: 'Success',
    hi: 'सफलता',
    ta: 'வெற்றி',
    te: 'విజయం',
    kn: 'ಯಶಸ್ವಿ',
    ml: 'വിജയം',
    bn: 'সাফল্য',
    mr: 'यशस्वी'
  },
  'Deleted successfully': {
    en: 'Deleted successfully',
    hi: 'सफलतापूर्वक हटाया गया',
    ta: 'வெற்றிகரமாக நீக்கப்பட்டது',
    te: 'విజయవంతంగా తొలగించబడింది',
    kn: 'ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ',
    ml: 'വിജയകരമായി ഇല്ലാതാക്കി',
    bn: 'সফলভাবে মুছে ফেলা হয়েছে',
    mr: 'यशस्वीपणे हटवले'
  }
};

/**
 * Get translated error message
 * @param {string} message - The error message key
 * @param {string} language - Target language code (default: 'en')
 * @returns {string} Translated message or original if not found
 */
exports.getTranslatedError = (message, language = 'en') => {
  if (errorMessages[message] && errorMessages[message][language]) {
    return errorMessages[message][language];
  }
  // Return the original message if translation not found
  return message;
};

/**
 * Create translated response helper
 * @param {object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {boolean} success - Success flag
 * @param {string} message - Message key to translate
 * @param {string} language - Target language code
 * @param {object} data - Additional data to include
 */
exports.sendTranslatedResponse = (res, status, success, message, language = 'en', data = {}) => {
  return res.status(status).json({
    success,
    message: exports.getTranslatedError(message, language),
    ...data
  });
};

/**
 * Get all error messages (for client-side use)
 */
exports.getAllErrorMessages = () => errorMessages;

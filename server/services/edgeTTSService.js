const https = require('https');
const { v4: uuidv4 } = require('uuid');

class EdgeTTSService {
  constructor() {
    // Microsoft Edge Neural Voices for Indian Languages (FREE)
    this.voices = {
      en: 'en-IN-NeerjaNeural',
      hi: 'hi-IN-SwaraNeural',
      ta: 'ta-IN-PallaviNeural',
      te: 'te-IN-ShrutiNeural',
      kn: 'kn-IN-SapnaNeural',
      ml: 'ml-IN-SobhanaNeural',
      bn: 'bn-IN-TanishaaNeural',
      mr: 'mr-IN-AarohiNeural',
      gu: 'gu-IN-DhwaniNeural',
    };
  }

  /**
   * Get auth token from Azure cognitive services (free tier)
   */
  async getToken() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'azure.microsoft.com',
        path: '/en-us/services/cognitive-services/text-to-speech/',
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        }
      };

      const req = https.request(options, (res) => {
        resolve('free-tier');
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Convert text to speech using Google Translate TTS (FREE fallback)
   */
  async textToSpeech(text, language = 'en') {
    const voice = this.voices[language] || this.voices['en'];
    const langCode = this.getLangCode(language);

    console.log(`TTS - Language: ${language}, Voice: ${voice}, Text length: ${text.length}`);

    // Use Google Translate TTS as free fallback
    return this.googleTTS(text, langCode);
  }

  /**
   * Google Translate TTS (FREE, unlimited)
   */
  googleTTS(text, lang) {
    return new Promise((resolve, reject) => {
      // Split text into chunks (Google TTS has 200 char limit per request)
      const chunks = this.splitText(text, 200);
      const audioBuffers = [];
      let completed = 0;

      const processChunk = (index) => {
        if (index >= chunks.length) {
          resolve(Buffer.concat(audioBuffers));
          return;
        }

        const chunk = encodeURIComponent(chunks[index]);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${chunk}`;

        https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://translate.google.com/'
          }
        }, (res) => {
          if (res.statusCode === 302 || res.statusCode === 301) {
            // Follow redirect
            https.get(res.headers.location, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://translate.google.com/'
              }
            }, (res2) => {
              const data = [];
              res2.on('data', chunk => data.push(chunk));
              res2.on('end', () => {
                audioBuffers[index] = Buffer.concat(data);
                completed++;
                processChunk(index + 1);
              });
            }).on('error', reject);
          } else if (res.statusCode === 200) {
            const data = [];
            res.on('data', chunk => data.push(chunk));
            res.on('end', () => {
              audioBuffers[index] = Buffer.concat(data);
              completed++;
              processChunk(index + 1);
            });
          } else {
            reject(new Error(`TTS failed: ${res.statusCode}`));
          }
        }).on('error', reject);
      };

      processChunk(0);
    });
  }

  splitText(text, maxLength) {
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        // If single sentence is too long, split by words
        if (sentence.length > maxLength) {
          const words = sentence.split(' ');
          currentChunk = '';
          for (const word of words) {
            if ((currentChunk + ' ' + word).length <= maxLength) {
              currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  getLangCode(lang) {
    const codes = {
      en: 'en-IN',
      hi: 'hi',
      ta: 'ta',
      te: 'te',
      kn: 'kn',
      ml: 'ml',
      bn: 'bn',
      mr: 'mr',
      gu: 'gu'
    };
    return codes[lang] || 'en';
  }

  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  getAvailableVoices() {
    return Object.entries(this.voices).map(([lang, voice]) => ({
      language: lang,
      voice: voice,
      name: this.getLanguageName(lang)
    }));
  }

  getLanguageName(code) {
    const names = {
      en: 'English (India)',
      hi: 'Hindi',
      ta: 'Tamil',
      te: 'Telugu',
      kn: 'Kannada',
      ml: 'Malayalam',
      bn: 'Bengali',
      mr: 'Marathi',
      gu: 'Gujarati'
    };
    return names[code] || code;
  }
}

module.exports = new EdgeTTSService();

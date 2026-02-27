const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

class ElevenLabsService {
  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';
    this.modelId = 'eleven_multilingual_v2';

    // ElevenLabs eleven_multilingual_v2 supported Indian languages: Hindi, Tamil only
    // For unsupported languages, we'll use Hindi voice (closest match)
    this.languageVoices = {
      en: null,  // Use default English voice
      hi: null,  // Hindi - supported natively
      ta: null,  // Tamil - supported natively
      te: null,  // Telugu - will use Hindi
      kn: null,  // Kannada - will use Hindi
      ml: null,  // Malayalam - will use Hindi
      bn: null,  // Bengali - will use Hindi
      mr: null   // Marathi - will use Hindi (very similar)
    };

    // Languages not natively supported - will speak but with Hindi accent
    this.unsupportedLanguages = ['te', 'kn', 'ml', 'bn', 'mr'];
  }

  /**
   * Convert text to speech and return audio buffer
   * @param {string} text - Text to convert to speech
   * @param {string} voiceId - Optional voice ID (defaults to configured voice)
   * @param {string} language - Language code for better pronunciation
   * @returns {Promise<Buffer>} Audio buffer in MP3 format
   */
  async textToSpeech(text, voiceId = null, language = 'en') {
    try {
      // Use default voice for all (eleven_multilingual_v2 auto-detects from text)
      const effectiveVoiceId = voiceId || this.defaultVoiceId;

      // Log warning for unsupported languages
      if (this.unsupportedLanguages.includes(language)) {
        console.log(`TTS Warning: ${language} not natively supported, using phonetic reading`);
      }

      console.log(`TTS Request - Language: ${language}, Voice: ${effectiveVoiceId}, TextLength: ${text.length}`);

      const audio = await this.client.textToSpeech.convert(
        effectiveVoiceId,
        {
          text: text,
          model_id: this.modelId, // eleven_multilingual_v2 auto-detects language from script
          output_format: 'mp3_44100_128'
        }
      );

      // Convert the audio stream to a buffer
      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error.message);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>} List of available voices
   */
  async getVoices() {
    try {
      const voices = await this.client.voices.getAll();
      return voices.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description
      }));
    } catch (error) {
      console.error('Failed to get voices:', error.message);
      throw new Error('Failed to fetch available voices');
    }
  }
}

module.exports = new ElevenLabsService();

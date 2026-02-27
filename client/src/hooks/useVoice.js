import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ttsAPI } from '../services/api';
import toast from 'react-hot-toast';

// Language codes for Web Speech API (for speech recognition)
const speechLanguageCodes = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN'
};

// Clean text for natural TTS output (Siri-like fluency)
const cleanTextForSpeech = (text) => {
  return text
    // Remove markdown bold/italic formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1')      // *italic* -> italic
    .replace(/__([^_]+)__/g, '$1')      // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1')        // _italic_ -> italic
    // Remove markdown headers
    .replace(/^#{1,6}\s*/gm, '')
    // Remove markdown code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove bullet points and list markers
    .replace(/^[\s]*[-*•]\s*/gm, '')
    .replace(/^[\s]*\d+\.\s*/gm, '')
    // Convert special punctuation to natural pauses (not spoken)
    .replace(/[–—]/g, ', ')
    .replace(/\.{3,}/g, ', ')  // ... -> pause
    // Remove characters that might be read aloud
    .replace(/[#`~^|\\<>{}[\]]/g, '')
    // Clean colons that aren't time (e.g., 10:30)
    .replace(/:\s*$/gm, '.')  // trailing colon -> period
    .replace(/:\s+/g, '. ')   // colon with space -> period
    // Clean up emojis
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{2300}-\u{23FF}]/gu, '')
    // Clean parentheses content (often not needed for speech)
    .replace(/\([^)]*\)/g, '')
    // Normalize quotes
    .replace(/["'"']/g, '')
    // Clean up multiple punctuation
    .replace(/([.!?])\1+/g, '$1')
    // Clean up multiple spaces and newlines
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const useVoice = () => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = speechLanguageCodes[language] || 'en-IN';

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        setTranscript(transcriptText);
        setMicError(null);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setMicError(event.error);

        // Show user-friendly error messages
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            toast.error('Microphone permission denied. Please allow microphone access in your browser settings.');
            break;
          case 'no-speech':
            toast.error('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            toast.error('No microphone found. Please connect a microphone.');
            break;
          case 'network':
            toast.error('Network error. Please check your internet connection.');
            break;
          case 'aborted':
            // User cancelled, no need to show error
            break;
          default:
            toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognitionInstance;
    } else {
      setIsSupported(false);
      console.warn('Speech Recognition API not supported in this browser');
    }
  }, [language]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecureContext) {
      toast.error('Microphone requires HTTPS. Please use localhost or enable HTTPS.', {
        duration: 5000
      });
      console.error('Microphone access requires secure context (HTTPS)');
      return;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Microphone not supported on this device/browser');
      return;
    }

    // Request microphone permission first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Microphone permission denied. Please allow microphone access in browser settings.', {
          duration: 5000
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else if (err.name === 'NotSupportedError') {
        toast.error('Microphone not supported. Make sure you\'re using HTTPS.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error('Microphone is being used by another app. Please close other apps using the mic.');
      } else {
        toast.error(`Microphone error: ${err.message || err.name}`);
      }
      return;
    }

    try {
      setTranscript('');
      setMicError(null);
      recognition.lang = speechLanguageCodes[language] || 'en-IN';
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      if (err.message?.includes('already started')) {
        // Recognition already running, try to stop and restart
        recognition.stop();
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            toast.error('Failed to start voice input. Please try again.');
          }
        }, 100);
      } else {
        toast.error('Failed to start voice input. Please try again.');
      }
    }
  }, [isListening, language]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setIsListening(false);
    }
  }, [isListening]);

  // Edge TTS - Free Microsoft Neural Voices for all Indian languages
  const speak = useCallback(async (text, onStart = null, onEnd = null) => {
    if (!text || text.trim().length === 0) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clean up previous audio URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    // Also stop browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Clean the text for better speech output
    const cleanedText = cleanTextForSpeech(text);

    // Limit text length
    const truncatedText = cleanedText.substring(0, 5000);

    setIsLoading(true);
    setIsSpeaking(true);
    onStart?.();

    try {
      // Call Edge TTS API (FREE - supports all Indian languages)
      const audioBlob = await ttsAPI.speak(truncatedText, language);

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        onEnd?.();
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setIsLoading(false);
        onEnd?.();
      };

      audio.oncanplaythrough = () => {
        setIsLoading(false);
      };

      await audio.play();
    } catch (error) {
      console.error('Edge TTS error, using browser fallback:', error);
      // Fallback to browser TTS if network fails
      fallbackSpeak(truncatedText, onStart, onEnd);
    }
  }, [language]);

  // Fallback to browser's speech synthesis
  const fallbackSpeak = useCallback((text, onStart = null, onEnd = null) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      setIsSpeaking(false);
      setIsLoading(false);
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsLoading(true);
    onStart?.();

    const speakWithVoice = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = speechLanguageCodes[language] || 'en-IN';
      utterance.lang = langCode;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let matchingVoice = null;

      // 1. Exact match
      matchingVoice = voices.find(voice => voice.lang === langCode);

      // 2. Partial match
      if (!matchingVoice) {
        matchingVoice = voices.find(voice =>
          voice.lang.startsWith(language + '-') || voice.lang === language
        );
      }

      // 3. Try Google/Microsoft voices by name
      if (!matchingVoice) {
        const langNames = {
          kn: 'kannada', te: 'telugu', ml: 'malayalam',
          bn: 'bengali', mr: 'marathi', hi: 'hindi', ta: 'tamil'
        };
        const langName = langNames[language];
        if (langName) {
          matchingVoice = voices.find(voice =>
            voice.name.toLowerCase().includes(langName)
          );
        }
      }

      // 4. LAST RESORT: Use any English voice if no match found
      if (!matchingVoice) {
        matchingVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        console.log(`No ${langCode} voice found, using English: ${matchingVoice?.name}`);
      }

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsLoading(false);
        onEnd?.();
      };
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsSpeaking(false);
        setIsLoading(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakWithVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => speakWithVoice();
      setTimeout(() => speakWithVoice(), 200);
    }
  }, [language]);

  const stopSpeaking = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Also stop browser TTS if it was used as fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isLoading,
    transcript,
    isSupported,
    micError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setTranscript
  };
};

export default useVoice;

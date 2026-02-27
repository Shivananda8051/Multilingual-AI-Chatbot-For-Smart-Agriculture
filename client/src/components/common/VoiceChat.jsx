import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX } from 'react-icons/hi';
import { voiceChatAPI, ttsAPI } from '../../services/api';

// Language detection from speech recognition
const detectLanguageCode = (langCode) => {
  // Map speech recognition language codes to our app codes
  const langMap = {
    'en': 'en', 'en-IN': 'en', 'en-US': 'en', 'en-GB': 'en',
    'hi': 'hi', 'hi-IN': 'hi',
    'ta': 'ta', 'ta-IN': 'ta',
    'te': 'te', 'te-IN': 'te',
    'kn': 'kn', 'kn-IN': 'kn',
    'ml': 'ml', 'ml-IN': 'ml',
    'bn': 'bn', 'bn-IN': 'bn',
    'mr': 'mr', 'mr-IN': 'mr'
  };
  return langMap[langCode] || 'en';
};

// Clean text for TTS
const cleanTextForSpeech = (text) => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/^[\s]*[-*•]\s*/gm, '')
    .replace(/^[\s]*\d+\.\s*/gm, '')
    .replace(/[#`~^|\\<>{}[\]]/g, '')
    .replace(/:\s+/g, '. ')
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/["'"']/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};

const VoiceChat = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, listening, thinking, speaking
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (e) {}
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current = null;
      } catch (e) {}
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setStatus('idle');
    setTranscript('');
    setResponse('');
    isProcessingRef.current = false;
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    // Cleanup when closed
    if (!isOpen) {
      cleanup();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      // Only process if still open
      if (!isOpen) return;

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          if (result[0].lang) {
            setDetectedLanguage(detectLanguageCode(result[0].lang));
          }
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        if (!isProcessingRef.current) {
          handleUserInput(finalTranscript);
        }
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
        setStatus('listening');
        if (audioRef.current && status === 'speaking') {
          audioRef.current.pause();
          audioRef.current = null;
          setStatus('listening');
        }
      }
    };

    recognition.onerror = (event) => {
      if (!isOpen) return;
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setTimeout(() => {
          if (isOpen && recognitionRef.current && status !== 'speaking' && status !== 'thinking') {
            startListening();
          }
        }, 100);
      } else if (event.error !== 'aborted') {
        setError(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isOpen && recognitionRef.current && status !== 'speaking' && status !== 'thinking' && !isProcessingRef.current) {
        setTimeout(() => startListening(), 100);
      }
    };

    recognitionRef.current = recognition;
    startListening();

    // Cleanup on unmount or when isOpen changes
    return cleanup;
  }, [isOpen, cleanup]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && status !== 'speaking' && status !== 'thinking') {
      try {
        recognitionRef.current.start();
        setStatus('listening');
        setTranscript('');
        setError(null);
      } catch (e) {
        // Already started
      }
    }
  }, [status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  const handleUserInput = async (text) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    stopListening();
    setStatus('thinking');
    setResponse('');

    try {
      // Detect language from text (simple heuristic based on script)
      const lang = detectLanguageFromText(text);
      setDetectedLanguage(lang);

      // Send to AI (Groq for faster response)
      const apiResponse = await voiceChatAPI.sendMessage(text, lang);
      const aiMessage = apiResponse.data.message.content;
      setResponse(aiMessage);

      // Speak the response
      setStatus('speaking');
      await speakResponse(aiMessage, lang);

    } catch (err) {
      console.error('AI response error:', err);
      setError('Failed to get response');
      setStatus('listening');
    } finally {
      isProcessingRef.current = false;
      // Resume listening after speaking
      if (isOpen) {
        setTimeout(() => startListening(), 500);
      }
    }
  };

  const detectLanguageFromText = (text) => {
    // Detect based on Unicode script ranges
    const scripts = {
      tamil: /[\u0B80-\u0BFF]/,
      telugu: /[\u0C00-\u0C7F]/,
      kannada: /[\u0C80-\u0CFF]/,
      malayalam: /[\u0D00-\u0D7F]/,
      bengali: /[\u0980-\u09FF]/,
      devanagari: /[\u0900-\u097F]/, // Hindi, Marathi
    };

    if (scripts.tamil.test(text)) return 'ta';
    if (scripts.telugu.test(text)) return 'te';
    if (scripts.kannada.test(text)) return 'kn';
    if (scripts.malayalam.test(text)) return 'ml';
    if (scripts.bengali.test(text)) return 'bn';
    if (scripts.devanagari.test(text)) {
      // Could be Hindi or Marathi - default to Hindi
      return 'hi';
    }
    return 'en';
  };

  // Browser TTS fallback
  const browserSpeak = (text, language) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const langCodes = {
        en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
        kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', mr: 'mr-IN'
      };
      utterance.lang = langCodes[language] || 'en-IN';
      utterance.rate = 0.9;

      // Try to find matching voice
      const voices = window.speechSynthesis.getVoices();
      let matchingVoice = voices.find(v => v.lang === utterance.lang);

      if (!matchingVoice) {
        matchingVoice = voices.find(v => v.lang.startsWith(language));
      }

      // Last resort: use English voice
      if (!matchingVoice) {
        matchingVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }

      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onend = resolve;
      utterance.onerror = resolve;

      window.speechSynthesis.speak(utterance);
    });
  };

  const speakResponse = async (text, language) => {
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      setStatus('listening');
      startListening();
      return;
    }

    // Use Edge TTS (FREE - supports all Indian languages)
    try {
      const audioBlob = await ttsAPI.speak(cleanedText.substring(0, 5000), language);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus('listening');
        audioRef.current = null;
        if (isOpen) startListening();
      };

      audio.onerror = async () => {
        // Fallback to browser TTS if network fails
        console.log('Edge TTS playback failed, using browser TTS');
        await browserSpeak(cleanedText, language);
        setStatus('listening');
        if (isOpen) startListening();
      };

      await audio.play();
    } catch (err) {
      console.error('Edge TTS error, falling back to browser:', err);
      try {
        await browserSpeak(cleanedText, language);
      } catch (e) {
        console.error('Browser TTS also failed:', e);
      }
      setStatus('listening');
      if (isOpen) startListening();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  // Interrupt: Stop speaking when user taps
  const handleInterrupt = () => {
    if (status === 'speaking' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setStatus('listening');
      startListening();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col"
        onClick={handleInterrupt}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">

          {/* Animated Visual */}
          <div className="relative w-48 h-48 mb-8">
            {/* Outer Glow */}
            {(status === 'listening' || status === 'speaking') && (
              <>
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.1, 0.2],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute inset-0 rounded-full ${
                    status === 'speaking'
                      ? 'bg-gradient-to-r from-green-500/30 to-blue-500/30'
                      : 'bg-gradient-to-r from-primary-500/30 to-purple-500/30'
                  }`}
                />
                <motion.div
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.15, 0.05, 0.15],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
                  className="absolute inset-0 rounded-full bg-white/10"
                />
              </>
            )}

            {/* Main Circle */}
            <motion.div
              animate={
                status === 'speaking'
                  ? { scale: [1, 1.05, 1, 1.08, 1] }
                  : status === 'listening'
                  ? { scale: [1, 1.02, 1] }
                  : { scale: 1 }
              }
              transition={{
                duration: status === 'speaking' ? 0.8 : 1.5,
                repeat: Infinity,
              }}
              className={`relative w-full h-full rounded-full flex items-center justify-center ${
                status === 'speaking'
                  ? 'bg-gradient-to-br from-green-500 to-blue-600'
                  : status === 'thinking'
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                  : 'bg-gradient-to-br from-primary-500 to-purple-600'
              }`}
            >
              {/* Wave Bars */}
              <div className="flex items-center gap-1">
                {status === 'speaking' ? (
                  // Speaking waves - more active
                  [...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [12, 32, 12, 40, 12],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-2 bg-white rounded-full"
                    />
                  ))
                ) : status === 'listening' ? (
                  // Listening dots - subtle pulse
                  [...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [8, 16, 8],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                      className="w-2 bg-white rounded-full"
                    />
                  ))
                ) : status === 'thinking' ? (
                  // Thinking - rotating dots
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  // Idle - static dots
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white/50 rounded-full" />
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Status Text */}
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <p className="text-white text-xl font-medium">
              {status === 'listening' && 'Listening...'}
              {status === 'thinking' && 'Thinking...'}
              {status === 'speaking' && 'Speaking...'}
              {status === 'idle' && 'Tap to start'}
            </p>
            <p className="text-white/50 text-sm mt-1">
              {status === 'speaking' && 'Tap anywhere to interrupt'}
              {status === 'listening' && 'Speak in any language'}
            </p>
          </motion.div>

          {/* Transcript / Response Display */}
          <div className="w-full max-w-md px-4">
            {transcript && status === 'listening' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/10 rounded-2xl p-4 mb-4"
              >
                <p className="text-white/70 text-sm mb-1">You said:</p>
                <p className="text-white">{transcript}</p>
              </motion.div>
            )}

            {response && (status === 'speaking' || status === 'listening') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-primary-500/20 rounded-2xl p-4 max-h-48 overflow-y-auto"
              >
                <p className="text-primary-300 text-sm mb-1">AgriBot:</p>
                <p className="text-white text-sm">{response.substring(0, 300)}{response.length > 300 ? '...' : ''}</p>
              </motion.div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 mt-4"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Bottom Hint */}
        <div className="pb-8 text-center">
          <p className="text-white/30 text-sm">
            Language: {detectedLanguage.toUpperCase()} • Tap X to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceChat;

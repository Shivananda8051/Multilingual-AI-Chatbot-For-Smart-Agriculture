import { useCallback } from 'react';

const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

// Persistent AudioContext (survives after user interaction)
let audioContext = null;
let audioBuffer = null;
let isUnlocked = false;
let html5Audio = null;

// Pre-load HTML5 Audio element for faster playback
const preloadHtml5Audio = () => {
  if (!html5Audio && typeof Audio !== 'undefined') {
    html5Audio = new Audio(NOTIFICATION_SOUND_URL);
    html5Audio.volume = 0.7;
    html5Audio.preload = 'auto';
    // Try to load it
    html5Audio.load();
  }
};

// Initialize and unlock AudioContext
const initAudioContext = async () => {
  if (audioContext && isUnlocked) return true;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    // Create or resume context
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Load the MP3 file into a buffer (only once)
    if (!audioBuffer) {
      try {
        const response = await fetch(NOTIFICATION_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Notification sound buffer loaded');
      } catch (e) {
        console.warn('Failed to load sound buffer:', e.message);
      }
    }

    isUnlocked = true;
    console.log('AudioContext unlocked');
    return true;
  } catch (error) {
    console.warn('Failed to init AudioContext:', error.message);
    return false;
  }
};

// Play sound using the persistent AudioContext
const playSoundBuffer = async () => {
  try {
    if (!audioContext || !audioBuffer) {
      console.warn('AudioContext or buffer not ready');
      return false;
    }

    // Resume if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create a new source for each play
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.7;

    source.start(0);
    console.log('Notification sound played via AudioContext');
    return true;
  } catch (error) {
    console.warn('Buffer playback failed:', error.message);
    return false;
  }
};

// Fallback: Generate beep sound
const playGeneratedBeep = async () => {
  try {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';

      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

      osc.start(start);
      osc.stop(start + 0.2);
    });
    return true;
  } catch (e) {
    return false;
  }
};

// Vibrate on mobile
const vibrate = () => {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]); // vibrate-pause-vibrate pattern
    return true;
  }
  return false;
};

// Auto-initialize on page load (aggressive approach)
if (typeof window !== 'undefined') {
  // Pre-load HTML5 audio immediately
  preloadHtml5Audio();

  // Try to initialize AudioContext immediately (might work in some browsers)
  setTimeout(() => {
    initAudioContext().catch(() => {});
  }, 100);

  // Also initialize on any user interaction (as backup)
  const handleInteraction = () => {
    initAudioContext();
    // Also "warm up" the HTML5 audio by playing silently
    if (html5Audio) {
      html5Audio.volume = 0;
      html5Audio.play().then(() => {
        html5Audio.pause();
        html5Audio.currentTime = 0;
        html5Audio.volume = 0.7;
      }).catch(() => {});
    }
  };

  ['click', 'touchstart', 'touchend', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, handleInteraction, { once: true, passive: true });
  });
}

// Check if notification sound is enabled in settings
const isSoundEnabled = () => {
  try {
    const savedSettings = localStorage.getItem('agribot_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings?.notifications?.sound !== false; // Default to true if not set
    }
  } catch (e) {}
  return true; // Default enabled
};

// Main play function - tries multiple methods for maximum compatibility
export const playNotificationSound = async () => {
  console.log('playNotificationSound called');

  // Check if sound is enabled in settings
  if (!isSoundEnabled()) {
    console.log('Sound disabled in settings, only vibrating');
    vibrate();
    return;
  }

  // Always try to vibrate on mobile
  vibrate();

  // Try multiple methods in parallel for fastest response
  const playAttempts = [];

  // Method 1: Preloaded HTML5 Audio (fastest if warmed up)
  if (html5Audio) {
    playAttempts.push(
      (async () => {
        try {
          html5Audio.currentTime = 0;
          await html5Audio.play();
          console.log('Preloaded HTML5 Audio played');
          return true;
        } catch (e) {
          return false;
        }
      })()
    );
  }

  // Method 2: AudioContext buffer
  if (audioBuffer) {
    playAttempts.push(
      (async () => {
        const played = await playSoundBuffer();
        if (played) console.log('AudioContext buffer played');
        return played;
      })()
    );
  }

  // Wait for first successful play
  if (playAttempts.length > 0) {
    const results = await Promise.all(playAttempts);
    if (results.some(r => r)) {
      return; // At least one method worked
    }
  }

  // Fallback: Try to initialize and play
  console.log('Primary methods failed, trying fallbacks...');

  // Try to init AudioContext
  await initAudioContext();

  // Try buffer again after init
  if (audioBuffer) {
    const played = await playSoundBuffer();
    if (played) {
      console.log('AudioContext buffer played after init');
      return;
    }
  }

  // Try generated beep
  if (audioContext) {
    const beeped = await playGeneratedBeep();
    if (beeped) {
      console.log('Generated beep played');
      return;
    }
  }

  // Final fallback: New HTML5 Audio element
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.7;
    await audio.play();
    console.log('New HTML5 Audio played');
  } catch (e) {
    console.warn('All audio playback methods failed:', e.message);
  }
};

// Hook for React components
export const useNotificationSound = () => {
  const playSound = useCallback(() => {
    playNotificationSound();
  }, []);

  return { playSound };
};

// Export init for manual unlock
export const unlockNotificationSound = initAudioContext;

export default useNotificationSound;

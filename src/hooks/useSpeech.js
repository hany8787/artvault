/**
 * Hook personnalisé pour Text-to-Speech
 * Utilise Web Speech API (gratuit, illimité)
 * Upgrade possible vers Google Cloud TTS / ElevenLabs
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Configuration des voix par niveau
const VOICE_CONFIG = {
  enfant: {
    rate: 0.85,      // Plus lent
    pitch: 1.1,      // Plus aigu
    volume: 1.0
  },
  amateur: {
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0
  },
  expert: {
    rate: 1.0,       // Vitesse normale
    pitch: 0.95,     // Légèrement plus grave
    volume: 1.0
  }
};

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);

  const utteranceRef = useRef(null);
  const textRef = useRef('');

  // Vérifier le support et charger les voix
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Sélectionner une voix française par défaut
        const frenchVoice = availableVoices.find(
          voice => voice.lang.startsWith('fr')
        ) || availableVoices.find(
          voice => voice.lang.startsWith('en')
        ) || availableVoices[0];
        
        setSelectedVoice(frenchVoice);
      };

      // Les voix peuvent être chargées de manière asynchrone
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Lire un texte à voix haute
   * @param {string} text - Texte à lire
   * @param {string} level - Niveau: 'enfant', 'amateur', 'expert'
   */
  const speak = useCallback((text, level = 'amateur') => {
    if (!isSupported || !text) return;

    // Arrêter toute lecture en cours
    speechSynthesis.cancel();

    const config = VOICE_CONFIG[level] || VOICE_CONFIG.amateur;
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang || 'fr-FR';
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    textRef.current = text;
    utteranceRef.current = utterance;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setProgress(0);
      setCurrentCharIndex(0);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(100);
      setCurrentCharIndex(-1);
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    // Track progress and current word position
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const progressPercent = Math.round((event.charIndex / text.length) * 100);
        setProgress(progressPercent);
        setCurrentCharIndex(event.charIndex);
      }
    };

    speechSynthesis.speak(utterance);
  }, [isSupported, selectedVoice]);

  /**
   * Mettre en pause
   */
  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  /**
   * Reprendre la lecture
   */
  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  /**
   * Arrêter complètement
   */
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback((text, level = 'amateur') => {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      speak(text, level);
    }
  }, [isSpeaking, isPaused, pause, resume, speak]);

  /**
   * Obtenir les voix françaises disponibles
   */
  const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));

  return {
    isSupported,
    isSpeaking,
    isPaused,
    progress,
    currentCharIndex,
    voices,
    frenchVoices,
    selectedVoice,
    setSelectedVoice,
    speak,
    pause,
    resume,
    stop,
    toggle
  };
}

export default useSpeech;

/**
 * Hook for Edge TTS (Microsoft Neural Voices)
 * High-quality text-to-speech using Microsoft Edge voices
 * Falls back to Web Speech API if server-side TTS is unavailable
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Audio cache to avoid regenerating same text
const audioCache = new Map();

export function useEdgeTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const utteranceRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Fallback: Use Web Speech API
   */
  const speakWithWebSpeech = useCallback((text, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Configure voice based on level
      const { level = 'amateur' } = options;
      utterance.lang = 'fr-FR';
      utterance.rate = level === 'enfant' ? 0.85 : level === 'expert' ? 1.0 : 0.95;
      utterance.pitch = level === 'enfant' ? 1.1 : level === 'expert' ? 0.95 : 1.0;

      // Try to get a French voice
      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setProgress(0);
        setUsingFallback(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('Web Speech error:', e);
        setError(e.error);
        reject(e);
      };

      // Estimate progress based on character position
      let charIndex = 0;
      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          charIndex = e.charIndex;
          setProgress(Math.round((charIndex / text.length) * 100));
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /**
   * Generate audio from text using Edge TTS
   */
  const generateAudio = useCallback(async (text, options = {}) => {
    const { level = 'amateur', lang = 'fr-FR', gender = 'female' } = options;
    const cacheKey = `${text}-${level}-${lang}-${gender}`;

    // Check cache first
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey);
    }

    setIsLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edge-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ text, level, lang, gender })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();

      // Check if server returned fallback signal
      if (data.fallback) {
        console.log('Edge TTS unavailable, using Web Speech API fallback');
        setUsingFallback(true);
        return { fallback: true, text };
      }

      const { audio, format, duration_estimate } = data;

      if (!audio) {
        throw new Error('No audio data received');
      }

      // Convert base64 to audio blob
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: format || 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the result
      const result = { audioUrl, duration_estimate };
      audioCache.set(cacheKey, result);

      return result;
    } catch (err) {
      console.error('Edge TTS error:', err);
      setError(err.message);
      // Return fallback signal on error
      setUsingFallback(true);
      return { fallback: true, text };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Speak text using Edge TTS (with fallback to Web Speech)
   */
  const speak = useCallback(async (text, options = {}) => {
    // Stop any current playback
    stop();

    const result = await generateAudio(text, options);
    if (!result) return;

    // If fallback, use Web Speech API
    if (result.fallback) {
      try {
        await speakWithWebSpeech(text, options);
      } catch (e) {
        console.error('Both TTS methods failed:', e);
        setError('Audio playback unavailable');
      }
      return;
    }

    const { audioUrl, duration_estimate } = result;

    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setDuration(duration_estimate);

    // Event handlers
    audio.onplay = () => {
      setIsPlaying(true);
      setIsPaused(false);

      // Update progress
      progressIntervalRef.current = setInterval(() => {
        if (audio.duration && !isNaN(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }, 100);
    };

    audio.onpause = () => {
      setIsPaused(true);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setError('Playback error');
      setIsPlaying(false);
    };

    // Start playback
    try {
      await audio.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError('Could not play audio');
    }
  }, [generateAudio, speakWithWebSpeech]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (usingFallback && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, usingFallback]);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (usingFallback && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, [isPaused, usingFallback]);

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
    // Stop Web Speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop Audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  /**
   * Toggle play/pause
   */
  const toggle = useCallback(async (text, options = {}) => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      await speak(text, options);
    }
  }, [isPlaying, isPaused, pause, resume, speak]);

  /**
   * Seek to position (0-100) - only works with Audio element, not Web Speech
   */
  const seek = useCallback((percentage) => {
    if (audioRef.current && audioRef.current.duration && !usingFallback) {
      audioRef.current.currentTime = (percentage / 100) * audioRef.current.duration;
      setProgress(percentage);
    }
  }, [usingFallback]);

  /**
   * Clear the audio cache
   */
  const clearCache = useCallback(() => {
    // Revoke object URLs to free memory
    audioCache.forEach(({ audioUrl }) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    });
    audioCache.clear();
  }, []);

  return {
    // State
    isLoading,
    isPlaying,
    isPaused,
    isSpeaking: isPlaying, // Alias for compatibility
    progress,
    duration,
    error,
    usingFallback,

    // Actions
    speak,
    pause,
    resume,
    stop,
    toggle,
    seek,
    generateAudio,
    clearCache,

    // Feature flag
    isEdgeTTS: true
  };
}

export default useEdgeTTS;

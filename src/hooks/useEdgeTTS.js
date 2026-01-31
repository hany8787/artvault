/**
 * Hook for Edge TTS (Microsoft Neural Voices)
 * High-quality text-to-speech using Microsoft Edge voices
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

  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

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
    };
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

      const { audio, format, duration_estimate } = await response.json();

      // Convert base64 to audio blob
      const binaryString = atob(audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: format });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cache the result
      audioCache.set(cacheKey, { audioUrl, duration_estimate });

      return { audioUrl, duration_estimate };
    } catch (err) {
      console.error('Edge TTS error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Speak text using Edge TTS
   */
  const speak = useCallback(async (text, options = {}) => {
    // Stop any current playback
    stop();

    const result = await generateAudio(text, options);
    if (!result) return;

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
  }, [generateAudio]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, [isPaused]);

  /**
   * Stop playback
   */
  const stop = useCallback(() => {
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
   * Seek to position (0-100)
   */
  const seek = useCallback((percentage) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (percentage / 100) * audioRef.current.duration;
      setProgress(percentage);
    }
  }, []);

  /**
   * Clear the audio cache
   */
  const clearCache = useCallback(() => {
    // Revoke object URLs to free memory
    audioCache.forEach(({ audioUrl }) => {
      URL.revokeObjectURL(audioUrl);
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

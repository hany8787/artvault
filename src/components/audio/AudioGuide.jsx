/**
 * Composant Audio Guide - Lecteur style musée
 * Design premium avec carte dépliable
 */

import { useState, useEffect } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import { generateAudioText, AUDIO_LEVELS } from '../../services/audioGuide';

/**
 * Lecteur Audio Guide - Version carte dépliable
 */
export function AudioGuidePlayer({ artwork, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('amateur');
  const [audioText, setAudioText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showText, setShowText] = useState(false);

  const {
    isSupported,
    isSpeaking,
    isPaused,
    progress,
    speak,
    pause,
    resume,
    stop
  } = useSpeech();

  // Auto-expand quand la lecture commence
  useEffect(() => {
    if (isSpeaking) {
      setIsExpanded(true);
    }
  }, [isSpeaking]);

  async function loadAudioText(level) {
    setIsLoading(true);
    setError(null);
    try {
      const text = await generateAudioText(artwork, level);
      setAudioText(text);
      return text;
    } catch (err) {
      setError('Impossible de générer l\'audio');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlayPause() {
    if (isSpeaking && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      let text = audioText;
      if (!text) {
        text = await loadAudioText(selectedLevel);
      }
      if (text) {
        speak(text, selectedLevel);
      }
    }
  }

  async function handleLevelChange(level) {
    if (level === selectedLevel) return;
    stop();
    setSelectedLevel(level);
    setAudioText('');
  }

  useEffect(() => {
    return () => stop();
  }, []);

  if (!isSupported) return null;

  // Version repliée (compacte)
  if (!isExpanded) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-gradient-to-r from-neutral-900 to-neutral-800 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-accent/30 transition-all group"
        >
          {/* Icône */}
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <span className="material-symbols-outlined text-accent text-2xl">headphones</span>
          </div>
          
          {/* Texte */}
          <div className="flex-1 text-left">
            <h3 className="font-display text-lg font-semibold text-white">Audio Guide</h3>
            <p className="text-sm text-white/50">Écouter la présentation • IA</p>
          </div>

          {/* Indicateur lecture en cours */}
          {isSpeaking && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-accent font-medium">En cours</span>
            </div>
          )}

          {/* Chevron */}
          <span className="material-symbols-outlined text-white/40 group-hover:text-accent transition-colors">
            expand_more
          </span>
        </button>
      </div>
    );
  }

  // Version dépliée (complète)
  return (
    <div className={className}>
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header cliquable pour replier */}
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full px-5 py-4 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-accent">headphones</span>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-display text-lg font-semibold text-white">Audio Guide</h3>
            <p className="text-xs text-white/50">Écoutez la présentation de cette œuvre</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 border border-accent/20">
              <span className="material-symbols-outlined text-accent text-sm">auto_awesome</span>
              <span className="text-xs text-accent font-medium">IA</span>
            </div>
            <span className="material-symbols-outlined text-white/40">expand_less</span>
          </div>
        </button>

        {/* Sélection du niveau */}
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Niveau</p>
          <div className="flex gap-2">
            {Object.values(AUDIO_LEVELS).map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelChange(level.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                  transition-all duration-200 text-sm font-medium
                  ${selectedLevel === level.id 
                    ? 'bg-accent text-neutral-900' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <span className="material-symbols-outlined text-lg">{level.icon}</span>
                <span className="hidden sm:inline">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Zone de lecture */}
        <div className="px-5 py-5">
          {/* Barre de progression */}
          <div className="mb-4">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-yellow-400 transition-all duration-300 ease-out"
                style={{ width: `${isSpeaking || isPaused ? progress : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-white/30">
                {isSpeaking || isPaused ? `${Math.round(progress)}%` : '0:00'}
              </span>
              <span className="text-xs text-white/30">
                {AUDIO_LEVELS[selectedLevel].sublabel}
              </span>
            </div>
          </div>

          {/* Contrôles */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={stop}
              disabled={!isSpeaking && !isPaused}
              className="w-12 h-12 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">stop</span>
            </button>

            <button
              onClick={handlePlayPause}
              disabled={isLoading}
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-lg
                ${isLoading 
                  ? 'bg-white/10 cursor-wait' 
                  : 'bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-3xl text-white animate-spin">progress_activity</span>
              ) : isSpeaking && !isPaused ? (
                <span className="material-symbols-outlined text-3xl text-neutral-900">pause</span>
              ) : (
                <span className="material-symbols-outlined text-3xl text-neutral-900">play_arrow</span>
              )}
            </button>

            <button
              onClick={() => setShowText(!showText)}
              className={`
                w-12 h-12 rounded-full transition-all flex items-center justify-center
                ${showText 
                  ? 'bg-accent/20 text-accent' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="material-symbols-outlined text-xl">
                {showText ? 'visibility_off' : 'article'}
              </span>
            </button>
          </div>

          {/* Statut */}
          <p className="text-center text-sm text-white/40 mt-3">
            {isLoading && 'Génération en cours...'}
            {isSpeaking && !isPaused && 'Lecture en cours'}
            {isPaused && 'En pause'}
            {!isLoading && !isSpeaking && !isPaused && 'Appuyez pour écouter'}
          </p>
        </div>

        {/* Zone texte */}
        {showText && audioText && (
          <div className="px-5 pb-5">
            <div className="bg-black/30 rounded-xl p-4 max-h-32 overflow-y-auto border border-white/5">
              <p className="text-sm text-white/70 leading-relaxed font-serif italic">
                "{audioText}"
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="px-5 pb-4">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioGuidePlayer;

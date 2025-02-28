import React, { createContext, useContext, useRef, useCallback } from 'react';

interface AudioContextType {
  playAudio: (audioUrl: string, onEnd?: () => void) => Promise<void>;
  stopCurrentAudio: () => void;
  isPlaying: (audioUrl: string) => boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
    }
  }, []);

  const playAudio = useCallback(async (audioUrl: string, onEnd?: () => void) => {
    // Stop any currently playing audio
    stopCurrentAudio();

    // Create and play new audio
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    currentAudioUrlRef.current = audioUrl;

    audio.addEventListener('ended', () => {
      onEnd?.();
      currentAudioRef.current = null;
      currentAudioUrlRef.current = null;
      URL.revokeObjectURL(audioUrl);
    });

    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      stopCurrentAudio();
      throw error;
    }
  }, [stopCurrentAudio]);

  const isPlaying = useCallback((audioUrl: string) => {
    return currentAudioUrlRef.current === audioUrl && 
           currentAudioRef.current !== null && 
           !currentAudioRef.current.paused;
  }, []);

  return (
    <AudioContext.Provider value={{ playAudio, stopCurrentAudio, isPlaying }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
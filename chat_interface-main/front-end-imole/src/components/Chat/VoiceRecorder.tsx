"use client"

import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognitionEvent, SpeechRecognitionInstance } from '@/types/speech.type';

interface VoiceRecorderProps {
  readonly onTranscript: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResultIndex = event.results.length - 1;
      console.log(event.results)
      const transcript = event.results[lastResultIndex][0].transcript;
      onTranscript(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not supported');
      return;
    }

    try {
      if (!isRecording) {
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Speech recognition error:', error instanceof Error ? error.message : String(error));
      setIsRecording(false);
    }
  };

  return (
    <button 
      type="button"
      onClick={toggleRecording} 
      className={`p-1 h-8 w-8 rounded-full border border-primary ${
        isRecording ? 'bg-red-500' : 'bg-gray-200'
      }`}
      title={isRecording ? 'Stop Recording' : 'Start Recording'}
      aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
    >
      <span role="img" aria-hidden="true">🎙️</span>
    </button>
  );
};

export default React.memo(VoiceRecorder);
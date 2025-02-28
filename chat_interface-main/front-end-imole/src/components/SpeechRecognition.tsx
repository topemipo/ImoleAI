"use client"

import { SpeechRecognitionEvent, SpeechRecognitionInstance, SpeechRecognitionProps } from '@/types/speech.type';
import React, { useEffect, useRef } from 'react';


export const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({
  children,
  isRecording,
  onStart,
  onEnd,
  onResult,
  language = 'en-US',
}) => {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      onStart();
    };

    recognition.onend = () => {
      onEnd();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result, _, arr) => result[arr.length - 1].transcript)
        .join(' ');
      onResult(transcript);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      onEnd();
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, onStart, onEnd, onResult]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    const startRecording = () => {
      recognitionRef.current?.start();
    };

    const stopRecording = () => {
      recognitionRef.current?.stop();
    };

    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  return <>{children}</>;
};
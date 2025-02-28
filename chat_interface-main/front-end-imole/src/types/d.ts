import { SpeechRecognitionInstance } from "./speech.type";

declare global {
    interface Window {
      SpeechRecognition: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition: new () => SpeechRecognitionInstance;
      webkitAudioContext: typeof AudioContext;
    }
  }

export {}; 
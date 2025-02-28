type SpeechRecognitionInstance = EventTarget & {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: () => void;
    onend: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: { error: string }) => void;
    start: () => void;
    stop: () => void;
  }
  
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    isFinal: boolean;
  }
  
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    readonly length: number;
  }
  
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    // results: {
    //   [index: number]: {
    //     [index: number]: {
    //       transcript: string;
    //     };
    //   };
    // }[];
  }
  
  interface SpeechRecognitionProps {
    children: React.ReactNode;
    isRecording: boolean;
    onStart: () => void;
    onEnd: () => void;
    onResult: (transcript: string) => void;
    language?: string;
  }

  export type { 
    SpeechRecognitionEvent, 
    SpeechRecognitionInstance, 
    SpeechRecognitionProps 
  };
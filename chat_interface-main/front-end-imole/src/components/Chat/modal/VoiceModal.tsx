"use client"

import React, { useCallback, useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/UI/Button";
import { useMessages } from "@/context/ChatContext";
import { useChat } from "@/hooks/useChat";

interface VoiceModalProps {
  onClose: () => void;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  isRecording: boolean;
  setShowWelcomeMessage: React.Dispatch<React.SetStateAction<boolean>>;
}

const VoiceModal = ({
  onClose,
  setIsRecording,
  isRecording: parentIsRecording,
  setShowWelcomeMessage,
}: VoiceModalProps) => {
  const { uploadAudio } = useChat();
  const { setMessages } = useMessages();
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [silenceTimeoutReached, setSilenceTimeoutReached] = useState(false);

  // Audio refs
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const botAudioRef = useRef<HTMLAudioElement | null>(null);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const microphoneStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => cleanup();
  }, []);

  const cleanup = (preserveTimeoutState: boolean = false) => {
    // Clear silence detection interval
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }

    // Stop recording if active
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }

    // Stop microphone stream
    if (microphoneStream.current) {
      microphoneStream.current.getTracks().forEach(track => track.stop());
      microphoneStream.current = null;
    }

    // Stop bot audio
    if (botAudioRef.current) {
      botAudioRef.current.pause();
      botAudioRef.current = null;
    }

    // Reset states
    setIsRecording(false);
    setIsBotSpeaking(false);
    // Only reset timeout states if not preserving them
    if (!preserveTimeoutState) {
      setSilenceTimer(0);
      setSilenceTimeoutReached(false);
    }
    // setSilenceTimer(0);
    // setSilenceTimeoutReached(false);
    setStatus("");
    audioChunks.current = [];
  };

  const checkAudioLevel = (): number => {
    if (!audioAnalyser.current) return -Infinity;

    const dataArray = new Float32Array(audioAnalyser.current.frequencyBinCount);
    audioAnalyser.current.getFloatTimeDomainData(dataArray);
    
    // Calculate RMS value
    const rms = Math.sqrt(
      dataArray.reduce((sum, val) => sum + (val * val), 0) / dataArray.length
    );
    
    return 20 * Math.log10(rms);
  };

  const handleSilenceTimeout = () => {
    // Set the timeout flag first
    setSilenceTimeoutReached(true);
    setStatus("No voice detected for 30 seconds. Click 'Start Recording' to try again.");
    
    // Clear the audio chunks BEFORE stopping the recorder
    audioChunks.current = [];
    
    // Clear the interval
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
  
    // Stop microphone stream
    if (microphoneStream.current) {
      microphoneStream.current.getTracks().forEach(track => track.stop());
      microphoneStream.current = null;
    }
  
    // Stop recording and reset states
    setIsRecording(false);
    
    // Stop the media recorder last
    if (mediaRecorder.current?.state === "recording") {
      try {
        // Temporarily remove the ondataavailable handler
        mediaRecorder.current.ondataavailable = null;
        mediaRecorder.current.onstop = null;
        mediaRecorder.current.stop();
        mediaRecorder.current = null;
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
    }
  
    // Cleanup while preserving timeout state
    cleanup(true);
  };

  // const handleSilenceTimeout = () => {
  //   setSilenceTimeoutReached(true);
  //   setStatus("No voice detected for 30 seconds. Click 'Start Recording' to try again.");
    
  //   // Stop the media recorder without triggering ondataavailable
  //   if (mediaRecorder.current?.state === "recording") {
  //     mediaRecorder.current.stop();
  //   }

  //   // Clear the audio chunks to prevent processing
  //   audioChunks.current = [];
    
  //   // Stop recording and reset states
  //   setIsRecording(false);
    
  //   // Clear the interval
  //   if (silenceIntervalRef.current) {
  //     clearInterval(silenceIntervalRef.current);
  //     silenceIntervalRef.current = null;
  //   }

  //   // Stop microphone stream
  //   if (microphoneStream.current) {
  //     microphoneStream.current.getTracks().forEach(track => track.stop());
  //     microphoneStream.current = null;
  //   }

  //   // Stop recording and reset states while preserving timeout state
  //   cleanup(true);
  // };

  const startRecording = async () => {
    try {
      cleanup(false);
      setSilenceTimeoutReached(false);

      // Initialize audio context
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      audioAnalyser.current = audioContext.current.createAnalyser();
      audioAnalyser.current.fftSize = 2048;

      // Get microphone stream
      microphoneStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect stream to analyser
      const source = audioContext.current.createMediaStreamSource(microphoneStream.current);
      source.connect(audioAnalyser.current);

      // Start recording
      mediaRecorder.current = new MediaRecorder(microphoneStream.current);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0 && !silenceTimeoutReached) {
          audioChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        if (!silenceTimeoutReached && audioChunks.current.length > 0) {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          if (audioBlob.size > 0) {
            handleVoiceInteraction(audioBlob);
          }
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setError("");

      // Start silence detection
      let lastSoundTime = Date.now();
      
      silenceIntervalRef.current = setInterval(() => {
        const level = checkAudioLevel();
        console.log('Audio level:', level); // Debug log

        if (level > -50) { // Threshold for sound detection
          lastSoundTime = Date.now();
          setSilenceTimer(0);
        } else {
          const silenceDuration = Math.floor((Date.now() - lastSoundTime) / 1000);
          setSilenceTimer(silenceDuration);
          console.log('Silence duration:', silenceDuration); // Debug log

          if (silenceDuration >= 30) {
            handleSilenceTimeout();
          }
        }
      }, 100);

    } catch (err) {
      console.error("Recording error:", err);
      setError("Failed to start recording");
      cleanup(false);
    }
  };

  // const stopRecording = () => {
  //   if (mediaRecorder.current?.state === "recording") {
  //     mediaRecorder.current.stop();
  //     cleanup(true);
  //   }
  // };

  const stopRecording = () => {
    if (mediaRecorder.current?.state === "recording") {
      // Just stop the recording - don't cleanup yet
      // The onstop handler will process the audio and then cleanup
      mediaRecorder.current.stop();
      
      // Clear the interval
      if (silenceIntervalRef.current) {
        clearInterval(silenceIntervalRef.current);
        silenceIntervalRef.current = null;
      }
  
      // Stop microphone stream
      if (microphoneStream.current) {
        microphoneStream.current.getTracks().forEach(track => track.stop());
        microphoneStream.current = null;
      }
  
      // Set recording state to false
      setIsRecording(false);
    }
  };

  const handleVoiceInteraction = async (audioBlob: Blob) => {
    if (silenceTimeoutReached || audioBlob.size === 0){ 
      cleanup(true);
      return
    };
    console.log('timer', silenceTimer)

    setIsProcessing(true);
    setStatus("Processing...");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      const chatResponse = await uploadAudio(formData);
      
      setShowWelcomeMessage(false);
      setMessages(prev => [
        ...prev,
        { id: `user-${Date.now()}`, content: chatResponse.transcription, role: "user" },
        { id: `assistant-${Date.now()}`, content: chatResponse.ragResponse, role: "assistant", audio: chatResponse.audioUrl }
      ]);

      await playBotResponse(chatResponse.audioUrl);
      setStatus("");
    } catch (err) {
      console.error("Processing error:", err);
      setError("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  
  const playBotResponse = async (audioUrl: string) => {
    try {
      setIsBotSpeaking(true);
      
      // Set up interruption detection
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream.current = stream;
      
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Monitor for interruptions
      const checkInterruption = setInterval(() => {
        const level = checkAudioLevel();
        if (level > -40) { // Higher threshold for interruption
          clearInterval(checkInterruption);
          handleInterruption();
        }
      }, 100);

      botAudioRef.current = new Audio(audioUrl);
      botAudioRef.current.onended = () => {
        clearInterval(checkInterruption);
        setIsBotSpeaking(false);
        startRecording();
      };

      await botAudioRef.current.play();
    } catch (err) {
      console.error("Playback error:", err);
      setError("Failed to play response");
      setIsBotSpeaking(false);
    }
  };

  const handleInterruption = () => {
    if (botAudioRef.current && isBotSpeaking) {
      botAudioRef.current.pause();
      setIsBotSpeaking(false);
      setStatus("Interruption detected - Listening...");
      startRecording();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isBotSpeaking ? "Assistant Speaking" : 
             parentIsRecording ? "Recording..." : "Voice Message"}
          </h3>
          <Button onClick={handleClose} variant="ghost" size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {status && (
            <p className="text-center text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
              {status}
            </p>
          )}
          
          {parentIsRecording && !silenceTimeoutReached && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Silence duration: {silenceTimer} seconds
              </p>
              {silenceTimer >= 25 && (
                <p className="text-sm text-yellow-600 font-medium">
                  Warning: Recording will stop in {30 - silenceTimer} seconds if no voice is detected
                </p>
              )}
            </div>
          )}
          
          {isBotSpeaking && (
            <div className="text-center space-y-2">
              <p className="text-sm text-blue-600 font-medium">
                Assistant is speaking (Speak to interrupt)
              </p>
              <div className="h-1 bg-blue-100 animate-pulse rounded"/>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              onClick={parentIsRecording ? stopRecording : startRecording}
              variant={parentIsRecording ? "destructive" : "default"}
              disabled={isProcessing}
            >
              {parentIsRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>

          <PulsatingCircle isActive={parentIsRecording && !silenceTimeoutReached} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(VoiceModal);

const PulsatingCircle = React.memo(({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center justify-center w-full h-32">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping" />
        <div className="relative rounded-full bg-red-500 w-16 h-16" />
      </div>
    </div>
  );
});

PulsatingCircle.displayName = "PulsatingCircle";



  // Cleanup on unmount
  // useEffect(() => () => {
  //   mediaRecorder.current?.stream?.getTracks().forEach(track => track.stop());
  //   botAudioRef.current?.pause();
  //   cancelAnimationFrame(animationFrameRef.current);
  //   audioContextRef.current?.close();
  // }, []);

  // useEffect(() => {
  //   return () => {
  //     // Stop any ongoing recording
  //     if (mediaRecorder.current?.state === "recording") {
  //       mediaRecorder.current.stop();
  //       mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
  //     }
  //     // Reset recording state
  //     setIsRecording(false);
  //     // Clear any audio chunks
  //     audioChunks.current = [];
  //     // Stop bot audio if playing
  //     botAudioRef.current?.pause();
  //     // Cleanup audio context
  //     cancelAnimationFrame(animationFrameRef.current);

  //     // Close AudioContext only if it's not already closed
  //     if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
  //       audioContextRef.current.close().catch(console.error);
  //     }

  //     // Cleanup interruption monitoring
  //     interruptionSourceRef.current?.disconnect();
  //     interruptionSourceRef.current?.mediaStream.getTracks().forEach(track => track.stop());
  //   };
  // }, [setIsRecording]);









  // import React, { useCallback, useRef, useState, useEffect } from "react";
// import { X } from "lucide-react";
// import { Button } from "@/components/UI/Button";
// import { useMessages } from "@/context/ChatContext";
// import { useChat } from "@/hooks/useChat";

// interface VoiceModalProps {
//   onClose: () => void;
//   setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
//   isRecording: boolean;
// }

// const VoiceModal = ({
//   onClose,
//   setIsRecording,
//   isRecording: parentIsRecording,
// }: VoiceModalProps) => {
//   const { uploadAudio } = useChat();
//   const { messages, setMessages } = useMessages();
//   const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
//   const [audioUrl, setAudioUrl] = useState<string>("");
//   const [status, setStatus] = useState<string>("");
//   const [error, setError] = useState<string>("");
//   const [silenceDetected, setSilenceDetected] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const mediaRecorder = useRef<MediaRecorder | null>(null);
//   const audioChunks = useRef<Blob[]>([]);
//   const silenceTimer = useRef<NodeJS.Timeout | null>(null);
//   const audioContext = useRef<AudioContext | null>(null);
//   const analyser = useRef<AnalyserNode | null>(null);

//   // Initialize audio context for silence detection
//   useEffect(() => {
//     audioContext.current = new AudioContext();
//     analyser.current = audioContext.current.createAnalyser();
//     analyser.current.fftSize = 256;

//     return () => {
//       if (audioContext.current) {
//         audioContext.current.close();
//       }
//     };
//   }, []);

//   // Handle the complete voice interaction flow
//   const handleVoiceInteraction = async (recordedBlob: Blob) => {
//     setIsProcessing(true);
//     setStatus("Processing your message...");

//     try {
//       // 1. Transcribe audio to text

//       const formData = new FormData();
//       formData.append("audio", recordedBlob, "recording.wav");
      
//       // const formData = new FormData();
//       // formData.append('file', recordedBlob);
//       // formData.append('model', 'whisper-1');

//       // const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//       //   method: 'POST',
//       //   headers: {
//       //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
//       //   },
//       //   body: formData,
//       // });

//       // if (!transcriptionResponse.ok) throw new Error('Transcription failed');
//       // const transcriptionData = await transcriptionResponse.json();

//       // // Add user message to chat
//       // setMessages(prev => [...prev, {
//       //   id: `user-${Date.now().toString()}`,
//       //   content: transcriptionData.text,
//       //   role: "user",
//       // }]);

//       // 2. Send transcribed text to chat API
//       setStatus("Getting response...");

//       const chatResponse = await uploadAudio(formData);
//       console.log(chatResponse)

//       // 3. Convert response to speech
//       setStatus("Converting response to speech...");

//       // const ttsResponse = await fetch(
//       //   "https://api.openai.com/v1/audio/speech",
//       //   {
//       //     method: "POST",
//       //     headers: {
//       //       Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
//       //       "Content-Type": "application/json",
//       //     },
//       //     body: JSON.stringify({
//       //       model: "tts-1",
//       //       voice: "alloy",
//       //       input: chatResponse.ragResponse,
//       //     }),
//       //   }
//       // );

//       // if (!ttsResponse.ok) throw new Error("Text-to-speech conversion failed");

//       // const audioBlob = await ttsResponse.blob();
//       // const audioURL = URL.createObjectURL(audioBlob);

//       setAudioUrl(chatResponse.audioUrl);

//       // Add assistant message to chat
//       setMessages(prev => [...prev, {
//         id: `user-${Date.now().toString()}`,
//         content: chatResponse.transcription,
//         role: "user",
//       }])

//       setMessages(prev => [...prev, {
//         id: `assistant-${Date.now().toString()}`,
//         content: chatResponse.ragResponse,
//         role: "assistant",
//         audio: chatResponse.audioUrl,
//       }]);

//       // Play the response
//       const audio = new Audio(chatResponse.audioUrl);
//       audio.onended = () => {
//         URL.revokeObjectURL(chatResponse.audioUrl);
//         startRecording(); // Automatically start recording after response
//       };
//       await audio.play();

//       setStatus("");
//       setIsProcessing(false);
//     } catch (err) {
//       console.error("Voice interaction error:", err);
//       setError("Error processing voice interaction. Please try again.");
//       setIsProcessing(false);
//       setStatus("");
//     }
//   };

//   // Automatic silence detection
//   const setupSilenceDetection = useCallback((stream: MediaStream) => {
//     if (!audioContext.current || !analyser.current) return;

//     const source = audioContext.current.createMediaStreamSource(stream);
//     source.connect(analyser.current);

//     const bufferLength = analyser.current.frequencyBinCount;
//     const dataArray = new Uint8Array(bufferLength);

//     const checkSilence = () => {
//       if (!analyser.current) return;

//       analyser.current.getByteFrequencyData(dataArray);
//       const average = dataArray.reduce((a, b) => a + b) / bufferLength;

//       if (average < 10) {
//         if (!silenceTimer.current) {
//           silenceTimer.current = setTimeout(() => {
//             setSilenceDetected(true);
//             stopRecording();
//           }, 2000);
//         }
//       } else {
//         if (silenceTimer.current) {
//           clearTimeout(silenceTimer.current);
//           silenceTimer.current = null;
//         }
//       }
//     };

//     const intervalId = setInterval(checkSilence, 100);
//     return () => clearInterval(intervalId);
//   }, []);

//   // Start recording
//   const startRecording = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       mediaRecorder.current = new MediaRecorder(stream);
//       audioChunks.current = [];

//       mediaRecorder.current.ondataavailable = (event) => {
//         if (event.data && event.data.size > 0) {
//           audioChunks.current.push(event.data);
//         }
//       };

//       mediaRecorder.current.onstop = () => {
//         const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
//         setAudioBlob(audioBlob);
//         handleVoiceInteraction(audioBlob);
//       };

//       mediaRecorder.current.start(100);
//       setIsRecording(true);
//       setError("");
//       setSilenceDetected(false);

//       const cleanup = setupSilenceDetection(stream);
//       return () => cleanup?.();
//     } catch (err) {
//       setError("Error accessing microphone. Please check permissions.");
//       console.error("Error starting recording:", err);
//     }
//   }, [setIsRecording, setupSilenceDetection]);

//   // Stop recording
//   const stopRecording = useCallback(() => {
//     if (mediaRecorder.current && parentIsRecording) {
//       mediaRecorder.current.stop();
//       mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
//       setIsRecording(false);
//     }
//   }, [parentIsRecording, setIsRecording]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (silenceTimer.current) {
//         clearTimeout(silenceTimer.current);
//       }
//       if (mediaRecorder.current && parentIsRecording) {
//         mediaRecorder.current.stop();
//         mediaRecorder.current.stream
//           .getTracks()
//           .forEach((track) => track.stop());
//       }
//       if (audioUrl) {
//         URL.revokeObjectURL(audioUrl);
//       }
//     };
//   }, [parentIsRecording, audioUrl]);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white rounded-lg p-6 w-full max-w-xl">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold">
//             {parentIsRecording ? "Recording..." : "Voice Message"}
//           </h3>
//           <Button
//             onClick={onClose}
//             variant="ghost"
//             size="icon"
//             disabled={isProcessing}
//           >
//             <X className="h-4 w-4" />
//           </Button>
//         </div>

//         {error && <p className="mb-4 text-red-500">{error}</p>}

//         <div className="space-y-4">
//           {status && (
//             <p className="text-center text-sm text-gray-600">{status}</p>
//           )}

//           <div className="flex justify-center gap-4">
//             <Button
//               onClick={parentIsRecording ? stopRecording : startRecording}
//               variant={parentIsRecording ? "destructive" : "default"}
//               disabled={isProcessing}
//             >
//               {parentIsRecording ? "Stop Recording" : "Start Recording"}
//             </Button>
//           </div>

//           <PulsatingCircle isActive={parentIsRecording} />
//         </div>
//       </div>
//     </div>
//   );
// };




// const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
// const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
// const silenceTimer = useRef<NodeJS.Timeout | null>(null);
// const [hasUserSpoken, setHasUserSpoken] = useState(false);
// const [isSpeechSupported, setIsSpeechSupported] = useState(true);

// const stopVoiceRecognition = useCallback(() => {
//   if (recognitionRef.current) {
//     recognitionRef.current.stop();
//     // setIsRecording(false);
//   }
//   clearSilenceTimer();
// }, []);

// const resetSilenceTimer = useCallback(() => {
//   clearSilenceTimer();
//   silenceTimer.current = setTimeout(() => {
//     stopVoiceRecognition();
//     if (hasUserSpoken) {
//       onRecordingComplete("Automatic submission due to silence");
//     }
//   }, 30000); // 30 seconds of inactivity
// },[onRecordingComplete, stopVoiceRecognition, hasUserSpoken]);

// const startVoiceRecognition = useCallback(() => {
//   if (recognitionRef.current && !botAudioMessage) {
//     recognitionRef.current.start();
//     setIsRecording(true);
//     resetSilenceTimer();
//   }
// },[botAudioMessage, setIsRecording, resetSilenceTimer]);

// const clearSilenceTimer = () => {
//   if (silenceTimer.current) {
//     clearTimeout(silenceTimer.current);
//     silenceTimer.current = null;
//   }
// };

// useEffect(() => {
//   const SpeechRecognition =
//     window.SpeechRecognition || window.webkitSpeechRecognition;

//   if (!SpeechRecognition) {
//     console.error("SpeechRecognition API is not supported in this browser");
//     setIsSpeechSupported(false);
//     onClose();
//     return;
//   }
//   try{
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.interimResults = true;

//   recognition.onresult = (event) => {
//     const transcript = Array.from(event.results)
//       .map((result) => result[0].transcript)
//       .join("");

//     if (event.results[0].isFinal) {
//       setHasUserSpoken(true);
//       onRecordingComplete(transcript);
//       resetSilenceTimer();
//     }
//   };

//   recognition.onerror = (event) => {
//     console.log("Speech recognition error:", event.error);
//     onClose();
//   };

//   recognitionRef.current = recognition;
//   const currentSynth = synthRef.current;
//   startVoiceRecognition();

//   return () => {
//     stopVoiceRecognition();
//     currentSynth.cancel(); // Cancel speech synthesis if any
//   };
// } catch (error) {
//   console.error("Error initializing speech recognition:", error);
//   setIsSpeechSupported(false);
//   onClose();
// }
// }, [onClose, onRecordingComplete, setIsRecording, setIsSpeechSupported, resetSilenceTimer, startVoiceRecognition, stopVoiceRecognition]);

// useEffect(() => {
//   if (botAudioMessage && hasUserSpoken) {
//     stopVoiceRecognition(); // Stop recognition when bot is speaking
//     const utterance = new SpeechSynthesisUtterance(botAudioMessage);

//     synthRef.current.speak(utterance);
//     utterance.onend = () => {
//       startVoiceRecognition(); // Resume recognition after bot stops
//       // setCurrentBotMessage("");
//       setInput("");
//     };
//   }
// }, [botAudioMessage, setInput, startVoiceRecognition, stopVoiceRecognition, hasUserSpoken]);

// if (!isSpeechSupported) {
//   return null; // Don't render anything if speech API is not supported
// }

// import { Button } from "@/components/UI/Button";
// import React, { useState, useRef, useEffect, useCallback } from "react";
// import { Pause, Play, X } from "lucide-react";
// import { SpeechRecognitionInstance } from "@/types/speech.type";

// interface RecordingPopupProps {
//   onClose: () => void;
//   onRecordingComplete: (text: string) => void;
//   botAudioMessage?: string;
//   setCurrentBotMessage: React.Dispatch<React.SetStateAction<string>>;
//   setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
//   setInput: React.Dispatch<React.SetStateAction<string>>;
// }

// const VoiceModal = ({
//   onClose,
//   onRecordingComplete,
//   botAudioMessage,
//   setIsRecording,
//   setCurrentBotMessage,
//   setInput,
// }: RecordingPopupProps) => {
//   const [isPaused, setIsPaused] = useState(false);
//   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
//   const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

//   useEffect(() => {
//     // Initialize speech recognition
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     const recognition = new SpeechRecognition();
//     recognition.continuous = true;
//     recognition.interimResults = true;

//     recognition.onresult = (event) => {
//       const transcript = Array.from(event.results)
//         .map((result) => result[0].transcript)
//         .join("");

//       if (event.results[0].isFinal) {
//         onRecordingComplete(transcript);
//         // Don't close modal here as we'll wait for bot response
//       }
//     };

//     recognition.onerror = (event) => {
//       console.log("Speech recognition error:", event.error);
//       // onClose();
//     };

//     recognitionRef.current = recognition;
//     const currentSynth = synthRef.current;
//     recognition.start();
//     setIsRecording(true);

//     return () => {
//       recognition.stop();
//       currentSynth.cancel(); // Cancel any ongoing speech
//     };
//   }, [onClose, onRecordingComplete, setIsRecording]);

//   // Handle bot response text-to-speech
//   useEffect(() => {
//     if (botAudioMessage) {
//       const utterance = new SpeechSynthesisUtterance(botAudioMessage);

//       synthRef.current.speak(utterance);

//       utterance.onend = () => {
//         setCurrentBotMessage('')
//         setInput('')
//         setIsRecording(true);
//       };
//     }
//   }, [botAudioMessage, onClose, setCurrentBotMessage, setInput]);

//   const handlePauseResume = useCallback(() => {
//     if (recognitionRef.current) {
//       if (isPaused) {
//         recognitionRef.current.start();
//       } else {
//         recognitionRef.current.stop();
//       }
//       setIsPaused(!isPaused);
//     }
//   }, [isPaused, setIsPaused]);

//   const handleStop = useCallback(() => {
//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//       setIsRecording(false);
//     }
//   }, [setIsRecording]);

//   return (
//     <div className="">
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//         <div className="bg-light rounded-lg p-6 w-[50%]">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold">
//               {botAudioMessage
//                 ? "Listening to Response"
//                 : "Recording Voice Message"}
//             </h3>
//             <Button
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700"
//             >
//               <X size={20} />
//             </Button>
//           </div>
//           <PulsatingCircle />
//           {!botAudioMessage && (
//             <div className="flex justify-center space-x-4">
//               <Button
//                 onClick={handlePauseResume}
//                 className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
//               >
//                 {isPaused ? <Play size={24} /> : <Pause size={24} />}
//               </Button>
//               <Button
//                 onClick={handleStop}
//                 className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
//               >
//                 <X />
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default React.memo(VoiceModal);

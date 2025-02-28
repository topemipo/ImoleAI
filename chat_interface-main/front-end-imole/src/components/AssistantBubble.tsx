import { AudioWaveformIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./UI/Button";
import MarkdownRenderer from "./UI/MarkdownRenderer";
import { PiLightbulbFilamentDuotone } from "react-icons/pi";
import { Message } from "@/context/ChatContext";
import CopyButton from "./UI/CopyButton";
import { useAudio } from "@/context/audioContext";

interface AssistantBubbleProps {
  message: Message;
}

const AssistantBubble: React.FC<AssistantBubbleProps> = ({ message }) => {
  const [error, setError] = useState<string>("");
  const { playAudio, stopCurrentAudio, isPlaying } = useAudio();
  const [voiceActive, setVoiceActive] = useState<boolean>(false);


  useEffect(() => {
    return () => {
      if (message.audio && isPlaying(message.audio)) {
        stopCurrentAudio();
      }
    };
  }, [stopCurrentAudio, isPlaying, message.audio]);

  // Update local playing state based on audio URL
  useEffect(() => {
    if (message.audio) {
      setVoiceActive(isPlaying(message.audio));
    }
  }, [isPlaying, message.audio]);


  const handlePlayStop = useCallback(async () => {
    if (!message.audio) return;

    try {
      setError("");
    
      if (isPlaying(message.audio)) {
        stopCurrentAudio();
      } else {
        await playAudio(message.audio, () => {
          // Optional callback when audio ends
          setVoiceActive(false);
        });
      }
    } catch (e) {
      console.error('Audio playback error:', e);
      setError("Failed to play audio");
      setVoiceActive(false);
    }
  }, [message.audio, playAudio, stopCurrentAudio, isPlaying]);


  return (
    <div>
      <div className="w-full flex items-center space-x-2">
        <div className="self-start">
          <PiLightbulbFilamentDuotone color="#FBAB57" className="w-8 h-8" />
        </div>
        <div className="w-full rounded-t-lg rounded-br-lg bg-light p-2">
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
      <div className="mt-2">
        <CopyButton message={message.content} />
        {message.audio && (
        <Button variant="ghost" size="sm" onClick={handlePlayStop} className={voiceActive ? "bg-primary" : ""}>
          <AudioWaveformIcon className="w-4 h-4 mr-2" />
          {voiceActive? "Playing" : "Play audio"}
        </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(AssistantBubble);


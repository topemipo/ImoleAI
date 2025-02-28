import { useState, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

interface ChatResponse {
  message: {
    response: string;
  };
  sources?: string[];
}

interface TranscribeResponse {
  transcription: string;
  ragResponse: string;
  audioUrl: string;
}

export const useChat = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const { socket, isConnected } = useWebSocket();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const streamResponse = useCallback(
    async (message: string): Promise<string> => {
      if (!isConnected) {
        throw new Error("WebSocket connection not established");
      }

      return new Promise((resolve, reject) => {
        let fullResponse = "";

        socket?.emit("message", { content: message });

        socket?.on("thinking", () => setIsThinking(true));
        socket?.on("typing", () => {
          setIsThinking(false);
          setIsTyping(true);
        });

        socket?.on("stream", (chunk: string) => {
          fullResponse += chunk;
        });

        socket?.on("complete", () => {
          setIsTyping(false);
          resolve(fullResponse);
        });

        socket?.on("error", (error: unknown) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });

        // Cleanup after 30 seconds to prevent memory leaks
        const timeout = setTimeout(() => {
          reject(new Error("Response timeout"));
        }, 30000);

        return () => {
          clearTimeout(timeout);
          socket?.off("thinking");
          socket?.off("typing");
          socket?.off("stream");
          socket?.off("complete");
          socket?.off("error");
        };
      });
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    async (content: string): Promise<ChatResponse> => {
      try {
        const response = await fetch(`${API_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: content }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }
        // console.log(response.json());
        return response.json();
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    []
  );

  const uploadAudio = useCallback(
    async (formData: FormData): Promise<TranscribeResponse> => {
      try {
        const response = await fetch(`${API_URL}/api/transcribe`, {
          method: "POST",
          body: formData,
        });

        return response.json();
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    []
  );

  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<void> => {
      try {
        const response = await fetch(`/api/chat/${messageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error("Failed to edit message");
        }
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    []
  );

  return {
    sendMessage,
    editMessage,
    streamResponse,
    uploadAudio,
    isTyping,
    isThinking,
  };
};

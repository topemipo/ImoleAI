"use client";

import React, { useCallback, useState } from "react";
import { Send, Mic } from "lucide-react";
import { Textarea } from "../UI/textarea";
import { Button } from "../UI/Button";
import { BsStop } from "react-icons/bs";

interface ChatTextArea {
  handleSubmit: (e: React.FormEvent) => void;
  handleTranscript: (text: string) => void;
  isLoading: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setShowVoiceModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatTextArea: React.FC<ChatTextArea> = ({
  handleSubmit,
  handleTranscript,
  isLoading,
  input,
  setInput,
  isRecording,
  setIsRecording,
  setShowVoiceModal,
}) => {

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        handleSubmit(e);
        // Reset textarea height
        const textarea = e.currentTarget.querySelector("textarea");
        if (textarea) {
          textarea.style.height = "44px";
        }

        // Clear input
        setInput("");
      }
    },
    [handleSubmit, input, setInput]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      // Auto-adjust height
      e.target.style.height = "inherit";
      e.target.style.height = `${e.target.scrollHeight}px`;
    },
    [setInput]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
      }
    },
    [handleFormSubmit]
  );

  const toggleRecording = useCallback(() => {
    setShowVoiceModal(true);
    if (!isRecording) {
      handleTranscript("");
    }
  }, [handleTranscript, setIsRecording, isRecording]);

  return (
    <div className="border-2 border-primary bg-secondary rounded-3xl mb-14">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-2xl p-3">
          <div className="flex flex-col space-y-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full pr-12 pl-4 py-3 text-gray-700 border-0 resize-none focus:ring-0 focus:outline-none rounded-xl theme-scrollbar"
              placeholder="Message..."
              style={{ minHeight: "44px", maxHeight: "200px", height: "auto" }}
              autoCapitalize="on"
              autoFocus
            />


            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 px-2">
                <Button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-colors ${
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  <Mic className="w-5 h-5" />
                </Button>

                <Button
                  type="button"
                  className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  title="Enable web search"
                >
                  <span>🌐</span>
                  <span className="text-sm">Web Search</span>
                </Button>
              </div>
              <Button
                onClick={handleFormSubmit}
                disabled={isLoading || !input.trim()}
                className="p-2 h-8 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 shadow-sm text-white transition-colors"
                title="Send message"
              >
                {isLoading ? (
                  <BsStop className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatTextArea);

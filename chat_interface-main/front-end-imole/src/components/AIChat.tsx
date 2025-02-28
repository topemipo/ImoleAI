"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { useChat } from "@/hooks/useChat";
import { Button } from "./UI/Button";
import { Alert, AlertDescription } from "./UI/alert";
import ChatTextArea from "./Chat/ChatTextArea";
import { Message, useMessages } from "@/context/ChatContext";
import { EditMessageForm } from "./Chat/EditMessageForm";
import VoiceModal from "./Chat/modal/VoiceModal";
import LoadingMessage from "./LoadingMessage";
import WelcomeHeader from "./WelcomeHeader";
import UserBubble from "./UserBubble";
import AssistantBubble from "./AssistantBubble";

const AIChat = () => {
  const { messages, setMessages } = useMessages();
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Refs
  // const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [parent] = useAutoAnimate();

  // Custom hooks
  const { sendMessage, isTyping, editMessage } = useChat();

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     synthRef.current = window.speechSynthesis;
  //   }
  // }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async () => {
    if (isThinking || isTyping || !input.trim()) {
      return;
    }

    setError(null);

    try {
      setShowWelcome(false);
      const newMessage: Message = {
        id: `user-${Date.now().toString()}`,
        content: input,
        role: "user",
      };

      // Store the current input in case of failure
      const currentInput = input;
      setInput("");
      setIsThinking(true);
      setMessages((prev) => [...prev, newMessage]);

      try {
        const response = await sendMessage(input);
        console.log(response);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now().toString()}`,
            content: response?.message.response,
            role: "assistant",
          },
        ]);
        setIsThinking(false);
      } catch (err) {
        console.log(err);
        setError("Failed to send message. Please try again.");
        setIsThinking(false);

        // Instead of removing messages, keep them and show an error
        setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
        setInput(currentInput);
      }
    } catch (err) {
      console.log(err);
      setError("Failed to send message. Please try again.");
    } 
  };

  // Handle message editing
  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      setError(null);
      
      const updatedMessages = messages.map((msg) => {
        if (msg.id === messageId) {
          return { ...msg, content: newContent };
        }
        return msg;
      });

      // Remove all messages after the edited message
      const editIndex = updatedMessages.findIndex(
        (msg) => msg.id === messageId
      );
      const trimmedMessages = updatedMessages.slice(0, editIndex + 2);
      const trimmedMessagesLastBotResponse = trimmedMessages.slice(0, -1);

      const editedResponse = await sendMessage(newContent);
      if (editedResponse) {
        setMessages(trimmedMessages);
        
        setMessages(trimmedMessagesLastBotResponse);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now().toString()}`,
            content: editedResponse?.message?.response,
            role: "assistant",
          },
        ]);

        setEditingMessageId(null);
      }else{
        setError("Failed to edit message. Please try again.");
        setMessages(messages)
      }
    } catch (err) {
      console.log(err);
      setError("Failed to edit message. Please try again.");
      setMessages(messages)
      setEditingMessageId(null);
    }
  };

  const handleCloseModal = useCallback(() => {
    setShowVoiceModal(false);
    setIsRecording(false);
  }, [setIsRecording]);

  useEffect(() => {
    if (!showVoiceModal && isRecording) {
      setIsRecording(false);
    }
  }, [showVoiceModal, isRecording]);

  return (
    <div className="flex flex-col justify-center h-screen bg-transparent w-[60%] min-w-3xl">
      <div className={`flex flex-col ${showWelcome ? "" : "flex-1 h-full"}`}>
        <div
          className={`overflow-y-auto px-4 pb-4 pt-8 space-y-4 hide-scrollbar ${
            showWelcome ? "" : "h-[80vh]"
          }`}
          ref={parent}
        >
          {showWelcome ? (
            <WelcomeHeader />
          ) : (
            messages.map((message) =>
              message.role == "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="flex items-end gap-2 group">
                    {editingMessageId === message.id ? (
                      <EditMessageForm
                        message={message}
                        onSubmit={handleEdit}
                        onCancel={() => setEditingMessageId("")}
                      />
                    ) : (
                      <UserBubble
                        key={message.id}
                        editedMId={editingMessageId as string}
                        message={message}
                        setEditingMessageId={setEditingMessageId}
                      />
                    )}
                  </div>
                </div>
              ) : (
                message.role === "assistant" && (
                  <AssistantBubble key={message.id} message={message} />
                )
              )
            )
          )}

          <LoadingMessage
            isThinking={isThinking}
            isTyping={isTyping}
            error={error as string}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="">
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Input Area */}
        <div className="">
          <ChatTextArea
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            handleTranscript={(transcript: string) =>
              setInput((prev) => prev + transcript)
            }
            isLoading={isTyping || isThinking}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            setShowVoiceModal={setShowVoiceModal}
          />
        </div>

        {showVoiceModal && (
          <VoiceModal
            onClose={handleCloseModal}
            setIsRecording={setIsRecording}
            isRecording={isRecording}
            setShowWelcomeMessage={setShowWelcome}
          />
        )}
      </div>
    </div>
  );
};

export default AIChat;

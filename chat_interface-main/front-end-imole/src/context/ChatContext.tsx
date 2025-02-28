"use client"


import React, { createContext, useContext, useState } from 'react';

interface ChatProviderProps {
    children: React.ReactNode;
}

export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    audio?: string
    // sources: SearchResult[];
}


const ChatContext = createContext<{
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}>({
  messages: [],
  setMessages: () => null,
});

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // if (typeof window !== 'undefined') {
    //   const saved = localStorage.getItem('chatMessages');
    //   return saved ? JSON.parse(saved) : [];
    // }
    return [];
  });

  
  const value = React.useMemo(() => ({ messages, setMessages }), [messages]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useMessages = () => useContext(ChatContext);
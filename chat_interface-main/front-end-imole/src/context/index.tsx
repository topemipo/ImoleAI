"use client"

import React from "react";
import { AudioProvider } from "./audioContext";
import { ChatProvider } from "./ChatContext";

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChatProvider>
      <AudioProvider>{children}</AudioProvider>
    </ChatProvider>
  );
};

export default Provider;

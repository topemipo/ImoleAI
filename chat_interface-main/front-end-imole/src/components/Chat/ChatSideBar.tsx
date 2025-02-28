"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useState } from "react";
import { Button } from "../UI/Button";
import { cn } from "@/lib/utils";
import { useMessages } from "@/context/ChatContext";
import { BsChatSquare } from "react-icons/bs";
import { useRouter } from "next/navigation";

const ChatSidebar: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { messages, setMessages } = useMessages();
  const { refresh } = useRouter();

  const handleNewSession = useCallback(() => {
    localStorage.removeItem('chatMessages')
    refresh();
  }, [refresh])

  return (
    <>
      {messages.length > 0 && (
        <div
          className={cn(
            "relative transition-all duration-300 shadow-lg h-screen",
            isSidebarOpen ? "w-64" : "w-0"
          )}
        >
          <aside className="flex justify-center w-full h-full">
            <div className={isSidebarOpen ? "p-4 mt-16 w-full space-y-4" : "hidden"}>
              <h2 className="text-lg font-bold">History</h2>
              <div className="space-y-12">
                <Button className="w-full" onClick={handleNewSession}>
                  New Chat <BsChatSquare/>
                </Button>
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    msg.role === 'user' && index === 0 ?
                    <Button
                      key={index}
                      className="mb-2 p-2 w-full rounded hover:bg-gray-100 cursor-pointer truncate"
                      onClick={() => {
                        setMessages(messages.slice(0, index + 1));
                      }}
                    >
                      {msg.content.substring(0, 50)}...
                    </Button>
                    : <></>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
      )}
    </>
  );
};

export default React.memo(ChatSidebar);

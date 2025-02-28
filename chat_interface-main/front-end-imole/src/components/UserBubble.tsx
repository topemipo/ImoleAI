import React from "react";
import { Button } from "./UI/Button";
import { Edit2Icon } from "lucide-react";
import MarkdownRenderer from "./UI/MarkdownRenderer";
import { Message } from "@/context/ChatContext";


interface UserBubbleProps {
    message: Message;
    setEditingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
    editedMId: string;
}

const UserBubble: React.FC<UserBubbleProps> = ({ message, editedMId, setEditingMessageId }) => {
  return (
    <div className="flex items-end gap-2 group">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditingMessageId(message.id)}
        className="text-orange-500 hover:text-orange-700 text-sm h-6 hover:border hover:border-primary rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity p-1"
        title="edit"
      >
        <Edit2Icon className="w-4 h-4" />
      </Button>
      <div className="max-w-3xl rounded-t-2xl rounded-bl-2xl rounded-br-[4px] border border-secondary bg-orange-100 p-2 text-sm">
        <MarkdownRenderer content={message.content} />
        {message.id === editedMId && (
          <div className="text-xs text-gray-500 mt-1">(edited)</div>
        )}
      </div>
    </div>
  );
};

export default React.memo(UserBubble);

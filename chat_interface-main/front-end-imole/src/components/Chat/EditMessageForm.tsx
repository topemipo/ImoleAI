"use client";

import { useState, useTransition } from "react";
import { Button } from "../UI/Button";
import { Textarea } from "../UI/textarea";
import { Message } from "@/context/ChatContext";
import { X } from "lucide-react";

interface EditMessageFormProps {
  message: Message;
  onSubmit: (messageId: string, content: string) => void;
  onCancel: () => void;
}

export const EditMessageForm: React.FC<EditMessageFormProps> = ({
  message,
  onSubmit,
  onCancel,
}) => {
  const [editedContent, setEditedContent] = useState<string>(message.content);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      onSubmit(message.id, editedContent);
    });
    const textarea = e.currentTarget.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "44px";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <Textarea
        value={editedContent}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          e.target.style.height = "inherit";
          e.target.style.height = `${e.target.scrollHeight}px`;
          setEditedContent(e.target.value);
        }}
        autoFocus
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") onCancel();
        }}
        rows={5}
        className="resize-none"
      />
      <div className="flex gap-2 self-end">
        <Button
          type="button"
          variant="ghost"
          className="border border-primary"
          onClick={onCancel}
        >
          <X color="#000" />
        </Button>
        <Button
          type="submit"
          className="border border-primary"
          disabled={!editedContent.trim() || isPending}
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

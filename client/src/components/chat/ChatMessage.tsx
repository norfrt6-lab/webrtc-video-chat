"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { getSocket } from "@/lib/socket";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const socket = getSocket();
  const isOwn = message.from === socket.id;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-medium text-primary">
          {isOwn ? "You" : message.username}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}

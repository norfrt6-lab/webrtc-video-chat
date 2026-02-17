"use client";

import { X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoomStore } from "@/store/useRoomStore";
import { useUIStore } from "@/store/useUIStore";
import { ParticipantItem } from "./ParticipantItem";

export function ParticipantsSidebar() {
  const participants = useRoomStore((s) => s.participants);
  const username = useRoomStore((s) => s.username);
  const setSidePanel = useUIStore((s) => s.setSidePanel);

  return (
    <div className="flex w-72 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Participants ({participants.length + 1})
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSidePanel(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {/* Local user */}
        <ParticipantItem
          username={`${username} (You)`}
          videoEnabled
          audioEnabled
          isLocal
        />

        {/* Remote participants */}
        {participants.map((p) => (
          <ParticipantItem
            key={p.socketId}
            username={p.username}
            videoEnabled={p.videoEnabled}
            audioEnabled={p.audioEnabled}
            handRaised={p.handRaised}
          />
        ))}
      </ScrollArea>
    </div>
  );
}

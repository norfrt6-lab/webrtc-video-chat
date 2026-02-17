"use client";

import { Video, VideoOff, Mic, MicOff, Hand } from "lucide-react";

interface ParticipantItemProps {
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  isLocal?: boolean;
  handRaised?: boolean;
}

export function ParticipantItem({
  username,
  videoEnabled,
  audioEnabled,
  isLocal,
  handRaised,
}: ParticipantItemProps) {
  return (
    <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-secondary/50">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {username.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium truncate max-w-[120px]">
          {username}
        </span>
        {handRaised && <Hand className="h-4 w-4 text-yellow-400" />}
      </div>
      <div className="flex items-center gap-1.5">
        {videoEnabled ? (
          <Video className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <VideoOff className="h-3.5 w-3.5 text-red-400" />
        )}
        {audioEnabled ? (
          <Mic className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <MicOff className="h-3.5 w-3.5 text-red-400" />
        )}
      </div>
    </div>
  );
}

"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Copy, Lock, Unlock, Users } from "lucide-react";
import { useRoomStore } from "@/store/useRoomStore";
import { getSocket } from "@/lib/socket";

export function RoomHeader() {
  const roomId = useRoomStore((s) => s.roomId);
  const isHost = useRoomStore((s) => s.isHost);
  const locked = useRoomStore((s) => s.locked);
  const participants = useRoomStore((s) => s.participants);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Room link copied to clipboard");
  };

  const toggleLock = () => {
    const socket = getSocket();
    if (locked) {
      socket.emit("unlock-room");
    } else {
      socket.emit("lock-room");
    }
  };

  return (
    <div className="flex items-center justify-between border-b bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold">
          Room: <span className="font-mono text-primary">{roomId}</span>
        </h2>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyRoomLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy room link</TooltipContent>
        </Tooltip>

        {isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleLock}>
                {locked ? (
                  <Lock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{locked ? "Unlock room" : "Lock room"}</TooltipContent>
          </Tooltip>
        )}

        {locked && !isHost && (
          <Lock className="h-4 w-4 text-yellow-500" />
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{participants.length + 1}</span>
      </div>
    </div>
  );
}

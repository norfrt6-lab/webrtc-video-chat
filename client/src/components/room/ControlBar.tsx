"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Users,
  BarChart3,
  Settings,
  Pencil,
  PhoneOff,
  Circle,
  Hand,
} from "lucide-react";
import { useMediaStore } from "@/store/useMediaStore";
import { useUIStore } from "@/store/useUIStore";
import { useChatStore } from "@/store/useChatStore";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

export function ControlBar() {
  const router = useRouter();
  const videoEnabled = useMediaStore((s) => s.videoEnabled);
  const audioEnabled = useMediaStore((s) => s.audioEnabled);
  const screenSharing = useMediaStore((s) => s.screenSharing);
  const recording = useMediaStore((s) => s.recording);
  const recordingTime = useMediaStore((s) => s.recordingTime);
  const sidePanel = useUIStore((s) => s.sidePanel);
  const whiteboardOpen = useUIStore((s) => s.whiteboardOpen);
  const unreadCount = useChatStore((s) => s.unreadCount);

  const { toggleVideo, toggleAudio, startScreenShare, stopScreenShare } =
    useMediaDevices();
  const toggleSidePanel = useUIStore((s) => s.toggleSidePanel);
  const setWhiteboardOpen = useUIStore((s) => s.setWhiteboardOpen);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const handleLeave = () => {
    router.push("/");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 border-t bg-card px-4 py-3">
      {/* Media controls */}
      <ControlButton
        tooltip={videoEnabled ? "Turn off camera" : "Turn on camera"}
        active={videoEnabled}
        onClick={toggleVideo}
        icon={videoEnabled ? Video : VideoOff}
        danger={!videoEnabled}
      />

      <ControlButton
        tooltip={audioEnabled ? "Mute" : "Unmute"}
        active={audioEnabled}
        onClick={toggleAudio}
        icon={audioEnabled ? Mic : MicOff}
        danger={!audioEnabled}
      />

      <ControlButton
        tooltip={screenSharing ? "Stop sharing" : "Share screen"}
        active={screenSharing}
        onClick={screenSharing ? stopScreenShare : startScreenShare}
        icon={screenSharing ? MonitorOff : MonitorUp}
      />

      <div className="mx-1 h-8 w-px bg-border" />

      {/* Feature controls */}
      <div className="relative">
        <ControlButton
          tooltip="Chat"
          active={sidePanel === "chat"}
          onClick={() => {
            toggleSidePanel("chat");
            if (sidePanel !== "chat") useChatStore.getState().resetUnread();
          }}
          icon={MessageSquare}
        />
        {unreadCount > 0 && sidePanel !== "chat" && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      <ControlButton
        tooltip="Participants"
        active={sidePanel === "participants"}
        onClick={() => toggleSidePanel("participants")}
        icon={Users}
      />

      <ControlButton
        tooltip="Whiteboard"
        active={whiteboardOpen}
        onClick={() => setWhiteboardOpen(!whiteboardOpen)}
        icon={Pencil}
      />

      <ControlButton
        tooltip="Stats"
        active={sidePanel === "stats"}
        onClick={() => toggleSidePanel("stats")}
        icon={BarChart3}
      />

      <ControlButton
        tooltip="Settings"
        active={false}
        onClick={() => setSettingsOpen(true)}
        icon={Settings}
      />

      {recording && (
        <span className="ml-2 flex items-center gap-1.5 text-sm text-red-400">
          <Circle className="h-3 w-3 fill-red-500 text-red-500 animate-pulse-ring" />
          {formatTime(recordingTime)}
        </span>
      )}

      <div className="mx-1 h-8 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleLeave}
            className="h-10 w-10"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Leave room</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ControlButton({
  tooltip,
  active,
  danger,
  onClick,
  icon: Icon,
}: {
  tooltip: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={danger ? "destructive" : active ? "secondary" : "ghost"}
          size="icon"
          onClick={onClick}
          className={cn("h-10 w-10", active && !danger && "bg-secondary")}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

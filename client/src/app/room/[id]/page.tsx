"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useRoomStore } from "@/store/useRoomStore";
import { useMediaStore } from "@/store/useMediaStore";
import { usePeerStore } from "@/store/usePeerStore";
import { useChatStore } from "@/store/useChatStore";
import { useUIStore } from "@/store/useUIStore";
import { VideoGrid } from "@/components/room/VideoGrid";
import { ControlBar } from "@/components/room/ControlBar";
import { RoomHeader } from "@/components/room/RoomHeader";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ParticipantsSidebar } from "@/components/participants/ParticipantsSidebar";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { WhiteboardOverlay } from "@/components/whiteboard/WhiteboardOverlay";
import { ReactionBar } from "@/components/reactions/ReactionBar";
import { FloatingEmoji } from "@/components/reactions/FloatingEmoji";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const initialized = useRef(false);

  const { joinRoom, disconnect } = useSocket();
  const { replaceTrack } = useWebRTC();
  const { acquireMedia, enumerateDevices } = useMediaDevices();

  const joined = useRoomStore((s) => s.joined);
  const username = useRoomStore((s) => s.username);
  const sidePanel = useUIStore((s) => s.sidePanel);
  const whiteboardOpen = useUIStore((s) => s.whiteboardOpen);
  const floatingReactions = useUIStore((s) => s.floatingReactions);
  const settingsOpen = useUIStore((s) => s.settingsOpen);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedUsername = sessionStorage.getItem("username");
    if (!storedUsername) {
      router.push("/");
      return;
    }

    const init = async () => {
      try {
        useRoomStore.getState().setRoom(roomId, storedUsername);
        await acquireMedia();
        await enumerateDevices();
        joinRoom(roomId, storedUsername);
      } catch (err) {
        toast.error("Failed to access camera/microphone");
        router.push("/");
      }
    };

    init();

    return () => {
      // Cleanup on unmount
      const { localStream, screenStream } = useMediaStore.getState();
      localStream?.getTracks().forEach((t) => t.stop());
      screenStream?.getTracks().forEach((t) => t.stop());
      usePeerStore.getState().reset();
      useMediaStore.getState().reset();
      useChatStore.getState().reset();
      useUIStore.getState().reset();
      useRoomStore.getState().reset();
      disconnect();
    };
  }, [roomId, router, joinRoom, disconnect, acquireMedia, enumerateDevices]);

  if (!joined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <RoomHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden p-2">
            <VideoGrid />
            {whiteboardOpen && <WhiteboardOverlay />}

            {/* Floating reactions */}
            {floatingReactions.map((r) => (
              <FloatingEmoji key={r.id} emoji={r.emoji} x={r.x} />
            ))}
          </div>

          <ReactionBar />
          <ControlBar />
        </div>

        {/* Side panels */}
        {sidePanel === "chat" && <ChatPanel />}
        {sidePanel === "participants" && <ParticipantsSidebar />}
        {sidePanel === "stats" && <StatsPanel />}
      </div>

      <SettingsDialog open={settingsOpen} />
    </div>
  );
}

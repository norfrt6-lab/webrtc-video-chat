"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  VideoOff,
  MicOff,
  Hand,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  videoEnabled?: boolean;
  audioEnabled?: boolean;
  muted?: boolean;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isActiveSpeaker?: boolean;
  handRaised?: boolean;
}

export function VideoTile({
  stream,
  username,
  videoEnabled = true,
  audioEnabled = true,
  muted = false,
  isLocal = false,
  isScreenShare = false,
  isActiveSpeaker = false,
  handRaised = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg bg-secondary",
        isActiveSpeaker && "ring-2 ring-primary",
        fullscreen && "bg-black"
      )}
    >
      {videoEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={cn(
            "h-full w-full object-cover",
            isLocal && !isScreenShare && "-scale-x-100"
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Overlay indicators */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white drop-shadow">
            {username}
          </span>
          {handRaised && (
            <Hand className="h-4 w-4 text-yellow-400 animate-bounce" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!audioEnabled && (
            <MicOff className="h-3.5 w-3.5 text-red-400" />
          )}
          {!videoEnabled && (
            <VideoOff className="h-3.5 w-3.5 text-red-400" />
          )}
        </div>
      </div>

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute right-2 top-2 rounded-md bg-black/40 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100 [div:hover>&]:opacity-100"
      >
        {fullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

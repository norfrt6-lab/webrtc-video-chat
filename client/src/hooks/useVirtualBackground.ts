"use client";

import { useRef, useCallback } from "react";
import { useMediaStore } from "@/store/useMediaStore";
import { usePeerStore } from "@/store/usePeerStore";

export function useVirtualBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const originalTrackRef = useRef<MediaStreamTrack | null>(null);

  const replaceVideoTrackOnPeers = useCallback((newTrack: MediaStreamTrack) => {
    const peers = usePeerStore.getState().peers;
    Array.from(peers.values()).forEach((peer) => {
      const sender = peer.pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newTrack).catch(() => {});
      }
    });
  }, []);

  const enable = useCallback(
    (mode: "blur" | "image") => {
      const { localStream } = useMediaStore.getState();
      if (!localStream) return;

      const videoTrack = localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      originalTrackRef.current = videoTrack;

      const settings = videoTrack.getSettings();
      const width = settings.width || 640;
      const height = settings.height || 480;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d")!;

      const videoEl = document.createElement("video");
      videoEl.srcObject = new MediaStream([videoTrack]);
      videoEl.autoplay = true;
      videoEl.playsInline = true;

      const render = () => {
        ctx.drawImage(videoEl, 0, 0, width, height);

        if (mode === "blur") {
          ctx.filter = "blur(10px)";
          ctx.globalAlpha = 0.3;
          ctx.drawImage(videoEl, 0, 0, width, height);
          ctx.filter = "none";
          ctx.globalAlpha = 1.0;
          // Draw center portion clearly (approximate person area)
          const cx = width * 0.2;
          const cy = height * 0.1;
          const cw = width * 0.6;
          const ch = height * 0.85;
          ctx.drawImage(videoEl, cx, cy, cw, ch, cx, cy, cw, ch);
        }

        animFrameRef.current = requestAnimationFrame(render);
      };

      videoEl.onloadedmetadata = () => {
        render();
      };

      // Get canvas stream and replace track
      const canvasStream = canvas.captureStream(30);
      const canvasTrack = canvasStream.getVideoTracks()[0];

      localStream.removeTrack(videoTrack);
      localStream.addTrack(canvasTrack);

      // Push to all peers
      replaceVideoTrackOnPeers(canvasTrack);

      useMediaStore.getState().setVirtualBackground(mode);
    },
    [replaceVideoTrackOnPeers],
  );

  const disable = useCallback(() => {
    const { localStream } = useMediaStore.getState();
    if (!localStream || !originalTrackRef.current) return;

    cancelAnimationFrame(animFrameRef.current);

    const canvasTrack = localStream.getVideoTracks()[0];
    if (canvasTrack) localStream.removeTrack(canvasTrack);
    localStream.addTrack(originalTrackRef.current);

    // Push to all peers
    replaceVideoTrackOnPeers(originalTrackRef.current);

    originalTrackRef.current = null;
    canvasRef.current = null;

    useMediaStore.getState().setVirtualBackground("none");
  }, [replaceVideoTrackOnPeers]);

  const toggle = useCallback(
    (mode: "none" | "blur" | "image") => {
      if (mode === "none") {
        disable();
      } else {
        disable(); // reset first
        enable(mode);
      }
    },
    [enable, disable],
  );

  return { enable, disable, toggle };
}

"use client";

import { useCallback } from "react";
import { useMediaStore } from "@/store/useMediaStore";
import { usePeerStore } from "@/store/usePeerStore";
import { getSocket } from "@/lib/socket";
import type { MediaDeviceOption } from "@/lib/types";

function replaceTrackOnPeers(
  kind: "audio" | "video",
  newTrack: MediaStreamTrack,
) {
  const peers = usePeerStore.getState().peers;
  Array.from(peers.values()).forEach((peer) => {
    const sender = peer.pc.getSenders().find((s) => s.track?.kind === kind);
    if (sender) {
      sender.replaceTrack(newTrack).catch(() => {});
    }
  });
}

export function useMediaDevices() {
  const setLocalStream = useMediaStore((s) => s.setLocalStream);
  const setDevices = useMediaStore((s) => s.setDevices);
  const setVideoEnabled = useMediaStore((s) => s.setVideoEnabled);
  const setAudioEnabled = useMediaStore((s) => s.setAudioEnabled);
  const setScreenSharing = useMediaStore((s) => s.setScreenSharing);
  const setScreenStream = useMediaStore((s) => s.setScreenStream);

  const acquireMedia = useCallback(
    async (audioDeviceId?: string, videoDeviceId?: string) => {
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : { echoCancellation: true, noiseSuppression: true },
      };

      // Stop old tracks before acquiring new ones
      const oldStream = useMediaStore.getState().localStream;
      if (oldStream) {
        oldStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Push new tracks to peers
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) replaceTrackOnPeers("video", videoTrack);
      if (audioTrack) replaceTrackOnPeers("audio", audioTrack);

      return stream;
    },
    [setLocalStream],
  );

  const enumerateDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audio: MediaDeviceOption[] = devices
      .filter((d) => d.kind === "audioinput")
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Mic ${d.deviceId.slice(0, 5)}`,
        kind: d.kind,
      }));
    const video: MediaDeviceOption[] = devices
      .filter((d) => d.kind === "videoinput")
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Cam ${d.deviceId.slice(0, 5)}`,
        kind: d.kind,
      }));
    setDevices(audio, video);
    return { audio, video };
  }, [setDevices]);

  const toggleVideo = useCallback(() => {
    const { localStream, videoEnabled } = useMediaStore.getState();
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !videoEnabled;
      setVideoEnabled(!videoEnabled);
      getSocket().emit("toggle-media", {
        type: "video",
        enabled: !videoEnabled,
      });
    }
  }, [setVideoEnabled]);

  const toggleAudio = useCallback(() => {
    const { localStream, audioEnabled } = useMediaStore.getState();
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !audioEnabled;
      setAudioEnabled(!audioEnabled);
      getSocket().emit("toggle-media", {
        type: "audio",
        enabled: !audioEnabled,
      });
    }
  }, [setAudioEnabled]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(stream);
      setScreenSharing(true);
      getSocket().emit("screen-share-started");

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setScreenSharing(false);
        getSocket().emit("screen-share-stopped");
      };

      return stream;
    } catch {
      return null;
    }
  }, [setScreenStream, setScreenSharing]);

  const stopScreenShare = useCallback(() => {
    const { screenStream } = useMediaStore.getState();
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setScreenSharing(false);
      getSocket().emit("screen-share-stopped");
    }
  }, [setScreenStream, setScreenSharing]);

  return {
    acquireMedia,
    enumerateDevices,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  };
}

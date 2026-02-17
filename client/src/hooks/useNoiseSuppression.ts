"use client";

import { useRef, useCallback } from "react";
import { useMediaStore } from "@/store/useMediaStore";
import { usePeerStore } from "@/store/usePeerStore";

export function useNoiseSuppression() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const originalTrackRef = useRef<MediaStreamTrack | null>(null);

  const replaceAudioTrackOnPeers = useCallback((newTrack: MediaStreamTrack) => {
    const peers = usePeerStore.getState().peers;
    Array.from(peers.values()).forEach((peer) => {
      const sender = peer.pc
        .getSenders()
        .find((s) => s.track?.kind === "audio");
      if (sender) {
        sender.replaceTrack(newTrack).catch(() => {});
      }
    });
  }, []);

  const enable = useCallback(() => {
    const { localStream } = useMediaStore.getState();
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    originalTrackRef.current = audioTrack;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(
      new MediaStream([audioTrack]),
    );

    // High-pass filter to remove low-frequency noise
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;

    // Compressor to even out volume
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    // Low-pass to remove high-frequency hiss
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 8000;

    const dest = audioCtx.createMediaStreamDestination();

    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(lowpass);
    lowpass.connect(dest);

    const processedTrack = dest.stream.getAudioTracks()[0];

    // Replace audio track in local stream
    localStream.removeTrack(audioTrack);
    localStream.addTrack(processedTrack);

    // Push to all peers
    replaceAudioTrackOnPeers(processedTrack);

    useMediaStore.getState().setNoiseSuppression(true);
  }, [replaceAudioTrackOnPeers]);

  const disable = useCallback(() => {
    const { localStream } = useMediaStore.getState();
    if (!localStream || !originalTrackRef.current) return;

    // Restore original track
    const processedTrack = localStream.getAudioTracks()[0];
    if (processedTrack) localStream.removeTrack(processedTrack);
    localStream.addTrack(originalTrackRef.current);

    // Push to all peers
    replaceAudioTrackOnPeers(originalTrackRef.current);

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    originalTrackRef.current = null;

    useMediaStore.getState().setNoiseSuppression(false);
  }, [replaceAudioTrackOnPeers]);

  const toggle = useCallback(() => {
    if (useMediaStore.getState().noiseSuppression) {
      disable();
    } else {
      enable();
    }
  }, [enable, disable]);

  return { enable, disable, toggle };
}

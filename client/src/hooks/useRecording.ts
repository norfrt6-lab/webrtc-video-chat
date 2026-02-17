"use client";

import { useRef, useCallback, useEffect } from "react";
import { useMediaStore } from "@/store/useMediaStore";
import { usePeerStore } from "@/store/usePeerStore";

export function useRecording() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setRecording = useMediaStore((s) => s.setRecording);
  const setRecordingTime = useMediaStore((s) => s.setRecordingTime);

  const startRecording = useCallback(() => {
    const localStream = useMediaStore.getState().localStream;
    if (!localStream) return;

    // Mix all streams together
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();

    // Add local audio
    const localAudio = localStream.getAudioTracks()[0];
    if (localAudio) {
      const localSource = audioCtx.createMediaStreamSource(
        new MediaStream([localAudio])
      );
      localSource.connect(dest);
    }

    // Add remote audio
    const peers = usePeerStore.getState().peers;
    peers.forEach((peer) => {
      if (peer.stream) {
        const remoteAudio = peer.stream.getAudioTracks()[0];
        if (remoteAudio) {
          const source = audioCtx.createMediaStreamSource(
            new MediaStream([remoteAudio])
          );
          source.connect(dest);
        }
      }
    });

    // Combine local video + mixed audio
    const videoTrack = localStream.getVideoTracks()[0];
    const tracks: MediaStreamTrack[] = [...dest.stream.getAudioTracks()];
    if (videoTrack) tracks.push(videoTrack);

    const combinedStream = new MediaStream(tracks);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    setRecordingTime(0);

    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds++;
      setRecordingTime(seconds);
    }, 1000);
  }, [setRecording, setRecordingTime]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    setRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [setRecording, setRecordingTime]);

  const toggleRecording = useCallback(() => {
    if (useMediaStore.getState().recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { startRecording, stopRecording, toggleRecording };
}

import { describe, it, expect, beforeEach } from "vitest";
import { useMediaStore } from "@/store/useMediaStore";

describe("useMediaStore", () => {
  beforeEach(() => {
    useMediaStore.getState().reset();
  });

  it("should have correct initial state", () => {
    const state = useMediaStore.getState();
    expect(state.videoEnabled).toBe(true);
    expect(state.audioEnabled).toBe(true);
    expect(state.screenSharing).toBe(false);
    expect(state.recording).toBe(false);
    expect(state.recordingTime).toBe(0);
    expect(state.noiseSuppression).toBe(false);
    expect(state.virtualBackground).toBe("none");
    expect(state.localStream).toBeNull();
    expect(state.screenStream).toBeNull();
    expect(state.audioDevices).toEqual([]);
    expect(state.videoDevices).toEqual([]);
  });

  it("should toggle video", () => {
    useMediaStore.getState().setVideoEnabled(false);
    expect(useMediaStore.getState().videoEnabled).toBe(false);
    useMediaStore.getState().setVideoEnabled(true);
    expect(useMediaStore.getState().videoEnabled).toBe(true);
  });

  it("should toggle audio", () => {
    useMediaStore.getState().setAudioEnabled(false);
    expect(useMediaStore.getState().audioEnabled).toBe(false);
  });

  it("should set screen sharing", () => {
    useMediaStore.getState().setScreenSharing(true);
    expect(useMediaStore.getState().screenSharing).toBe(true);
  });

  it("should set recording state and time", () => {
    useMediaStore.getState().setRecording(true);
    useMediaStore.getState().setRecordingTime(42);
    expect(useMediaStore.getState().recording).toBe(true);
    expect(useMediaStore.getState().recordingTime).toBe(42);
  });

  it("should set devices", () => {
    const audio = [{ deviceId: "a1", label: "Mic 1", kind: "audioinput" as MediaDeviceKind }];
    const video = [{ deviceId: "v1", label: "Cam 1", kind: "videoinput" as MediaDeviceKind }];
    useMediaStore.getState().setDevices(audio, video);
    expect(useMediaStore.getState().audioDevices).toEqual(audio);
    expect(useMediaStore.getState().videoDevices).toEqual(video);
  });

  it("should set virtual background", () => {
    useMediaStore.getState().setVirtualBackground("blur");
    expect(useMediaStore.getState().virtualBackground).toBe("blur");
  });

  it("should set noise suppression", () => {
    useMediaStore.getState().setNoiseSuppression(true);
    expect(useMediaStore.getState().noiseSuppression).toBe(true);
  });

  it("should reset all state", () => {
    useMediaStore.getState().setVideoEnabled(false);
    useMediaStore.getState().setScreenSharing(true);
    useMediaStore.getState().setRecording(true);
    useMediaStore.getState().reset();
    const state = useMediaStore.getState();
    expect(state.videoEnabled).toBe(true);
    expect(state.screenSharing).toBe(false);
    expect(state.recording).toBe(false);
  });
});

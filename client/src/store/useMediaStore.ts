import { create } from "zustand";
import type { MediaDeviceOption } from "@/lib/types";

interface MediaState {
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
  recording: boolean;
  recordingTime: number;
  noiseSuppression: boolean;
  virtualBackground: "none" | "blur" | "image";
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioDevices: MediaDeviceOption[];
  videoDevices: MediaDeviceOption[];
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  // Actions
  setVideoEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  setRecording: (recording: boolean) => void;
  setRecordingTime: (time: number) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setVirtualBackground: (bg: "none" | "blur" | "image") => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setDevices: (audio: MediaDeviceOption[], video: MediaDeviceOption[]) => void;
  setSelectedAudioDevice: (deviceId: string) => void;
  setSelectedVideoDevice: (deviceId: string) => void;
  reset: () => void;
}

const initialState = {
  videoEnabled: true,
  audioEnabled: true,
  screenSharing: false,
  recording: false,
  recordingTime: 0,
  noiseSuppression: false,
  virtualBackground: "none" as const,
  localStream: null as MediaStream | null,
  screenStream: null as MediaStream | null,
  audioDevices: [] as MediaDeviceOption[],
  videoDevices: [] as MediaDeviceOption[],
  selectedAudioDevice: "",
  selectedVideoDevice: "",
};

export const useMediaStore = create<MediaState>((set) => ({
  ...initialState,

  setVideoEnabled: (enabled) => set({ videoEnabled: enabled }),
  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),
  setScreenSharing: (sharing) => set({ screenSharing: sharing }),
  setRecording: (recording) => set({ recording }),
  setRecordingTime: (time) => set({ recordingTime: time }),
  setNoiseSuppression: (enabled) => set({ noiseSuppression: enabled }),
  setVirtualBackground: (bg) => set({ virtualBackground: bg }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  setDevices: (audio, video) => set({ audioDevices: audio, videoDevices: video }),
  setSelectedAudioDevice: (deviceId) => set({ selectedAudioDevice: deviceId }),
  setSelectedVideoDevice: (deviceId) => set({ selectedVideoDevice: deviceId }),
  reset: () => set(initialState),
}));

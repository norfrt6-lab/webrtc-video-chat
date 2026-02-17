"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, AudioLines, Sparkles } from "lucide-react";
import { useMediaStore } from "@/store/useMediaStore";
import { useUIStore } from "@/store/useUIStore";
import { useMediaDevices } from "@/hooks/useMediaDevices";

interface SettingsDialogProps {
  open: boolean;
}

export function SettingsDialog({ open }: SettingsDialogProps) {
  const audioDevices = useMediaStore((s) => s.audioDevices);
  const videoDevices = useMediaStore((s) => s.videoDevices);
  const selectedAudioDevice = useMediaStore((s) => s.selectedAudioDevice);
  const selectedVideoDevice = useMediaStore((s) => s.selectedVideoDevice);
  const noiseSuppression = useMediaStore((s) => s.noiseSuppression);
  const virtualBackground = useMediaStore((s) => s.virtualBackground);
  const setSelectedAudioDevice = useMediaStore((s) => s.setSelectedAudioDevice);
  const setSelectedVideoDevice = useMediaStore((s) => s.setSelectedVideoDevice);
  const setNoiseSuppression = useMediaStore((s) => s.setNoiseSuppression);
  const setVirtualBackground = useMediaStore((s) => s.setVirtualBackground);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const { acquireMedia } = useMediaDevices();

  const handleAudioChange = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    await acquireMedia(deviceId, selectedVideoDevice || undefined);
  };

  const handleVideoChange = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    await acquireMedia(selectedAudioDevice || undefined, deviceId);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setSettingsOpen(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Audio device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Microphone</label>
            <Select value={selectedAudioDevice} onValueChange={handleAudioChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioDevices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video device */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Camera</label>
            <Select value={selectedVideoDevice} onValueChange={handleVideoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {videoDevices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Noise suppression */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AudioLines className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Noise Suppression</span>
            </div>
            <Button
              variant={noiseSuppression ? "secondary" : "outline"}
              size="sm"
              onClick={() => setNoiseSuppression(!noiseSuppression)}
            >
              {noiseSuppression ? "On" : "Off"}
            </Button>
          </div>

          {/* Virtual background */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Virtual Background</span>
            </div>
            <div className="flex gap-2">
              {(["none", "blur", "image"] as const).map((bg) => (
                <Button
                  key={bg}
                  variant={virtualBackground === bg ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setVirtualBackground(bg)}
                  className="flex-1 capitalize"
                >
                  {bg}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

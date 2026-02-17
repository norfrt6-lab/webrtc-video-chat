"use client";

import { usePeerStore } from "@/store/usePeerStore";
import { useMediaStore } from "@/store/useMediaStore";
import { useRoomStore } from "@/store/useRoomStore";
import { VideoTile } from "./VideoTile";

export function VideoGrid() {
  const localStream = useMediaStore((s) => s.localStream);
  const screenStream = useMediaStore((s) => s.screenStream);
  const videoEnabled = useMediaStore((s) => s.videoEnabled);
  const audioEnabled = useMediaStore((s) => s.audioEnabled);
  const username = useRoomStore((s) => s.username);
  const peers = usePeerStore((s) => s.peers);
  const activeSpeaker = usePeerStore((s) => s.activeSpeaker);

  const peerEntries = Array.from(peers.entries());
  const totalCount = 1 + peerEntries.length + (screenStream ? 1 : 0);

  // Adaptive grid columns
  const gridCols =
    totalCount <= 1
      ? "grid-cols-1"
      : totalCount <= 2
        ? "grid-cols-1 md:grid-cols-2"
        : totalCount <= 4
          ? "grid-cols-2"
          : totalCount <= 6
            ? "grid-cols-2 md:grid-cols-3"
            : "grid-cols-3 md:grid-cols-4";

  return (
    <div className={`grid h-full gap-2 ${gridCols}`}>
      {/* Local video */}
      <VideoTile
        stream={localStream}
        username={`${username} (You)`}
        muted
        videoEnabled={videoEnabled}
        audioEnabled={audioEnabled}
        isLocal
      />

      {/* Screen share */}
      {screenStream && (
        <VideoTile
          stream={screenStream}
          username={`${username} (Screen)`}
          muted
          videoEnabled
          audioEnabled={false}
          isScreenShare
        />
      )}

      {/* Remote peers */}
      {peerEntries.map(([socketId, peer]) => {
        const participant = useRoomStore
          .getState()
          .participants.find((p) => p.socketId === socketId);
        return (
          <VideoTile
            key={socketId}
            stream={peer.stream ?? null}
            username={peer.username}
            videoEnabled={participant?.videoEnabled ?? true}
            audioEnabled={participant?.audioEnabled ?? true}
            handRaised={participant?.handRaised}
            isActiveSpeaker={activeSpeaker === socketId}
          />
        );
      })}
    </div>
  );
}

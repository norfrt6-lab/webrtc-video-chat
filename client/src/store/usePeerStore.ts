import { create } from "zustand";
import type { PeerConnection, PeerQualityStats } from "@/lib/types";

interface PeerState {
  peers: Map<string, PeerConnection>;
  qualityStats: Map<string, PeerQualityStats>;
  activeSpeaker: string | null;
  // Actions
  setPeer: (socketId: string, peer: PeerConnection) => void;
  removePeer: (socketId: string) => void;
  updatePeerStream: (socketId: string, stream: MediaStream) => void;
  setQualityStats: (socketId: string, stats: PeerQualityStats) => void;
  setActiveSpeaker: (socketId: string | null) => void;
  reset: () => void;
}

export const usePeerStore = create<PeerState>((set) => ({
  peers: new Map(),
  qualityStats: new Map(),
  activeSpeaker: null,

  setPeer: (socketId, peer) =>
    set((state) => {
      const peers = new Map(state.peers);
      peers.set(socketId, peer);
      return { peers };
    }),

  removePeer: (socketId) =>
    set((state) => {
      const peers = new Map(state.peers);
      const peer = peers.get(socketId);
      if (peer) {
        peer.pc.close();
        peers.delete(socketId);
      }
      const qualityStats = new Map(state.qualityStats);
      qualityStats.delete(socketId);
      return { peers, qualityStats };
    }),

  updatePeerStream: (socketId, stream) =>
    set((state) => {
      const peers = new Map(state.peers);
      const peer = peers.get(socketId);
      if (peer) {
        peers.set(socketId, { ...peer, stream });
      }
      return { peers };
    }),

  setQualityStats: (socketId, stats) =>
    set((state) => {
      const qualityStats = new Map(state.qualityStats);
      qualityStats.set(socketId, stats);
      return { qualityStats };
    }),

  setActiveSpeaker: (socketId) => set({ activeSpeaker: socketId }),

  reset: () =>
    set((state) => {
      state.peers.forEach((peer) => peer.pc.close());
      return { peers: new Map(), qualityStats: new Map(), activeSpeaker: null };
    }),
}));

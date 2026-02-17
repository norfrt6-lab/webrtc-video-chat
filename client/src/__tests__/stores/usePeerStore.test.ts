import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePeerStore } from "@/store/usePeerStore";

const mockPC = {
  close: vi.fn(),
  getSenders: vi.fn(() => []),
  getStats: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as RTCPeerConnection;

describe("usePeerStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Manual reset without calling close on mock
    usePeerStore.setState({
      peers: new Map(),
      qualityStats: new Map(),
      activeSpeaker: null,
    });
  });

  it("should have correct initial state", () => {
    const state = usePeerStore.getState();
    expect(state.peers.size).toBe(0);
    expect(state.qualityStats.size).toBe(0);
    expect(state.activeSpeaker).toBeNull();
  });

  it("should add a peer", () => {
    usePeerStore.getState().setPeer("s1", {
      pc: mockPC,
      username: "Alice",
    });
    expect(usePeerStore.getState().peers.size).toBe(1);
    expect(usePeerStore.getState().peers.get("s1")?.username).toBe("Alice");
  });

  it("should remove a peer and close connection", () => {
    usePeerStore.getState().setPeer("s1", {
      pc: mockPC,
      username: "Alice",
    });
    usePeerStore.getState().removePeer("s1");
    expect(usePeerStore.getState().peers.size).toBe(0);
    expect(mockPC.close).toHaveBeenCalled();
  });

  it("should update peer stream", () => {
    const stream = { id: "mock-stream" } as unknown as MediaStream;
    usePeerStore.getState().setPeer("s1", { pc: mockPC, username: "Alice" });
    usePeerStore.getState().updatePeerStream("s1", stream);
    expect(usePeerStore.getState().peers.get("s1")?.stream).toBe(stream);
  });

  it("should set quality stats", () => {
    const stats = {
      socketId: "s1",
      bitrate: 1000,
      resolution: "1280x720",
      fps: 30,
      rtt: 50,
      jitter: 2,
      packetLoss: 0.1,
      connectionState: "connected",
    };
    usePeerStore.getState().setQualityStats("s1", stats);
    expect(usePeerStore.getState().qualityStats.get("s1")).toEqual(stats);
  });

  it("should remove quality stats when peer removed", () => {
    usePeerStore.getState().setPeer("s1", { pc: mockPC, username: "Alice" });
    usePeerStore.getState().setQualityStats("s1", {
      socketId: "s1",
      bitrate: 1000,
      resolution: "1280x720",
      fps: 30,
      rtt: 50,
      jitter: 2,
      packetLoss: 0.1,
      connectionState: "connected",
    });
    usePeerStore.getState().removePeer("s1");
    expect(usePeerStore.getState().qualityStats.size).toBe(0);
  });

  it("should set active speaker", () => {
    usePeerStore.getState().setActiveSpeaker("s1");
    expect(usePeerStore.getState().activeSpeaker).toBe("s1");
    usePeerStore.getState().setActiveSpeaker(null);
    expect(usePeerStore.getState().activeSpeaker).toBeNull();
  });
});

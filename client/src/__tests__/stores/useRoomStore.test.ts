import { describe, it, expect, beforeEach } from "vitest";
import { useRoomStore } from "@/store/useRoomStore";

describe("useRoomStore", () => {
  beforeEach(() => {
    useRoomStore.getState().reset();
  });

  it("should have correct initial state", () => {
    const state = useRoomStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.username).toBe("");
    expect(state.isHost).toBe(false);
    expect(state.locked).toBe(false);
    expect(state.joined).toBe(false);
    expect(state.participants).toEqual([]);
  });

  it("should set room info", () => {
    useRoomStore.getState().setRoom("room-123", "Alice");
    const state = useRoomStore.getState();
    expect(state.roomId).toBe("room-123");
    expect(state.username).toBe("Alice");
  });

  it("should set joined state", () => {
    useRoomStore.getState().setJoined(true);
    expect(useRoomStore.getState().joined).toBe(true);
  });

  it("should set host state", () => {
    useRoomStore.getState().setIsHost(true);
    expect(useRoomStore.getState().isHost).toBe(true);
  });

  it("should set locked state", () => {
    useRoomStore.getState().setLocked(true);
    expect(useRoomStore.getState().locked).toBe(true);
  });

  it("should set participants", () => {
    const participants = [
      { socketId: "s1", username: "Alice", videoEnabled: true, audioEnabled: true },
      { socketId: "s2", username: "Bob", videoEnabled: false, audioEnabled: true },
    ];
    useRoomStore.getState().setParticipants(participants);
    expect(useRoomStore.getState().participants).toEqual(participants);
  });

  it("should update a participant", () => {
    useRoomStore.getState().setParticipants([
      { socketId: "s1", username: "Alice", videoEnabled: true, audioEnabled: true },
    ]);
    useRoomStore.getState().updateParticipant("s1", { videoEnabled: false });
    expect(useRoomStore.getState().participants[0].videoEnabled).toBe(false);
  });

  it("should remove a participant", () => {
    useRoomStore.getState().setParticipants([
      { socketId: "s1", username: "Alice", videoEnabled: true, audioEnabled: true },
      { socketId: "s2", username: "Bob", videoEnabled: true, audioEnabled: true },
    ]);
    useRoomStore.getState().removeParticipant("s1");
    expect(useRoomStore.getState().participants).toHaveLength(1);
    expect(useRoomStore.getState().participants[0].socketId).toBe("s2");
  });

  it("should reset state", () => {
    useRoomStore.getState().setRoom("room-123", "Alice");
    useRoomStore.getState().setJoined(true);
    useRoomStore.getState().setIsHost(true);
    useRoomStore.getState().reset();
    const state = useRoomStore.getState();
    expect(state.roomId).toBeNull();
    expect(state.username).toBe("");
    expect(state.joined).toBe(false);
    expect(state.isHost).toBe(false);
  });
});

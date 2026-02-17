import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/store/useUIStore";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it("should have correct initial state", () => {
    const state = useUIStore.getState();
    expect(state.sidePanel).toBeNull();
    expect(state.whiteboardOpen).toBe(false);
    expect(state.settingsOpen).toBe(false);
    expect(state.passwordModalOpen).toBe(false);
    expect(state.pendingRoomId).toBeNull();
    expect(state.floatingReactions).toEqual([]);
  });

  it("should set side panel", () => {
    useUIStore.getState().setSidePanel("chat");
    expect(useUIStore.getState().sidePanel).toBe("chat");
  });

  it("should toggle side panel", () => {
    useUIStore.getState().toggleSidePanel("chat");
    expect(useUIStore.getState().sidePanel).toBe("chat");
    useUIStore.getState().toggleSidePanel("chat");
    expect(useUIStore.getState().sidePanel).toBeNull();
  });

  it("should switch between different side panels", () => {
    useUIStore.getState().toggleSidePanel("chat");
    expect(useUIStore.getState().sidePanel).toBe("chat");
    useUIStore.getState().toggleSidePanel("participants");
    expect(useUIStore.getState().sidePanel).toBe("participants");
  });

  it("should set whiteboard open", () => {
    useUIStore.getState().setWhiteboardOpen(true);
    expect(useUIStore.getState().whiteboardOpen).toBe(true);
  });

  it("should set settings open", () => {
    useUIStore.getState().setSettingsOpen(true);
    expect(useUIStore.getState().settingsOpen).toBe(true);
  });

  it("should handle password modal", () => {
    useUIStore.getState().setPasswordModal(true, "room-123");
    expect(useUIStore.getState().passwordModalOpen).toBe(true);
    expect(useUIStore.getState().pendingRoomId).toBe("room-123");
    useUIStore.getState().setPasswordModal(false);
    expect(useUIStore.getState().passwordModalOpen).toBe(false);
  });

  it("should add and remove reactions", () => {
    const reaction = { id: "r1", emoji: "👍", username: "Alice", x: 50 };
    useUIStore.getState().addReaction(reaction);
    expect(useUIStore.getState().floatingReactions).toHaveLength(1);
    useUIStore.getState().removeReaction("r1");
    expect(useUIStore.getState().floatingReactions).toHaveLength(0);
  });

  it("should reset all state", () => {
    useUIStore.getState().setSidePanel("chat");
    useUIStore.getState().setWhiteboardOpen(true);
    useUIStore.getState().addReaction({ id: "r1", emoji: "👍", username: "A", x: 0 });
    useUIStore.getState().reset();
    const state = useUIStore.getState();
    expect(state.sidePanel).toBeNull();
    expect(state.whiteboardOpen).toBe(false);
    expect(state.floatingReactions).toEqual([]);
  });
});

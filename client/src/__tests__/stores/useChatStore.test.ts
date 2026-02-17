import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/store/useChatStore";

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  it("should have correct initial state", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it("should add a message", () => {
    const msg = {
      id: "1",
      from: "s1",
      username: "Alice",
      message: "Hello",
      timestamp: Date.now(),
    };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0]).toEqual(msg);
  });

  it("should add multiple messages", () => {
    const msg1 = { id: "1", from: "s1", username: "Alice", message: "Hi", timestamp: 1 };
    const msg2 = { id: "2", from: "s2", username: "Bob", message: "Hey", timestamp: 2 };
    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);
    expect(useChatStore.getState().messages).toHaveLength(2);
  });

  it("should increment unread count", () => {
    useChatStore.getState().incrementUnread();
    useChatStore.getState().incrementUnread();
    expect(useChatStore.getState().unreadCount).toBe(2);
  });

  it("should reset unread count", () => {
    useChatStore.getState().incrementUnread();
    useChatStore.getState().incrementUnread();
    useChatStore.getState().resetUnread();
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  it("should reset all state", () => {
    useChatStore.getState().addMessage({
      id: "1", from: "s1", username: "Alice", message: "Hi", timestamp: 1,
    });
    useChatStore.getState().incrementUnread();
    useChatStore.getState().reset();
    expect(useChatStore.getState().messages).toEqual([]);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });
});

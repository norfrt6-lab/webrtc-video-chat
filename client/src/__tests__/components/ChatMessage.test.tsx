import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "@/components/chat/ChatMessage";

// Mock socket
vi.mock("@/lib/socket", () => ({
  getSocket: () => ({ id: "my-socket-id" }),
}));

describe("ChatMessage", () => {
  it("should render message text", () => {
    render(
      <ChatMessage
        message={{
          id: "1",
          from: "other-id",
          username: "Alice",
          message: "Hello world!",
          timestamp: Date.now(),
        }}
      />
    );
    expect(screen.getByText("Hello world!")).toBeDefined();
  });

  it("should show username for other users", () => {
    render(
      <ChatMessage
        message={{
          id: "1",
          from: "other-id",
          username: "Alice",
          message: "Hi",
          timestamp: Date.now(),
        }}
      />
    );
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("should show 'You' for own messages", () => {
    render(
      <ChatMessage
        message={{
          id: "1",
          from: "my-socket-id",
          username: "Me",
          message: "My message",
          timestamp: Date.now(),
        }}
      />
    );
    expect(screen.getByText("You")).toBeDefined();
  });

  it("should format timestamp", () => {
    const ts = new Date(2025, 0, 15, 14, 30).getTime();
    render(
      <ChatMessage
        message={{
          id: "1",
          from: "other-id",
          username: "Alice",
          message: "Hi",
          timestamp: ts,
        }}
      />
    );
    // Should render time in some format
    const timeElement = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeElement).toBeDefined();
  });
});

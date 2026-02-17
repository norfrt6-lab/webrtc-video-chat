import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LobbyForm } from "@/components/lobby/LobbyForm";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("LobbyForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    sessionStorage.clear();
  });

  it("should render the form", () => {
    render(<LobbyForm />);
    expect(screen.getByPlaceholderText("Enter your name")).toBeDefined();
    expect(screen.getByPlaceholderText("Enter room ID to join")).toBeDefined();
    expect(screen.getByText("Create New Room")).toBeDefined();
    expect(screen.getByText("Join Room")).toBeDefined();
  });

  it("should create a room and navigate", () => {
    render(<LobbyForm />);
    const nameInput = screen.getByPlaceholderText("Enter your name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    fireEvent.click(screen.getByText("Create New Room"));
    expect(sessionStorage.getItem("username")).toBe("Alice");
    expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/room\/.+/));
  });

  it("should join a room with room ID", () => {
    render(<LobbyForm />);
    const nameInput = screen.getByPlaceholderText("Enter your name");
    const roomInput = screen.getByPlaceholderText("Enter room ID to join");
    fireEvent.change(nameInput, { target: { value: "Bob" } });
    fireEvent.change(roomInput, { target: { value: "test-room" } });
    fireEvent.click(screen.getByText("Join Room"));
    expect(pushMock).toHaveBeenCalledWith("/room/test-room");
  });

  it("should use Anonymous if no name provided", () => {
    render(<LobbyForm />);
    fireEvent.click(screen.getByText("Create New Room"));
    expect(sessionStorage.getItem("username")).toBe("Anonymous");
  });

  it("should disable join button when room ID is empty", () => {
    render(<LobbyForm />);
    const joinButton = screen.getByText("Join Room");
    expect(joinButton).toBeDisabled();
  });

  it("should show meeting history link", () => {
    render(<LobbyForm />);
    expect(screen.getByText("Meeting History")).toBeDefined();
  });
});

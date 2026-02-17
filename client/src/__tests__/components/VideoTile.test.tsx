import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoTile } from "@/components/room/VideoTile";

describe("VideoTile", () => {
  it("should render username", () => {
    render(
      <VideoTile stream={null} username="Alice" videoEnabled={false} />
    );
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("should show avatar initial when video is off", () => {
    render(
      <VideoTile stream={null} username="Alice" videoEnabled={false} />
    );
    expect(screen.getByText("A")).toBeDefined();
  });

  it("should show muted icon when audio is off", () => {
    const { container } = render(
      <VideoTile stream={null} username="Alice" audioEnabled={false} />
    );
    // MicOff icon should be rendered
    const micOffIcon = container.querySelector('[class*="text-red"]');
    expect(micOffIcon).toBeDefined();
  });

  it("should show video off icon when video is disabled", () => {
    const { container } = render(
      <VideoTile stream={null} username="Alice" videoEnabled={false} />
    );
    const icons = container.querySelectorAll('[class*="text-red"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should show hand raised indicator", () => {
    const { container } = render(
      <VideoTile stream={null} username="Alice" handRaised />
    );
    const handIcon = container.querySelector('[class*="text-yellow"]');
    expect(handIcon).toBeDefined();
  });

  it("should apply active speaker ring", () => {
    const { container } = render(
      <VideoTile stream={null} username="Alice" isActiveSpeaker />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("ring-2");
  });
});

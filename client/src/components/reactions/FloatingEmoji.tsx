"use client";

interface FloatingEmojiProps {
  emoji: string;
  x: number;
}

export function FloatingEmoji({ emoji, x }: FloatingEmojiProps) {
  return (
    <div
      className="pointer-events-none absolute bottom-20 text-3xl animate-float-up"
      style={{ left: `${x}%` }}
    >
      {emoji}
    </div>
  );
}

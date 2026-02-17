"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, LogIn, History } from "lucide-react";
import Link from "next/link";

export function LobbyForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    return Math.random().toString(36).slice(2, 10);
  };

  const handleCreate = () => {
    const name = username.trim() || "Anonymous";
    const newRoomId = generateRoomId();
    sessionStorage.setItem("username", name);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoin = () => {
    const name = username.trim() || "Anonymous";
    const id = roomId.trim();
    if (!id) return;
    sessionStorage.setItem("username", name);
    router.push(`/room/${id}`);
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Your Name</label>
          <Input
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
          />
        </div>

        <Button onClick={handleCreate} className="w-full" size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create New Room
        </Button>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </span>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Room ID</label>
          <Input
            placeholder="Enter room ID to join"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
        </div>

        <Button
          onClick={handleJoin}
          variant="secondary"
          className="w-full"
          size="lg"
          disabled={!roomId.trim()}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Join Room
        </Button>

        <Separator />

        <Link href="/history" className="block">
          <Button variant="ghost" className="w-full" size="sm">
            <History className="mr-2 h-4 w-4" />
            Meeting History
          </Button>
        </Link>
      </div>
    </div>
  );
}

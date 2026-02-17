"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useRoomStore } from "@/store/useRoomStore";
import { getSocket } from "@/lib/socket";

export function PasswordModal() {
  const [password, setPassword] = useState("");
  const open = useUIStore((s) => s.passwordModalOpen);
  const pendingRoomId = useUIStore((s) => s.pendingRoomId);
  const setPasswordModal = useUIStore((s) => s.setPasswordModal);
  const username = useRoomStore((s) => s.username);

  const handleSubmit = () => {
    if (!pendingRoomId || !password.trim()) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("join-room", { roomId: pendingRoomId, username, password });
    setPassword("");
    setPasswordModal(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && setPasswordModal(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Room Password
          </DialogTitle>
          <DialogDescription>
            This room requires a password to join.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setPasswordModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!password.trim()}>
            Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

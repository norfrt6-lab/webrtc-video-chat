"use client";

import { LobbyForm } from "@/components/lobby/LobbyForm";
import { PasswordModal } from "@/components/lobby/PasswordModal";
import { Video } from "lucide-react";

export default function LobbyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Video Chat
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create or join a room to start a video call
          </p>
        </div>
        <LobbyForm />
      </div>
      <PasswordModal />
    </div>
  );
}

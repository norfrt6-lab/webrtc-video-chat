"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSocket, disconnectSocket, type TypedSocket } from "@/lib/socket";
import { useRoomStore } from "@/store/useRoomStore";
import { useChatStore } from "@/store/useChatStore";
import { useUIStore } from "@/store/useUIStore";

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);

  const setJoined = useRoomStore((s) => s.setJoined);
  const setIsHost = useRoomStore((s) => s.setIsHost);
  const setLocked = useRoomStore((s) => s.setLocked);
  const setParticipants = useRoomStore((s) => s.setParticipants);
  const updateParticipant = useRoomStore((s) => s.updateParticipant);
  const addMessage = useChatStore((s) => s.addMessage);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const sidePanel = useUIStore((s) => s.sidePanel);
  const addReaction = useUIStore((s) => s.addReaction);
  const removeReaction = useUIStore((s) => s.removeReaction);

  const connect = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socketRef.current = socket;
    return socket;
  }, []);

  const joinRoom = useCallback(
    (roomId: string, username: string, password?: string) => {
      const socket = connect();
      socket.emit("join-room", { roomId, username, password });
    },
    [connect],
  );

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    // ── Room events ──
    const onRoomJoined = (data: any) => {
      setJoined(true);
      setIsHost(data.isHost);
      setLocked(data.locked);
      setParticipants(data.participants);
    };

    const onParticipantUpdate = (data: any) => {
      setParticipants(data.participants);
    };

    const onHostChanged = (data: any) => {
      setIsHost(data.isHost);
    };

    const onRoomLockChanged = (data: any) => {
      setLocked(data.locked);
    };

    const onErrorMessage = (data: any) => {
      if (data.message === "password-required") {
        const { setPasswordModal } = useUIStore.getState();
        const { roomId } = useRoomStore.getState();
        setPasswordModal(true, roomId);
      }
    };

    // ── Chat ──
    const onChatMessage = (msg: any) => {
      addMessage(msg);
      const currentPanel = useUIStore.getState().sidePanel;
      if (currentPanel !== "chat") {
        incrementUnread();
      }
    };

    // ── Media ──
    const onMediaToggled = ({ socketId, type, enabled }: any) => {
      if (type === "video") {
        updateParticipant(socketId, { videoEnabled: enabled });
      } else {
        updateParticipant(socketId, { audioEnabled: enabled });
      }
    };

    const onScreenShareStarted = ({ socketId }: any) => {
      updateParticipant(socketId, { isScreenSharing: true });
    };

    const onScreenShareStopped = ({ socketId }: any) => {
      updateParticipant(socketId, { isScreenSharing: false });
    };

    // ── Reactions ──
    const onEmojiReaction = ({ emoji, username }: any) => {
      const id = Math.random().toString(36).slice(2);
      const x = 10 + Math.random() * 80;
      addReaction({ id, emoji, username, x });
      setTimeout(() => removeReaction(id), 2000);
    };

    const onHandRaise = ({ socketId, raised }: any) => {
      updateParticipant(socketId, { handRaised: raised });
    };

    socket.on("room-joined", onRoomJoined);
    socket.on("participant-update", onParticipantUpdate);
    socket.on("host-changed", onHostChanged);
    socket.on("room-lock-changed", onRoomLockChanged);
    socket.on("error-message", onErrorMessage);
    socket.on("chat-message", onChatMessage);
    socket.on("media-toggled", onMediaToggled);
    socket.on("screen-share-started", onScreenShareStarted);
    socket.on("screen-share-stopped", onScreenShareStopped);
    socket.on("emoji-reaction", onEmojiReaction);
    socket.on("hand-raise", onHandRaise);

    return () => {
      socket.off("room-joined", onRoomJoined);
      socket.off("participant-update", onParticipantUpdate);
      socket.off("host-changed", onHostChanged);
      socket.off("room-lock-changed", onRoomLockChanged);
      socket.off("error-message", onErrorMessage);
      socket.off("chat-message", onChatMessage);
      socket.off("media-toggled", onMediaToggled);
      socket.off("screen-share-started", onScreenShareStarted);
      socket.off("screen-share-stopped", onScreenShareStopped);
      socket.off("emoji-reaction", onEmojiReaction);
      socket.off("hand-raise", onHandRaise);
    };
  }, [
    setJoined,
    setIsHost,
    setLocked,
    setParticipants,
    updateParticipant,
    addMessage,
    incrementUnread,
    addReaction,
    removeReaction,
  ]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
  }, []);

  return { socket: socketRef, connect, joinRoom, disconnect };
}

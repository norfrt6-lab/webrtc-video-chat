import { create } from "zustand";
import type { Participant } from "@/lib/types";

interface RoomState {
  roomId: string | null;
  username: string;
  isHost: boolean;
  locked: boolean;
  joined: boolean;
  participants: Participant[];
  // Actions
  setRoom: (roomId: string, username: string) => void;
  setJoined: (joined: boolean) => void;
  setIsHost: (isHost: boolean) => void;
  setLocked: (locked: boolean) => void;
  setParticipants: (participants: Participant[]) => void;
  updateParticipant: (socketId: string, update: Partial<Participant>) => void;
  removeParticipant: (socketId: string) => void;
  reset: () => void;
}

const initialState = {
  roomId: null as string | null,
  username: "",
  isHost: false,
  locked: false,
  joined: false,
  participants: [] as Participant[],
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoom: (roomId, username) => set({ roomId, username }),

  setJoined: (joined) => set({ joined }),

  setIsHost: (isHost) => set({ isHost }),

  setLocked: (locked) => set({ locked }),

  setParticipants: (participants) => set({ participants }),

  updateParticipant: (socketId, update) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.socketId === socketId ? { ...p, ...update } : p
      ),
    })),

  removeParticipant: (socketId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.socketId !== socketId),
    })),

  reset: () => set(initialState),
}));

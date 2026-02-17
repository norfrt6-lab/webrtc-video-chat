import { create } from "zustand";
import type { SidePanel, FloatingReaction } from "@/lib/types";

interface UIState {
  sidePanel: SidePanel;
  whiteboardOpen: boolean;
  settingsOpen: boolean;
  passwordModalOpen: boolean;
  pendingRoomId: string | null;
  floatingReactions: FloatingReaction[];
  // Actions
  setSidePanel: (panel: SidePanel) => void;
  toggleSidePanel: (panel: NonNullable<SidePanel>) => void;
  setWhiteboardOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setPasswordModal: (open: boolean, roomId?: string | null) => void;
  addReaction: (reaction: FloatingReaction) => void;
  removeReaction: (id: string) => void;
  reset: () => void;
}

const initialState = {
  sidePanel: null as SidePanel,
  whiteboardOpen: false,
  settingsOpen: false,
  passwordModalOpen: false,
  pendingRoomId: null as string | null,
  floatingReactions: [] as FloatingReaction[],
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  setSidePanel: (panel) => set({ sidePanel: panel }),

  toggleSidePanel: (panel) =>
    set((state) => ({
      sidePanel: state.sidePanel === panel ? null : panel,
    })),

  setWhiteboardOpen: (open) => set({ whiteboardOpen: open }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setPasswordModal: (open, roomId = null) =>
    set({ passwordModalOpen: open, pendingRoomId: roomId }),

  addReaction: (reaction) =>
    set((state) => ({
      floatingReactions: [...state.floatingReactions, reaction],
    })),

  removeReaction: (id) =>
    set((state) => ({
      floatingReactions: state.floatingReactions.filter((r) => r.id !== id),
    })),

  reset: () => set(initialState),
}));

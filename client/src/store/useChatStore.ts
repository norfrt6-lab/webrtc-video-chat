import { create } from "zustand";
import type { ChatMessage } from "@/lib/types";

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  addMessage: (msg: ChatMessage) => void;
  resetUnread: () => void;
  incrementUnread: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  unreadCount: 0,

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  resetUnread: () => set({ unreadCount: 0 }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  reset: () => set({ messages: [], unreadCount: 0 }),
}));

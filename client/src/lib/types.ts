// ── Participant ──
export interface Participant {
  socketId: string;
  username: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  handRaised?: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
}

// ── Chat ──
export interface ChatMessage {
  id: string;
  from: string;
  username: string;
  message: string;
  timestamp: number;
}

// ── Room ──
export interface RoomInfo {
  roomId: string;
  participants: Participant[];
  isHost: boolean;
  locked: boolean;
}

// ── Peer / WebRTC ──
export interface PeerConnection {
  pc: RTCPeerConnection;
  username: string;
  stream?: MediaStream;
  dataChannel?: RTCDataChannel;
}

export interface PeerQualityStats {
  socketId: string;
  bitrate: number;
  resolution: string;
  fps: number;
  rtt: number;
  jitter: number;
  packetLoss: number;
  connectionState: string;
}

// ── Media ──
export type MediaDeviceOption = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
};

// ── Whiteboard ──
export interface WhiteboardStroke {
  socketId: string;
  points: number[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

// ── File Share ──
export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  progress: number;
  direction: "send" | "receive";
  complete: boolean;
}

// ── Reactions ──
export interface FloatingReaction {
  id: string;
  emoji: string;
  username: string;
  x: number;
}

// ── History ──
export interface MeetingHistoryItem {
  id: number;
  room_id: string;
  started_at: string;
  ended_at: string | null;
  participant_count: number;
}

export interface MeetingDetail extends MeetingHistoryItem {
  participants: {
    username: string;
    joined_at: string;
    left_at: string | null;
  }[];
  chat_logs: {
    username: string;
    message: string;
    sent_at: string;
  }[];
}

// ── Socket Events (server → client) ──
export interface ServerToClientEvents {
  "room-joined": (data: RoomInfo) => void;
  "user-joined": (data: { socketId: string; username: string }) => void;
  "user-left": (data: { socketId: string; username: string }) => void;
  "participant-update": (data: { count: number; participants: Participant[] }) => void;
  "host-changed": (data: { isHost: boolean }) => void;
  "room-lock-changed": (data: { locked: boolean }) => void;
  "error-message": (data: { message: string }) => void;
  offer: (data: { from: string; offer: RTCSessionDescriptionInit; username: string }) => void;
  answer: (data: { from: string; answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: { from: string; candidate: RTCIceCandidateInit }) => void;
  "chat-message": (data: ChatMessage) => void;
  "media-toggled": (data: { socketId: string; type: "video" | "audio"; enabled: boolean }) => void;
  "screen-share-started": (data: { socketId: string; username: string }) => void;
  "screen-share-stopped": (data: { socketId: string }) => void;
  "emoji-reaction": (data: { socketId: string; username: string; emoji: string }) => void;
  "hand-raise": (data: { socketId: string; username: string; raised: boolean }) => void;
  "whiteboard-draw": (data: WhiteboardStroke) => void;
  "whiteboard-clear": (data: { socketId: string }) => void;
}

// ── Socket Events (client → server) ──
export interface ClientToServerEvents {
  "join-room": (data: { roomId: string; username: string; password?: string }) => void;
  "lock-room": () => void;
  "unlock-room": () => void;
  offer: (data: { to: string; offer: RTCSessionDescriptionInit }) => void;
  answer: (data: { to: string; answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: { to: string; candidate: RTCIceCandidateInit }) => void;
  "chat-message": (data: { message: string }) => void;
  "toggle-media": (data: { type: "video" | "audio"; enabled: boolean }) => void;
  "screen-share-started": () => void;
  "screen-share-stopped": () => void;
  "emoji-reaction": (data: { emoji: string }) => void;
  "hand-raise": (data: { raised: boolean }) => void;
  "whiteboard-draw": (data: Omit<WhiteboardStroke, "socketId">) => void;
  "whiteboard-clear": () => void;
}

// ── UI Panel Types ──
export type SidePanel = "chat" | "participants" | "stats" | "settings" | null;

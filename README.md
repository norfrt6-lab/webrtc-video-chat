# WebRTC Video Chat

Real-time video conferencing application with advanced collaboration features built as a full-stack project using WebRTC, Socket.io, Next.js, and Express.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐    │
│  │  Pages   │  │Components│  │  Hooks   │  │ Zustand Stores│    │
│  │          │  │          │  │          │  │               │    │
│  │ Lobby    │  │ VideoGrid│  │ useSocket│  │ useRoomStore  │    │
│  │ Room/[id]│  │ VideoTile│  │ useWebRTC│  │ useChatStore  │    │
│  │ History  │  │ ControlBar│ │ useMedia │  │ useMediaStore │    │
│  │          │  │ ChatPanel│  │ useRecord│  │ usePeerStore  │    │
│  │          │  │ Whiteboard│ │ useFile  │  │ useUIStore    │    │
│  │          │  │ StatsPanel│ │ useNoise │  │               │    │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘    │
│                        │                                        │
│                   Socket.io Client                              │
└────────────────────────┼────────────────────────────────────────┘
                         │ WebSocket + WebRTC Signaling
┌────────────────────────┼────────────────────────────────────────┐
│                   Server (Express + Socket.io)                  │
│                        │                                        │
│  ┌─────────────────────┼──────────────────────────────────┐     │
│  │              Socket.io Event Handlers                  │     │
│  │  ┌──────┐ ┌─────────┐ ┌────┐ ┌─────┐ ┌──────────────┐  │     │
│  │  │ Room │ │Signaling│ │Chat│ │Media│ │  Reactions   │  │     │
│  │  └──────┘ └─────────┘ └────┘ └─────┘ │  Whiteboard  │  │     │
│  │                                      └──────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  REST API    │  │  Middleware   │  │     SQLite DB       │   │
│  │ /api/room    │  │  Rate Limit  │  │  meetings            │   │
│  │ /api/history │  │  Auth (bcrypt)│ │  chat_logs           │   │
│  │ /api/ice     │  │  Sanitize    │  │  participants        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                    Peer-to-Peer (WebRTC)                             │
│                                                                      │
│   Browser A ◄──── RTCPeerConnection (Video/Audio) ────► Browser B    │
│              ◄──── RTCDataChannel (File Transfer) ────►              │
└──────────────────────────────────────────────────────────────────────┘
```

## Features

### Video & Audio
- Multi-participant video calls (up to 8 users)
- Camera and microphone toggle
- Adaptive video grid layout
- Active speaker detection
- Per-participant quality indicators
- Fullscreen video tiles

### Screen Sharing
- Share entire screen or application window
- Audio sharing support

### Chat
- Real-time text messaging
- Unread message badge
- Message timestamps
- Chat history persisted to database

### Collaboration
- Whiteboard with pen/eraser, color picker, width control
- Whiteboard export to PNG
- Emoji reactions with floating animations
- Hand raise indicator
- File sharing via WebRTC DataChannels (P2P, 16KB chunking)

### Recording
- Local recording with MediaRecorder API
- Mixed audio from all participants
- Timer display, auto-download on stop

### Audio Processing
- Noise suppression (Web Audio filter chain: highpass + compressor + lowpass)
- Virtual background (blur mode via canvas processing)

### Room Management
- Create/join rooms with unique IDs
- Room password protection (bcrypt hashed)
- Room locking by host
- Host transfer on disconnect
- Copy room link to clipboard

### Monitoring
- Real-time network stats per peer (bitrate, resolution, FPS, RTT, jitter, packet loss)
- Color-coded connection quality
- Meeting history with participant logs and chat archives

## Tech Stack

### Frontend (`client/`)
| Technology | Purpose |
|---|---|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type safety |
| TailwindCSS | Utility-first CSS |
| shadcn/ui | Radix-based UI components |
| Zustand | Client state management |
| Lucide React | Icon library |
| Socket.io Client | Real-time communication |
| Vitest | Unit testing |
| React Testing Library | Component testing |

### Backend (`src/server/`)
| Technology | Purpose |
|---|---|
| Express.js | HTTP server & REST API |
| Socket.io | WebSocket signaling |
| better-sqlite3 | Persistent storage (WAL mode) |
| bcryptjs | Password hashing |
| uuid | Unique ID generation |

## Project Structure

```
webrtc-video-chat/
├── server.js                  # Entry point
├── src/server/
│   ├── config.js              # Environment config
│   ├── database.js            # SQLite (meetings, chat, participants)
│   ├── middleware/
│   │   ├── rateLimit.js       # Sliding window rate limiter
│   │   └── auth.js            # bcrypt password verification
│   ├── routes/
│   │   ├── rooms.js           # /api/room/create, /api/room/:id, /api/ice-config
│   │   └── history.js         # /api/history (paginated), /api/history/:id
│   ├── handlers/
│   │   ├── room.js            # Join/leave, host, lock
│   │   ├── signaling.js       # Offer/answer/ICE relay
│   │   ├── chat.js            # Messages + DB logging
│   │   ├── media.js           # Toggle, screen share events
│   │   ├── reactions.js       # Emoji + hand raise
│   │   └── whiteboard.js      # Draw + clear relay
│   └── utils/
│       └── sanitize.js        # XSS prevention
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout, dark theme
│   │   │   ├── page.tsx       # Lobby page
│   │   │   ├── room/[id]/page.tsx  # Room page
│   │   │   └── history/page.tsx    # Meeting history
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── lobby/         # LobbyForm, PasswordModal
│   │   │   ├── room/          # VideoGrid, VideoTile, ControlBar, RoomHeader
│   │   │   ├── chat/          # ChatPanel, ChatMessage
│   │   │   ├── participants/  # ParticipantsSidebar, ParticipantItem
│   │   │   ├── whiteboard/    # WhiteboardOverlay, WhiteboardToolbar
│   │   │   ├── reactions/     # ReactionBar, FloatingEmoji
│   │   │   ├── stats/         # StatsPanel
│   │   │   └── settings/      # SettingsDialog
│   │   ├── hooks/
│   │   │   ├── useSocket.ts   # Socket.io connection + event routing
│   │   │   ├── useWebRTC.ts   # Peer connections, offer/answer/ICE
│   │   │   ├── useMediaDevices.ts  # getUserMedia, device switching
│   │   │   ├── useRecording.ts     # MediaRecorder
│   │   │   ├── useWhiteboard.ts    # Canvas drawing + sync
│   │   │   ├── useFileShare.ts     # DataChannel file transfer
│   │   │   ├── useNoiseSuppression.ts  # Web Audio filters
│   │   │   └── useVirtualBackground.ts # Canvas video processing
│   │   ├── store/
│   │   │   ├── useRoomStore.ts     # Room state
│   │   │   ├── useChatStore.ts     # Chat messages
│   │   │   ├── useMediaStore.ts    # Media/device state
│   │   │   ├── usePeerStore.ts     # Peer connections
│   │   │   └── useUIStore.ts       # UI panel state
│   │   ├── lib/
│   │   │   ├── types.ts       # Shared TypeScript types
│   │   │   ├── socket.ts      # Socket.io singleton
│   │   │   ├── webrtc.ts      # RTCPeerConnection helpers
│   │   │   └── utils.ts       # cn() class merge utility
│   │   └── __tests__/
│   │       ├── stores/        # 5 store test files (40 tests)
│   │       └── components/    # 3 component test files (16 tests)
│   └── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## Setup

### Prerequisites
- Node.js >= 18
- npm >= 9

### Local Development

```bash
# Install all dependencies (server + client)
npm install

# Start both server (:3000) and Next.js dev (:3001)
npm run dev

# Or start them separately
npm run dev:server   # Express on :3000
npm run dev:client   # Next.js on :3001
```

Open http://localhost:3001 in your browser.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000                        # Server port
MAX_PARTICIPANTS=8               # Max users per room
DB_PATH=data/webrtc-chat.db      # SQLite database path
ROOM_PASSWORD_ENABLED=true       # Enable room passwords
TURN_SERVER_URL=                  # TURN server (optional, for NAT traversal)
TURN_USERNAME=
TURN_CREDENTIAL=
```

### Running Tests

```bash
npm test
```

56 tests across 8 test suites:
- 5 Zustand store test files (40 unit tests)
- 3 React component test files (16 render tests)

### Docker

```bash
# Build and run with Docker Compose
docker compose up --build

# Or build the image directly
docker build -t webrtc-video-chat .
docker run -p 3000:3000 -p 3001:3001 webrtc-video-chat
```

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/room/create` | Create a room, returns `{ roomId }` |
| GET | `/api/room/:id` | Room info `{ exists, participantCount, locked, hasPassword }` |
| GET | `/api/ice-config` | ICE/STUN/TURN server config |
| GET | `/api/history?page=1&limit=10` | Paginated meeting history |
| GET | `/api/history/:id` | Meeting detail with participants and chat logs |

### Socket.io Events

#### Client to Server
| Event | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, username, password? }` | Join a room |
| `lock-room` | - | Lock room (host only) |
| `unlock-room` | - | Unlock room (host only) |
| `offer` | `{ to, offer }` | WebRTC offer |
| `answer` | `{ to, answer }` | WebRTC answer |
| `ice-candidate` | `{ to, candidate }` | ICE candidate |
| `chat-message` | `{ message }` | Send chat message |
| `toggle-media` | `{ type, enabled }` | Toggle video/audio |
| `screen-share-started` | - | Notify screen share start |
| `screen-share-stopped` | - | Notify screen share stop |
| `emoji-reaction` | `{ emoji }` | Send emoji reaction |
| `hand-raise` | `{ raised }` | Toggle hand raise |
| `whiteboard-draw` | `{ points, color, width, tool }` | Draw stroke |
| `whiteboard-clear` | - | Clear whiteboard |

#### Server to Client
| Event | Payload | Description |
|---|---|---|
| `room-joined` | `{ roomId, participants, isHost, locked }` | Successfully joined |
| `user-joined` | `{ socketId, username }` | New user joined |
| `user-left` | `{ socketId, username }` | User left |
| `participant-update` | `{ count, participants[] }` | Updated participant list |
| `host-changed` | `{ isHost }` | Host role transferred |
| `room-lock-changed` | `{ locked }` | Room lock state changed |
| `error-message` | `{ message }` | Error notification |
| `chat-message` | `{ id, from, username, message, timestamp }` | Chat message received |
| `media-toggled` | `{ socketId, type, enabled }` | Participant media state |
| `emoji-reaction` | `{ socketId, username, emoji }` | Emoji reaction |
| `hand-raise` | `{ socketId, username, raised }` | Hand raise state |
| `whiteboard-draw` | `{ socketId, points, color, width, tool }` | Remote draw stroke |
| `whiteboard-clear` | `{ socketId }` | Whiteboard cleared |

## License

MIT

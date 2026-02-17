# WebRTC Video Chat

Real-time peer-to-peer video conferencing application built with WebRTC, Socket.io, and Node.js.

## Features

- Multi-party video calls with mesh topology
- Room-based sessions with shareable links
- Screen sharing support
- Camera and microphone toggle controls
- Real-time text chat via WebRTC data channels
- Responsive UI with dark theme
- STUN/TURN server configuration for NAT traversal

## Tech Stack

- **Frontend:** Vanilla JS, WebRTC API, Socket.io Client
- **Backend:** Node.js, Express, Socket.io
- **Protocol:** WebRTC (ICE, SDP, DTLS-SRTP)
- **Signaling:** WebSocket via Socket.io

## Quick Start



Open  in your browser.

## Architecture



The signaling server handles room management and SDP/ICE candidate exchange.
Once peers connect, media streams flow directly between browsers via WebRTC.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
|  | Server port |  |
|  | TURN server URL | - |
|  | TURN credentials | - |
|  | TURN credentials | - |

## License

MIT
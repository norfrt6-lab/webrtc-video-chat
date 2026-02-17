const config = require("./src/server/config");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { cleanupStaleLimits } = require("./src/server/middleware/rateLimit");
const { router: roomRoutes, setRooms } = require("./src/server/routes/rooms");
const roomHandler = require("./src/server/handlers/room");
const signalingHandler = require("./src/server/handlers/signaling");
const chatHandler = require("./src/server/handlers/chat");
const mediaHandler = require("./src/server/handlers/media");
const reactionsHandler = require("./src/server/handlers/reactions");
const whiteboardHandler = require("./src/server/handlers/whiteboard");

const app = express();
const server = http.createServer(app);

const allowedOrigins = config.CORS_ORIGIN || "*";
const io = new Server(server, {
  cors: { origin: allowedOrigins },
  pingInterval: 10000,
  pingTimeout: 5000,
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Shared rooms store
const rooms = new Map();
setRooms(rooms);
app.use(roomRoutes);

// Database
let db = null;
try {
  db = require("./src/server/database");
  console.log("SQLite database initialized");
} catch (e) {
  console.warn("Database not available:", e.message);
}

// History routes
try {
  const {
    router: historyRoutes,
    setDb,
  } = require("./src/server/routes/history");
  setDb(db);
  app.use(historyRoutes);
} catch (e) {
  console.warn("History routes not available:", e.message);
}

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  roomHandler.register(io, socket, rooms, db);
  signalingHandler.register(io, socket);
  chatHandler.register(io, socket, rooms, db);
  mediaHandler.register(io, socket, rooms);
  reactionsHandler.register(io, socket);
  whiteboardHandler.register(io, socket);
});

// Cleanup interval
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    if (
      room.participants.length === 0 &&
      now - room.createdAt > config.ROOM_EXPIRY_MS
    ) {
      rooms.delete(roomId);
    }
  });
  cleanupStaleLimits();
}, 60000);

// Start server
server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  clearInterval(cleanupInterval);
  io.close(() => {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
  // Force exit after 5 seconds
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

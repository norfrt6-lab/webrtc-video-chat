const { validatePayload } = require("../utils/sanitize");
const { checkRateLimit } = require("../middleware/rateLimit");

const VALID_MEDIA_TYPES = ["video", "audio"];

function register(io, socket, rooms) {
  socket.on("toggle-media", ({ type, enabled }) => {
    if (!validatePayload({ type }, ["type"])) return;
    if (!VALID_MEDIA_TYPES.includes(type)) return;
    if (!checkRateLimit(socket.id, "general")) return;

    const roomId = socket.roomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.find((p) => p.socketId === socket.id);
    if (participant) {
      if (type === "video") participant.videoEnabled = !!enabled;
      if (type === "audio") participant.audioEnabled = !!enabled;
    }

    socket.to(roomId).emit("media-toggled", {
      socketId: socket.id,
      type,
      enabled: !!enabled,
    });
  });

  socket.on("screen-share-started", () => {
    if (!socket.roomId) return;
    if (!checkRateLimit(socket.id, "general")) return;
    socket.to(socket.roomId).emit("screen-share-started", {
      socketId: socket.id,
      username: socket.username,
    });
  });

  socket.on("screen-share-stopped", () => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit("screen-share-stopped", {
      socketId: socket.id,
    });
  });
}

module.exports = { register };

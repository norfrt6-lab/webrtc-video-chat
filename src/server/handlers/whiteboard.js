const { checkRateLimit } = require("../middleware/rateLimit");

const MAX_POINTS_LENGTH = 10000;

function register(io, socket) {
  socket.on("whiteboard-draw", (data) => {
    if (!socket.roomId) return;
    if (!checkRateLimit(socket.id, "general")) return;

    // Validate and sanitize - only allow known properties
    if (!data || typeof data !== "object") return;
    if (!Array.isArray(data.points) || data.points.length < 4) return;
    if (data.points.length > MAX_POINTS_LENGTH) return;
    if (!data.points.every((p) => typeof p === "number" && isFinite(p))) return;

    const tool = data.tool === "eraser" ? "eraser" : "pen";
    const color =
      typeof data.color === "string" ? data.color.slice(0, 7) : "#ffffff";
    const width =
      typeof data.width === "number"
        ? Math.min(Math.max(data.width, 1), 20)
        : 3;

    socket.to(socket.roomId).emit("whiteboard-draw", {
      socketId: socket.id,
      points: data.points,
      color,
      width,
      tool,
    });
  });

  socket.on("whiteboard-clear", () => {
    if (!socket.roomId) return;
    if (!checkRateLimit(socket.id, "general")) return;
    socket.to(socket.roomId).emit("whiteboard-clear", {
      socketId: socket.id,
    });
  });
}

module.exports = { register };

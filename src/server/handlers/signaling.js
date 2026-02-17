const { validatePayload } = require("../utils/sanitize");
const { checkRateLimit } = require("../middleware/rateLimit");

function register(io, socket) {
  // Verify target is in the same room before relaying
  function isInSameRoom(targetSocketId) {
    if (!socket.roomId) return false;
    const room = io.sockets.adapter.rooms.get(socket.roomId);
    return room && room.has(targetSocketId);
  }

  socket.on("offer", ({ to, offer }) => {
    if (!validatePayload({ to, offer }, ["to", "offer"])) return;
    if (!checkRateLimit(socket.id, "general")) return;
    if (typeof to !== "string" || !isInSameRoom(to)) return;
    io.to(to).emit("offer", {
      from: socket.id,
      offer,
      username: socket.username,
    });
  });

  socket.on("answer", ({ to, answer }) => {
    if (!validatePayload({ to, answer }, ["to", "answer"])) return;
    if (!checkRateLimit(socket.id, "general")) return;
    if (typeof to !== "string" || !isInSameRoom(to)) return;
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (!validatePayload({ to, candidate }, ["to", "candidate"])) return;
    if (!checkRateLimit(socket.id, "general")) return;
    if (typeof to !== "string" || !isInSameRoom(to)) return;
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });
}

module.exports = { register };

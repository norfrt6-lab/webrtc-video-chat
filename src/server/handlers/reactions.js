const { checkRateLimit } = require("../middleware/rateLimit");

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "👏", "🎉", "🔥"];

function register(io, socket) {
  socket.on("emoji-reaction", ({ emoji }) => {
    if (!socket.roomId || !emoji) return;
    if (!checkRateLimit(socket.id, "general")) return;

    // Validate emoji is from the allowed set
    const emojiStr = String(emoji);
    if (!ALLOWED_EMOJIS.includes(emojiStr)) return;

    io.to(socket.roomId).emit("emoji-reaction", {
      socketId: socket.id,
      username: socket.username,
      emoji: emojiStr,
    });
  });

  socket.on("hand-raise", ({ raised }) => {
    if (!socket.roomId) return;
    if (!checkRateLimit(socket.id, "general")) return;

    io.to(socket.roomId).emit("hand-raise", {
      socketId: socket.id,
      username: socket.username,
      raised: !!raised,
    });
  });
}

module.exports = { register };

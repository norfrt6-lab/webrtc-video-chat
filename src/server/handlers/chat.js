const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { escapeHtml } = require('../utils/sanitize');
const { checkRateLimit } = require('../middleware/rateLimit');

function register(io, socket, rooms, db) {
  socket.on('chat-message', ({ message }) => {
    if (!socket.roomId || !message) return;
    if (!checkRateLimit(socket.id, 'chat')) {
      return socket.emit('error-message', { message: 'Chat rate limit exceeded' });
    }

    const sanitized = escapeHtml(String(message).trim().slice(0, config.MAX_CHAT_LENGTH));
    if (!sanitized) return;

    const payload = {
      id: uuidv4().slice(0, 12),
      from: socket.id,
      username: socket.username || 'Anonymous',
      message: sanitized,
      timestamp: Date.now()
    };

    // DB logging
    if (db) {
      const room = rooms.get(socket.roomId);
      if (room && room.meetingId) {
        db.logChat(room.meetingId, payload.username, sanitized);
      }
    }

    io.to(socket.roomId).emit('chat-message', payload);
  });
}

module.exports = { register };

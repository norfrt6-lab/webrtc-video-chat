const config = require('../config');

const rateLimits = new Map();

function checkRateLimit(socketId, type) {
  const now = Date.now();
  let entry = rateLimits.get(socketId);
  if (!entry) {
    entry = { timestamps: [], chatTimestamps: [] };
    rateLimits.set(socketId, entry);
  }

  const key = type === 'chat' ? 'chatTimestamps' : 'timestamps';
  const max = type === 'chat' ? config.CHAT_RATE_LIMIT_MAX : config.RATE_LIMIT_MAX;

  entry[key] = entry[key].filter(t => now - t < config.RATE_LIMIT_WINDOW);
  if (entry[key].length >= max) return false;
  entry[key].push(now);
  return true;
}

function clearRateLimit(socketId) {
  rateLimits.delete(socketId);
}

function cleanupStaleLimits() {
  rateLimits.forEach((entry, socketId) => {
    if (entry.timestamps.length === 0 && entry.chatTimestamps.length === 0) {
      rateLimits.delete(socketId);
    }
  });
}

module.exports = { checkRateLimit, clearRateLimit, cleanupStaleLimits };

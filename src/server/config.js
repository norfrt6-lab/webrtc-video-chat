require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MAX_PARTICIPANTS: Math.max(
    2,
    parseInt(process.env.MAX_PARTICIPANTS, 10) || 8,
  ),
  ROOM_EXPIRY_MS: parseInt(process.env.ROOM_EXPIRY_MS, 10) || 60 * 60 * 1000,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 10000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 50,
  CHAT_RATE_LIMIT_MAX: parseInt(process.env.CHAT_RATE_LIMIT_MAX, 10) || 10,
  MAX_CHAT_LENGTH: parseInt(process.env.MAX_CHAT_LENGTH, 10) || 500,
  DB_PATH: process.env.DB_PATH || "data/webrtc-chat.db",
  ROOM_PASSWORD_ENABLED: process.env.ROOM_PASSWORD_ENABLED !== "false",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  TURN_SERVER_URL: process.env.TURN_SERVER_URL || "",
  TURN_USERNAME: process.env.TURN_USERNAME || "",
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || "",
};

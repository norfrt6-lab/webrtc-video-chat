const express = require("express");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");

const router = express.Router();

let rooms;

function setRooms(roomsMap) {
  rooms = roomsMap;
}

// POST to create a room (proper REST method for resource creation)
router.post("/api/room/create", (req, res) => {
  // Generate unique room ID with collision check
  let roomId;
  let attempts = 0;
  do {
    roomId = uuidv4().slice(0, 8);
    attempts++;
  } while (rooms.has(roomId) && attempts < 10);

  if (rooms.has(roomId)) {
    return res.status(503).json({ error: "Failed to generate unique room ID" });
  }

  rooms.set(roomId, {
    participants: [],
    createdAt: Date.now(),
    passwordHash: null,
    locked: false,
    hostSocketId: null,
    meetingId: null,
  });
  res.json({ roomId });
});

// Keep GET for backwards compatibility (lobby uses fetch without POST)
router.get("/api/room/create", (req, res) => {
  let roomId;
  let attempts = 0;
  do {
    roomId = uuidv4().slice(0, 8);
    attempts++;
  } while (rooms.has(roomId) && attempts < 10);

  if (rooms.has(roomId)) {
    return res.status(503).json({ error: "Failed to generate unique room ID" });
  }

  rooms.set(roomId, {
    participants: [],
    createdAt: Date.now(),
    passwordHash: null,
    locked: false,
    hostSocketId: null,
    meetingId: null,
  });
  res.json({ roomId });
});

router.get("/api/room/:id", (req, res) => {
  const id = String(req.params.id).slice(0, 50);
  const room = rooms.get(id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    participants: room.participants.length,
    maxParticipants: config.MAX_PARTICIPANTS,
    isFull: room.participants.length >= config.MAX_PARTICIPANTS,
    hasPassword: !!room.passwordHash,
    locked: room.locked,
  });
});

router.get("/api/ice-config", (req, res) => {
  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  if (config.TURN_SERVER_URL) {
    iceServers.push({
      urls: config.TURN_SERVER_URL,
      username: config.TURN_USERNAME,
      credential: config.TURN_CREDENTIAL,
    });
  }
  res.json({ iceServers });
});

module.exports = { router, setRooms };

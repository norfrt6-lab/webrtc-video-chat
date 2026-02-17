const config = require("../config");
const {
  escapeHtml,
  validatePayload,
  validateString,
} = require("../utils/sanitize");
const { checkRateLimit, clearRateLimit } = require("../middleware/rateLimit");
const { verifyRoomPassword } = require("../middleware/auth");

function getParticipantList(rooms, roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return room.participants.map((p) => ({
    socketId: p.socketId,
    username: p.username,
    videoEnabled: p.videoEnabled,
    audioEnabled: p.audioEnabled,
  }));
}

function broadcastParticipantUpdate(io, rooms, roomId) {
  const participants = getParticipantList(rooms, roomId);
  io.to(roomId).emit("participant-update", {
    count: participants.length,
    participants,
  });
}

function register(io, socket, rooms, db) {
  socket.on("join-room", ({ roomId, username, password }) => {
    if (!validatePayload({ roomId, username }, ["roomId", "username"])) {
      return socket.emit("error-message", { message: "Invalid join request" });
    }
    if (!validateString(roomId, 50) || !validateString(username, 30)) {
      return socket.emit("error-message", { message: "Invalid join request" });
    }
    if (!checkRateLimit(socket.id, "general")) {
      return socket.emit("error-message", { message: "Rate limit exceeded" });
    }

    const sanitizedUsername =
      escapeHtml(String(username).trim().slice(0, 30)) || "Anonymous";

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: [],
        createdAt: Date.now(),
        passwordHash: null,
        locked: false,
        hostSocketId: null,
        meetingId: null,
      });
    }

    const room = rooms.get(roomId);

    // Check password
    if (room.passwordHash && !verifyRoomPassword(room, password)) {
      return socket.emit("error-message", { message: "password-required" });
    }

    // Check lock
    if (room.locked) {
      return socket.emit("error-message", { message: "room-locked" });
    }

    // Check full
    if (room.participants.length >= config.MAX_PARTICIPANTS) {
      return socket.emit("error-message", { message: "Room is full" });
    }

    // Check duplicate
    if (room.participants.some((p) => p.socketId === socket.id)) {
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = sanitizedUsername;

    // Set host if first participant
    if (room.participants.length === 0) {
      room.hostSocketId = socket.id;
    }

    room.participants.push({
      socketId: socket.id,
      username: sanitizedUsername,
      videoEnabled: true,
      audioEnabled: true,
      joinedAt: Date.now(),
    });

    // DB logging
    try {
      if (db) {
        if (!room.meetingId) {
          room.meetingId = db.createMeeting(roomId);
        }
        db.addParticipant(room.meetingId, sanitizedUsername, socket.id);
      }
    } catch (err) {
      console.error("DB error on join:", err.message);
    }

    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      username: sanitizedUsername,
    });

    socket.emit("room-joined", {
      roomId,
      participants: getParticipantList(rooms, roomId).filter(
        (p) => p.socketId !== socket.id,
      ),
      isHost: room.hostSocketId === socket.id,
      locked: room.locked,
    });

    broadcastParticipantUpdate(io, rooms, roomId);
    console.log(
      `${sanitizedUsername} joined room ${roomId} (${room.participants.length}/${config.MAX_PARTICIPANTS})`,
    );
  });

  // Lock/Unlock room (host only)
  socket.on("lock-room", () => {
    const room = rooms.get(socket.roomId);
    if (!room || room.hostSocketId !== socket.id) return;
    room.locked = true;
    io.to(socket.roomId).emit("room-lock-changed", { locked: true });
  });

  socket.on("unlock-room", () => {
    const room = rooms.get(socket.roomId);
    if (!room || room.hostSocketId !== socket.id) return;
    room.locked = false;
    io.to(socket.roomId).emit("room-lock-changed", { locked: false });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    clearRateLimit(socket.id);

    rooms.forEach((room, roomId) => {
      const idx = room.participants.findIndex((p) => p.socketId === socket.id);
      if (idx === -1) return;

      const username = room.participants[idx].username;
      const participantCount = room.participants.length;
      room.participants.splice(idx, 1);

      // DB logging
      try {
        if (db && room.meetingId) {
          db.removeParticipant(room.meetingId, socket.id);
        }
      } catch (err) {
        console.error("DB error on disconnect:", err.message);
      }

      if (room.participants.length === 0) {
        try {
          if (db && room.meetingId) {
            db.endMeeting(room.meetingId, participantCount);
          }
        } catch (err) {
          console.error("DB error on endMeeting:", err.message);
        }
        rooms.delete(roomId);
      } else {
        // Transfer host if host left - notify all participants
        if (room.hostSocketId === socket.id) {
          room.hostSocketId = room.participants[0].socketId;
          io.to(socket.roomId).emit("host-changed", {
            isHost: false,
            newHostSocketId: room.participants[0].socketId,
          });
          io.to(room.hostSocketId).emit("host-changed", { isHost: true });
        }

        io.to(roomId).emit("user-left", { socketId: socket.id, username });
        broadcastParticipantUpdate(io, rooms, roomId);
      }
    });
  });
}

module.exports = { register };

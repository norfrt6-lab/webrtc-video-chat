require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.static('public'));

const rooms = new Map();

app.get('/api/room/create', (req, res) => {
  const roomId = uuidv4().slice(0, 8);
  rooms.set(roomId, { participants: [], createdAt: Date.now() });
  res.json({ roomId });
});

app.get('/api/room/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ participants: room.participants.length });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userId }) => {
    socket.join(roomId);
    const room = rooms.get(roomId) || { participants: [], createdAt: Date.now() };
    room.participants.push({ socketId: socket.id, userId });
    rooms.set(roomId, room);
    socket.to(roomId).emit('user-joined', { userId, socketId: socket.id });
  });

  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('toggle-media', ({ roomId, type, enabled }) => {
    socket.to(roomId).emit('media-toggled', { userId: socket.id, type, enabled });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      room.participants = room.participants.filter(p => p.socketId !== socket.id);
      if (room.participants.length === 0) rooms.delete(roomId);
      else io.to(roomId).emit('user-left', { socketId: socket.id });
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));

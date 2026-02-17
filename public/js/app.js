const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteContainer = document.getElementById('remoteVideos');
const peers = {};
let localStream;
let currentRoom;

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

async function init() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
  } catch (err) {
    console.error('Failed to get media:', err);
  }
}

async function createRoom() {
  const res = await fetch('/api/room/create');
  const { roomId } = await res.json();
  joinRoom(roomId);
  document.getElementById('roomId').textContent = roomId;
}

function joinRoom(roomId) {
  currentRoom = roomId;
  socket.emit('join-room', { roomId, userId: socket.id });
}

async function createPeerConnection(remoteSocketId) {
  const pc = new RTCPeerConnection(config);
  peers[remoteSocketId] = pc;

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit('ice-candidate', { to: remoteSocketId, candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    let video = document.getElementById('video-' + remoteSocketId);
    if (!video) {
      video = document.createElement('video');
      video.id = 'video-' + remoteSocketId;
      video.autoplay = true;
      video.playsInline = true;
      remoteContainer.appendChild(video);
    }
    video.srcObject = e.streams[0];
  };

  return pc;
}

socket.on('user-joined', async ({ socketId }) => {
  const pc = await createPeerConnection(socketId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', { to: socketId, offer });
});

socket.on('offer', async ({ from, offer }) => {
  const pc = await createPeerConnection(from);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', { to: from, answer });
});

socket.on('answer', async ({ from, answer }) => {
  await peers[from].setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', async ({ from, candidate }) => {
  if (peers[from]) await peers[from].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('user-left', ({ socketId }) => {
  if (peers[socketId]) { peers[socketId].close(); delete peers[socketId]; }
  const video = document.getElementById('video-' + socketId);
  if (video) video.remove();
});

function toggleVideo() {
  const track = localStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
  socket.emit('toggle-media', { roomId: currentRoom, type: 'video', enabled: track.enabled });
}

function toggleAudio() {
  const track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  socket.emit('toggle-media', { roomId: currentRoom, type: 'audio', enabled: track.enabled });
}

init();

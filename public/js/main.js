import { state } from './modules/state.js';
import { dom, showToast, switchToRoom, switchToLobby, copyRoomLink, updateVideoGridCount } from './modules/ui.js';
import { acquireMedia, switchDevice, toggleVideo, toggleAudio } from './modules/media.js';
import { closePeer } from './modules/peers.js';
import { toggleScreenShare, stopSpeakerDetection } from './modules/screen-share.js';
import { sendChatMessage, toggleChat } from './modules/chat.js';
import { setupSocketListeners, submitPassword } from './modules/socket.js';
import { toggleRecording, stopRecording } from './modules/recording.js';
import { initReactionBar, toggleHandRaise } from './modules/reactions.js';
import { initWhiteboard, toggleWhiteboard } from './modules/whiteboard.js';
import { broadcastFile } from './modules/file-share.js';
import { toggleNoiseSuppression, cleanupNoiseSuppression } from './modules/noise-suppression.js';
import { initVirtualBg, cleanupVirtualBg } from './modules/virtual-bg.js';
import { toggleStats, cleanupStats } from './modules/stats-dashboard.js';

// --------------- ICE Config ---------------
async function fetchIceConfig() {
  try {
    const res = await fetch('/api/ice-config');
    const data = await res.json();
    state.iceConfig = { iceServers: data.iceServers };
  } catch (err) {
    console.error('Failed to fetch ICE config:', err);
    state.iceConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }
}

// --------------- Room Management ---------------
async function createRoom(password) {
  const url = '/api/room/create' + (password ? '?password=' + encodeURIComponent(password) : '');
  const res = await fetch(url);
  const data = await res.json();
  return data.roomId;
}

async function joinRoom() {
  const username = dom.username.value.trim();
  if (!username) {
    showToast('Please enter your name', 'error');
    dom.username.focus();
    return;
  }
  state.username = username;

  let roomId = dom.roomInput.value.trim();
  const password = dom.roomPassword ? dom.roomPassword.value.trim() : '';

  if (!roomId) {
    roomId = await createRoom(password);
  }

  // Check availability
  try {
    const res = await fetch('/api/room/' + roomId);
    if (res.ok) {
      const info = await res.json();
      if (info.isFull) {
        showToast('Room is full', 'error');
        return;
      }
    }
  } catch (e) { /* Room will be created on join */ }

  const mediaOk = await acquireMedia();
  if (!mediaOk) return;

  await fetchIceConfig();

  state.socket = io();
  setupSocketListeners();

  state.currentRoom = roomId;
  state.socket.emit('join-room', { roomId, username, password });

  switchToRoom(roomId, username);
}

function leaveRoom() {
  Object.keys(state.peers).forEach(socketId => closePeer(socketId));

  if (state.localStream) {
    state.localStream.getTracks().forEach(t => t.stop());
    state.localStream = null;
  }
  if (state.screenStream) {
    state.screenStream.getTracks().forEach(t => t.stop());
    state.screenStream = null;
  }

  stopSpeakerDetection();
  cleanupNoiseSuppression();
  cleanupVirtualBg();
  cleanupStats();
  if (state.recording) stopRecording();

  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }

  state.currentRoom = null;
  state.videoEnabled = true;
  state.audioEnabled = true;
  state.screenSharing = false;
  state.chatOpen = false;
  state.participantsOpen = false;
  state.unreadMessages = 0;
  state.isHost = false;
  state.roomLocked = false;
  state.handRaised = false;
  state.peers = {};
  state.fileChannels = {};

  switchToLobby();
}

// --------------- Participants Sidebar ---------------
function toggleParticipants() {
  state.participantsOpen = !state.participantsOpen;
  dom.participantsSidebar.classList.toggle('hidden', !state.participantsOpen);
  dom.participantsBtn.classList.toggle('active', state.participantsOpen);
}

// --------------- Lock Room ---------------
function toggleLock() {
  if (!state.socket || !state.isHost) return;
  if (state.roomLocked) {
    state.socket.emit('unlock-room');
  } else {
    state.socket.emit('lock-room');
  }
}

// --------------- Event Bindings ---------------
dom.joinBtn.addEventListener('click', joinRoom);
dom.username.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(); });
dom.roomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(); });

dom.leaveBtn.addEventListener('click', leaveRoom);
dom.copyRoomBtn.addEventListener('click', copyRoomLink);

dom.toggleVideoBtn.addEventListener('click', toggleVideo);
dom.toggleAudioBtn.addEventListener('click', toggleAudio);
dom.shareScreenBtn.addEventListener('click', toggleScreenShare);

dom.sendMsgBtn.addEventListener('click', sendChatMessage);
dom.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChatMessage(); });
dom.chatToggleBtn.addEventListener('click', toggleChat);

dom.participantsBtn.addEventListener('click', toggleParticipants);
dom.closeParticipants.addEventListener('click', toggleParticipants);

dom.settingsBtn.addEventListener('click', () => dom.settingsModal.classList.remove('hidden'));
dom.closeSettings.addEventListener('click', () => dom.settingsModal.classList.add('hidden'));
dom.settingsModal.addEventListener('click', (e) => { if (e.target === dom.settingsModal) dom.settingsModal.classList.add('hidden'); });

dom.cameraSelect.addEventListener('change', () => switchDevice('video', dom.cameraSelect.value));
dom.micSelect.addEventListener('change', () => switchDevice('audio', dom.micSelect.value));

// Feature buttons
if (dom.recordBtn) dom.recordBtn.addEventListener('click', toggleRecording);
if (dom.handRaiseBtn) dom.handRaiseBtn.addEventListener('click', toggleHandRaise);
if (dom.noiseBtn) dom.noiseBtn.addEventListener('click', toggleNoiseSuppression);
if (dom.whiteboardBtn) dom.whiteboardBtn.addEventListener('click', toggleWhiteboard);
if (dom.fileBtn) dom.fileBtn.addEventListener('click', () => dom.fileInput.click());
if (dom.fileInput) dom.fileInput.addEventListener('change', () => {
  if (dom.fileInput.files[0]) broadcastFile(dom.fileInput.files[0]);
  dom.fileInput.value = '';
});
if (dom.lockBtn) dom.lockBtn.addEventListener('click', toggleLock);
if (dom.statsBtn) dom.statsBtn.addEventListener('click', toggleStats);
if (dom.closeStats) dom.closeStats.addEventListener('click', toggleStats);

// Password modal
if (dom.passwordModalSubmit) dom.passwordModalSubmit.addEventListener('click', submitPassword);
if (dom.passwordModalInput) dom.passwordModalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPassword(); });
if (dom.passwordModalClose) dom.passwordModalClose.addEventListener('click', () => dom.passwordModal.classList.add('hidden'));

// URL hash pre-fill
const hash = window.location.hash.slice(1);
if (hash) dom.roomInput.value = hash;

// Init feature modules
initReactionBar();
initWhiteboard();
initVirtualBg();

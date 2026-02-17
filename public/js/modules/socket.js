import { state } from './state.js';
import { dom, showToast, updateParticipantsList } from './ui.js';
import { createPeerConnection, closePeer } from './peers.js';
import { displayChatMessage } from './chat.js';
import { startSpeakerDetection } from './screen-share.js';
import { showFloatingEmoji, showHandRaise } from './reactions.js';
import { applyRemoteDraw, remoteClear } from './whiteboard.js';

export function setupSocketListeners() {
  const socket = state.socket;

  socket.on('room-joined', (data) => {
    showToast('Joined room ' + data.roomId, 'success');
    state.isHost = !!data.isHost;
    state.roomLocked = !!data.locked;
    if (state.isHost && dom.lockBtn) {
      dom.lockBtn.classList.remove('hidden');
    }
    startSpeakerDetection();
  });

  socket.on('user-joined', async (data) => {
    showToast(data.username + ' joined', 'info');
    const pc = createPeerConnection(data.socketId, data.username);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: data.socketId, offer });
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  });

  socket.on('offer', async (data) => {
    const pc = createPeerConnection(data.from, data.username);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: data.from, answer });
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  });

  socket.on('answer', async (data) => {
    const peer = state.peers[data.from];
    if (peer) {
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (err) {
        console.error('Failed to set remote description:', err);
      }
    }
  });

  socket.on('ice-candidate', async (data) => {
    const peer = state.peers[data.from];
    if (peer) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    }
  });

  socket.on('user-left', (data) => {
    showToast((data.username || 'A user') + ' left', 'info');
    closePeer(data.socketId);
  });

  socket.on('media-toggled', (data) => {
    const peer = state.peers[data.socketId];
    if (!peer) return;
    if (data.type === 'video') {
      peer.videoEnabled = data.enabled;
      const overlay = document.getElementById('muted-overlay-' + data.socketId);
      if (overlay) overlay.classList.toggle('hidden', data.enabled);
    }
    if (data.type === 'audio') {
      peer.audioEnabled = data.enabled;
      const mic = document.getElementById('mic-indicator-' + data.socketId);
      if (mic) mic.classList.toggle('hidden', data.enabled);
    }
  });

  socket.on('chat-message', displayChatMessage);

  socket.on('screen-share-started', (data) => {
    showToast((data.username || 'Someone') + ' is sharing their screen', 'info');
  });

  socket.on('screen-share-stopped', () => {
    showToast('Screen sharing stopped', 'info');
  });

  socket.on('participant-update', (data) => {
    dom.participantCount.textContent = data.count;
    updateParticipantsList(data.participants);
  });

  socket.on('emoji-reaction', showFloatingEmoji);
  socket.on('hand-raise', showHandRaise);

  socket.on('whiteboard-draw', applyRemoteDraw);
  socket.on('whiteboard-clear', remoteClear);

  socket.on('room-lock-changed', (data) => {
    state.roomLocked = data.locked;
    if (dom.lockBtn) {
      dom.lockBtn.textContent = data.locked ? 'Unlock' : 'Lock';
    }
    showToast('Room ' + (data.locked ? 'locked' : 'unlocked'), 'info');
  });

  socket.on('host-changed', (data) => {
    if (data.isHost) {
      state.isHost = true;
      if (dom.lockBtn) dom.lockBtn.classList.remove('hidden');
      showToast('You are now the host', 'info');
    }
  });

  socket.on('error-message', (data) => {
    if (data.message === 'password-required') {
      showPasswordModal();
    } else if (data.message === 'room-locked') {
      showToast('This room is locked by the host', 'error');
    } else {
      showToast(data.message, 'error');
    }
  });

  // Reconnection
  socket.on('disconnect', () => {
    showToast('Disconnected from server. Reconnecting...', 'error');
  });

  socket.on('connect', () => {
    if (state.currentRoom && state.username) {
      socket.emit('join-room', { roomId: state.currentRoom, username: state.username });
      showToast('Reconnected!', 'success');
    }
  });
}

function showPasswordModal() {
  if (dom.passwordModal) {
    dom.passwordModal.classList.remove('hidden');
    if (dom.passwordModalInput) dom.passwordModalInput.focus();
  }
}

export function submitPassword() {
  const password = dom.passwordModalInput ? dom.passwordModalInput.value.trim() : '';
  if (!password) return;
  dom.passwordModal.classList.add('hidden');
  dom.passwordModalInput.value = '';
  state.socket.emit('join-room', {
    roomId: state.currentRoom,
    username: state.username,
    password
  });
}

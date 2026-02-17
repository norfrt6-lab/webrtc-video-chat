import { state } from './state.js';

export const dom = {
  lobby: document.getElementById('lobby'),
  roomView: document.getElementById('room-view'),
  chatPanel: document.getElementById('chat-panel'),
  username: document.getElementById('username'),
  roomInput: document.getElementById('room'),
  roomPassword: document.getElementById('roomPassword'),
  joinBtn: document.getElementById('joinBtn'),
  leaveBtn: document.getElementById('leaveBtn'),
  roomIdDisplay: document.getElementById('room-id-display'),
  copyRoomBtn: document.getElementById('copyRoomBtn'),
  videoGrid: document.getElementById('video-grid'),
  localVideo: document.getElementById('localVideo'),
  toggleVideoBtn: document.getElementById('toggleVideo'),
  toggleAudioBtn: document.getElementById('toggleAudio'),
  shareScreenBtn: document.getElementById('shareScreen'),
  chatInput: document.getElementById('chatInput'),
  sendMsgBtn: document.getElementById('sendMsg'),
  messages: document.getElementById('messages'),
  toasts: document.getElementById('toasts'),
  chatToggleBtn: document.getElementById('chatToggleBtn'),
  chatBadge: document.getElementById('chatBadge'),
  participantsBtn: document.getElementById('participantsBtn'),
  participantCount: document.getElementById('participantCount'),
  participantsSidebar: document.getElementById('participantsSidebar'),
  participantsList: document.getElementById('participantsList'),
  closeParticipants: document.getElementById('closeParticipants'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettings: document.getElementById('closeSettings'),
  cameraSelect: document.getElementById('cameraSelect'),
  micSelect: document.getElementById('micSelect'),
  localLabel: document.getElementById('localLabel'),
  recordBtn: document.getElementById('recordBtn'),
  recordIndicator: document.getElementById('recordIndicator'),
  recordTimer: document.getElementById('recordTimer'),
  handRaiseBtn: document.getElementById('handRaiseBtn'),
  noiseBtn: document.getElementById('noiseBtn'),
  whiteboardBtn: document.getElementById('whiteboardBtn'),
  whiteboardOverlay: document.getElementById('whiteboardOverlay'),
  whiteboardCanvas: document.getElementById('whiteboardCanvas'),
  wbColorPicker: document.getElementById('wbColorPicker'),
  wbStrokeWidth: document.getElementById('wbStrokeWidth'),
  wbToolPen: document.getElementById('wbToolPen'),
  wbToolEraser: document.getElementById('wbToolEraser'),
  wbClear: document.getElementById('wbClear'),
  wbExport: document.getElementById('wbExport'),
  wbClose: document.getElementById('wbClose'),
  reactionBar: document.getElementById('reactionBar'),
  fileInput: document.getElementById('fileInput'),
  fileBtn: document.getElementById('fileBtn'),
  fileProgress: document.getElementById('fileProgress'),
  lockBtn: document.getElementById('lockBtn'),
  statsBtn: document.getElementById('statsBtn'),
  statsPanel: document.getElementById('statsPanel'),
  statsBody: document.getElementById('statsBody'),
  closeStats: document.getElementById('closeStats'),
  virtualBgSelect: document.getElementById('virtualBgSelect'),
  virtualBgImageInput: document.getElementById('virtualBgImageInput'),
  passwordModal: document.getElementById('passwordModal'),
  passwordModalInput: document.getElementById('passwordModalInput'),
  passwordModalSubmit: document.getElementById('passwordModalSubmit'),
  passwordModalClose: document.getElementById('passwordModalClose'),
  reactionsContainer: document.getElementById('reactionsContainer')
};

export function showToast(message, type) {
  type = type || 'info';
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  dom.toasts.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function switchToRoom(roomId, username) {
  dom.lobby.classList.add('hidden');
  dom.roomView.classList.remove('hidden');
  dom.roomIdDisplay.textContent = 'Room: ' + roomId;
  dom.localLabel.textContent = username + ' (You)';
  updateVideoGridCount();
}

export function switchToLobby() {
  dom.roomView.classList.add('hidden');
  dom.chatPanel.classList.add('hidden');
  dom.participantsSidebar.classList.add('hidden');
  if (dom.whiteboardOverlay) dom.whiteboardOverlay.classList.add('hidden');
  if (dom.statsPanel) dom.statsPanel.classList.add('hidden');
  dom.lobby.classList.remove('hidden');
  dom.localVideo.srcObject = null;
  dom.messages.innerHTML = '';
  dom.toggleVideoBtn.classList.add('active');
  dom.toggleVideoBtn.textContent = 'Camera';
  dom.toggleAudioBtn.classList.add('active');
  dom.toggleAudioBtn.textContent = 'Mic';
  dom.shareScreenBtn.classList.remove('active');
  dom.shareScreenBtn.textContent = 'Screen';
  dom.chatBadge.classList.add('hidden');
  if (dom.lockBtn) { dom.lockBtn.classList.add('hidden'); dom.lockBtn.textContent = 'Lock'; }
  if (dom.recordIndicator) dom.recordIndicator.classList.add('hidden');

  const remotes = dom.videoGrid.querySelectorAll('.video-wrapper.remote');
  remotes.forEach(el => el.remove());
  updateVideoGridCount();
}

export function updateVideoGridCount() {
  const count = dom.videoGrid.querySelectorAll('.video-wrapper').length;
  dom.videoGrid.setAttribute('data-count', count);
}

export function updateParticipantsList(participants) {
  dom.participantsList.innerHTML = '';

  const selfItem = document.createElement('div');
  selfItem.className = 'participant-item';
  selfItem.innerHTML = '<span class="participant-name">' + (state.username || 'You') + ' (You)</span>' +
    '<span class="participant-status">' +
    (state.videoEnabled ? '' : '<span class="status-muted" title="Camera off">cam</span>') +
    (state.audioEnabled ? '' : '<span class="status-muted" title="Mic off">mic</span>') +
    '</span>';
  dom.participantsList.appendChild(selfItem);

  if (participants) {
    participants.forEach(p => {
      if (p.socketId === (state.socket && state.socket.id)) return;
      const item = document.createElement('div');
      item.className = 'participant-item';
      item.innerHTML = '<span class="participant-name">' + p.username + '</span>' +
        '<span class="participant-status">' +
        (p.videoEnabled ? '' : '<span class="status-muted" title="Camera off">cam</span>') +
        (p.audioEnabled ? '' : '<span class="status-muted" title="Mic off">mic</span>') +
        '</span>';
      dom.participantsList.appendChild(item);
    });
  }
}

export function copyRoomLink() {
  const link = window.location.origin + window.location.pathname + '#' + state.currentRoom;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => showToast('Room link copied!', 'success'));
  } else {
    const input = document.createElement('input');
    input.value = link;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    showToast('Room link copied!', 'success');
  }
}

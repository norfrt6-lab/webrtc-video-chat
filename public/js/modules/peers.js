import { state } from './state.js';
import { dom, showToast, updateVideoGridCount } from './ui.js';
import { startQualityMonitoring, stopQualityMonitoring } from './bandwidth.js';
import { setupAudioAnalysis, cleanupAudioAnalysis } from './screen-share.js';
import { setupFileChannel } from './file-share.js';

export function createPeerConnection(remoteSocketId, remoteUsername) {
  const pc = new RTCPeerConnection(state.iceConfig);

  state.peers[remoteSocketId] = {
    pc,
    username: remoteUsername || 'Peer',
    videoEnabled: true,
    audioEnabled: true
  };

  if (state.localStream) {
    state.localStream.getTracks().forEach(track => pc.addTrack(track, state.localStream));
  }

  // Create data channel for file transfer (offerer side)
  const fileChannel = pc.createDataChannel('file-transfer');
  setupFileChannel(remoteSocketId, fileChannel);

  // Handle incoming data channels (answerer side)
  pc.ondatachannel = (e) => {
    if (e.channel.label === 'file-transfer') {
      setupFileChannel(remoteSocketId, e.channel);
    }
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      state.socket.emit('ice-candidate', { to: remoteSocketId, candidate: e.candidate });
    }
  };

  pc.ontrack = (e) => {
    let wrapper = document.getElementById('wrapper-' + remoteSocketId);
    if (!wrapper) {
      wrapper = createVideoWrapper(remoteSocketId, remoteUsername);
      dom.videoGrid.appendChild(wrapper);
      updateVideoGridCount();
    }
    const video = wrapper.querySelector('video');
    video.srcObject = e.streams[0];
    setupAudioAnalysis(remoteSocketId, e.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    const connState = pc.connectionState;
    updateConnectionIndicator(remoteSocketId, connState);

    if (connState === 'failed') {
      showToast('Connection lost with ' + (remoteUsername || 'a peer'), 'error');
      setTimeout(() => {
        if (state.peers[remoteSocketId] && pc.connectionState === 'failed') {
          pc.restartIce();
        }
      }, 5000);
    }
    if (connState === 'disconnected') {
      setTimeout(() => {
        if (state.peers[remoteSocketId] && pc.connectionState === 'disconnected') {
          showToast('Reconnecting to ' + (remoteUsername || 'a peer') + '...', 'info');
        }
      }, 3000);
    }
  };

  startQualityMonitoring(remoteSocketId, pc);
  return pc;
}

export function closePeer(socketId) {
  const peer = state.peers[socketId];
  if (peer) {
    peer.pc.close();
    delete state.peers[socketId];
  }
  stopQualityMonitoring(socketId);
  cleanupAudioAnalysis(socketId);
  delete state.fileChannels[socketId];

  const wrapper = document.getElementById('wrapper-' + socketId);
  if (wrapper) wrapper.remove();
  updateVideoGridCount();
}

export function createVideoWrapper(socketId, username) {
  const wrapper = document.createElement('div');
  wrapper.id = 'wrapper-' + socketId;
  wrapper.className = 'video-wrapper remote';

  const video = document.createElement('video');
  video.id = 'video-' + socketId;
  video.autoplay = true;
  video.playsInline = true;
  wrapper.appendChild(video);

  const label = document.createElement('span');
  label.className = 'video-label';
  label.id = 'label-' + socketId;
  label.textContent = username || 'Peer';
  wrapper.appendChild(label);

  const qualityDot = document.createElement('span');
  qualityDot.className = 'quality-indicator quality-good';
  qualityDot.id = 'quality-' + socketId;
  qualityDot.title = 'Connection quality';
  wrapper.appendChild(qualityDot);

  const mutedOverlay = document.createElement('div');
  mutedOverlay.className = 'muted-overlay hidden';
  mutedOverlay.id = 'muted-overlay-' + socketId;
  mutedOverlay.textContent = 'Camera Off';
  wrapper.appendChild(mutedOverlay);

  const micIndicator = document.createElement('span');
  micIndicator.className = 'mic-indicator hidden';
  micIndicator.id = 'mic-indicator-' + socketId;
  micIndicator.title = 'Microphone muted';
  wrapper.appendChild(micIndicator);

  const handIcon = document.createElement('span');
  handIcon.className = 'hand-raise-icon hidden';
  handIcon.id = 'hand-' + socketId;
  handIcon.title = 'Hand raised';
  handIcon.textContent = '\u270B';
  wrapper.appendChild(handIcon);

  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'fullscreen-btn';
  fullscreenBtn.title = 'Fullscreen';
  fullscreenBtn.textContent = '\u26F6';
  fullscreenBtn.onclick = () => toggleFullscreen(wrapper);
  wrapper.appendChild(fullscreenBtn);

  wrapper.addEventListener('dblclick', () => toggleFullscreen(wrapper));

  return wrapper;
}

function toggleFullscreen(element) {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    element.requestFullscreen().catch(() => {});
  }
}

export function updateConnectionIndicator(socketId, connState, quality) {
  const dot = document.getElementById('quality-' + socketId);
  if (!dot) return;

  if (connState === 'failed' || connState === 'disconnected') {
    dot.className = 'quality-indicator quality-poor';
    dot.title = 'Disconnected';
    return;
  }

  if (quality) {
    dot.className = 'quality-indicator quality-' + quality;
    dot.title = quality === 'good' ? 'Good connection' :
      quality === 'fair' ? 'Fair connection' : 'Poor connection';
  }
}

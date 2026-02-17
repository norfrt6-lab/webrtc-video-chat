import { state } from './state.js';
import { dom, showToast } from './ui.js';

export async function toggleScreenShare() {
  if (state.screenSharing) {
    stopScreenShare();
    return;
  }

  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = state.screenStream.getVideoTracks()[0];

    Object.values(state.peers).forEach(peer => {
      const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
    });

    dom.localVideo.srcObject = state.screenStream;
    state.screenSharing = true;
    dom.shareScreenBtn.classList.add('active');
    dom.shareScreenBtn.textContent = 'Stop Share';
    state.socket.emit('screen-share-started');

    screenTrack.onended = () => stopScreenShare();
  } catch (err) {
    console.error('Screen share failed:', err);
    if (err.name !== 'NotAllowedError') {
      showToast('Failed to share screen', 'error');
    }
  }
}

function stopScreenShare() {
  if (!state.screenSharing) return;

  if (state.screenStream) {
    state.screenStream.getTracks().forEach(t => t.stop());
    state.screenStream = null;
  }

  const videoTrack = state.localStream && state.localStream.getVideoTracks()[0];
  if (videoTrack) {
    Object.values(state.peers).forEach(peer => {
      const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
  }

  dom.localVideo.srcObject = state.localStream;
  state.screenSharing = false;
  dom.shareScreenBtn.classList.remove('active');
  dom.shareScreenBtn.textContent = 'Screen';
  state.socket.emit('screen-share-stopped');
}

// Active speaker detection
export function setupAudioAnalysis(socketId, stream) {
  try {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    state.audioContexts[socketId] = { ctx, analyser, source };
  } catch (e) { /* AudioContext not available */ }
}

export function cleanupAudioAnalysis(socketId) {
  const entry = state.audioContexts[socketId];
  if (entry) {
    try { entry.ctx.close(); } catch (e) {}
    delete state.audioContexts[socketId];
  }
}

export function startSpeakerDetection() {
  state.speakerInterval = setInterval(() => {
    let loudest = null;
    let maxVolume = 0;
    const threshold = 20;

    Object.keys(state.audioContexts).forEach(socketId => {
      const entry = state.audioContexts[socketId];
      if (!entry || !entry.analyser) return;
      const data = new Uint8Array(entry.analyser.frequencyBinCount);
      entry.analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
      if (avg > threshold && avg > maxVolume) {
        maxVolume = avg;
        loudest = socketId;
      }
    });

    dom.videoGrid.querySelectorAll('.video-wrapper').forEach(w => w.classList.remove('active-speaker'));
    if (loudest) {
      const wrapper = document.getElementById('wrapper-' + loudest);
      if (wrapper) wrapper.classList.add('active-speaker');
    }
  }, 500);
}

export function stopSpeakerDetection() {
  if (state.speakerInterval) {
    clearInterval(state.speakerInterval);
    state.speakerInterval = null;
  }
  Object.keys(state.audioContexts).forEach(id => cleanupAudioAnalysis(id));
}

import { state } from './state.js';
import { dom, showToast } from './ui.js';

export function toggleNoiseSuppression() {
  if (state.noiseSuppression) {
    disableNoiseSuppression();
  } else {
    enableNoiseSuppression();
  }
}

function enableNoiseSuppression() {
  if (!state.localStream) return;

  try {
    const audioTrack = state.localStream.getAudioTracks()[0];
    if (!audioTrack) return;

    state.originalAudioTrack = audioTrack;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));

    // Highpass filter to cut low-frequency noise
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;

    // Compressor as noise gate
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    // Low-pass to cut high-frequency hiss
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 8000;

    const destination = ctx.createMediaStreamDestination();
    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(lowpass);
    lowpass.connect(destination);

    const processedTrack = destination.stream.getAudioTracks()[0];

    // Replace audio track in local stream and peers
    state.localStream.removeTrack(audioTrack);
    state.localStream.addTrack(processedTrack);

    Object.values(state.peers).forEach(peer => {
      const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (sender) sender.replaceTrack(processedTrack);
    });

    state.noiseCtx = ctx;
    state.noiseSuppression = true;
    dom.noiseBtn.classList.add('active');
    dom.noiseBtn.textContent = 'Noise: On';
    showToast('Noise suppression enabled', 'success');
  } catch (err) {
    console.error('Noise suppression failed:', err);
    showToast('Noise suppression not supported', 'error');
  }
}

function disableNoiseSuppression() {
  if (!state.originalAudioTrack) return;

  try {
    const processedTrack = state.localStream.getAudioTracks()[0];
    if (processedTrack) {
      state.localStream.removeTrack(processedTrack);
    }
    state.localStream.addTrack(state.originalAudioTrack);

    Object.values(state.peers).forEach(peer => {
      const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'audio');
      if (sender) sender.replaceTrack(state.originalAudioTrack);
    });

    if (state.noiseCtx) {
      state.noiseCtx.close().catch(() => {});
      state.noiseCtx = null;
    }

    state.originalAudioTrack = null;
    state.noiseSuppression = false;
    dom.noiseBtn.classList.remove('active');
    dom.noiseBtn.textContent = 'Noise: Off';
    showToast('Noise suppression disabled', 'info');
  } catch (err) {
    console.error('Failed to disable noise suppression:', err);
  }
}

export function cleanupNoiseSuppression() {
  if (state.noiseSuppression) {
    disableNoiseSuppression();
  }
}

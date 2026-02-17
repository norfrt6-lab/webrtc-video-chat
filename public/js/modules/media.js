import { state } from './state.js';
import { dom, showToast } from './ui.js';

export async function acquireMedia() {
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    dom.localVideo.srcObject = state.localStream;
    await populateDeviceSelects();
    return true;
  } catch (err) {
    console.error('Failed to get media:', err);
    showToast('Could not access camera/microphone: ' + err.message, 'error');
    return false;
  }
}

export async function populateDeviceSelects() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    dom.cameraSelect.innerHTML = '';
    dom.micSelect.innerHTML = '';

    devices.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || (device.kind + ' ' + device.deviceId.slice(0, 5));
      if (device.kind === 'videoinput') dom.cameraSelect.appendChild(option);
      if (device.kind === 'audioinput') dom.micSelect.appendChild(option);
    });

    const videoTrack = state.localStream && state.localStream.getVideoTracks()[0];
    const audioTrack = state.localStream && state.localStream.getAudioTracks()[0];
    if (videoTrack) {
      const vs = videoTrack.getSettings();
      if (vs.deviceId) dom.cameraSelect.value = vs.deviceId;
    }
    if (audioTrack) {
      const as = audioTrack.getSettings();
      if (as.deviceId) dom.micSelect.value = as.deviceId;
    }
  } catch (err) {
    console.error('Failed to enumerate devices:', err);
  }
}

export async function switchDevice(kind, deviceId) {
  if (!state.localStream) return;
  try {
    const constraints = {};
    if (kind === 'video') {
      constraints.video = { deviceId: { exact: deviceId } };
      constraints.audio = false;
    } else {
      constraints.audio = { deviceId: { exact: deviceId } };
      constraints.video = false;
    }

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newTrack = kind === 'video' ? newStream.getVideoTracks()[0] : newStream.getAudioTracks()[0];
    const oldTrack = kind === 'video' ? state.localStream.getVideoTracks()[0] : state.localStream.getAudioTracks()[0];

    if (oldTrack) {
      state.localStream.removeTrack(oldTrack);
      oldTrack.stop();
    }
    state.localStream.addTrack(newTrack);

    Object.values(state.peers).forEach(peer => {
      const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === kind);
      if (sender) sender.replaceTrack(newTrack);
    });

    if (kind === 'video') dom.localVideo.srcObject = state.localStream;
    showToast((kind === 'video' ? 'Camera' : 'Microphone') + ' switched', 'success');
  } catch (err) {
    console.error('Failed to switch device:', err);
    showToast('Failed to switch device', 'error');
  }
}

export function toggleVideo() {
  if (!state.localStream) return;
  const track = state.localStream.getVideoTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  state.videoEnabled = track.enabled;
  dom.toggleVideoBtn.classList.toggle('active', track.enabled);
  dom.toggleVideoBtn.textContent = track.enabled ? 'Camera' : 'Camera Off';
  state.socket.emit('toggle-media', { type: 'video', enabled: track.enabled });
}

export function toggleAudio() {
  if (!state.localStream) return;
  const track = state.localStream.getAudioTracks()[0];
  if (!track) return;
  track.enabled = !track.enabled;
  state.audioEnabled = track.enabled;
  dom.toggleAudioBtn.classList.toggle('active', track.enabled);
  dom.toggleAudioBtn.textContent = track.enabled ? 'Mic' : 'Mic Off';
  state.socket.emit('toggle-media', { type: 'audio', enabled: track.enabled });
}

import { state } from './state.js';
import { dom, showToast } from './ui.js';

export function startRecording() {
  if (!state.localStream || state.recording) return;

  try {
    state.recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }

    state.recorder = new MediaRecorder(state.localStream, options);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.recordedChunks.push(e.data);
      }
    };

    state.recorder.onstop = () => {
      const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recording-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.webm';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      showToast('Recording saved', 'success');
    };

    state.recorder.start(1000);
    state.recording = true;
    state.recordingStartTime = Date.now();

    dom.recordBtn.classList.add('active');
    dom.recordBtn.textContent = 'Stop Rec';
    dom.recordIndicator.classList.remove('hidden');

    updateRecordTimer();
    state.recordingTimer = setInterval(updateRecordTimer, 1000);

    showToast('Recording started', 'info');
  } catch (err) {
    console.error('Recording failed:', err);
    showToast('Recording not supported', 'error');
  }
}

export function stopRecording() {
  if (!state.recording || !state.recorder) return;

  state.recorder.stop();
  state.recording = false;
  clearInterval(state.recordingTimer);

  dom.recordBtn.classList.remove('active');
  dom.recordBtn.textContent = 'Record';
  dom.recordIndicator.classList.add('hidden');
  dom.recordTimer.textContent = '00:00';
}

export function toggleRecording() {
  if (state.recording) stopRecording();
  else startRecording();
}

function updateRecordTimer() {
  const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  dom.recordTimer.textContent = mins + ':' + secs;
}

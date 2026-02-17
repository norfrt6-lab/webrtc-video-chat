import { state } from './state.js';
import { dom, showToast } from './ui.js';

let animFrameId = null;
let segmenter = null;
let bgImage = null;
let hiddenCanvas = null;
let hiddenCtx = null;
let hiddenVideo = null;

export function initVirtualBg() {
  hiddenCanvas = document.createElement('canvas');
  hiddenCtx = hiddenCanvas.getContext('2d');
  hiddenVideo = document.createElement('video');
  hiddenVideo.playsInline = true;
  hiddenVideo.muted = true;

  if (dom.virtualBgSelect) {
    dom.virtualBgSelect.addEventListener('change', (e) => {
      setVirtualBg(e.target.value);
    });
  }
  if (dom.virtualBgImageInput) {
    dom.virtualBgImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => { bgImage = img; };
      img.src = URL.createObjectURL(file);
    });
  }

  // Try loading MediaPipe SelfieSegmentation
  loadSegmenter();
}

async function loadSegmenter() {
  try {
    if (window.SelfieSegmentation) {
      segmenter = new window.SelfieSegmentation({ locateFile: (file) => {
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/' + file;
      }});
      segmenter.setOptions({ modelSelection: 1, selfieMode: true });
      segmenter.onResults(onSegmentResults);
    }
  } catch (e) {
    console.warn('MediaPipe not available, using fallback blur');
  }
}

let lastMask = null;

function onSegmentResults(results) {
  lastMask = results.segmentationMask;
}

export async function setVirtualBg(mode) {
  state.virtualBgMode = mode;

  if (mode === 'none') {
    stopVirtualBg();
    return;
  }

  if (!state.localStream) return;

  const videoTrack = state.localStream.getVideoTracks()[0];
  if (!videoTrack) return;

  const settings = videoTrack.getSettings();
  hiddenCanvas.width = settings.width || 640;
  hiddenCanvas.height = settings.height || 480;

  hiddenVideo.srcObject = new MediaStream([videoTrack]);
  await hiddenVideo.play();

  state.virtualBgStream = hiddenCanvas.captureStream(30);
  const processedTrack = state.virtualBgStream.getVideoTracks()[0];

  // Replace track in local video and all peers
  dom.localVideo.srcObject = new MediaStream([processedTrack, ...state.localStream.getAudioTracks()]);
  Object.values(state.peers).forEach(peer => {
    const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (sender) sender.replaceTrack(processedTrack);
  });

  startProcessing();
  showToast('Virtual background: ' + mode, 'success');
}

function startProcessing() {
  if (animFrameId) return;

  const process = async () => {
    if (state.virtualBgMode === 'none') return;

    if (segmenter && state.virtualBgMode !== 'none') {
      await segmenter.send({ image: hiddenVideo });
    }

    const w = hiddenCanvas.width;
    const h = hiddenCanvas.height;

    if (lastMask && segmenter) {
      // Draw original frame
      hiddenCtx.save();
      hiddenCtx.drawImage(hiddenVideo, 0, 0, w, h);

      // Draw background
      hiddenCtx.globalCompositeOperation = 'destination-over';
      if (state.virtualBgMode === 'blur') {
        hiddenCtx.filter = 'blur(15px)';
        hiddenCtx.drawImage(hiddenVideo, 0, 0, w, h);
        hiddenCtx.filter = 'none';
      } else if (state.virtualBgMode === 'image' && bgImage) {
        hiddenCtx.drawImage(bgImage, 0, 0, w, h);
      }

      // Apply mask
      hiddenCtx.globalCompositeOperation = 'destination-in';
      hiddenCtx.drawImage(lastMask, 0, 0, w, h);
      hiddenCtx.restore();

      // Draw background behind mask
      hiddenCtx.globalCompositeOperation = 'destination-over';
      if (state.virtualBgMode === 'blur') {
        hiddenCtx.filter = 'blur(15px)';
        hiddenCtx.drawImage(hiddenVideo, 0, 0, w, h);
        hiddenCtx.filter = 'none';
      } else if (state.virtualBgMode === 'image' && bgImage) {
        hiddenCtx.drawImage(bgImage, 0, 0, w, h);
      }
      hiddenCtx.globalCompositeOperation = 'source-over';
    } else {
      // Fallback: simple full-frame blur
      if (state.virtualBgMode === 'blur') {
        hiddenCtx.filter = 'blur(8px)';
        hiddenCtx.drawImage(hiddenVideo, 0, 0, w, h);
        hiddenCtx.filter = 'none';
        // Draw face area unblurred (center crop approximation)
        const cx = w * 0.25, cy = h * 0.1, cw = w * 0.5, ch = h * 0.8;
        hiddenCtx.drawImage(hiddenVideo, cx, cy, cw, ch, cx, cy, cw, ch);
      } else if (state.virtualBgMode === 'image' && bgImage) {
        hiddenCtx.drawImage(bgImage, 0, 0, w, h);
        const cx = w * 0.25, cy = h * 0.1, cw = w * 0.5, ch = h * 0.8;
        hiddenCtx.drawImage(hiddenVideo, cx, cy, cw, ch, cx, cy, cw, ch);
      } else {
        hiddenCtx.drawImage(hiddenVideo, 0, 0, w, h);
      }
    }

    animFrameId = requestAnimationFrame(process);
  };
  animFrameId = requestAnimationFrame(process);
}

function stopVirtualBg() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (state.virtualBgStream) {
    state.virtualBgStream.getTracks().forEach(t => t.stop());
    state.virtualBgStream = null;
  }

  lastMask = null;

  // Restore original video track
  if (state.localStream) {
    const videoTrack = state.localStream.getVideoTracks()[0];
    if (videoTrack) {
      dom.localVideo.srcObject = state.localStream;
      Object.values(state.peers).forEach(peer => {
        const sender = peer.pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }
  }
}

export function cleanupVirtualBg() {
  stopVirtualBg();
  state.virtualBgMode = 'none';
}

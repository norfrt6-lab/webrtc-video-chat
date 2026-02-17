import { state } from './state.js';
import { dom, showToast } from './ui.js';

const CHUNK_SIZE = 16384;
const incomingFiles = {};

export function setupFileChannel(socketId, channel) {
  state.fileChannels[socketId] = channel;

  channel.binaryType = 'arraybuffer';

  channel.onmessage = (e) => {
    if (typeof e.data === 'string') {
      const meta = JSON.parse(e.data);
      if (meta.type === 'file-meta') {
        incomingFiles[socketId] = {
          name: meta.name,
          size: meta.size,
          mimeType: meta.mimeType,
          chunks: [],
          received: 0
        };
        showFileProgress(socketId, meta.name, 0);
      }
    } else {
      const file = incomingFiles[socketId];
      if (!file) return;
      file.chunks.push(e.data);
      file.received += e.data.byteLength;
      const progress = Math.min(file.received / file.size, 1);
      showFileProgress(socketId, file.name, progress);

      if (file.received >= file.size) {
        const blob = new Blob(file.chunks, { type: file.mimeType });
        downloadFile(blob, file.name);
        delete incomingFiles[socketId];
        hideFileProgress(socketId);
        showToast('File received: ' + file.name, 'success');
      }
    }
  };
}

export function broadcastFile(file) {
  if (!file) return;

  const meta = JSON.stringify({
    type: 'file-meta',
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream'
  });

  const reader = new FileReader();
  reader.onload = () => {
    const buffer = reader.result;
    Object.keys(state.fileChannels).forEach(socketId => {
      const channel = state.fileChannels[socketId];
      if (channel.readyState !== 'open') return;

      channel.send(meta);

      let offset = 0;
      const sendChunk = () => {
        while (offset < buffer.byteLength) {
          if (channel.bufferedAmount > CHUNK_SIZE * 8) {
            setTimeout(sendChunk, 50);
            return;
          }
          const end = Math.min(offset + CHUNK_SIZE, buffer.byteLength);
          channel.send(buffer.slice(offset, end));
          offset = end;
        }
      };
      sendChunk();
    });

    showToast('Sending file: ' + file.name, 'info');
  };
  reader.readAsArrayBuffer(file);
}

function showFileProgress(socketId, fileName, progress) {
  if (!dom.fileProgress) return;
  dom.fileProgress.classList.remove('hidden');
  let bar = document.getElementById('fp-' + socketId);
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'fp-' + socketId;
    bar.className = 'file-progress-item';
    bar.innerHTML = '<span class="fp-name"></span><div class="fp-bar"><div class="fp-fill"></div></div>';
    dom.fileProgress.appendChild(bar);
  }
  bar.querySelector('.fp-name').textContent = fileName;
  bar.querySelector('.fp-fill').style.width = Math.round(progress * 100) + '%';
}

function hideFileProgress(socketId) {
  const bar = document.getElementById('fp-' + socketId);
  if (bar) {
    setTimeout(() => bar.remove(), 2000);
  }
  if (dom.fileProgress && dom.fileProgress.children.length <= 1) {
    setTimeout(() => dom.fileProgress.classList.add('hidden'), 2000);
  }
}

function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

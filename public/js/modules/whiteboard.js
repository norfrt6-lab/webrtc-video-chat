import { state } from './state.js';
import { dom } from './ui.js';

let ctx = null;
let drawing = false;
let currentPath = [];
let tool = 'pen';
let color = '#ffffff';
let lineWidth = 3;
let sendBuffer = [];
let sendTimer = null;

export function initWhiteboard() {
  if (!dom.whiteboardCanvas) return;
  ctx = dom.whiteboardCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  dom.whiteboardCanvas.addEventListener('pointerdown', onPointerDown);
  dom.whiteboardCanvas.addEventListener('pointermove', onPointerMove);
  dom.whiteboardCanvas.addEventListener('pointerup', onPointerUp);
  dom.whiteboardCanvas.addEventListener('pointerleave', onPointerUp);

  if (dom.wbColorPicker) dom.wbColorPicker.addEventListener('input', (e) => { color = e.target.value; });
  if (dom.wbStrokeWidth) dom.wbStrokeWidth.addEventListener('input', (e) => { lineWidth = parseInt(e.target.value); });
  if (dom.wbToolPen) dom.wbToolPen.addEventListener('click', () => { tool = 'pen'; dom.wbToolPen.classList.add('active'); dom.wbToolEraser.classList.remove('active'); });
  if (dom.wbToolEraser) dom.wbToolEraser.addEventListener('click', () => { tool = 'eraser'; dom.wbToolEraser.classList.add('active'); dom.wbToolPen.classList.remove('active'); });
  if (dom.wbClear) dom.wbClear.addEventListener('click', clearWhiteboard);
  if (dom.wbExport) dom.wbExport.addEventListener('click', exportWhiteboard);
  if (dom.wbClose) dom.wbClose.addEventListener('click', toggleWhiteboard);
}

function resizeCanvas() {
  if (!dom.whiteboardCanvas) return;
  const rect = dom.whiteboardCanvas.parentElement.getBoundingClientRect();
  dom.whiteboardCanvas.width = rect.width;
  dom.whiteboardCanvas.height = rect.height;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function getPos(e) {
  const rect = dom.whiteboardCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / rect.width,
    y: (e.clientY - rect.top) / rect.height
  };
}

function onPointerDown(e) {
  drawing = true;
  currentPath = [getPos(e)];
  dom.whiteboardCanvas.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!drawing) return;
  const pos = getPos(e);
  currentPath.push(pos);

  // Draw locally
  drawSegment(currentPath[currentPath.length - 2], pos, tool, color, lineWidth);

  // Buffer for network send
  sendBuffer.push(pos);
  if (!sendTimer) {
    sendTimer = setTimeout(flushSendBuffer, 33); // ~30fps
  }
}

function onPointerUp() {
  if (!drawing) return;
  drawing = false;
  flushSendBuffer();
  currentPath = [];
}

function flushSendBuffer() {
  if (sendBuffer.length > 0 && state.socket) {
    state.socket.emit('whiteboard-draw', {
      tool, color, width: lineWidth,
      points: sendBuffer
    });
    sendBuffer = [];
  }
  sendTimer = null;
}

function drawSegment(from, to, drawTool, drawColor, drawWidth) {
  if (!ctx) return;
  const w = dom.whiteboardCanvas.width;
  const h = dom.whiteboardCanvas.height;

  ctx.beginPath();
  ctx.moveTo(from.x * w, from.y * h);
  ctx.lineTo(to.x * w, to.y * h);

  if (drawTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = drawWidth * 4;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
  }
  ctx.stroke();
}

// Apply remote drawing
export function applyRemoteDraw(data) {
  if (!ctx || !data.points || data.points.length < 2) return;
  for (let i = 1; i < data.points.length; i++) {
    drawSegment(data.points[i - 1], data.points[i], data.tool, data.color, data.width);
  }
}

export function clearWhiteboard() {
  if (!ctx) return;
  ctx.clearRect(0, 0, dom.whiteboardCanvas.width, dom.whiteboardCanvas.height);
  if (state.socket) state.socket.emit('whiteboard-clear');
}

export function remoteClear() {
  if (!ctx) return;
  ctx.clearRect(0, 0, dom.whiteboardCanvas.width, dom.whiteboardCanvas.height);
}

function exportWhiteboard() {
  if (!dom.whiteboardCanvas) return;
  const link = document.createElement('a');
  link.download = 'whiteboard-' + Date.now() + '.png';
  link.href = dom.whiteboardCanvas.toDataURL();
  link.click();
}

export function toggleWhiteboard() {
  state.whiteboardOpen = !state.whiteboardOpen;
  dom.whiteboardOverlay.classList.toggle('hidden', !state.whiteboardOpen);
  dom.whiteboardBtn.classList.toggle('active', state.whiteboardOpen);
  if (state.whiteboardOpen) resizeCanvas();
}

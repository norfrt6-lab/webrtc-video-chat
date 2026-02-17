import { state } from './state.js';
import { dom } from './ui.js';

const EMOJIS = [
  { emoji: '\uD83D\uDC4D', label: 'thumbs up' },
  { emoji: '\uD83D\uDC4F', label: 'clap' },
  { emoji: '\u2764\uFE0F', label: 'heart' },
  { emoji: '\uD83D\uDE02', label: 'laugh' },
  { emoji: '\uD83D\uDE2E', label: 'surprised' },
  { emoji: '\uD83D\uDD25', label: 'fire' }
];

export function initReactionBar() {
  if (!dom.reactionBar) return;
  EMOJIS.forEach(({ emoji, label }) => {
    const btn = document.createElement('button');
    btn.className = 'reaction-btn';
    btn.textContent = emoji;
    btn.title = label;
    btn.onclick = () => sendReaction(emoji);
    dom.reactionBar.appendChild(btn);
  });
}

function sendReaction(emoji) {
  if (!state.socket) return;
  state.socket.emit('emoji-reaction', { emoji });
}

export function showFloatingEmoji(data) {
  if (!dom.reactionsContainer) return;
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = data.emoji;
  el.style.left = (10 + Math.random() * 80) + '%';
  dom.reactionsContainer.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

export function toggleHandRaise() {
  if (!state.socket) return;
  state.handRaised = !state.handRaised;
  state.socket.emit('hand-raise', { raised: state.handRaised });
  dom.handRaiseBtn.classList.toggle('active', state.handRaised);
  dom.handRaiseBtn.textContent = state.handRaised ? 'Lower Hand' : 'Raise Hand';
}

export function showHandRaise(data) {
  const icon = document.getElementById('hand-' + data.socketId);
  if (icon) {
    icon.classList.toggle('hidden', !data.raised);
  }
}

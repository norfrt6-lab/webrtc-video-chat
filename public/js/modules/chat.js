import { state } from './state.js';
import { dom, showToast } from './ui.js';

export function sendChatMessage() {
  const text = dom.chatInput.value.trim();
  if (!text || !state.socket) return;
  state.socket.emit('chat-message', { message: text });
  dom.chatInput.value = '';
}

export function displayChatMessage(data) {
  const div = document.createElement('div');
  const isOwn = data.from === (state.socket && state.socket.id);
  div.className = 'chat-message ' + (isOwn ? 'own' : 'remote');

  const author = document.createElement('span');
  author.className = 'chat-author';
  author.textContent = isOwn ? 'You' : data.username;
  div.appendChild(author);

  const text = document.createElement('span');
  text.className = 'chat-text';
  text.textContent = data.message;
  div.appendChild(text);

  const time = document.createElement('span');
  time.className = 'chat-time';
  const d = new Date(data.timestamp);
  time.textContent = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  div.appendChild(time);

  dom.messages.appendChild(div);
  dom.messages.scrollTop = dom.messages.scrollHeight;

  if (!state.chatOpen && !isOwn) {
    state.unreadMessages++;
    dom.chatBadge.textContent = state.unreadMessages;
    dom.chatBadge.classList.remove('hidden');
  }
}

export function toggleChat() {
  state.chatOpen = !state.chatOpen;
  dom.chatPanel.classList.toggle('hidden', !state.chatOpen);
  dom.chatToggleBtn.classList.toggle('active', state.chatOpen);

  if (state.chatOpen) {
    state.unreadMessages = 0;
    dom.chatBadge.classList.add('hidden');
    dom.chatInput.focus();
  }
}

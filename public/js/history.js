const listEl = document.getElementById('meetingsList');
const navEl = document.getElementById('historyNav');
let currentPage = 1;
const perPage = 20;

async function loadMeetings(page) {
  currentPage = page || 1;
  try {
    const res = await fetch('/api/history?page=' + currentPage + '&perPage=' + perPage);
    const data = await res.json();

    if (!data.meetings || data.meetings.length === 0) {
      listEl.innerHTML = '<div class="no-meetings">No meetings yet. Start a video chat to create history.</div>';
      navEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = data.meetings.map(m => {
      const date = new Date(m.created_at);
      const duration = m.ended_at ? formatDuration(m.ended_at - m.created_at) : 'In progress';
      return '<div class="meeting-card" data-id="' + m.id + '">' +
        '<div class="meeting-card-header">' +
        '<h3>Room: ' + m.room_id + '</h3>' +
        '<span class="participant-badge">' + m.participant_count + ' participants</span>' +
        '</div>' +
        '<div class="meeting-meta">' +
        '<span>' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString() + '</span>' +
        '<span>Duration: ' + duration + '</span>' +
        '</div>' +
        '<div class="meeting-detail" id="detail-' + m.id + '"></div>' +
        '</div>';
    }).join('');

    // Pagination
    const totalPages = Math.ceil(data.total / perPage);
    let navHtml = '';
    if (currentPage > 1) navHtml += '<button class="btn btn-sm" onclick="loadMeetings(' + (currentPage - 1) + ')">Previous</button>';
    navHtml += '<span class="participant-badge">Page ' + currentPage + ' of ' + totalPages + '</span>';
    if (currentPage < totalPages) navHtml += '<button class="btn btn-sm" onclick="loadMeetings(' + (currentPage + 1) + ')">Next</button>';
    navEl.innerHTML = navHtml;

    // Card click handlers
    listEl.querySelectorAll('.meeting-card').forEach(card => {
      card.addEventListener('click', () => toggleMeetingDetail(card));
    });
  } catch (err) {
    listEl.innerHTML = '<div class="no-meetings">Failed to load meeting history.</div>';
  }
}

async function toggleMeetingDetail(card) {
  const id = card.getAttribute('data-id');
  const detailEl = document.getElementById('detail-' + id);

  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded');
    return;
  }

  // Collapse others
  listEl.querySelectorAll('.meeting-card.expanded').forEach(c => c.classList.remove('expanded'));

  try {
    const res = await fetch('/api/history/' + id);
    const data = await res.json();

    let html = '<h4 style="margin-bottom:8px;font-size:0.9rem;">Participants</h4>';
    html += '<div style="margin-bottom:12px;">';
    data.participants.forEach(p => {
      const joinTime = new Date(p.joined_at).toLocaleTimeString();
      const leftTime = p.left_at ? new Date(p.left_at).toLocaleTimeString() : 'still connected';
      html += '<div class="chat-log-item">' + p.username + ' <span class="chat-log-time">' + joinTime + ' - ' + leftTime + '</span></div>';
    });
    html += '</div>';

    html += '<h4 style="margin-bottom:8px;font-size:0.9rem;">Chat Log (' + data.chatLogs.length + ' messages)</h4>';
    if (data.chatLogs.length === 0) {
      html += '<div style="color:var(--text-muted);font-size:0.8rem;">No messages</div>';
    } else {
      data.chatLogs.forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        html += '<div class="chat-log-item"><span class="chat-log-author">' + log.username + '</span>: ' + log.message + '<span class="chat-log-time">' + time + '</span></div>';
      });
    }

    detailEl.innerHTML = html;
    card.classList.add('expanded');
  } catch (err) {
    detailEl.innerHTML = '<div style="color:var(--danger);">Failed to load details</div>';
    card.classList.add('expanded');
  }
}

function formatDuration(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) return hours + 'h ' + mins + 'm';
  if (mins > 0) return mins + 'm ' + secs + 's';
  return secs + 's';
}

// Make loadMeetings available globally for pagination buttons
window.loadMeetings = loadMeetings;

loadMeetings(1);

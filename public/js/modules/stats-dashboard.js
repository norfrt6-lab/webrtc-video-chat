import { state } from './state.js';
import { dom } from './ui.js';

let statsInterval = null;

export function toggleStats() {
  state.statsOpen = !state.statsOpen;
  dom.statsPanel.classList.toggle('hidden', !state.statsOpen);
  dom.statsBtn.classList.toggle('active', state.statsOpen);

  if (state.statsOpen) {
    startStatsCollection();
  } else {
    stopStatsCollection();
  }
}

function startStatsCollection() {
  updateStats();
  statsInterval = setInterval(updateStats, 2000);
}

function stopStatsCollection() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}

async function updateStats() {
  if (!dom.statsBody) return;

  let html = '<table class="stats-table"><thead><tr>' +
    '<th>Peer</th><th>Bitrate</th><th>Res</th><th>FPS</th><th>RTT</th><th>Jitter</th><th>Loss</th>' +
    '</tr></thead><tbody>';

  let totalBitrate = 0;

  for (const [socketId, peer] of Object.entries(state.peers)) {
    try {
      const stats = await peer.pc.getStats();
      let bitrate = 0, resolution = '-', fps = '-', rtt = '-', jitter = '-', loss = '-';
      let bytesReceived = 0;

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.frameWidth && report.frameHeight) {
            resolution = report.frameWidth + 'x' + report.frameHeight;
          }
          if (report.framesPerSecond) {
            fps = Math.round(report.framesPerSecond);
          }
          if (report.packetsLost !== undefined && report.packetsReceived) {
            const total = report.packetsReceived + report.packetsLost;
            loss = total > 0 ? (report.packetsLost / total * 100).toFixed(1) + '%' : '0%';
          }
          if (report.jitter !== undefined) {
            jitter = (report.jitter * 1000).toFixed(0) + 'ms';
          }
          if (report.bytesReceived) {
            bytesReceived = report.bytesReceived;
          }
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          if (report.currentRoundTripTime !== undefined) {
            rtt = (report.currentRoundTripTime * 1000).toFixed(0) + 'ms';
          }
          if (report.availableOutgoingBitrate) {
            bitrate = Math.round(report.availableOutgoingBitrate / 1000);
          }
        }
      });

      totalBitrate += bitrate;

      const rttClass = parseFloat(rtt) > 300 ? 'stat-poor' : parseFloat(rtt) > 150 ? 'stat-fair' : 'stat-good';
      const lossClass = parseFloat(loss) > 5 ? 'stat-poor' : parseFloat(loss) > 2 ? 'stat-fair' : 'stat-good';

      html += '<tr>' +
        '<td>' + peer.username + '</td>' +
        '<td>' + (bitrate ? bitrate + 'kbps' : '-') + '</td>' +
        '<td>' + resolution + '</td>' +
        '<td>' + fps + '</td>' +
        '<td class="' + rttClass + '">' + rtt + '</td>' +
        '<td>' + jitter + '</td>' +
        '<td class="' + lossClass + '">' + loss + '</td>' +
        '</tr>';
    } catch (e) {
      html += '<tr><td>' + peer.username + '</td><td colspan="6">-</td></tr>';
    }
  }

  html += '</tbody></table>';
  html += '<div class="stats-total">Total bandwidth: ' + totalBitrate + ' kbps</div>';

  dom.statsBody.innerHTML = html;
}

export function cleanupStats() {
  stopStatsCollection();
}

import { state } from './state.js';
import { showToast } from './ui.js';
import { updateConnectionIndicator } from './peers.js';

const QUALITY_TIERS = {
  high:   { maxBitrate: 1500000, maxFramerate: 30, scaleDown: 1 },
  medium: { maxBitrate: 800000,  maxFramerate: 24, scaleDown: 1.5 },
  low:    { maxBitrate: 400000,  maxFramerate: 15, scaleDown: 2 }
};

let lastAdaptTier = {};

export function startQualityMonitoring(socketId, pc) {
  state.qualityIntervals[socketId] = setInterval(async () => {
    if (!state.peers[socketId]) {
      stopQualityMonitoring(socketId);
      return;
    }
    try {
      const stats = await pc.getStats();
      let rtt = null;
      let packetLoss = null;

      stats.forEach(report => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime;
        }
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
            const total = report.packetsReceived + report.packetsLost;
            packetLoss = total > 0 ? report.packetsLost / total : 0;
          }
        }
      });

      let quality = 'good';
      if (rtt !== null && rtt > 0.3) quality = 'poor';
      else if (rtt !== null && rtt > 0.15) quality = 'fair';
      if (packetLoss !== null && packetLoss > 0.05) quality = 'poor';
      else if (packetLoss !== null && packetLoss > 0.02 && quality !== 'poor') quality = 'fair';

      updateConnectionIndicator(socketId, null, quality);

      // Adaptive bitrate
      const tier = quality === 'good' ? 'high' : quality === 'fair' ? 'medium' : 'low';
      if (lastAdaptTier[socketId] !== tier) {
        lastAdaptTier[socketId] = tier;
        adaptBitrate(pc, tier);
        if (tier !== 'high') {
          showToast('Video quality adjusted (' + tier + ')', 'info');
        }
      }
    } catch (e) { /* Stats not available */ }
  }, 5000);
}

export function stopQualityMonitoring(socketId) {
  if (state.qualityIntervals[socketId]) {
    clearInterval(state.qualityIntervals[socketId]);
    delete state.qualityIntervals[socketId];
  }
  delete lastAdaptTier[socketId];
}

function adaptBitrate(pc, tier) {
  const config = QUALITY_TIERS[tier];
  if (!config) return;

  pc.getSenders().forEach(sender => {
    if (!sender.track || sender.track.kind !== 'video') return;
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = config.maxBitrate;
    params.encodings[0].maxFramerate = config.maxFramerate;
    params.encodings[0].scaleResolutionDownBy = config.scaleDown;
    sender.setParameters(params).catch(() => {});
  });
}

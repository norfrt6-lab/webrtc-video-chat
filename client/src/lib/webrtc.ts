const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export async function fetchIceConfig(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("http://localhost:3000/api/ice-config");
    const data = await res.json();
    if (data.iceServers?.length) return data.iceServers;
  } catch {
    // fallback to defaults
  }
  return ICE_SERVERS;
}

export function createPeerConnection(
  iceServers: RTCIceServer[]
): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers });
}

export function setMediaBitrate(
  pc: RTCPeerConnection,
  maxBitrate: number
): void {
  const senders = pc.getSenders();
  senders.forEach((sender) => {
    if (!sender.track) return;
    const params = sender.getParameters();
    if (!params.encodings?.length) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = maxBitrate;
    sender.setParameters(params).catch(() => {});
  });
}

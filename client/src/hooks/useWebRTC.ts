"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { fetchIceConfig, createPeerConnection } from "@/lib/webrtc";
import { usePeerStore } from "@/store/usePeerStore";
import { useMediaStore } from "@/store/useMediaStore";

// Queue ICE candidates that arrive before remote description is set
const iceCandidateQueues = new Map<string, RTCIceCandidateInit[]>();

function queueIceCandidate(socketId: string, candidate: RTCIceCandidateInit) {
  if (!iceCandidateQueues.has(socketId)) {
    iceCandidateQueues.set(socketId, []);
  }
  iceCandidateQueues.get(socketId)!.push(candidate);
}

async function flushIceCandidates(socketId: string, pc: RTCPeerConnection) {
  const queue = iceCandidateQueues.get(socketId);
  if (!queue) return;
  for (const candidate of queue) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Failed to add queued ICE candidate:", err);
    }
  }
  iceCandidateQueues.delete(socketId);
}

export function useWebRTC() {
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const setPeer = usePeerStore((s) => s.setPeer);
  const removePeer = usePeerStore((s) => s.removePeer);
  const updatePeerStream = usePeerStore((s) => s.updatePeerStream);

  // Load ICE config once
  useEffect(() => {
    fetchIceConfig().then((servers) => {
      iceServersRef.current = servers;
    });
  }, []);

  const createPeer = useCallback(
    async (socketId: string, username: string, initiator: boolean) => {
      // Close existing peer if any
      const existingPeer = usePeerStore.getState().peers.get(socketId);
      if (existingPeer) {
        existingPeer.pc.close();
      }

      const localStream = useMediaStore.getState().localStream;
      const pc = createPeerConnection(iceServersRef.current);

      // Add local tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      const socket = getSocket();

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            to: socketId,
            candidate: e.candidate,
          });
        }
      };

      // Remote stream
      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        updatePeerStream(socketId, remoteStream);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          pc.restartIce();
        }
      };

      pc.onnegotiationneeded = async () => {
        // Only renegotiate if we're the initiator
        if (!initiator) return;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: socketId, offer });
        } catch (err) {
          console.error("Renegotiation failed:", err);
        }
      };

      // Store peer
      setPeer(socketId, { pc, username, stream: remoteStream });

      // Create offer if initiator
      if (initiator) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: socketId, offer });
        } catch (err) {
          console.error("Failed to create offer:", err);
        }
      }

      return pc;
    },
    [setPeer, updatePeerStream],
  );

  const handleOffer = useCallback(
    async (
      from: string,
      offer: RTCSessionDescriptionInit,
      username: string,
    ) => {
      try {
        const pc = await createPeer(from, username, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushIceCandidates(from, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        getSocket().emit("answer", { to: from, answer });
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    },
    [createPeer],
  );

  const handleAnswer = useCallback(
    async (from: string, answer: RTCSessionDescriptionInit) => {
      try {
        const peer = usePeerStore.getState().peers.get(from);
        if (peer) {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushIceCandidates(from, peer.pc);
        }
      } catch (err) {
        console.error("Failed to handle answer:", err);
      }
    },
    [],
  );

  const handleIceCandidate = useCallback(
    async (from: string, candidate: RTCIceCandidateInit) => {
      const peer = usePeerStore.getState().peers.get(from);
      if (!peer || !peer.pc.remoteDescription) {
        // Queue if remote description not yet set
        queueIceCandidate(from, candidate);
        return;
      }
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add ICE candidate:", err);
      }
    },
    [],
  );

  const closePeer = useCallback(
    (socketId: string) => {
      iceCandidateQueues.delete(socketId);
      removePeer(socketId);
    },
    [removePeer],
  );

  const replaceTrack = useCallback(
    async (kind: "audio" | "video", newTrack: MediaStreamTrack) => {
      const peers = usePeerStore.getState().peers;
      const entries = Array.from(peers.entries());
      for (const [, peer] of entries) {
        const sender = peer.pc.getSenders().find((s) => s.track?.kind === kind);
        if (sender) {
          try {
            await sender.replaceTrack(newTrack);
          } catch (err) {
            console.warn("Failed to replace track:", err);
          }
        }
      }
    },
    [],
  );

  // Wire up signaling events
  useEffect(() => {
    const socket = getSocket();

    const onUserJoined = ({
      socketId,
      username,
    }: {
      socketId: string;
      username: string;
    }) => {
      createPeer(socketId, username, true);
    };

    const onOffer = ({
      from,
      offer,
      username,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
      username: string;
    }) => {
      handleOffer(from, offer, username);
    };

    const onAnswer = ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      handleAnswer(from, answer);
    };

    const onIceCandidate = ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      handleIceCandidate(from, candidate);
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      closePeer(socketId);
    };

    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("user-left", onUserLeft);
    };
  }, [createPeer, handleOffer, handleAnswer, handleIceCandidate, closePeer]);

  return { createPeer, closePeer, replaceTrack };
}

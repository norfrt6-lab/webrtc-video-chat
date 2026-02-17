"use client";

import { useCallback, useState } from "react";
import { usePeerStore } from "@/store/usePeerStore";
import type { FileTransfer } from "@/lib/types";

const CHUNK_SIZE = 16 * 1024; // 16KB

export function useFileShare() {
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);

  const sendFile = useCallback(async (file: File) => {
    const peers = usePeerStore.getState().peers;
    const id = Math.random().toString(36).slice(2);

    setTransfers((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        direction: "send",
        complete: false,
      },
    ]);

    const buffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

    for (const [, peer] of Array.from(peers.entries())) {
      // Create data channel for file
      const dc = peer.pc.createDataChannel(`file-${id}`);

      dc.onopen = () => {
        // Send metadata first
        dc.send(
          JSON.stringify({
            type: "file-meta",
            id,
            name: file.name,
            size: file.size,
            totalChunks,
          }),
        );

        // Send chunks
        let offset = 0;
        let chunkIndex = 0;
        const sendNextChunk = () => {
          if (offset >= buffer.byteLength) {
            dc.send(JSON.stringify({ type: "file-end", id }));
            setTransfers((prev) =>
              prev.map((t) =>
                t.id === id ? { ...t, progress: 100, complete: true } : t,
              ),
            );
            return;
          }

          const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
          dc.send(chunk);
          offset += CHUNK_SIZE;
          chunkIndex++;

          const progress = Math.round((chunkIndex / totalChunks) * 100);
          setTransfers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, progress } : t)),
          );

          if (dc.bufferedAmount < CHUNK_SIZE * 4) {
            sendNextChunk();
          } else {
            dc.onbufferedamountlow = () => {
              dc.onbufferedamountlow = null;
              sendNextChunk();
            };
            dc.bufferedAmountLowThreshold = CHUNK_SIZE * 2;
          }
        };

        sendNextChunk();
      };
    }
  }, []);

  const setupReceiver = useCallback((dc: RTCDataChannel) => {
    let fileMeta: {
      id: string;
      name: string;
      size: number;
      totalChunks: number;
    } | null = null;
    const chunks: ArrayBuffer[] = [];

    dc.onmessage = (e) => {
      if (typeof e.data === "string") {
        const msg = JSON.parse(e.data);
        if (msg.type === "file-meta") {
          fileMeta = msg;
          setTransfers((prev) => [
            ...prev,
            {
              id: msg.id,
              name: msg.name,
              size: msg.size,
              progress: 0,
              direction: "receive",
              complete: false,
            },
          ]);
        } else if (msg.type === "file-end" && fileMeta) {
          const blob = new Blob(chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileMeta.name;
          a.click();
          URL.revokeObjectURL(url);

          setTransfers((prev) =>
            prev.map((t) =>
              t.id === fileMeta!.id
                ? { ...t, progress: 100, complete: true }
                : t,
            ),
          );
        }
      } else if (fileMeta) {
        chunks.push(e.data);
        const progress = Math.round(
          (chunks.length / fileMeta.totalChunks) * 100,
        );
        setTransfers((prev) =>
          prev.map((t) => (t.id === fileMeta!.id ? { ...t, progress } : t)),
        );
      }
    };
  }, []);

  return { transfers, sendFile, setupReceiver };
}

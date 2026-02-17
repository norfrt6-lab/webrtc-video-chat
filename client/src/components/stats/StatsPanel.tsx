"use client";

import { useEffect } from "react";
import { X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePeerStore } from "@/store/usePeerStore";
import { useUIStore } from "@/store/useUIStore";
import type { PeerQualityStats } from "@/lib/types";

export function StatsPanel() {
  const peers = usePeerStore((s) => s.peers);
  const qualityStats = usePeerStore((s) => s.qualityStats);
  const setQualityStats = usePeerStore((s) => s.setQualityStats);
  const setSidePanel = useUIStore((s) => s.setSidePanel);

  // Poll stats every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentPeers = Array.from(usePeerStore.getState().peers.entries());
      for (const [socketId, peer] of currentPeers) {
        try {
          const stats = await peer.pc.getStats();
          let bitrate = 0;
          let rtt = 0;
          let jitter = 0;
          let packetLoss = 0;
          let resolution = "N/A";
          let fps = 0;

          stats.forEach((report: any) => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
              if (report.bytesReceived) {
                bitrate = Math.round((report.bytesReceived * 8) / 1000);
              }
              if (report.jitter) jitter = report.jitter * 1000;
              if (report.framesPerSecond) fps = report.framesPerSecond;
              if (report.frameWidth && report.frameHeight) {
                resolution = `${report.frameWidth}x${report.frameHeight}`;
              }
              if (report.packetsLost && report.packetsReceived) {
                packetLoss =
                  (report.packetsLost /
                    (report.packetsLost + report.packetsReceived)) *
                  100;
              }
            }
            if (
              report.type === "candidate-pair" &&
              report.state === "succeeded"
            ) {
              if (report.currentRoundTripTime) {
                rtt = report.currentRoundTripTime * 1000;
              }
            }
          });

          setQualityStats(socketId, {
            socketId,
            bitrate,
            resolution,
            fps,
            rtt: Math.round(rtt),
            jitter: Math.round(jitter * 100) / 100,
            packetLoss: Math.round(packetLoss * 100) / 100,
            connectionState: peer.pc.connectionState,
          });
        } catch {
          // stats not available
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [setQualityStats]);

  const statsEntries = Array.from(qualityStats.entries());

  const getQualityColor = (stats: PeerQualityStats) => {
    if (stats.packetLoss > 5 || stats.rtt > 300) return "text-red-400";
    if (stats.packetLoss > 2 || stats.rtt > 150) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="flex w-80 flex-col border-l bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Network Stats
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setSidePanel(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        {statsEntries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No active connections
          </p>
        ) : (
          <div className="space-y-4">
            {statsEntries.map(([socketId, stats]) => {
              const peer = peers.get(socketId);
              return (
                <div key={socketId} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {peer?.username ?? socketId.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs font-medium ${getQualityColor(stats)}`}
                    >
                      {stats.connectionState}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <StatRow label="Bitrate" value={`${stats.bitrate} kbps`} />
                    <StatRow label="Resolution" value={stats.resolution} />
                    <StatRow label="FPS" value={`${stats.fps}`} />
                    <StatRow label="RTT" value={`${stats.rtt} ms`} />
                    <StatRow label="Jitter" value={`${stats.jitter} ms`} />
                    <StatRow
                      label="Packet Loss"
                      value={`${stats.packetLoss}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono">{value}</span>
    </>
  );
}

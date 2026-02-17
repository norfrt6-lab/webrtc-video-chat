"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { getSocket } from "@/lib/socket";
import { WhiteboardToolbar } from "./WhiteboardToolbar";

export function WhiteboardOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [width, setWidth] = useState(3);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const pointsRef = useRef<number[]>([]);
  const setWhiteboardOpen = useUIStore((s) => s.setWhiteboardOpen);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Listen for remote strokes
  useEffect(() => {
    const socket = getSocket();

    const handleDraw = (data: {
      socketId: string;
      points: number[];
      color: string;
      width: number;
      tool: string;
    }) => {
      const ctx = getCtx();
      if (!ctx || data.points.length < 4) return;
      ctx.beginPath();
      ctx.strokeStyle = data.tool === "eraser" ? "#000000" : data.color;
      ctx.lineWidth = data.tool === "eraser" ? 20 : data.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(data.points[0], data.points[1]);
      for (let i = 2; i < data.points.length; i += 2) {
        ctx.lineTo(data.points[i], data.points[i + 1]);
      }
      ctx.stroke();
    };

    const handleClear = () => {
      const ctx = getCtx();
      const canvas = canvasRef.current;
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on("whiteboard-draw", handleDraw);
    socket.on("whiteboard-clear", handleClear);

    return () => {
      socket.off("whiteboard-draw", handleDraw);
      socket.off("whiteboard-clear", handleClear);
    };
  }, [getCtx]);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setDrawing(true);
    const { x, y } = getPos(e);
    pointsRef.current = [x, y];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const { x, y } = getPos(e);
    const ctx = getCtx();
    if (!ctx) return;

    const pts = pointsRef.current;
    ctx.beginPath();
    ctx.strokeStyle = tool === "eraser" ? "#000000" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (pts.length >= 2) {
      ctx.moveTo(pts[pts.length - 2], pts[pts.length - 1]);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    pointsRef.current.push(x, y);
  };

  const onPointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (pointsRef.current.length >= 4) {
      getSocket().emit("whiteboard-draw", {
        points: pointsRef.current,
        color,
        width,
        tool,
      });
    }
    pointsRef.current = [];
  };

  const handleClear = () => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    getSocket().emit("whiteboard-clear");
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="absolute inset-0 z-10">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <WhiteboardToolbar
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        tool={tool}
        setTool={setTool}
        onClear={handleClear}
        onExport={handleExport}
        onClose={() => setWhiteboardOpen(false)}
      />
    </div>
  );
}

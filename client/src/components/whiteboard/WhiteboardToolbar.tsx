"use client";

import { Pencil, Eraser, Trash2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WhiteboardToolbarProps {
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  tool: "pen" | "eraser";
  setTool: (t: "pen" | "eraser") => void;
  onClear: () => void;
  onExport: () => void;
  onClose: () => void;
}

const COLORS = ["#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7"];

export function WhiteboardToolbar({
  color,
  setColor,
  width,
  setWidth,
  tool,
  setTool,
  onClear,
  onExport,
  onClose,
}: WhiteboardToolbarProps) {
  return (
    <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card/90 px-3 py-2 shadow-lg backdrop-blur">
      <Button
        variant={tool === "pen" ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => setTool("pen")}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        variant={tool === "eraser" ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => setTool("eraser")}
      >
        <Eraser className="h-4 w-4" />
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => setColor(c)}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform",
            color === c ? "scale-110 border-primary" : "border-transparent hover:scale-105"
          )}
          style={{ backgroundColor: c }}
        />
      ))}

      <div className="mx-1 h-6 w-px bg-border" />

      <input
        type="range"
        min={1}
        max={10}
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
        className="w-16 accent-primary"
      />

      <div className="mx-1 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
        <Download className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

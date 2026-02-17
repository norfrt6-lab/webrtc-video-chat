"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

export function useWhiteboard() {
  const sendStroke = useCallback(
    (points: number[], color: string, width: number, tool: "pen" | "eraser") => {
      getSocket().emit("whiteboard-draw", { points, color, width, tool });
    },
    []
  );

  const sendClear = useCallback(() => {
    getSocket().emit("whiteboard-clear");
  }, []);

  return { sendStroke, sendClear };
}

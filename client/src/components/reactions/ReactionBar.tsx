"use client";

import { getSocket } from "@/lib/socket";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState } from "react";

const EMOJIS = ["👍", "❤️", "😂", "👏", "🎉", "🔥"];

export function ReactionBar() {
  const [handRaised, setHandRaised] = useState(false);

  const sendReaction = (emoji: string) => {
    getSocket().emit("emoji-reaction", { emoji });
  };

  const toggleHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    getSocket().emit("hand-raise", { raised: newState });
  };

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-1.5">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          className="rounded-md px-2 py-1 text-lg transition-transform hover:scale-125 hover:bg-secondary active:scale-95"
        >
          {emoji}
        </button>
      ))}
      <div className="mx-1 h-6 w-px bg-border" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={handRaised ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleHand}
            className="h-8"
          >
            <Hand className={`h-4 w-4 ${handRaised ? "text-yellow-400" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{handRaised ? "Lower hand" : "Raise hand"}</TooltipContent>
      </Tooltip>
    </div>
  );
}

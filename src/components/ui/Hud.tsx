"use client";

import { useIsTouch } from "@/hooks/useIsTouch";
import { usePointerLock } from "@/hooks/usePointerLock";
import { useGameStore } from "@/store/useGameStore";

export default function Hud() {
  const phase = useGameStore((s) => s.phase);
  const isTouch = useIsTouch();
  const { locked, lock } = usePointerLock();

  const moving = phase === "explore" || phase === "guided";
  if (!moving || isTouch || locked) return null;

  return (
    <button
      type="button"
      onClick={lock}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/50 text-[#f4ede0]"
    >
      <span className="font-display text-lg tracking-wide">
        Click to look around
      </span>
      <span className="text-xs opacity-70">
        WASD to move · Shift to run · Esc to release the mouse
      </span>
    </button>
  );
}

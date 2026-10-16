"use client";

import { useGameStore } from "@/store/useGameStore";

/** Two black "eyelids" that blink open while the character wakes up. */
export default function WakeOverlay() {
  const phase = useGameStore((s) => s.phase);
  if (phase !== "waking") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      <div className="eyelid eyelid-top" />
      <div className="eyelid eyelid-bottom" />
    </div>
  );
}

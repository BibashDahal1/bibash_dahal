"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

const DURATION = 3000; // ms. The eyes are fully open at about 78% of this, and the lids then stay open.

// [position in the animation 0..1, how far the lid has moved away, in % of its own height]
// shut -> first peek -> blink shut -> wider look -> half shut -> fully open
const STOPS: [number, number][] = [
  [0, 0],
  [0.1, 0],
  [0.22, 34],
  [0.3, 2],
  [0.46, 58],
  [0.54, 10],
  [0.78, 101],
  [1, 101],
];

/** `dir` -1 moves the lid up (top lid), +1 moves it down (bottom lid) */
const frames = (dir: -1 | 1): Keyframe[] =>
  STOPS.map(([offset, pct], i) => ({
    offset,
    transform: `translate3d(0, ${dir * pct}%, 0)`,
    easing: i < STOPS.length - 1 ? "cubic-bezier(0.42, 0, 0.25, 1)" : "linear",
  }));

/**
 * Two black "eyelids" that blink open while the character wakes up.
 * Self-contained (no stylesheet): the lids start shut, and `fill: "forwards"` keeps them open at the end,
 * so they can never snap back to black. Only `transform` is animated, so it costs the page nothing.
 */
export default function WakeOverlay() {
  const phase = useGameStore((s) => s.phase);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "waking") return;
    const a = top.current?.animate(frames(-1), {
      duration: DURATION,
      fill: "forwards",
    });
    const b = bottom.current?.animate(frames(1), {
      duration: DURATION,
      fill: "forwards",
    });
    return () => {
      a?.cancel();
      b?.cancel();
    };
  }, [phase]);

  if (phase !== "waking") return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      aria-hidden
    >
      <div
        ref={top}
        className="absolute inset-x-0 top-0 h-[56%] will-change-transform"
        style={{
          background:
            "linear-gradient(to bottom, #000 0%, #000 82%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        ref={bottom}
        className="absolute inset-x-0 bottom-0 h-[56%] will-change-transform"
        style={{
          background:
            "linear-gradient(to top, #000 0%, #000 82%, rgba(0,0,0,0) 100%)",
        }}
      />
    </div>
  );
}

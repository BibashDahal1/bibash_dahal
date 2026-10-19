"use client";

import { useIsTouch } from "@/hooks/useIsTouch";
import { useGameStore } from "@/store/useGameStore";

/** Crosshair + what you're aiming at. (The USE button lives in the control pad on touch devices.) */
export default function InteractPrompt() {
  const hover = useGameStore((s) => s.hover);
  const phase = useGameStore((s) => s.phase);
  const scene = useGameStore((s) => s.scene);
  const isTouch = useIsTouch();

  if (scene === "lobby" || phase !== "explore") return null;

  return (
    <>
      {!hover && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
      )}
      {hover && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4 ${
            isTouch ? "bottom-44" : "bottom-16"
          }`}
        >
          <div className="rounded-full border border-[#d4af37]/60 bg-black/55 px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#ffe08a] backdrop-blur-sm">
            {isTouch ? "USE" : "E"} · {hover.label}
          </div>
        </div>
      )}
    </>
  );
}

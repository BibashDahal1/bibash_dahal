"use client";

import { useIsTouch } from "@/hooks/useIsTouch";
import { activateHover } from "@/lib/interaction";
import { useGameStore } from "@/store/useGameStore";

/** Crosshair + "what you're aiming at". Click/E on desktop, a big button on touch. */
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
      {hover &&
        (isTouch ? (
          <button
            type="button"
            onClick={activateHover}
            className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[#d4af37] bg-black/70 px-6 py-3 text-sm font-semibold text-[#ffe08a] shadow-xl backdrop-blur-sm active:scale-95"
          >
            Tap · {hover.label}
          </button>
        ) : (
          <div className="pointer-events-none absolute bottom-10 right-8 z-30 rounded border border-white/15 bg-black/55 px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#f4ede0]">
            Click / E · {hover.label}
          </div>
        ))}
    </>
  );
}

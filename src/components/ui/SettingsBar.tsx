"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

const BTN =
  "rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-xs text-[#f4ede0] backdrop-blur-sm transition hover:border-[#d4af37]";

/** Sound and graphics switches. M and G work even while the mouse is captured. */
export default function SettingsBar() {
  const phase = useGameStore((s) => s.phase);
  const muted = useGameStore((s) => s.muted);
  const quality = useGameStore((s) => s.quality);
  const active = phase !== "intro";

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const s = useGameStore.getState();
      if (e.code === "KeyM") s.toggleMuted();
      if (e.code === "KeyG")
        s.setQuality(s.quality === "high" ? "low" : "high");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute right-4 top-4 z-40 flex gap-2">
      <button
        type="button"
        className={BTN}
        onClick={() => useGameStore.getState().toggleMuted()}
      >
        {muted ? "🔇 Sound off" : "🔊 Sound on"}{" "}
        <span className="ml-1 hidden opacity-50 sm:inline">M</span>
      </button>
      <button
        type="button"
        className={BTN}
        onClick={() => {
          const s = useGameStore.getState();
          s.setQuality(s.quality === "high" ? "low" : "high");
        }}
      >
        ⚙ {quality === "high" ? "High" : "Low"}{" "}
        <span className="ml-1 hidden opacity-50 sm:inline">G</span>
      </button>
    </div>
  );
}

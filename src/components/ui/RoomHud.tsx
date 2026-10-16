"use client";

import { useEffect } from "react";
import { useIsTouch } from "@/hooks/useIsTouch";
import { returnToLobby } from "@/lib/transitions";
import { useGameStore, type Destination } from "@/store/useGameStore";

const HINTS: Record<Destination, string> = {
  office: "Aim at a skill hologram, the CV folder on the desk, or the chair",
  projects: "Aim at a project's screen, a picture or its hologram",
};

export default function RoomHud() {
  const scene = useGameStore((s) => s.scene);
  const phase = useGameStore((s) => s.phase);
  const isTouch = useIsTouch();
  const active = scene !== "lobby" && phase === "explore";

  // B = back to lobby (the mouse is captured on desktop, so the button isn't clickable)
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyB") returnToLobby(scene as Destination);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, scene]);

  if (!active) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => returnToLobby(scene as Destination)}
        className="absolute left-4 top-4 z-40 rounded-lg border border-white/25 bg-black/60 px-4 py-2 text-xs font-medium tracking-wide text-[#f4ede0] backdrop-blur-sm transition hover:border-[#d4af37]"
      >
        ← Back to lobby
      </button>
      <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center px-4 sm:top-4 sm:px-40">
        <span className="rounded-full bg-black/55 px-4 py-1.5 text-center text-[11px] text-[#e8dfc9] backdrop-blur-sm">
          {HINTS[scene as Destination]} ·{" "}
          {isTouch
            ? "tap the button to open"
            : "click or press E to open · B to go back"}
        </span>
      </div>
    </>
  );
}

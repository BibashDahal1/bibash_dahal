"use client";

import { useGameStore } from "@/store/useGameStore";

export default function FadeOverlay() {
  const fade = useGameStore((s) => s.fade);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[45] bg-black transition-opacity duration-700"
      style={{ opacity: fade ? 1 : 0 }}
    />
  );
}

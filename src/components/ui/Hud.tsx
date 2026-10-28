"use client";

import { useEffect, useRef, useState } from "react";
import { useIsTouch } from "@/hooks/useIsTouch";
import { useGameStore } from "@/store/useGameStore";

export default function Hud() {
  const phase = useGameStore((s) => s.phase);
  const isTouch = useIsTouch();
  const [shown, setShown] = useState(false);
  const started = useRef(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (phase === "explore" && !started.current) {
      started.current = true;
      setShown(true);
      timer.current = window.setTimeout(() => setShown(false), 10000);
    }
  }, [phase]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  if (!shown) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4 ${
        isTouch ? "bottom-44" : "bottom-10"
      }`}
    >
      <p className="rounded-full bg-black/65 px-4 py-2 text-center text-xs text-[#f4ede0]">
        {isTouch
          ? "Left thumb to move · right thumb to look · USE to interact"
          : "WASD to move · mouse to look · Shift to run · E or click to interact · Esc to free the mouse"}
      </p>
    </div>
  );
}

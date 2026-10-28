"use client";

import { useEffect, useRef, useState } from "react";
import { usePointerLock } from "@/hooks/usePointerLock";
import { activateHover } from "@/lib/interaction";
import { lockMouse } from "@/lib/mouseLook";
import { useGameStore } from "@/store/useGameStore";

const FIRST_HINT_MS = 6000; // small first-time hint in the lobby
const SCENE_GRACE_MS = 1500; // ignore lock drops right after a room change

export default function DesktopMouseLook() {
  const phase = useGameStore((s) => s.phase);
  const detail = useGameStore((s) => s.detail);
  const scene = useGameStore((s) => s.scene);
  const { locked } = usePointerLock();

  const [released, setReleased] = useState(false); // visitor pressed Esc
  const [firstHint, setFirstHint] = useState(false);

  const prevLocked = useRef(false);
  const everLocked = useRef(false);
  const firstHintShown = useRef(false);
  const sceneChangedAt = useRef(0);
  const timer = useRef<number | null>(null);

  const canLook = (phase === "explore" || phase === "guided") && !detail;

  // remember when the scene last changed, and clear the overlay on any room change
  useEffect(() => {
    sceneChangedAt.current = performance.now();
    setReleased(false);
  }, [scene]);

  // lock changes
  useEffect(() => {
    if (locked) {
      everLocked.current = true;
      setReleased(false);
      setFirstHint(false);
      if (timer.current) window.clearTimeout(timer.current);
    } else if (prevLocked.current) {
      const nearSceneChange =
        performance.now() - sceneChangedAt.current < SCENE_GRACE_MS;
      // lost the capture while freely exploring = the visitor pressed Esc
      if (canLook && !nearSceneChange) setReleased(true);
    }
    prevLocked.current = locked;
  }, [locked, canLook]);

  // hide the overlay whenever exploring is paused (menu, card, transition...)
  useEffect(() => {
    if (!canLook) {
      setReleased(false);
      setFirstHint(false);
    }
  }, [canLook]);

  // small first-time hint, once, in the lobby
  useEffect(() => {
    if (
      canLook &&
      scene === "lobby" &&
      !locked &&
      !everLocked.current &&
      !firstHintShown.current
    ) {
      firstHintShown.current = true;
      setFirstHint(true);
      timer.current = window.setTimeout(
        () => setFirstHint(false),
        FIRST_HINT_MS,
      );
    }
  }, [canLook, scene, locked]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  // clicking captures the mouse everywhere; while captured, a click uses what you aim at
  useEffect(() => {
    if (!canLook) return;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // clicks on buttons and other UI keep their normal behavior
      if (
        (e.target as HTMLElement | null)?.closest("button, a, input, [data-ui]")
      )
        return;
      if (document.pointerLockElement) {
        activateHover();
      } else {
        lockMouse();
      }
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [canLook]);

  if (!canLook || locked) return null;

  // Esc overlay: light dim + highlighted message
  if (released) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/45 px-4">
        <div className="rounded-2xl border border-[#d4af37]/70 bg-black/80 px-6 py-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.25)]">
          <p className="text-sm font-semibold tracking-wide text-[#ffe08a]">
            Click to look around again
          </p>
          <p className="mt-1 text-[11px] text-[#e8dfc9]/70">
            Esc releases the mouse
          </p>
        </div>
      </div>
    );
  }

  // small first-time hint
  if (firstHint) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-center px-4">
        <p className="rounded-full bg-black/65 px-3 py-1.5 text-[11px] text-[#f4ede0]/90">
          Click to look around with the mouse · Esc to release
        </p>
      </div>
    );
  }

  return null;
}

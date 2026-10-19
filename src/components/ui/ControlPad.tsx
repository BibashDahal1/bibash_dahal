"use client";

import { useEffect, useRef, useState } from "react";
import { input } from "@/lib/input";
import { activateHover } from "@/lib/interaction";
import { useGameStore } from "@/store/useGameStore";

const RADIUS = 52; // how far the joystick knob can travel
const LOOK_FEEDBACK = 30; // how far the look knob moves, just for feedback
const DEAD_ZONE = 0.12;
const TOUCH_LOOK_BOOST = 2.2;

type Stick = { ox: number; oy: number; kx: number; ky: number };

/**
 * The on-screen controller, for phones and tablets only (GameShell mounts it on touch devices).
 *  - left half: floating joystick (move)
 *  - right half: drag to look
 *  - RUN toggle and USE button
 * Everything is translucent.
 */
export default function ControlPad() {
  const hover = useGameStore((s) => s.hover);

  const [stick, setStick] = useState<Stick | null>(null);
  const [run, setRun] = useState(false);

  const movePointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });
  const lookStart = useRef({ x: 0, y: 0 });
  const lookKnob = useRef<HTMLDivElement>(null);

  useEffect(() => {
    input.run = run;
  }, [run]);

  // leave nothing stuck when the pad goes away (a menu opens, a card opens...)
  useEffect(
    () => () => {
      input.move.x = 0;
      input.move.y = 0;
      input.run = false;
    },
    [],
  );

  const endMove = () => {
    movePointer.current = null;
    input.move.x = 0;
    input.move.y = 0;
    setStick(null);
  };

  const endLook = () => {
    lookPointer.current = null;
    if (lookKnob.current)
      lookKnob.current.style.transform = "translate(0px, 0px)";
  };

  const baseClass =
    "pointer-events-none absolute rounded-full border bg-white/[0.05]";

  return (
    <div
      className="absolute inset-0 z-20 select-none [-webkit-touch-callout:none]"
      style={{ touchAction: "none" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ---- MOVE zone: left half ---- */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (movePointer.current !== null) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          movePointer.current = e.pointerId;
          origin.current = { x: e.clientX, y: e.clientY };
          setStick({ ox: e.clientX, oy: e.clientY, kx: 0, ky: 0 });
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== movePointer.current) return;
          const dx = e.clientX - origin.current.x;
          const dy = e.clientY - origin.current.y;
          const dist = Math.min(Math.hypot(dx, dy), RADIUS);
          const angle = Math.atan2(dy, dx);
          const magnitude = dist / RADIUS;
          const k =
            magnitude < DEAD_ZONE
              ? 0
              : (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
          input.move.x = Math.cos(angle) * k;
          input.move.y = -Math.sin(angle) * k; // up on screen = forward
          setStick({
            ox: origin.current.x,
            oy: origin.current.y,
            kx: Math.cos(angle) * dist,
            ky: Math.sin(angle) * dist,
          });
        }}
        onPointerUp={endMove}
        onPointerCancel={endMove}
        onLostPointerCapture={endMove}
      />

      {/* ---- LOOK zone: right half ---- */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (lookPointer.current !== null) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          lookPointer.current = e.pointerId;
          lastLook.current = { x: e.clientX, y: e.clientY };
          lookStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== lookPointer.current) return;
          const dx = e.clientX - lastLook.current.x;
          const dy = e.clientY - lastLook.current.y;
          input.look.dx += dx * TOUCH_LOOK_BOOST;
          input.look.dy += dy * TOUCH_LOOK_BOOST;
          lastLook.current = { x: e.clientX, y: e.clientY };

          if (lookKnob.current) {
            const fx = Math.max(
              -LOOK_FEEDBACK,
              Math.min(LOOK_FEEDBACK, (e.clientX - lookStart.current.x) * 0.3),
            );
            const fy = Math.max(
              -LOOK_FEEDBACK,
              Math.min(LOOK_FEEDBACK, (e.clientY - lookStart.current.y) * 0.3),
            );
            lookKnob.current.style.transform = `translate(${fx}px, ${fy}px)`;
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerId !== lookPointer.current) return;
          endLook();
        }}
        onPointerCancel={endLook}
        onLostPointerCapture={endLook}
      />

      {/* ---- ghost ring: shows where the joystick is while idle ---- */}
      {!stick && (
        <div
          className={`${baseClass} border-white/20`}
          style={{
            left: "max(24px, env(safe-area-inset-left))",
            bottom: "max(28px, env(safe-area-inset-bottom))",
            width: RADIUS * 2,
            height: RADIUS * 2,
          }}
        >
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 text-[9px] text-white/30">
            ▲
          </span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-white/30">
            ▼
          </span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-white/30">
            ◀
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white/30">
            ▶
          </span>
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/10" />
        </div>
      )}

      {/* the joystick while in use */}
      {stick && (
        <>
          <div
            className={`${baseClass} border-white/30`}
            style={{
              left: stick.ox - RADIUS,
              top: stick.oy - RADIUS,
              width: RADIUS * 2,
              height: RADIUS * 2,
            }}
          />
          <div
            className="pointer-events-none absolute h-11 w-11 rounded-full border border-white/40 bg-[#d4af37]/45"
            style={{
              left: stick.ox + stick.kx - 22,
              top: stick.oy + stick.ky - 22,
            }}
          />
        </>
      )}

      {/* look ring */}
      <div
        className={`${baseClass} border-white/20`}
        style={{
          right: "max(24px, env(safe-area-inset-right))",
          bottom: "max(28px, env(safe-area-inset-bottom))",
          width: RADIUS * 2,
          height: RADIUS * 2,
        }}
      >
        <span className="absolute left-1/2 top-2 -translate-x-1/2 text-[8px] tracking-[0.25em] text-white/30">
          LOOK
        </span>
        <div
          ref={lookKnob}
          className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 rounded-full border border-white/25 bg-white/10 transition-transform duration-150"
        />
      </div>

      {/* ---- buttons ---- */}
      <div
        className="pointer-events-none absolute z-30 flex flex-col items-center gap-3"
        style={{
          right: "max(32px, calc(env(safe-area-inset-right) + 8px))",
          bottom: "calc(max(28px, env(safe-area-inset-bottom)) + 124px)",
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Run"
          aria-pressed={run}
          onClick={() => setRun((r) => !r)}
          className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border text-[10px] font-semibold tracking-widest transition ${
            run
              ? "border-[#d4af37] bg-[#d4af37]/25 text-[#ffe08a]"
              : "border-white/25 bg-white/[0.06] text-white/70"
          }`}
        >
          RUN
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Use"
          disabled={!hover}
          onPointerDown={(e) => {
            e.stopPropagation();
            activateHover();
          }}
          className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border text-[11px] font-semibold tracking-widest transition ${
            hover
              ? "animate-pulse border-[#d4af37] bg-[#d4af37]/25 text-[#ffe08a]"
              : "border-white/20 bg-white/[0.04] text-white/35"
          }`}
        >
          USE
        </button>
      </div>
    </div>
  );
}

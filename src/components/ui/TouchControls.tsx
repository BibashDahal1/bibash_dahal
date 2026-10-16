"use client";

import { useEffect, useRef, useState } from "react";
import { input } from "@/lib/input";

const RADIUS = 48;
const TOUCH_LOOK_BOOST = 2.2; // converts touch pixels to the same feel as mouse pixels

type Stick = { ox: number; oy: number; kx: number; ky: number };

/** Left half: floating joystick (move). Right half: drag to look. */
export default function TouchControls() {
  const [stick, setStick] = useState<Stick | null>(null);
  const movePointer = useRef<number | null>(null);
  const lookPointer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const lastLook = useRef({ x: 0, y: 0 });

  useEffect(
    () => () => {
      input.move.x = 0;
      input.move.y = 0;
    },
    [],
  );

  const resetStick = () => {
    movePointer.current = null;
    input.move.x = 0;
    input.move.y = 0;
    setStick(null);
  };

  return (
    <div
      className="absolute inset-0 z-20 select-none"
      style={{ touchAction: "none" }}
    >
      {/* MOVE zone */}
      <div
        className="absolute inset-y-0 left-0 w-1/2"
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
          const kx = Math.cos(angle) * dist;
          const ky = Math.sin(angle) * dist;
          input.move.x = kx / RADIUS;
          input.move.y = -ky / RADIUS; // up on screen = forward
          setStick({ ox: origin.current.x, oy: origin.current.y, kx, ky });
        }}
        onPointerUp={resetStick}
        onPointerCancel={resetStick}
      />

      {/* LOOK zone */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        onPointerDown={(e) => {
          if (lookPointer.current !== null) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          lookPointer.current = e.pointerId;
          lastLook.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== lookPointer.current) return;
          input.look.dx += (e.clientX - lastLook.current.x) * TOUCH_LOOK_BOOST;
          input.look.dy += (e.clientY - lastLook.current.y) * TOUCH_LOOK_BOOST;
          lastLook.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (lookPointer.current = null)}
        onPointerCancel={() => (lookPointer.current = null)}
      />

      {stick && (
        <>
          <div
            className="pointer-events-none absolute rounded-full border border-white/30 bg-white/10"
            style={{
              left: stick.ox - RADIUS,
              top: stick.oy - RADIUS,
              width: RADIUS * 2,
              height: RADIUS * 2,
            }}
          />
          <div
            className="pointer-events-none absolute rounded-full bg-[#d4af37]/70"
            style={{
              left: stick.ox + stick.kx - 20,
              top: stick.oy + stick.ky - 20,
              width: 40,
              height: 40,
            }}
          />
        </>
      )}
    </div>
  );
}

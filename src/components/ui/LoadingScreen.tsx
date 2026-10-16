"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";

/* ============================================================
   Monogram artwork (stroke centre-lines, traced from the emblem)
   Written in this order, like a pen: left "B" → centre "D" →
   inner bracket → small "a".
   ============================================================ */

const STROKE_WIDTH = 32;

const PATHS = [
  // left "B" lobes
  "M 508 408 H 470 A 159 159 0 0 0 361 683 A 160 160 0 0 0 470 942 H 582",
  // centre "D" with notch
  "M 520 626 H 475 A 57 57 0 0 1 475 512 H 555 V 307 H 726 " +
    "C 755 307 775 318 796 334 L 912 427 Q 920 434 920 445 V 712 " +
    "Q 920 725 912 732 L 808 816 C 785 834 760 843 735 843 H 678",
  // inner bracket
  "M 678 414 H 726 L 799 478 Q 806 484 806 493 V 666 " +
    "Q 806 675 799 681 L 735 737 H 680",
  // small "a" hook
  "M 520 843 H 475 A 53.5 53.5 0 0 1 475 736 H 580 V 843",
] as const;

const VB = { x: 250, y: 250, w: 730, h: 750 };

const CSS = `
.bd-art {
  width: min(44vh, 68vw, 400px);
  aspect-ratio: ${VB.w} / ${VB.h};
  filter:
    drop-shadow(0 0 10px rgba(60, 160, 255, 0.45))
    drop-shadow(0 0 34px rgba(110, 70, 255, 0.35));
}
.bd-svg { width: 100%; height: 100%; display: block; overflow: visible; }
.bd-st {
  fill: none;
  stroke-width: ${STROKE_WIDTH};
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bd-done .bd-svg { animation: bd-pulse 0.9s ease-in-out 1; }
@keyframes bd-pulse {
  0%, 100% { filter: brightness(1); }
  45% { filter: brightness(1.55) saturate(1.2); }
}
`;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Covers the page until the 3D scene is built. The monogram is
 *  written stroke by stroke as loading progresses; when the last
 *  stroke is finished the screen fades away. */
export default function LoadingScreen() {
  const ready = useGameStore((s) => s.sceneReady);
  const { progress } = useProgress();

  const [fake, setFake] = useState(6);
  const [shown, setShown] = useState(0); // eased 0..100 actually written
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const [lens, setLens] = useState<number[] | null>(null);

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradId = `bd-grad-${uid}`;

  // measure every stroke once so the pen can be paced by real length
  useEffect(() => {
    const l = pathRefs.current.map((p) => p?.getTotalLength() ?? 0);
    if (l.every((n) => n > 0)) setLens(l);
  }, []);

  // slow, believable fallback progress while the scene builds
  useEffect(() => {
    if (ready) return;
    const id = setInterval(
      () => setFake((p) => Math.min(p + Math.random() * 7, 92)),
      250,
    );
    return () => clearInterval(id);
  }, [ready]);

  const target = ready ? 100 : Math.max(fake, progress);
  const targetRef = useRef(target);
  targetRef.current = target;

  // ease the written amount toward the target (smooth pen motion)
  useEffect(() => {
    let raf = 0;
    let cur = 0;
    const tick = () => {
      const t = targetRef.current;
      if (cur < t) {
        cur = Math.min(t, cur + Math.max((t - cur) * 0.05, 0.16));
        setShown(cur);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const complete = ready && shown >= 99.9;

  // fully written + scene ready → short hold, then fade out
  useEffect(() => {
    if (!complete) return;
    const hold = setTimeout(() => setFading(true), 800);
    const end = setTimeout(() => setGone(true), 800 + 750);
    return () => {
      clearTimeout(hold);
      clearTimeout(end);
    };
  }, [complete]);

  if (gone) return null;

  // distribute the written length across the strokes in order
  const total = lens ? lens.reduce((a, b) => a + b, 0) : 0;
  const drawn = (shown / 100) * total;
  let acc = 0;
  let tip: { x: number; y: number } | null = null;

  const fracs = PATHS.map((_, i) => {
    if (!lens) return 0;
    const f = clamp01((drawn - acc) / lens[i]);
    if (f > 0 && f < 1) {
      const el = pathRefs.current[i];
      if (el) {
        const pt = el.getPointAtLength(lens[i] * f);
        tip = { x: pt.x, y: pt.y };
      }
    }
    acc += lens[i];
    return f;
  });

  const renderStrokes = (stroke: string, glow = false) =>
    PATHS.map((d, i) => {
      const len = lens?.[i] ?? 0;
      const f = fracs[i];
      return (
        <path
          key={i}
          ref={
            glow
              ? undefined
              : (el) => {
                  pathRefs.current[i] = el;
                }
          }
          className="bd-st"
          d={d}
          stroke={stroke}
          style={{
            strokeWidth: glow ? STROKE_WIDTH * 2.2 : undefined,
            strokeDasharray: len ? `${len} ${len}` : undefined,
            strokeDashoffset: len ? len * (1 - f) : undefined,
            opacity: f > 0.001 ? (glow ? 0.22 : 1) : 0,
          }}
        />
      );
    });

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute inset-0 z-[70] flex items-center justify-center px-6 transition-opacity duration-700 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      } ${complete ? "bd-done" : ""}`}
      style={{
        backgroundColor: "#02030f",
        backgroundImage:
          "radial-gradient(90% 60% at 50% 0%, rgba(20,60,150,0.30) 0%, transparent 70%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }}
    >
      <style>{CSS}</style>
      <span className="sr-only">Loading portfolio… {Math.round(shown)}%</span>

      <div className="bd-art" aria-hidden="true">
        <svg
          className="bd-svg"
          viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="300"
              y1="380"
              x2="940"
              y2="880"
            >
              <stop offset="0%" stopColor="#35e8ff" />
              <stop offset="38%" stopColor="#1e9bff" />
              <stop offset="68%" stopColor="#4d5bff" />
              <stop offset="100%" stopColor="#7a2cff" />
            </linearGradient>
          </defs>

          {/* soft glow under the strokes */}
          <g>{renderStrokes("#4a7bff", true)}</g>

          {/* the written line */}
          <g>{renderStrokes(`url(#${gradId})`)}</g>

          {/* glowing pen tip while writing */}
          {tip && !complete && (
            <g>
              <circle
                cx={tip.x}
                cy={tip.y}
                r="26"
                fill="#7ae6ff"
                opacity="0.28"
              />
              <circle cx={tip.x} cy={tip.y} r="11" fill="#e8fbff" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

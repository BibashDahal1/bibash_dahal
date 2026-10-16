"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  FontLoader,
  type Font,
} from "three/examples/jsm/loaders/FontLoader.js";

import { BACK_WALL_Z, GOLD, GOLD_LIGHT } from "@/constants/world";
import { sleep } from "@/lib/sleep";

const GOLD_A = new THREE.Color(GOLD);
const GOLD_B = new THREE.Color(GOLD_LIGHT);

const LETTER_MS = 170; // a new letter starts being written every 170ms
const DRAW_MS = 650; // time the pen takes to trace one letter's outline
const FILL_MS = 450; // gold fill fades in after the outline is traced
const HOLD_MS = 3400; // fully written, shimmering
const FADE_MS = 800;
const GAP_MS = 500;

const LETTER_SPACING = 0.08; // em, same as before
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeInOutSine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

/* ============================================================
   Glyph geometry
   ------------------------------------------------------------
   Every letter is turned into closed outline contours (the
   letter's edge + its holes, e.g. the eyes of the B / A / D).
   The pen traces those contours, then the gold fill fades in
   and the light sweeps across — the same "written by hand"
   sequence as the logo animation.
   ============================================================ */

type Contour = {
  points: THREE.Vector3[]; // evenly spaced along the outline (constant pen speed)
  len: number;
};
type Glyph = {
  contours: Contour[];
  len: number; // total outline length of the letter
  fill: THREE.ShapeGeometry | null;
  cx: number; // letter centre x (for the travelling shimmer)
};

function buildGlyphs(text: string, size: number, font: Font) {
  const data: any = font.data;
  const scale = size / data.resolution;
  const spacing = LETTER_SPACING * size;

  // 1) lay the letters out left → right
  let cursor = 0;
  const raw = Array.from(text).map((ch) => {
    const g = data.glyphs[ch] ?? data.glyphs["?"];
    const adv = (g?.ha ?? 0) * scale;
    const item = {
      x: cursor,
      adv,
      shapes: ch.trim() === "" ? [] : font.generateShapes(ch, size),
    };
    cursor += adv + spacing;
    return item;
  });
  const width = Math.max(0, cursor - spacing);

  // 2) vertical centring from the real outline bounds
  let minY = Infinity;
  let maxY = -Infinity;
  for (const r of raw) {
    for (const s of r.shapes) {
      for (const p of s.getPoints(6)) {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
  }
  const offX = -width / 2;
  const offY = Number.isFinite(minY) ? -(minY + maxY) / 2 : 0;

  // 3) contours + fill per letter
  const glyphs: Glyph[] = raw.map((r) => {
    const contours: Contour[] = [];
    for (const shape of r.shapes) {
      for (const c of [shape, ...shape.holes]) {
        const l = c.getLength();
        if (l <= 0) continue;
        const n = Math.max(32, Math.ceil(l / (size * 0.012)));
        const pts2 = c.getSpacedPoints(n);
        const first = pts2[0];
        if (first.distanceTo(pts2[pts2.length - 1]) > 1e-4)
          pts2.push(first.clone());
        const points = pts2.map(
          (p) => new THREE.Vector3(p.x + r.x + offX, p.y + offY, 0),
        );
        contours.push({ points, len: l });
      }
    }
    let fill: THREE.ShapeGeometry | null = null;
    if (r.shapes.length) {
      fill = new THREE.ShapeGeometry(r.shapes, 10);
      fill.translate(r.x + offX, offY, 0);
    }
    return {
      contours,
      len: contours.reduce((a, c) => a + c.len, 0),
      fill,
      cx: r.x + offX + r.adv / 2,
    };
  });

  return { glyphs, width };
}

type Props = {
  text?: string;
  position?: [number, number, number];
  fontSize?: number;
  subtitle?: string;
  /**
   * typeface.json font. Tried first from your own site (put it in
   * public/fonts/), then from a CDN copy of three's Helvetiker Bold.
   */
  fontUrl?: string;
};

/**
 * Gold name that is written by hand: a glowing pen traces every letter's outline,
 * the gold fill fades in, a light sweeps across, then it fades and is written again, forever.
 * It starts the moment it mounts and never depends on game state, so it can't get stuck.
 */
function WrittenName({
  text = "BIBASH DAHAL",
  position = [0, 4.4, BACK_WALL_Z + 0.06],
  fontSize = 1.25,
  subtitle,
  font,
}: Omit<Props, "fontUrl"> & { font: Font }) {
  const target = useRef(1);
  const opacity = useRef(0);
  const writeStart = useRef<number | null>(null);

  const lineRef = useRef<THREE.Mesh>(null);
  const lineMat = useRef<THREE.MeshBasicMaterial>(null);
  const fillMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const coreRefs = useRef<any[][]>([]);
  const glowRefs = useRef<any[][]>([]);
  const tipRef = useRef<THREE.Group>(null);
  const tipCore = useRef<THREE.MeshBasicMaterial>(null);
  const tipHalo = useRef<THREE.MeshBasicMaterial>(null);

  const built = useMemo(
    () => buildGlyphs(text, fontSize, font),
    [text, fontSize, font],
  );

  useEffect(
    () => () => {
      built.glyphs.forEach((g) => g.fill?.dispose());
    },
    [built],
  );

  const strokeW = fontSize * 0.03;
  const WRITE_MS = (text.length - 1) * LETTER_MS + DRAW_MS + FILL_MS;

  useEffect(() => {
    let stop = false;
    (async () => {
      while (!stop) {
        target.current = 1;
        writeStart.current = performance.now(); // the pen starts writing
        await sleep(WRITE_MS);
        if (stop) return;
        await sleep(HOLD_MS); // fully written, shimmering
        if (stop) return;
        target.current = 0;
        await sleep(FADE_MS);
        if (stop) return;
        writeStart.current = null;
        await sleep(GAP_MS);
      }
    })();
    return () => {
      stop = true;
    };
  }, [WRITE_MS]);

  useFrame(({ clock }, dt) => {
    opacity.current = THREE.MathUtils.damp(
      opacity.current,
      target.current,
      6,
      dt,
    );
    const op = opacity.current;
    const t = clock.elapsedTime;
    const ws = writeStart.current;
    const el = ws == null ? -1 : performance.now() - ws;

    let tip: THREE.Vector3 | null = null;

    for (let gi = 0; gi < built.glyphs.length; gi++) {
      const g = built.glyphs[gi];
      if (!g.contours.length) continue;

      const start = gi * LETTER_MS;
      const dp = el < 0 ? 0 : easeInOutSine(clamp01((el - start) / DRAW_MS));
      const fp = el < 0 ? 0 : clamp01((el - start - DRAW_MS * 0.8) / FILL_MS);
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 - g.cx * 0.8); // light travels across

      // pen: trace the contours one after another
      const drawn = dp * g.len;
      let acc = 0;
      for (let ci = 0; ci < g.contours.length; ci++) {
        const c = g.contours[ci];
        const f = clamp01((drawn - acc) / c.len);
        acc += c.len;
        const segs =
          f <= 0 ? 0 : Math.max(1, Math.floor(f * (c.points.length - 1)));
        if (f > 0 && f < 1) tip = c.points[segs]; // newest letter wins

        const core = coreRefs.current[gi]?.[ci];
        if (core) {
          core.visible = segs > 0;
          core.geometry.instanceCount = segs;
          core.material.opacity = op * (1 - 0.4 * fp);
        }
        const glow = glowRefs.current[gi]?.[ci];
        if (glow) {
          glow.visible = segs > 0;
          glow.geometry.instanceCount = segs;
          glow.material.opacity = 0.3 * op * (0.7 + 0.3 * pulse);
        }
      }

      // gold fill fades in once the outline is written, then shimmers
      const mat = fillMats.current[gi];
      if (mat) {
        mat.color.lerpColors(GOLD_A, GOLD_B, pulse);
        mat.opacity = fp * op;
      }
    }

    if (tipRef.current) {
      const p = tip as THREE.Vector3 | null;
      tipRef.current.visible = !!p && op > 0.02;
      if (p) tipRef.current.position.set(p.x, p.y, 0.03);
      if (tipCore.current) tipCore.current.opacity = op;
      if (tipHalo.current) tipHalo.current.opacity = 0.32 * op;
    }

    // underline grows as letters are started
    if (lineRef.current) {
      const started =
        el < 0 ? 0 : Math.min(text.length, Math.floor(el / LETTER_MS) + 1);
      const k = Math.max(0.001, started / text.length);
      lineRef.current.scale.x = THREE.MathUtils.damp(
        lineRef.current.scale.x,
        k,
        5,
        dt,
      );
    }
    if (lineMat.current) lineMat.current.opacity = op;
  });

  return (
    <group position={position}>
      {built.glyphs.map((g, gi) =>
        g.contours.length === 0 ? null : (
          <group key={gi}>
            {/* gold fill */}
            <mesh geometry={g.fill!}>
              <meshBasicMaterial
                ref={(el) => {
                  fillMats.current[gi] = el;
                }}
                color={GOLD}
                transparent
                opacity={0}
                depthWrite={false}
              />
            </mesh>

            {/* outline the pen traces: soft glow + bright line */}
            {g.contours.map((c, ci) => (
              <group key={ci}>
                <Line
                  ref={(el: any) => {
                    (glowRefs.current[gi] ??= [])[ci] = el;
                  }}
                  points={c.points}
                  color="#ffb300"
                  lineWidth={strokeW * 2.8}
                  worldUnits
                  transparent
                  opacity={0}
                  depthWrite={false}
                  position={[0, 0, -0.01]}
                />
                <Line
                  ref={(el: any) => {
                    (coreRefs.current[gi] ??= [])[ci] = el;
                  }}
                  points={c.points}
                  color={GOLD_LIGHT}
                  lineWidth={strokeW}
                  worldUnits
                  transparent
                  opacity={0}
                  position={[0, 0, 0.01]}
                />
              </group>
            ))}
          </group>
        ),
      )}

      {/* glowing pen tip */}
      <group ref={tipRef} visible={false}>
        <mesh>
          <circleGeometry args={[strokeW * 3.2, 24]} />
          <meshBasicMaterial
            ref={tipHalo}
            color="#ffb300"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[strokeW * 1.3, 20]} />
          <meshBasicMaterial
            ref={tipCore}
            color="#fff3c4"
            transparent
            opacity={0}
          />
        </mesh>
      </group>

      <mesh
        ref={lineRef}
        position={[0, -fontSize * 0.76, 0]}
        scale={[0.001, 1, 1]}
      >
        <boxGeometry
          args={[Math.max(built.width, fontSize * 8.8), 0.04, 0.02]}
        />
        <meshBasicMaterial ref={lineMat} color={GOLD} transparent />
      </mesh>

      {subtitle && (
        <Text
          position={[0, -fontSize * 0.98, 0]}
          fontSize={fontSize * 0.19}
          letterSpacing={0.3}
          color="#c9bfa6"
          anchorX="center"
          anchorY="middle"
        >
          {subtitle}
        </Text>
      )}
    </group>
  );
}

const LOCAL_FONT = "/fonts/helvetiker_bold.typeface.json";
const CDN_FONT =
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/fonts/helvetiker_bold.typeface.json";

/** Loads the font (own site first, CDN as a fallback), then starts the writing. */
export default function GoldenName({ fontUrl = LOCAL_FONT, ...rest }: Props) {
  const [font, setFont] = useState<Font | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of [fontUrl, CDN_FONT]) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled) setFont(new FontLoader().parse(json));
          return;
        } catch {
          /* try the next source */
        }
      }
      console.error("GoldenName: could not load a typeface.json font");
    })();
    return () => {
      cancelled = true;
    };
  }, [fontUrl]);

  if (!font) return null;
  return <WrittenName {...rest} font={font} />;
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { inView } from "@/lib/inView";
import HologramPlatform, { PLATFORM_H } from "./HologramPlatform";
import { PALETTES, type PaletteName } from "./hologramPalette";

/* ---------- artwork + performance constants ---------- */
const W = 2166;
const H = 2904;

// the plane is slightly larger than the portrait so the glow has room
const PAD_X = 1.12;
const PAD_Y = 1.06;

const SIL_SCALE = 0.4; // static black silhouette (drawn once)
const SIL_W = Math.round(W * SIL_SCALE);
const SIL_H = Math.round(H * SIL_SCALE);

const STROKE_SCALE = 0.32; // animated outline (lower = faster)
const ST_W = Math.round(W * STROKE_SCALE);
const ST_H = Math.round(H * STROKE_SCALE);

const GLOW_SCALE = 0.18; // blurred halo (drawn once, tiny)
const GLOW_W = Math.round(W * PAD_X * GLOW_SCALE);
const GLOW_H = Math.round(H * PAD_Y * GLOW_SCALE);
const GLOW_BLUR = 16;

const STROKE_W = 4;
const ERASE_W = 6;
const OVERLAP = 2; // design units, hides seams between incremental pieces
const MIN_PIECE = 0.8; // skip pieces shorter than this (design units)

type Kind = "A" | "B" | "C";
type Chunk = [Kind, string];

/* ---------- timeline ---------- */
const DRAW_SPREAD = 3800;
const DRAW_DUR: Record<Kind, number> = { A: 2800, B: 1700, C: 1000 };
const UNDRAW_SPREAD = 1800;
const UNDRAW_DUR: Record<Kind, number> = { A: 1500, B: 1100, C: 800 };
const FILL_IN_MS = 1400;
const SHEEN_MS = 1500;
const HOLD_MS = 2200;
const FILL_OUT_MS = 1000;
const GAP_MS = 500;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return sy(clamp01(t));
  };
}

const easeDraw = bezier(0.45, 0.05, 0.35, 1);
const easeUndraw = bezier(0.55, 0, 0.4, 1);
const easeSoft = bezier(0.42, 0, 0.58, 1);
const easeSheen = bezier(0.25, 0.6, 0.3, 1);

function buildTimeline(kinds: Kind[]) {
  const n = kinds.length;
  const frac = (i: number) => (n > 1 ? i / (n - 1) : 0);

  const dStart = kinds.map((_, i) => frac(i) * DRAW_SPREAD);
  const dDur = kinds.map((k) => DRAW_DUR[k]);
  const drawEnd = Math.max(...dStart.map((s, i) => s + dDur[i]));

  const fillIn = drawEnd - 600;
  const fillInEnd = fillIn + FILL_IN_MS;
  const sheenAt = fillIn + 700;

  const undrawAt = fillInEnd - 100;
  const uStart = kinds.map((_, i) => undrawAt + frac(i) * UNDRAW_SPREAD);
  const uDur = kinds.map((k) => UNDRAW_DUR[k]);
  const undrawEnd = Math.max(...uStart.map((s, i) => s + uDur[i]));

  const fillOut = undrawEnd + HOLD_MS;
  const total = fillOut + FILL_OUT_MS + GAP_MS;

  return { dStart, dDur, uStart, uDur, fillIn, sheenAt, fillOut, total };
}

/* ---------- shader ---------- */
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
  Premultiplied alpha, NormalBlending:
    black portrait  = alpha only (hides what is behind it)
    blue light      = rgb only  (outline, glow, scanlines)
  The textures are uploaded without flipping (cheaper), so the shader flips v itself.
  The outline texture is uploaded premultiplied, so its rgb is already multiplied by its alpha.
*/
const FRAG = /* glsl */ `
  uniform sampler2D uStroke; // animated outline (premultiplied)
  uniform sampler2D uSil;    // a = silhouette
  uniform sampler2D uGlow;   // blurred halo, alpha only (covers the whole plane)
  uniform float uFillOpacity;
  uniform float uSheen;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform vec2  uPad;
  uniform vec3  uColA;
  uniform vec3  uColC;
  varying vec2 vUv;

  void main() {
    // portrait coordinates inside the plane; everything outside is masked
    vec2 pu = (vUv - 0.5) * uPad + 0.5;
    float inside = step(0.0, pu.x) * step(pu.x, 1.0) * step(0.0, pu.y) * step(pu.y, 1.0);

    vec2 tu = vec2(pu.x, 1.0 - pu.y);
    vec3 outline = texture2D(uStroke, tu).rgb;
    float silA = texture2D(uSil, tu).a;
    float gl = texture2D(uGlow, vec2(vUv.x, 1.0 - vUv.y)).a;

    float sil = silA * inside;
    float fa  = sil * uFillOpacity;

    float lines = 0.5 + 0.5 * sin(pu.y * 620.0 - uTime * 4.0);
    float band  = smoothstep(0.03, 0.0, abs(pu.y - fract(uTime * 0.2)));

    float c = vUv.x - vUv.y * 0.25;
    float p = -0.3 + uSheen * 1.6;
    float on = step(0.0, uSheen) * step(uSheen, 1.0);
    float sweep = smoothstep(0.1, 0.0, abs(c - p)) * on;

    vec3 light = outline * inside
               + uColA * gl * (1.0 - sil) * uFillOpacity * 0.9
               + uColA * fa * lines * 0.03
               + uColC * fa * band * 0.12
               + uColC * fa * sweep * 0.18;

    float fadeB = smoothstep(-0.02, 0.09, pu.y);           // dissolve into the projector
    float flick = 0.94 + 0.06 * sin(uTime * 31.0) * sin(uTime * 7.3);
    float scan  = 0.85 + 0.15 * sin(vUv.y * 520.0 - uTime * 5.0);
    float k = scan * flick * fadeB * uOpacity * uIntensity;

    vec3 rgb = light * k;
    float a = fa * fadeB * uOpacity;

    if (a < 0.003 && max(rgb.r, max(rgb.g, rgb.b)) < 0.003) discard;

    gl_FragColor = vec4(rgb, a);
    #include <colorspace_fragment>
  }
`;

/* ---------- paths -> point lists ---------- */

/**
 * A path flattened into points once. `cum` is the distance along the path at each point, so any piece of the
 * outline can be drawn by itself without touching the rest. `brk` marks the first point of each sub-shape.
 */
interface Poly {
  x: Float32Array;
  y: Float32Array;
  cum: Float32Array;
  brk: Uint8Array;
  n: number;
}

const TOKEN = /[MCLZ]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

function parsePath(d: string): Poly {
  const tok = d.match(TOKEN) ?? [];
  const xs: number[] = [];
  const ys: number[] = [];
  const br: number[] = [];
  let cmd = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;

  const add = (x: number, y: number, b: number) => {
    xs.push(x);
    ys.push(y);
    br.push(b);
    cx = x;
    cy = y;
  };
  const num = () => parseFloat(tok[i++]);

  while (i < tok.length) {
    const c = tok[i].charCodeAt(0);
    if (c === 77 || c === 67 || c === 76 || c === 90) {
      // M C L Z
      cmd = tok[i++];
      if (cmd === "Z" && (cx !== sx || cy !== sy)) add(sx, sy, 0);
      continue;
    }
    if (cmd === "M") {
      sx = num();
      sy = num();
      add(sx, sy, 1);
      cmd = "L"; // extra pairs after M are line-tos
    } else if (cmd === "L") {
      const x = num();
      const y = num();
      add(x, y, 0);
    } else if (cmd === "C") {
      const x1 = num();
      const y1 = num();
      const x2 = num();
      const y2 = num();
      const x3 = num();
      const y3 = num();
      const x0 = cx;
      const y0 = cy;
      const ctrl =
        Math.hypot(x1 - x0, y1 - y0) +
        Math.hypot(x2 - x1, y2 - y1) +
        Math.hypot(x3 - x2, y3 - y2);
      const n = Math.min(20, Math.max(2, Math.ceil(ctrl / 5)));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        const a = u * u * u;
        const b = 3 * u * u * t;
        const cc = 3 * u * t * t;
        const dd = t * t * t;
        add(
          a * x0 + b * x1 + cc * x2 + dd * x3,
          a * y0 + b * y1 + cc * y2 + dd * y3,
          0,
        );
      }
    } else {
      i++;
    }
  }

  if (!xs.length) add(0, 0, 1);
  const n = xs.length;
  const x = Float32Array.from(xs);
  const y = Float32Array.from(ys);
  const brk = Uint8Array.from(br);
  const cum = new Float32Array(n);
  for (let k = 1; k < n; k++)
    cum[k] =
      cum[k - 1] + (brk[k] ? 0 : Math.hypot(x[k] - x[k - 1], y[k] - y[k - 1]));
  return { x, y, cum, brk, n };
}

/** adds the piece [s, e] (distance along the path) to the current canvas path */
function appendRange(
  ctx: CanvasRenderingContext2D,
  p: Poly,
  s: number,
  e: number,
) {
  const { x, y, cum, brk, n } = p;
  if (e <= s) return;

  // first point whose distance is beyond s
  let lo = 1;
  let hi = n;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] > s) hi = mid;
    else lo = mid + 1;
  }
  let k = lo;
  if (k >= n) return;

  const c0 = cum[k - 1];
  const c1 = cum[k];
  const f = c1 > c0 ? (s - c0) / (c1 - c0) : 0;
  ctx.moveTo(
    x[k - 1] + (x[k] - x[k - 1]) * f,
    y[k - 1] + (y[k] - y[k - 1]) * f,
  );

  for (; k < n && cum[k - 1] < e; k++) {
    if (brk[k]) {
      ctx.moveTo(x[k], y[k]);
      continue;
    }
    if (cum[k] <= e) {
      ctx.lineTo(x[k], y[k]);
    } else {
      const g = (e - cum[k - 1]) / (cum[k] - cum[k - 1]);
      ctx.lineTo(
        x[k - 1] + (x[k] - x[k - 1]) * g,
        y[k - 1] + (y[k] - y[k - 1]) * g,
      );
    }
  }
}

/** builds the whole artwork as one canvas path (for the silhouette and the glow) */
function polyPath(ctx: CanvasRenderingContext2D, polys: Poly[]) {
  ctx.beginPath();
  for (const p of polys) {
    for (let k = 0; k < p.n; k++) {
      if (p.brk[k]) ctx.moveTo(p.x[k], p.y[k]);
      else ctx.lineTo(p.x[k], p.y[k]);
    }
  }
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

function bakeSilhouette(canvas: HTMLCanvasElement, polys: Poly[]) {
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(SIL_SCALE, 0, 0, SIL_SCALE, 0, 0);
  ctx.fillStyle = "#000";
  polyPath(ctx, polys);
  ctx.fill("evenodd");
}

function bakeGlow(canvas: HTMLCanvasElement, polys: Poly[]) {
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw the shape off-canvas and let its blurred shadow land on the canvas
  const OFF = canvas.width + 200;
  ctx.setTransform(
    GLOW_SCALE,
    0,
    0,
    GLOW_SCALE,
    ((PAD_X - 1) / 2) * W * GLOW_SCALE - OFF,
    ((PAD_Y - 1) / 2) * H * GLOW_SCALE,
  );
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = GLOW_BLUR;
  ctx.shadowOffsetX = OFF;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#fff";
  polyPath(ctx, polys);
  ctx.fill("evenodd");
  ctx.fill("evenodd"); // second pass = stronger halo
}

/**
 * Draws only the NEW piece of each stroke and erases only the NEWLY vanished piece.
 * All pieces of one step go into a single canvas path, so it costs two stroke calls per step.
 */
function stepStrokes(r: Runtime, ctx: CanvasRenderingContext2D, t: number) {
  const { tl, polys, lens, prevDp, prevUp } = r;
  let drew = false;
  let erased = false;

  ctx.beginPath();
  for (let i = 0; i < polys.length; i++) {
    if (t < tl.dStart[i] || prevDp[i] >= 1) continue;
    const dp = easeDraw(clamp01((t - tl.dStart[i]) / tl.dDur[i]));
    const L = lens[i];
    if (dp > prevDp[i] && ((dp - prevDp[i]) * L >= MIN_PIECE || dp >= 1)) {
      appendRange(
        ctx,
        polys[i],
        Math.max(0, prevDp[i] * L - OVERLAP),
        Math.min(L, dp * L + OVERLAP * 0.5),
      );
      prevDp[i] = dp;
      drew = true;
    }
  }
  if (drew) ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < polys.length; i++) {
    if (t < tl.uStart[i] || prevUp[i] >= 1) continue;
    const up = easeUndraw(clamp01((t - tl.uStart[i]) / tl.uDur[i]));
    const L = lens[i];
    if (up > prevUp[i] && ((up - prevUp[i]) * L >= MIN_PIECE || up >= 1)) {
      appendRange(
        ctx,
        polys[i],
        Math.max(0, prevUp[i] * L - 1),
        Math.min(L, up * L + 1),
      );
      prevUp[i] = up;
      erased = true;
    }
  }
  if (erased) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = ERASE_W;
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = STROKE_W;
  }
  return drew || erased;
}

/* ---------- component ---------- */

interface HologramPortraitProps {
  position?: [number, number, number]; // floor position of the platform
  height?: number; // portrait height in world units
  lift?: number; // gap between platform and bottom of the portrait
  palette?: PaletteName;
  billboard?: boolean; // keep facing the camera around Y
  floatAmp?: number;
  intensity?: number;
  showBase?: boolean;
  maxDistance?: number; // beyond this the hologram is hidden and paused
}

interface Runtime {
  polys: Poly[];
  lens: Float32Array;
  tl: ReturnType<typeof buildTimeline>;
  t: number;
  acc: number;
  prevDp: Float32Array;
  prevUp: Float32Array;
}

const _wp = new THREE.Vector3();

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const makeTex = (c: HTMLCanvasElement, premultiplied = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.flipY = false; // the shader flips v: cheaper than flipping on every upload
  t.premultiplyAlpha = premultiplied; // canvases are premultiplied already, so this skips a conversion
  return t;
};

export default function HologramPortrait({
  position = [0, 0, 0],
  height = 3.2,
  lift = 0.5,
  palette = "blue",
  billboard = true,
  floatAmp = 0.05,
  intensity = 1.2,
  showBase = true,
  maxDistance = 40,
}: HologramPortraitProps) {
  const pal = PALETTES[palette];
  const width = (height * W) / H;
  const planeW = width * PAD_X;
  const planeH = height * PAD_Y;
  const portraitY = PLATFORM_H + lift + planeH / 2;

  const rootRef = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Group>(null);
  const rt = useRef<Runtime | null>(null);

  // a sphere around the platform and portrait, for "is it on screen?"
  const px = position[0];
  const py = position[1];
  const pz = position[2];
  const center = useMemo(
    () => new THREE.Vector3(px, py + portraitY, pz),
    [px, py, pz, portraitY],
  );
  const radius = planeH * 0.5 + 1.8;

  const strokeCanvas = useMemo(() => makeCanvas(ST_W, ST_H), []);
  const silCanvas = useMemo(() => makeCanvas(SIL_W, SIL_H), []);
  const glowCanvas = useMemo(() => makeCanvas(GLOW_W, GLOW_H), []);

  const [strokeTex, silTex, glowTex] = useMemo(
    () =>
      [
        makeTex(strokeCanvas, true),
        makeTex(silCanvas),
        makeTex(glowCanvas),
      ] as const,
    [strokeCanvas, silCanvas, glowCanvas],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uStroke: { value: strokeTex },
          uSil: { value: silTex },
          uGlow: { value: glowTex },
          uFillOpacity: { value: 0 },
          uSheen: { value: -1 },
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uIntensity: { value: intensity },
          uPad: { value: new THREE.Vector2(PAD_X, PAD_Y) },
          uColA: { value: new THREE.Color(pal.a) },
          uColC: { value: new THREE.Color(pal.c) },
        },
        transparent: true,
        premultipliedAlpha: true,
        blending: THREE.NormalBlending, // premultiplied: ONE, ONE_MINUS_SRC_ALPHA
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strokeTex, silTex, glowTex, pal],
  );

  // load the artwork, flatten the paths, bake the static textures once (in small slices, never one long stall)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await import("./portraitData");
      if (cancelled) return;
      const chunks = data.PORTRAIT_CHUNKS as unknown as Chunk[];

      const polys: Poly[] = [];
      let t0 = performance.now();
      for (let i = 0; i < chunks.length; i++) {
        polys.push(parsePath(chunks[i][1]));
        if (performance.now() - t0 > 8) {
          await tick();
          if (cancelled) return;
          t0 = performance.now();
        }
      }
      const lens = new Float32Array(polys.length);
      for (let i = 0; i < polys.length; i++)
        lens[i] = Math.max(polys[i].cum[polys[i].n - 1], 1);

      bakeSilhouette(silCanvas, polys);
      silTex.needsUpdate = true;
      await tick();
      if (cancelled) return;

      bakeGlow(glowCanvas, polys);
      glowTex.needsUpdate = true;
      await tick();
      if (cancelled) return;

      // animated-outline canvas: set up once, then only ever add / erase pieces
      const sctx = strokeCanvas.getContext("2d")!;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, ST_W, ST_H);
      sctx.setTransform(STROKE_SCALE, 0, 0, STROKE_SCALE, 0, 0);
      const g = sctx.createLinearGradient(400, 200, 1800, 2700);
      g.addColorStop(0, pal.stroke[0]);
      g.addColorStop(0.5, pal.stroke[1]);
      g.addColorStop(1, pal.stroke[2]);
      sctx.strokeStyle = g;
      sctx.lineWidth = STROKE_W;
      sctx.lineJoin = "round";
      sctx.lineCap = "butt";

      rt.current = {
        polys,
        lens,
        tl: buildTimeline(chunks.map((c) => c[0])),
        t: 0,
        acc: 0,
        prevDp: new Float32Array(chunks.length),
        prevUp: new Float32Array(chunks.length),
      };
    })();

    return () => {
      cancelled = true;
      rt.current = null;
    };
  }, [silCanvas, glowCanvas, strokeCanvas, silTex, glowTex, pal]);

  useEffect(
    () => () => {
      strokeTex.dispose();
      silTex.dispose();
      glowTex.dispose();
      material.dispose();
    },
    [strokeTex, silTex, glowTex, material],
  );

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const root = rootRef.current;
    if (!root) return;

    // not on screen, or too far away: draw nothing and do no work at all
    const d2 = state.camera.position.distanceToSquared(center);
    const visible =
      d2 < maxDistance * maxDistance &&
      inView(state.camera, time, center, radius);
    root.visible = visible;
    if (!visible) return;

    const u = material.uniforms;
    u.uTime.value = time;

    // float and face the camera
    const face = faceRef.current;
    if (face) {
      face.position.y = portraitY + Math.sin(time * 1.1) * floatAmp;
      if (billboard) {
        face.getWorldPosition(_wp);
        face.rotation.y = Math.atan2(
          state.camera.position.x - _wp.x,
          state.camera.position.z - _wp.z,
        );
      }
    }

    const r = rt.current;
    if (!r) return;

    u.uOpacity.value = Math.min(1, u.uOpacity.value + delta * 1.5);

    const dtMs = Math.min(delta, 0.1) * 1000;
    const last = r.t;
    r.t = (r.t + dtMs) % r.tl.total;
    const t = r.t;
    const ctx = strokeCanvas.getContext("2d")!;

    // loop restart: start from a clean canvas
    if (t < last) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ST_W, ST_H);
      ctx.restore();
      r.prevDp.fill(0);
      r.prevUp.fill(0);
      strokeTex.needsUpdate = true;
    }

    // outline: updated less often the farther away you are
    const dist = Math.sqrt(d2);
    const stepMs = dist < 14 ? 1000 / 24 : dist < 24 ? 1000 / 15 : 100;
    r.acc += dtMs;
    if (r.acc >= stepMs) {
      r.acc %= stepMs;
      if (stepStrokes(r, ctx, t)) strokeTex.needsUpdate = true;
    }

    // black portrait in / out + light sweep (cheap uniforms)
    const fin = easeSoft(clamp01((t - r.tl.fillIn) / FILL_IN_MS));
    const fout = easeSoft(clamp01((t - r.tl.fillOut) / FILL_OUT_MS));
    u.uFillOpacity.value = fin * (1 - fout);

    const sp = clamp01((t - r.tl.sheenAt) / SHEEN_MS);
    u.uSheen.value = sp > 0 && sp < 1 ? easeSheen(sp) : -1;
  });

  return (
    <group ref={rootRef} position={position}>
      {showBase && (
        <HologramPlatform
          width={width}
          beamHeight={lift + planeH * 0.3}
          palette={palette}
        />
      )}

      <group ref={faceRef} position={[0, portraitY, 0]}>
        <mesh renderOrder={10}>
          <planeGeometry args={[planeW, planeH]} />
          <primitive object={material} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

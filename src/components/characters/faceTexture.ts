import * as THREE from "three";
import type { Quality } from "@/constants/quality";
import { FACE, UV, type FaceType } from "./face";

// The texture is a front view of the face, 2800 px per metre, so a 3 cm eye is about 84 px wide.
const K = 2800;
const W = Math.round((UV.x1 - UV.x0) * K);
const H = Math.round((UV.y1 - UV.y0) * K);

export interface FaceSpec {
  type: FaceType;
  skin: string;
  hair: string;
  lipstick?: string;
  stubble?: boolean;
}

type RGB = [number, number, number];

const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintFace(spec: FaceSpec, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const px = (x: number) => (x - UV.x0) * K;
  const py = (y: number) => (UV.y1 - y) * K;
  const len = (metres: number) => metres * K;

  const female = spec.type === "female";
  const skin = rgb(spec.skin);
  const shade = mix(skin, [50, 22, 16], 0.65);
  const light = mix(skin, [255, 245, 230], 0.6);
  const rand = rng(hash(JSON.stringify(spec)));

  // soft round patch of colour
  const blob = (
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: RGB,
    alpha: number,
  ) => {
    ctx.save();
    ctx.translate(px(x), py(y));
    ctx.scale(len(rx), len(ry));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, css(color, alpha));
    g.addColorStop(1, css(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ---- skin ----
  ctx.fillStyle = spec.skin;
  ctx.fillRect(0, 0, W, H);

  const tone = ctx.createLinearGradient(0, 0, 0, H);
  tone.addColorStop(0, "rgba(255,255,255,0.05)");
  tone.addColorStop(1, "rgba(120,60,40,0.07)");
  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, W, H);

  blob(0, 0.075, 0.05, 0.022, light, 0.1); // forehead
  for (const s of [-1, 1]) {
    blob(s * 0.05, -0.03, 0.03, 0.022, [205, 95, 95], female ? 0.22 : 0.14); // cheeks
    blob(
      s * FACE.eyeX,
      0.016,
      0.026,
      0.018,
      mix(skin, [70, 35, 30], 0.7),
      0.26,
    ); // eye sockets
    blob(s * FACE.eyeX, -0.004, 0.017, 0.007, [110, 70, 70], 0.16); // under the eyes
    blob(s * 0.018, -0.03, 0.008, 0.014, shade, 0.22); // beside the nose
    blob(s * 0.022, FACE.mouthY, 0.005, 0.005, shade, 0.28); // mouth corners
    if (female) blob(s * FACE.eyeX, 0.028, 0.019, 0.009, [150, 100, 125], 0.12); // eyeshadow
  }
  blob(0, FACE.noseTipY + 0.002, 0.007, 0.006, light, 0.14); // nose tip highlight

  // nostrils
  ctx.fillStyle = "rgba(40,15,10,0.75)";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(
      px(s * 0.0075),
      py(-0.0345),
      len(0.0035),
      len(0.002),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // smile lines
  ctx.strokeStyle = css(shade, 0.14);
  ctx.lineWidth = len(0.0009);
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(px(s * 0.016), py(-0.035));
    ctx.quadraticCurveTo(px(s * 0.03), py(-0.048), px(s * 0.027), py(-0.064));
    ctx.stroke();
  }

  // ---- eyes: lash line + lid crease (the eyeballs themselves are separate meshes) ----
  for (const s of [-1, 1]) {
    const cx = s * FACE.eyeX;
    const cy = FACE.eyeY + 0.0015;
    ctx.strokeStyle = css([25, 14, 10], 0.55);
    ctx.lineWidth = len(0.0012);
    ctx.beginPath();
    ctx.moveTo(px(cx - 0.0145), py(cy - 0.001));
    ctx.quadraticCurveTo(
      px(cx),
      py(cy + 0.0165),
      px(cx + 0.0145),
      py(cy - 0.001),
    );
    ctx.stroke();

    ctx.strokeStyle = css(shade, 0.22);
    ctx.lineWidth = len(0.0008);
    ctx.beginPath();
    ctx.moveTo(px(cx - 0.015), py(cy + 0.007));
    ctx.quadraticCurveTo(
      px(cx),
      py(cy + 0.0235),
      px(cx + 0.015),
      py(cy + 0.007),
    );
    ctx.stroke();
  }

  // ---- eyebrows: many fine hair strokes ----
  const browColor = mix(rgb(spec.hair), [20, 14, 10], 0.35);
  for (const s of [-1, 1]) {
    const thick = female ? 0.0042 : 0.0064;
    for (let i = 0; i < 150; i++) {
      const t = rand();
      const x = s * (0.012 + 0.043 * t);
      const arch =
        (female ? 0.0085 : 0.0048) * Math.sin(Math.PI * Math.min(1, t * 0.9)) -
        Math.max(0, t - 0.78) * 0.014;
      const y = FACE.browY + arch + (rand() - 0.5) * thick * (1 - 0.55 * t);
      const angle = 0.35 - 0.9 * t;
      const l = 0.0042;
      ctx.strokeStyle = css(browColor, 0.45 + rand() * 0.45);
      ctx.lineWidth = len(0.0006);
      ctx.beginPath();
      ctx.moveTo(px(x), py(y));
      ctx.lineTo(px(x + s * l * Math.cos(angle)), py(y + l * Math.sin(angle)));
      ctx.stroke();
    }
  }

  // ---- lips ----
  const dark = luminance(skin) < 110;
  const lipColor = spec.lipstick
    ? rgb(spec.lipstick)
    : mix(skin, dark ? [110, 48, 46] : [168, 78, 78], female ? 0.62 : 0.5);
  const lipDark = mix(lipColor, [40, 12, 14], 0.35);
  const mY = FACE.mouthY;

  // upper lip with a cupid's bow
  ctx.beginPath();
  ctx.moveTo(px(-0.0215), py(mY));
  ctx.bezierCurveTo(
    px(-0.0165),
    py(mY + 0.0042),
    px(-0.009),
    py(mY + 0.0068),
    px(-0.0035),
    py(mY + 0.0062),
  );
  ctx.quadraticCurveTo(px(0), py(mY + 0.0048), px(0.0035), py(mY + 0.0062));
  ctx.bezierCurveTo(
    px(0.009),
    py(mY + 0.0068),
    px(0.0165),
    py(mY + 0.0042),
    px(0.0215),
    py(mY),
  );
  ctx.quadraticCurveTo(px(0), py(mY - 0.0008), px(-0.0215), py(mY));
  ctx.closePath();
  const upper = ctx.createLinearGradient(0, py(mY + 0.007), 0, py(mY));
  upper.addColorStop(0, css(lipDark));
  upper.addColorStop(1, css(lipColor));
  ctx.fillStyle = upper;
  ctx.fill();

  // lower lip, fuller and lighter in the middle
  ctx.beginPath();
  ctx.moveTo(px(-0.0205), py(mY - 0.0004));
  ctx.quadraticCurveTo(px(0), py(mY - 0.0012), px(0.0205), py(mY - 0.0004));
  ctx.bezierCurveTo(
    px(0.0155),
    py(mY - 0.0122),
    px(-0.0155),
    py(mY - 0.0122),
    px(-0.0205),
    py(mY - 0.0004),
  );
  ctx.closePath();
  const lower = ctx.createRadialGradient(
    px(0),
    py(mY - 0.0055),
    0,
    px(0),
    py(mY - 0.0055),
    len(0.014),
  );
  lower.addColorStop(0, css(mix(lipColor, [255, 190, 180], 0.25)));
  lower.addColorStop(1, css(lipColor));
  ctx.fillStyle = lower;
  ctx.fill();

  // the line where the lips meet, and a little shine
  ctx.strokeStyle = css([60, 20, 20], 0.7);
  ctx.lineWidth = len(0.0007);
  ctx.beginPath();
  ctx.moveTo(px(-0.0215), py(mY));
  ctx.quadraticCurveTo(px(0), py(mY - 0.001), px(0.0215), py(mY));
  ctx.stroke();
  blob(0, mY - 0.006, 0.007, 0.0022, [255, 225, 220], 0.22);

  // ---- stubble ----
  if (spec.stubble) {
    const stubble = mix(rgb(spec.hair), [20, 14, 10], 0.3);
    for (let i = 0; i < 2600; i++) {
      const x = (rand() * 2 - 1) * 0.062;
      const y = -0.03 - rand() * 0.078;
      const limit = 0.052 + (y + 0.03) * 0.25; // the jaw narrows toward the chin
      if (Math.abs(x) > limit) continue;
      if (Math.abs(x) < 0.024 && y < -0.052 && y > -0.074) continue; // not on the lips
      ctx.fillStyle = css(stubble, 0.14 + rand() * 0.16);
      ctx.fillRect(px(x), py(y), 1.6, 1.6);
    }
  }

  return canvas;
}

function paintEye(iris: string) {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // the front of the eye is at u = 0.25, v = 0.5 of a sphere texture
  const cx = w * 0.25;
  const cy = h * 0.5;
  const R = 41; // iris radius: about 0.5 rad of the eyeball
  const col = rgb(iris);

  const sclera = ctx.createLinearGradient(0, 0, 0, h);
  sclera.addColorStop(0, "#d6d0c7");
  sclera.addColorStop(0.5, "#f4f0ea");
  sclera.addColorStop(1, "#d6d0c7");
  ctx.fillStyle = sclera;
  ctx.fillRect(0, 0, w, h);

  const g = ctx.createRadialGradient(cx, cy, R * 0.25, cx, cy, R);
  g.addColorStop(0, css(mix(col, [0, 0, 0], 0.5)));
  g.addColorStop(0.55, css(col));
  g.addColorStop(1, css(mix(col, [0, 0, 0], 0.45)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // fibres in the iris
  ctx.strokeStyle = css(mix(col, [255, 255, 255], 0.35), 0.25);
  ctx.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.32, cy + Math.sin(a) * R * 0.32);
    ctx.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95);
    ctx.stroke();
  }

  // dark ring at the edge, pupil
  ctx.strokeStyle = "rgba(15,10,8,0.85)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#050404";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // catchlight: what makes an eye look alive
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.ellipse(
    cx - R * 0.3,
    cy - R * 0.32,
    R * 0.14,
    R * 0.12,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.arc(cx + R * 0.25, cy + R * 0.3, R * 0.06, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

const faceCache = new Map<string, THREE.CanvasTexture>();
const eyeCache = new Map<string, THREE.CanvasTexture>();

/** Painted face for one person. Cached and shared: never dispose it. */
export function getFaceTexture(spec: FaceSpec, quality: Quality) {
  const key = `${JSON.stringify(spec)}|${quality}`;
  let tex = faceCache.get(key);
  if (!tex) {
    tex = new THREE.CanvasTexture(
      paintFace(spec, quality === "high" ? 1 : 0.5),
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = quality === "high" ? 8 : 2;
    faceCache.set(key, tex);
  }
  return tex;
}

/** Eyeball texture for an iris colour. Cached and shared. */
export function getEyeTexture(iris: string) {
  let tex = eyeCache.get(iris);
  if (!tex) {
    tex = new THREE.CanvasTexture(paintEye(iris));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    eyeCache.set(iris, tex);
  }
  return tex;
}

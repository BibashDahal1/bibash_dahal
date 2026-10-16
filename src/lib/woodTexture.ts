import * as THREE from "three";

export type WoodKind = "walnut" | "dark" | "oak";

const PRESETS: Record<
  WoodKind,
  { base: string; dark: string; planks: number }
> = {
  walnut: { base: "#6b4a30", dark: "#3d2616", planks: 8 },
  dark: { base: "#3f2a1c", dark: "#1f120a", planks: 8 },
  oak: { base: "#b58a57", dark: "#7a5530", planks: 8 },
};

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<WoodKind, THREE.CanvasTexture>();

/** Vertical wood planks with grain, knots and seams. One tile = 8 planks. Cached per kind. */
export function getWoodTexture(kind: WoodKind) {
  const hit = cache.get(kind);
  if (hit) return hit;

  const { base, dark, planks } = PRESETS[kind];
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const r = rng(kind.length * 977 + base.charCodeAt(2));
  const [br, bg, bb] = hex(base);
  const [dr, dg, db] = hex(dark);
  const pw = S / planks;

  for (let p = 0; p < planks; p++) {
    const tone = 0.82 + r() * 0.32;
    ctx.fillStyle = `rgb(${Math.min(255, br * tone) | 0},${Math.min(255, bg * tone) | 0},${Math.min(255, bb * tone) | 0})`;
    ctx.fillRect(p * pw, 0, pw, S);

    // grain
    for (let g = 0; g < 26; g++) {
      const x0 = p * pw + r() * pw;
      ctx.beginPath();
      for (let y = 0; y <= S; y += 16) {
        const x =
          x0 + Math.sin(y * 0.02 + g) * 2.2 + Math.sin(y * 0.05 + p) * 1.2;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${dr},${dg},${db},${0.05 + r() * 0.18})`;
      ctx.lineWidth = 0.6 + r() * 1.4;
      ctx.stroke();
    }

    // occasional knot
    if (r() < 0.35) {
      const kx = p * pw + pw * (0.3 + r() * 0.4);
      const ky = r() * S;
      const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, 14);
      grad.addColorStop(0, `rgba(${dr},${dg},${db},0.45)`);
      grad.addColorStop(1, `rgba(${dr},${dg},${db},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 9, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // seam between planks
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(p * pw, 0, 2.5, S);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(kind, tex);
  return tex;
}

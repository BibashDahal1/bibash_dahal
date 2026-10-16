import * as THREE from "three";

/** Dark metal floor with a faint grid. `glow` has only the lines, to use as an emissive map. One tile = 4 m. */
export function createTechFloorTextures(repeatX: number, repeatY: number) {
  const S = 512;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    return c;
  };

  const color = make();
  const cx = color.getContext("2d")!;
  cx.fillStyle = "#070b12";
  cx.fillRect(0, 0, S, S);
  for (let i = 0; i < 2500; i++) {
    cx.fillStyle = `rgba(120,180,255,${Math.random() * 0.03})`;
    cx.fillRect(Math.random() * S, Math.random() * S, 2, 1);
  }

  const glow = make();
  const gx = glow.getContext("2d")!;
  gx.fillStyle = "#000";
  gx.fillRect(0, 0, S, S);

  // grid every metre
  for (const [ctx, a] of [
    [cx, 0.16],
    [gx, 0.3],
  ] as const) {
    ctx.strokeStyle = `rgba(80,190,255,${a})`;
    ctx.lineWidth = 1.5;
    for (let p = 0; p <= S; p += S / 4) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, S);
      ctx.moveTo(0, p);
      ctx.lineTo(S, p);
      ctx.stroke();
    }
  }
  // brighter tile border + plus marks at the corners
  for (const [ctx, a] of [
    [cx, 0.4],
    [gx, 1],
  ] as const) {
    ctx.strokeStyle = `rgba(110,215,255,${a})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, S - 4, S - 4);
    ctx.lineWidth = 2;
    for (const [x, y] of [
      [0, 0],
      [S, 0],
      [0, S],
      [S, S],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x, y + 14);
      ctx.stroke();
    }
  }

  const finish = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: finish(color, true), glow: finish(glow, true) };
}

/** Dark panelled wall. One tile = 4 m x 4 m (2 x 2 panels). */
export function createTechWallTexture(repeatX: number, repeatY: number) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, "#0f1826");
  g.addColorStop(1, "#0a1019");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);

  // panel seams with a light edge
  const half = S / 2;
  for (let p = 0; p <= S; p += half) {
    ctx.fillStyle = "#04070c";
    ctx.fillRect(p - 1.5, 0, 3, S);
    ctx.fillRect(0, p - 1.5, S, 3);
    ctx.fillStyle = "rgba(120,180,255,0.07)";
    ctx.fillRect(p + 1.5, 0, 1.5, S);
    ctx.fillRect(0, p + 1.5, S, 1.5);
  }
  // rivets
  ctx.fillStyle = "rgba(150,200,255,0.18)";
  for (const bx of [0, half]) {
    for (const by of [0, half]) {
      for (const [dx, dy] of [
        [14, 14],
        [half - 14, 14],
        [14, half - 14],
        [half - 14, half - 14],
      ] as const) {
        ctx.beginPath();
        ctx.arc(bx + dx, by + dy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

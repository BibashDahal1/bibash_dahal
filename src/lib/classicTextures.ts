import * as THREE from "three";

function seeded(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const finish = (
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  wrap = true,
) => {
  const tex = new THREE.CanvasTexture(canvas);
  if (wrap) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/** Polished cream marble with soft veins and gold inlay between 2 m slabs. One tile = 4 m. */
export function createMarbleTexture(repeatX: number, repeatY: number) {
  const S = 512;
  const half = S / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const r = seeded(4242);

  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const x = tx * half;
      const y = ty * half;
      const tone = 0.96 + r() * 0.06;
      const g = ctx.createLinearGradient(x, y, x + half, y + half);
      g.addColorStop(
        0,
        `rgb(${(235 * tone) | 0},${(229 * tone) | 0},${(217 * tone) | 0})`,
      );
      g.addColorStop(
        1,
        `rgb(${(216 * tone) | 0},${(208 * tone) | 0},${(194 * tone) | 0})`,
      );
      ctx.fillStyle = g;
      ctx.fillRect(x, y, half, half);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, half, half);
      ctx.clip();
      for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(105,96,86,${0.08 + r() * 0.14})`;
        ctx.lineWidth = 0.6 + r() * 1.8;
        ctx.beginPath();
        ctx.moveTo(x + r() * half, y);
        ctx.bezierCurveTo(
          x + r() * half,
          y + half * 0.3,
          x + r() * half,
          y + half * 0.6,
          x + r() * half,
          y + half,
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  ctx.strokeStyle = "rgba(201,162,74,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, S - 3, S - 3);
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half, S);
  ctx.moveTo(0, half);
  ctx.lineTo(S, half);
  ctx.stroke();

  return finish(canvas, repeatX, repeatY);
}

/** Deep navy damask wallpaper with a faint gold quatrefoil pattern. One tile = 2 m. */
export function createDamaskTexture(repeatX: number, repeatY: number) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, S);
  bg.addColorStop(0, "#15233f");
  bg.addColorStop(1, "#101b32");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  const motif = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(212,175,55,0.07)";
    ctx.strokeStyle = "rgba(212,175,55,0.2)";
    ctx.lineWidth = 2;
    for (const a of [0, Math.PI / 2]) {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    for (const a of [Math.PI / 4, -Math.PI / 4]) {
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, 60, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  // centre + corners, so the tile repeats without a seam
  for (const [x, y] of [
    [S / 2, S / 2],
    [0, 0],
    [S, 0],
    [0, S],
    [S, S],
  ] as const)
    motif(x, y);

  return finish(canvas, repeatX, repeatY);
}

/** Burgundy runner carpet with a gold border and diamond medallions. Square tile; repeat it along the length only. */
export function createCarpetTexture(repeatY: number) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const r = seeded(99);

  ctx.fillStyle = "#5a1424";
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(255,200,200,${r() * 0.04})`;
    ctx.fillRect(r() * S, r() * S, 2, 1);
  }
  ctx.fillStyle = "#4a0f1c";
  ctx.fillRect(48, 0, S - 96, S);

  // gold borders run the full length
  ctx.fillStyle = "rgba(201,162,74,0.95)";
  ctx.fillRect(18, 0, 10, S);
  ctx.fillRect(S - 28, 0, 10, S);
  ctx.fillRect(40, 0, 3, S);
  ctx.fillRect(S - 43, 0, 3, S);

  // nested diamonds
  const c = S / 2;
  for (const [rad, lw, a] of [
    [190, 4, 0.9],
    [150, 2.5, 0.7],
    [110, 2, 0.6],
  ] as const) {
    ctx.strokeStyle = `rgba(201,162,74,${a})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(c, c - rad);
    ctx.lineTo(c + rad * 0.85, c);
    ctx.lineTo(c, c + rad);
    ctx.lineTo(c - rad * 0.85, c);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(201,162,74,0.85)";
  ctx.beginPath();
  ctx.arc(c, c, 26, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [
    [0, -190],
    [162, 0],
    [0, 190],
    [-162, 0],
  ] as const) {
    ctx.beginPath();
    ctx.arc(c + dx, c + dy, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = finish(canvas, 1, repeatY);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  return tex;
}

/** A soft diagonal band of light. Slide its `offset` across a glass pane for a passing glint. */
export function createGlintTexture() {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.65)");
  g.addColorStop(0.58, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // clear the edge so the clamped border never smears
  for (const [x, y, w, h] of [
    [0, 0, S, 4],
    [0, S - 4, S, 4],
    [0, 0, 4, S],
    [S - 4, 0, 4, S],
  ] as const) {
    ctx.clearRect(x, y, w, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------- generated certificate card
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const cardCache = new Map<string, HTMLCanvasElement>();

/**
 * A parchment certificate card with a double gold border and a seal, drawn from the certificate's text.
 * Used when a certificate has no image yet (and while its image loads). Cached.
 */
export function getCertificateCardCanvas(cert: {
  id: string;
  title: string;
  issuer: string;
  date: string;
}) {
  const key = `${cert.id}|${cert.title}|${cert.issuer}|${cert.date}`;
  const hit = cardCache.get(key);
  if (hit) return hit;

  const W = 1100;
  const H = 778; // A4 landscape
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const spacing = (px: number) => {
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
    } catch {
      /* older browsers just skip the letter spacing */
    }
  };

  // parchment
  const paper = ctx.createLinearGradient(0, 0, W, H);
  paper.addColorStop(0, "#f7efdc");
  paper.addColorStop(1, "#e8d7ae");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);
  const r = seeded(7);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = `rgba(120,90,40,${r() * 0.05})`;
    ctx.fillRect(r() * W, r() * H, 2, 1);
  }

  // double border + corner diamonds
  ctx.strokeStyle = "#b8923a";
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 54, W - 108, H - 108);
  ctx.fillStyle = "#b8923a";
  for (const [x, y] of [
    [54, 54],
    [W - 54, 54],
    [54, H - 54],
    [W - 54, H - 54],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 14, y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#7a5f22";
  ctx.font = "600 32px Georgia, 'Times New Roman', serif";
  spacing(9);
  ctx.fillText("CERTIFICATE", W / 2, 150);
  spacing(0);
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("is proudly presented for", W / 2, 195);

  // title, wrapped
  ctx.fillStyle = "#2a1d08";
  ctx.font = "bold 56px Georgia, serif";
  const lines = wrapLines(ctx, cert.title, W - 300).slice(0, 3);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 300 + i * 68));
  const after = 300 + (lines.length - 1) * 68 + 50;

  // divider
  ctx.strokeStyle = "#b8923a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, after);
  ctx.lineTo(W / 2 + 160, after);
  ctx.stroke();
  ctx.fillStyle = "#b8923a";
  ctx.beginPath();
  ctx.moveTo(W / 2, after - 8);
  ctx.lineTo(W / 2 + 8, after);
  ctx.lineTo(W / 2, after + 8);
  ctx.lineTo(W / 2 - 8, after);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7a5f22";
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText("issued by", W / 2, after + 52);
  ctx.fillStyle = "#2a1d08";
  ctx.font = "600 34px Georgia, serif";
  ctx.fillText(
    wrapLines(ctx, cert.issuer, W - 300)[0] ?? "",
    W / 2,
    after + 100,
  );

  // date, bottom left
  ctx.textAlign = "left";
  ctx.fillStyle = "#6b5420";
  ctx.font = "24px Georgia, serif";
  ctx.fillText(cert.date, 130, H - 112);
  ctx.strokeStyle = "#b8923a";
  ctx.beginPath();
  ctx.moveTo(130, H - 140);
  ctx.lineTo(330, H - 140);
  ctx.stroke();

  // gold seal, bottom right
  const sx = W - 190;
  const sy = H - 160;
  const seal = ctx.createRadialGradient(sx, sy, 6, sx, sy, 64);
  seal.addColorStop(0, "#f3d680");
  seal.addColorStop(1, "#b8923a");
  ctx.fillStyle = seal;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rad = i % 2 === 0 ? 66 : 58;
    ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(122,95,34,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(122,95,34,0.85)";
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const rad = i % 2 === 0 ? 30 : 13;
    ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();

  cardCache.set(key, canvas);
  return canvas;
}

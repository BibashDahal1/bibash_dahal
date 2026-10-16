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

/** Abstract geometric "painting" for the wall frames. */
export function createArtTexture(seed: number, aspect: number) {
  const W = 512;
  const H = Math.round(W / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const rand = seeded(seed * 7919 + 13);

  const palettes = [
    ["#1f2a44", "#d4af37", "#e9e2d3", "#8c3b3b"],
    ["#2b3a33", "#c9b48c", "#f2ede1", "#b5651d"],
    ["#33293a", "#ff9f68", "#f4ede0", "#5eeaff"],
  ];
  const pal = palettes[seed % palettes.length];

  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pal[1 + Math.floor(rand() * 3)];
    if (rand() < 0.5) {
      ctx.fillRect(
        rand() * W * 0.8,
        rand() * H * 0.8,
        W * (0.1 + rand() * 0.3),
        H * (0.1 + rand() * 0.4),
      );
    } else {
      ctx.beginPath();
      ctx.arc(rand() * W, rand() * H, 30 + rand() * 90, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(212,175,55,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, H * (0.3 + rand() * 0.4));
  ctx.lineTo(W, H * (0.3 + rand() * 0.4));
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Polished oak plank floor. One tile = 10 planks (16 cm each) = 1.6 m, so callers repeat it (W/1.6, D/1.6).
 * Planks run along the room's length; end joints are staggered; the tile is seamless.
 */
export function createFloorTexture(repeatX: number, repeatY: number) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const r = seeded(20261014);

  const planks = 10;
  const pw = S / planks;
  const base = [172, 120, 68]; // warm honey oak
  const dark = [62, 36, 16];
  const rgb = (c: number[], k = 1) =>
    `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;

  for (let p = 0; p < planks; p++) {
    const x = p * pw;

    // split the plank into boards whose lengths add up to exactly the tile height, then rotate the start
    const lens: number[] = [];
    let total = 0;
    while (total < S) {
      const l = 150 + r() * 260;
      lens.push(l);
      total += l;
    }
    const k = S / total;
    const off = r() * S;

    let y = 0;
    for (const l0 of lens) {
      const len = l0 * k;
      const tone = 0.84 + r() * 0.3;
      const grains = Array.from({ length: 9 }, () => ({
        gx: x + r() * pw,
        a: 0.06 + r() * 0.16,
        w: 0.6 + r() * 1.2,
        ph: r() * 6,
      }));

      for (const d of [-S, 0, S]) {
        const y0 = y + off + d;
        if (y0 >= S || y0 + len <= 0) continue;

        ctx.fillStyle = rgb(base, tone);
        ctx.fillRect(x, y0, pw, len);

        for (const gr of grains) {
          ctx.beginPath();
          let first = true;
          for (
            let yy = Math.max(0, y0);
            yy <= Math.min(S, y0 + len);
            yy += 12
          ) {
            const gx = gr.gx + Math.sin(yy * 0.03 + gr.ph) * 1.6;
            if (first) {
              ctx.moveTo(gx, yy);
              first = false;
            } else {
              ctx.lineTo(gx, yy);
            }
          }
          ctx.strokeStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},${gr.a})`;
          ctx.lineWidth = gr.w;
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(25,12,4,0.5)"; // end joint
        ctx.fillRect(x, y0, pw, 1.6);
      }
      y += len;
    }

    ctx.fillStyle = "rgba(25,12,4,0.55)"; // seam between planks
    ctx.fillRect(x, 0, 1.8, S);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Painted dusk sky for the windows. */
export function createSunsetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#2c2650");
  sky.addColorStop(0.35, "#8a3f6b");
  sky.addColorStop(0.6, "#e0645a");
  sky.addColorStop(0.8, "#ff9a52");
  sky.addColorStop(1, "#ffd68a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 512);

  const sun = ctx.createRadialGradient(128, 410, 4, 128, 410, 110);
  sun.addColorStop(0, "rgba(255,246,214,1)");
  sun.addColorStop(0.25, "rgba(255,214,140,0.8)");
  sun.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 280, 256, 232);

  ctx.fillStyle = "rgba(255,190,150,0.22)";
  for (const [x, y, w] of [
    [60, 300, 90],
    [180, 340, 70],
    [100, 250, 60],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, w, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft white blob; tinted and added on the floor it becomes a patch of sunlight. */
export function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

/** One ceiling coffer (4 m x 4 m): cream panel, gold inlay, central rosette. */
export function createCofferTexture(repeatX: number, repeatY: number) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#efe6d4";
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = "#e5d9c0";
  ctx.fillRect(46, 46, S - 92, S - 92);
  ctx.strokeStyle = "rgba(201,162,74,0.9)";
  ctx.lineWidth = 6;
  ctx.strokeRect(46, 46, S - 92, S - 92);
  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, S - 132, S - 132);

  ctx.strokeStyle = "rgba(201,162,74,0.75)";
  for (const rad of [58, 38, 16]) {
    ctx.lineWidth = rad === 58 ? 4 : 2;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, rad, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(S / 2 + Math.cos(a) * 18, S / 2 + Math.sin(a) * 18);
    ctx.lineTo(S / 2 + Math.cos(a) * 54, S / 2 + Math.sin(a) * 54);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

let newspaper: THREE.CanvasTexture | null = null;

/** A newsprint front page. Created once and shared by every reader (never dispose it). */
export function getNewspaperTexture() {
  if (newspaper) return newspaper;

  const W = 512;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const r = seeded(77);

  ctx.fillStyle = "#ebe6d8";
  ctx.fillRect(0, 0, W, H);

  // masthead
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 54px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("THE DAILY POST", W / 2, 62);
  ctx.fillRect(24, 76, W - 48, 3);
  ctx.fillRect(24, 84, W - 48, 1);

  // headline
  ctx.font = "bold 30px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("MARKETS RALLY AS", 28, 128);
  ctx.fillText("TECH LEADS THE WAY", 28, 162);

  // photo
  const photo = ctx.createLinearGradient(28, 178, 198, 300);
  photo.addColorStop(0, "#7d7a72");
  photo.addColorStop(1, "#3e3c38");
  ctx.fillStyle = photo;
  ctx.fillRect(28, 178, 170, 118);

  // columns of "text"
  ctx.fillStyle = "rgba(40,40,40,0.55)";
  const colX = [214, 318, 422];
  for (const x of colX) {
    for (let row = 0; row < 12; row++) {
      ctx.fillRect(x, 182 + row * 10, 70 + r() * 28, 3);
    }
  }
  for (let row = 0; row < 7; row++) {
    ctx.fillRect(28, 306 + row * 10, 150 + r() * 40, 3);
    ctx.fillRect(214, 306 + row * 10, 250 + r() * 40, 3);
  }
  ctx.fillStyle = "rgba(40,40,40,0.35)";
  for (const x of [207, 311, 415]) ctx.fillRect(x, 178, 1, 190);

  newspaper = new THREE.CanvasTexture(canvas);
  newspaper.colorSpace = THREE.SRGBColorSpace;
  newspaper.anisotropy = 4;
  return newspaper;
}

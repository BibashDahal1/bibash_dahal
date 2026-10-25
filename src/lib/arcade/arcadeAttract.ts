import type { ArcadeGameId } from "@/constants/arcade";

const tri = (x: number) => {
  const f = x - Math.floor(x);
  return f < 0.5 ? f * 2 : 2 - f * 2;
};

// ---- snake: a snake running a loop around the screen ----
const SNAKE_PATH = (() => {
  const p: { x: number; y: number }[] = [];
  for (let x = 2; x <= 13; x++) p.push({ x, y: 3 });
  for (let y = 4; y <= 9; y++) p.push({ x: 13, y });
  for (let x = 12; x >= 2; x--) p.push({ x, y: 9 });
  for (let y = 8; y >= 4; y--) p.push({ x: 2, y });
  return p;
})();

function snake(ctx: CanvasRenderingContext2D, t: number, W: number, H: number) {
  const C = 16;
  ctx.fillStyle = "#031009";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(90,255,150,0.08)";
  for (let x = 0; x < W / C; x++)
    for (let y = 0; y < H / C; y++) ctx.fillRect(x * C + 7, y * C + 7, 2, 2);
  const step = Math.floor(t * 9);
  const n = SNAKE_PATH.length;
  const f = SNAKE_PATH[(Math.floor(step / 12) * 12 + 12) % n];
  ctx.fillStyle = "#ff4d4d";
  ctx.fillRect(f.x * C + 3, f.y * C + 3, C - 6, C - 6);
  for (let i = 8; i >= 0; i--) {
    const c = SNAKE_PATH[(((step - i) % n) + n) % n];
    ctx.fillStyle =
      i === 0 ? "#c9ffd9" : `hsl(140,80%,${Math.max(30, 52 - i * 3)}%)`;
    ctx.fillRect(c.x * C + 1, c.y * C + 1, C - 2, C - 2);
  }
}

// ---- breakout: a ball bouncing under a wall of bricks ----
function breakout(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = "#0a0614";
  ctx.fillRect(0, 0, W, H);
  const cols = 10;
  const bw = (W - 16) / cols;
  const colors = ["#ff5a5a", "#ff9a4d", "#ffd23f", "#7dff9a", "#5eeaff"];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r * 7 + c * 3 + Math.floor(t / 3)) % 11 === 0) continue;
      ctx.fillStyle = colors[r];
      ctx.fillRect(8 + c * bw + 1, 58 + r * 13, bw - 2, 10);
    }
  }
  const bx = 10 + tri(t * 0.55) * (W - 20);
  const by = 130 + tri(t * 0.8) * (H - 170);
  ctx.fillStyle = "#c9d6ff";
  ctx.fillRect(bx - 22, H - 36, 44, 7);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(bx, by, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ---- blocks: a piece falling onto a stack ----
const PIECES: [number, number][][] = [
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
];
const BLOCK_COLORS = [
  "#b57aff",
  "#6a8dff",
  "#ff9a4d",
  "#ff5a5a",
  "#5eeaff",
  "#7dff9a",
  "#ffd23f",
];

function blocks(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = "#070b14";
  ctx.fillRect(0, 0, W, H);
  const C = 11;
  const ox = Math.floor((W - 10 * C) / 2);
  const oy = 58;
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(ox, oy, 10 * C, 11 * C);
  for (let r = 7; r < 11; r++) {
    for (let c = 0; c < 10; c++) {
      if ((r * 3 + c * 5) % 7 === 0) continue;
      ctx.fillStyle = BLOCK_COLORS[(r + c) % 7];
      ctx.fillRect(ox + c * C + 1, oy + r * C + 1, C - 2, C - 2);
    }
  }
  const seg = 2.4;
  const idx = Math.floor(t / seg);
  const piece = PIECES[idx % PIECES.length];
  const y = Math.floor(((t % seg) / seg) * 6);
  const x = 2 + ((idx * 3) % 5);
  ctx.fillStyle = BLOCK_COLORS[idx % 7];
  for (const [r, c] of piece)
    ctx.fillRect(ox + (x + c) * C + 1, oy + (y + r) * C + 1, C - 2, C - 2);
}

// ---- flap: pipes scrolling past a bobbing bird ----
function flap(ctx: CanvasRenderingContext2D, t: number, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#4ec0ff");
  g.addColorStop(1, "#bfeaff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const groundY = H - 24;
  const spacing = 110;
  const scroll = t * 70;
  for (let k = -1; k < 4; k++) {
    const px = k * spacing - (scroll % spacing);
    const n = Math.floor(scroll / spacing) + k;
    const gapY = 80 + ((n * 53 + 17) % 50);
    ctx.fillStyle = "#3fbf55";
    ctx.fillRect(px, 0, 26, gapY - 34);
    ctx.fillRect(px, gapY + 34, 26, groundY - gapY - 34);
    ctx.fillRect(px - 2, gapY - 44, 30, 10);
    ctx.fillRect(px - 2, gapY + 34, 30, 10);
  }
  ctx.fillStyle = "#d9b56a";
  ctx.fillRect(0, groundY, W, 24);
  ctx.fillStyle = "#6ccf4f";
  ctx.fillRect(0, groundY, W, 5);
  const by = 92 + Math.sin(t * 4) * 12;
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.arc(74, by, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(77, by - 4, 4, 4);
  ctx.fillStyle = "#ff7a2a";
  ctx.fillRect(81, by - 1, 6, 3);
}

// ---- 2048: a board of changing tiles ----
const TILE_BG: Record<number, string> = {
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
};

function merge(ctx: CanvasRenderingContext2D, t: number, W: number, H: number) {
  ctx.fillStyle = "#14110d";
  ctx.fillRect(0, 0, W, H);
  const n = 4;
  const size = 38;
  const gap = 4;
  const total = n * size + (n - 1) * gap;
  const ox = Math.floor((W - total) / 2);
  const oy = Math.floor((H - total) / 2);
  const tick = Math.floor(t * 1.2);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = ox + c * (size + gap);
      const y = oy + r * (size + gap);
      const k = (r * 5 + c * 3 + tick) % 9;
      if (k > 6) {
        ctx.fillStyle = "#2b2620";
        ctx.fillRect(x, y, size, size);
        continue;
      }
      const v = 2 ** (1 + k);
      ctx.fillStyle = TILE_BG[v] ?? "#3c3a32";
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = v <= 4 ? "#776e65" : "#ffffff";
      ctx.font = `bold ${v < 100 ? 16 : 13}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + size / 2, y + size / 2 + 5);
    }
  }
}

export function drawAttract(
  game: ArcadeGameId,
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
) {
  switch (game) {
    case "snake":
      return snake(ctx, t, W, H);
    case "breakout":
      return breakout(ctx, t, W, H);
    case "blocks":
      return blocks(ctx, t, W, H);
    case "flap":
      return flap(ctx, t, W, H);
    case "merge":
      return merge(ctx, t, W, H);
  }
}

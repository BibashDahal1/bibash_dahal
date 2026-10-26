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

// ---- sudoku: a grid slowly filling with numbers ----
function sudoku(
  ctx: CanvasRenderingContext2D,
  t: number,
  W: number,
  H: number,
) {
  ctx.fillStyle = "#0b0d18";
  ctx.fillRect(0, 0, W, H);
  const C = 12;
  const ox = Math.floor((W - 9 * C) / 2);
  const oy = 54;
  ctx.fillStyle = "#14131c";
  ctx.fillRect(ox, oy, 9 * C, 9 * C);

  const p = (t / 9) % 1.15;
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const order = (((r * 9 + c) * 37) % 81) / 81;
      if (order >= p) continue;
      const v = ((r * 3 + Math.floor(r / 3) + c) % 9) + 1;
      ctx.fillStyle = order < 0.35 ? "#e8ecf5" : "#ff9a4d";
      ctx.fillText(String(v), ox + c * C + C / 2, oy + r * C + C - 3);
    }
  }
  for (let k = 0; k <= 9; k++) {
    ctx.lineWidth = k % 3 === 0 ? 1.5 : 0.5;
    ctx.strokeStyle =
      k % 3 === 0 ? "rgba(255,154,77,0.9)" : "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(ox + k * C, oy);
    ctx.lineTo(ox + k * C, oy + 9 * C);
    ctx.moveTo(ox, oy + k * C);
    ctx.lineTo(ox + 9 * C, oy + k * C);
    ctx.stroke();
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
    case "sudoku":
      return sudoku(ctx, t, W, H);
  }
}

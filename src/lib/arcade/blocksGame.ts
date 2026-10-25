import { blip, fanfare } from "@/lib/snakeSfx";
import {
  MULT,
  type Difficulty,
  type GameInstance,
  type HudItem,
} from "./types";
import { rr } from "./util";

const COLS = 10;
const ROWS = 22; // the top 2 rows are hidden spawn space
const HIDDEN = 2;
const CELL = 24;
const BW = COLS * CELL; // 240
const BH = (ROWS - HIDDEN) * CELL; // 480
const W = 360;
const H = 480;
export const BLOCKS_DIM = { width: W, height: H } as const;

type PT = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
const ORDER: PT[] = ["I", "O", "T", "S", "Z", "J", "L"];
const SHAPES: Record<PT, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};
const COLORS: Record<PT, string> = {
  I: "#5eeaff",
  O: "#ffd23f",
  T: "#b57aff",
  S: "#7dff9a",
  Z: "#ff5a5a",
  J: "#6a8dff",
  L: "#ff9a4d",
};
const BASE_MS: Record<Difficulty, number> = {
  easy: 900,
  normal: 760,
  hard: 600,
  insane: 450,
};
const KICKS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
];

interface Piece {
  t: PT;
  m: number[][];
  x: number;
  y: number;
}

const rotCW = (m: number[][]) =>
  m.map((_, r) => m.map((__, c) => m[m.length - 1 - c][r]));
const rotCCW = (m: number[][]) =>
  m.map((_, r) => m.map((__, c) => m[c][m.length - 1 - r]));

function cell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size = CELL,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(x + 1, y + 1, size - 2, Math.max(2, size * 0.14));
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(
    x + 1,
    y + size - 1 - Math.max(2, size * 0.14),
    size - 2,
    Math.max(2, size * 0.14),
  );
}

export class BlocksGame implements GameInstance {
  readonly width = W;
  readonly height = H;
  finished = false;
  score = 0;
  level = 1;

  private mult: number;
  private baseMs: number;
  private lines = 0;
  private board: (PT | null)[][] = Array.from({ length: ROWS }, () =>
    Array<PT | null>(COLS).fill(null),
  );
  private cur: Piece | null = null;
  private next: PT;
  private holdT: PT | null = null;
  private canHold = true;
  private bag: PT[] = [];
  private gravAcc = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private hDir = 0;
  private leftHeld = false;
  private rightHeld = false;
  private dasT = 0;
  private arrT = 0;
  private softDrop = false;
  private clearing: { rows: number[]; t: number } | null = null;
  private dead = false;
  private deadTimer = 0;
  private banner = 0;

  constructor(mode: Difficulty) {
    this.mult = MULT[mode];
    this.baseMs = BASE_MS[mode];
    this.next = this.draw7();
    this.spawnNext();
  }

  private get gravityMs() {
    return Math.max(50, this.baseMs * Math.pow(0.82, this.level - 1));
  }

  hud(): HudItem[] {
    return [
      { label: "Score", value: this.score, color: "#ffd23f" },
      { label: "Level", value: this.level, color: "#5eeaff" },
      { label: "Lines", value: this.lines, color: "#7dff9a" },
    ];
  }

  private draw7(): PT {
    if (!this.bag.length) {
      this.bag = [...ORDER];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop()!;
  }

  private collides(m: number[][], x: number, y: number) {
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && this.board[by][bx]) return true;
      }
    }
    return false;
  }

  private spawn(t: PT): boolean {
    const m = SHAPES[t].map((r) => [...r]);
    const x = Math.floor((COLS - m.length) / 2);
    this.cur = { t, m, x, y: 0 };
    this.gravAcc = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.canHold = true;
    return !this.collides(m, x, 0);
  }

  private spawnNext() {
    const t = this.next;
    this.next = this.draw7();
    if (!this.spawn(t)) this.die();
  }

  private die() {
    this.dead = true;
    this.deadTimer = 800;
    blip(160, 0.5, "sawtooth", 0.07, 45);
  }

  private onMoved() {
    const c = this.cur;
    if (!c) return;
    if (this.collides(c.m, c.x, c.y + 1) && this.lockResets < 12) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private moveH(d: number) {
    const c = this.cur;
    if (!c || this.clearing) return;
    if (!this.collides(c.m, c.x + d, c.y)) {
      c.x += d;
      this.onMoved();
    }
  }

  private stepDown(soft: boolean) {
    const c = this.cur;
    if (!c || this.clearing) return false;
    if (this.collides(c.m, c.x, c.y + 1)) return false;
    c.y++;
    if (soft) this.score += 1;
    return true;
  }

  private rotate(dir: 1 | -1) {
    const c = this.cur;
    if (!c || c.t === "O" || this.clearing) return;
    const m = dir === 1 ? rotCW(c.m) : rotCCW(c.m);
    for (const [dx, dy] of KICKS) {
      if (!this.collides(m, c.x + dx, c.y + dy)) {
        c.m = m;
        c.x += dx;
        c.y += dy;
        this.onMoved();
        blip(700, 0.03, "square", 0.03);
        return;
      }
    }
  }

  private hardDrop() {
    if (!this.cur || this.clearing) return;
    while (this.stepDown(false)) this.score += 2;
    blip(180, 0.07, "square", 0.05);
    this.lockPiece();
  }

  private hold() {
    const c = this.cur;
    if (!c || !this.canHold || this.clearing) return;
    const t = c.t;
    if (this.holdT) {
      const h = this.holdT;
      this.holdT = t;
      if (!this.spawn(h)) this.die();
    } else {
      this.holdT = t;
      this.spawnNext();
    }
    this.canHold = false;
    blip(500, 0.05, "triangle", 0.04);
  }

  private lockPiece() {
    const c = this.cur;
    if (!c) return;
    let top = false;
    for (let r = 0; r < c.m.length; r++) {
      for (let k = 0; k < c.m[r].length; k++) {
        if (!c.m[r][k]) continue;
        const by = c.y + r;
        const bx = c.x + k;
        if (by < HIDDEN) top = true;
        if (by >= 0 && by < ROWS) this.board[by][bx] = c.t;
      }
    }
    this.cur = null;
    if (top) {
      this.die();
      return;
    }
    const rows: number[] = [];
    for (let r = 0; r < ROWS; r++)
      if (this.board[r].every(Boolean)) rows.push(r);
    if (rows.length) {
      this.clearing = { rows, t: 260 };
      const pts = [0, 100, 300, 500, 800][rows.length] ?? 800;
      this.score += Math.round(pts * this.level * this.mult);
      this.lines += rows.length;
      const nl = 1 + Math.floor(this.lines / 10);
      if (nl > this.level) {
        this.level = nl;
        this.banner = 1200;
        fanfare();
      } else {
        blip(600 + rows.length * 120, 0.12, "square", 0.05);
      }
    } else {
      this.spawnNext();
    }
  }

  key(code: string, down: boolean) {
    switch (code) {
      case "ArrowLeft":
      case "KeyA":
        if (down) {
          this.leftHeld = true;
          this.hDir = -1;
          this.dasT = 0;
          this.arrT = 0;
          this.moveH(-1);
        } else {
          this.leftHeld = false;
          if (this.hDir === -1) {
            this.hDir = this.rightHeld ? 1 : 0;
            this.dasT = 0;
            this.arrT = 0;
          }
        }
        break;
      case "ArrowRight":
      case "KeyD":
        if (down) {
          this.rightHeld = true;
          this.hDir = 1;
          this.dasT = 0;
          this.arrT = 0;
          this.moveH(1);
        } else {
          this.rightHeld = false;
          if (this.hDir === 1) {
            this.hDir = this.leftHeld ? -1 : 0;
            this.dasT = 0;
            this.arrT = 0;
          }
        }
        break;
      case "ArrowDown":
      case "KeyS":
        this.softDrop = down;
        if (down) {
          this.stepDown(true);
          this.gravAcc = 0;
        }
        break;
      case "ArrowUp":
      case "KeyX":
      case "KeyW":
        if (down) this.rotate(1);
        break;
      case "KeyZ":
        if (down) this.rotate(-1);
        break;
      case "Space":
        if (down) this.hardDrop();
        break;
      case "KeyC":
      case "ShiftLeft":
      case "ShiftRight":
        if (down) this.hold();
        break;
    }
  }
  tap() {
    this.rotate(1);
  }

  update(dt: number) {
    if (this.finished) return;
    if (this.dead) {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.finished = true;
      return;
    }
    if (this.banner > 0) this.banner -= dt;

    if (this.clearing) {
      this.clearing.t -= dt;
      if (this.clearing.t <= 0) {
        for (const r of this.clearing.rows) {
          this.board.splice(r, 1);
          this.board.unshift(Array<PT | null>(COLS).fill(null));
        }
        this.clearing = null;
        this.spawnNext();
      }
      return;
    }
    const c = this.cur;
    if (!c) return;

    // sideways auto-repeat
    if (this.hDir !== 0) {
      this.dasT += dt;
      if (this.dasT >= 160) {
        this.arrT += dt;
        while (this.arrT >= 50) {
          this.arrT -= 50;
          this.moveH(this.hDir);
        }
      }
    }

    // gravity
    const g = this.gravityMs;
    const interval = this.softDrop ? Math.min(45, g) : g;
    this.gravAcc += dt;
    while (this.gravAcc >= interval) {
      this.gravAcc -= interval;
      if (!this.stepDown(this.softDrop)) {
        this.gravAcc = 0;
        break;
      }
    }

    // lock delay
    if (this.cur && this.collides(c.m, c.x, c.y + 1)) {
      this.lockTimer += dt;
      if (this.lockTimer >= 450) this.lockPiece();
    } else {
      this.lockTimer = 0;
    }
  }

  private preview(
    ctx: CanvasRenderingContext2D,
    t: PT,
    x: number,
    y: number,
    bw: number,
    bh: number,
    size: number,
    alpha: number,
  ) {
    const m = SHAPES[t];
    let minR = 9;
    let maxR = -1;
    let minC = 9;
    let maxC = -1;
    m.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return;
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }),
    );
    const ox = x + (bw - (maxC - minC + 1) * size) / 2;
    const oy = y + (bh - (maxR - minR + 1) * size) / 2;
    ctx.globalAlpha = alpha;
    m.forEach((row, r) =>
      row.forEach(
        (v, c) =>
          v &&
          cell(
            ctx,
            ox + (c - minC) * size,
            oy + (r - minR) * size,
            COLORS[t],
            size,
          ),
      ),
    );
    ctx.globalAlpha = 1;
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#070b14";
    ctx.fillRect(0, 0, W, H);

    // board
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, BW, BH);
    ctx.strokeStyle = "rgba(94,234,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= COLS; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, BH);
    }
    for (let i = 0; i <= ROWS - HIDDEN; i++) {
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(BW, i * CELL + 0.5);
    }
    ctx.stroke();

    for (let r = HIDDEN; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.board[r][c];
        if (t) cell(ctx, c * CELL, (r - HIDDEN) * CELL, COLORS[t]);
      }
    }
    if (this.clearing) {
      ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * Math.sin(now / 35)})`;
      for (const r of this.clearing.rows)
        ctx.fillRect(0, (r - HIDDEN) * CELL, BW, CELL);
    }

    const c = this.cur;
    if (c && !this.dead) {
      let gy = c.y;
      while (!this.collides(c.m, c.x, gy + 1)) gy++;
      ctx.strokeStyle = COLORS[c.t];
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      c.m.forEach((row, r) =>
        row.forEach((v, k) => {
          if (v && gy + r >= HIDDEN)
            ctx.strokeRect(
              (c.x + k) * CELL + 2,
              (gy + r - HIDDEN) * CELL + 2,
              CELL - 4,
              CELL - 4,
            );
        }),
      );
      ctx.globalAlpha = 1;
      c.m.forEach((row, r) =>
        row.forEach((v, k) => {
          if (v && c.y + r >= HIDDEN)
            cell(ctx, (c.x + k) * CELL, (c.y + r - HIDDEN) * CELL, COLORS[c.t]);
        }),
      );
    }

    ctx.strokeStyle = "rgba(94,234,255,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, BW - 3, BH - 3);

    // side panel
    const x0 = BW + 16;
    const pw = W - x0 - 8;
    ctx.textAlign = "left";
    ctx.fillStyle = "#7a8aa0";
    ctx.font = "bold 12px monospace";
    ctx.fillText("NEXT", x0, 24);
    ctx.fillStyle = "#0b1220";
    rr(ctx, x0, 32, pw, 76, 8);
    ctx.fill();
    this.preview(ctx, this.next, x0, 32, pw, 76, 16, 1);

    ctx.fillStyle = "#7a8aa0";
    ctx.fillText("HOLD", x0, 140);
    ctx.fillStyle = "#0b1220";
    rr(ctx, x0, 148, pw, 76, 8);
    ctx.fill();
    if (this.holdT)
      this.preview(
        ctx,
        this.holdT,
        x0,
        148,
        pw,
        76,
        16,
        this.canHold ? 1 : 0.35,
      );

    ctx.fillStyle = "#4d5b70";
    ctx.font = "11px monospace";
    const hints = [
      "◀ ▶  MOVE",
      "▲ / X  ROTATE",
      "Z  ROTATE BACK",
      "▼  SOFT DROP",
      "SPACE  HARD DROP",
      "C / SHIFT  HOLD",
    ];
    hints.forEach((h, i) => ctx.fillText(h, x0, 262 + i * 18));

    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 300);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, BH / 2 - 36, BW, 72);
      ctx.textAlign = "center";
      ctx.fillStyle = "#c9f6ff";
      ctx.font = "bold 28px monospace";
      ctx.fillText(`LEVEL ${this.level}`, BW / 2, BH / 2 + 10);
      ctx.globalAlpha = 1;
    }
    if (this.dead) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, BW, BH);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "bold 28px monospace";
      ctx.fillText("TOP OUT", BW / 2, BH / 2);
    }
  }
}

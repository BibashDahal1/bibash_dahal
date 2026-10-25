import { blip, fanfare } from "@/lib/snakeSfx";
import {
  MULT,
  type Difficulty,
  type GameInstance,
  type HudItem,
} from "./types";
import { rr } from "./util";

const SIZE = 440;
export const MERGE_DIM = { width: SIZE, height: SIZE } as const;
const PAD = 14;
const GAP = 10;
const ANIM = 130;

const N: Record<Difficulty, number> = {
  easy: 5,
  normal: 4,
  hard: 4,
  insane: 3,
};
const FOUR: Record<Difficulty, number> = {
  easy: 0.1,
  normal: 0.1,
  hard: 0.25,
  insane: 0.15,
};

type Dir = "left" | "right" | "up" | "down";
const KEYS: Record<string, Dir> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
};

interface Tile {
  id: number;
  v: number;
  r: number;
  c: number;
  fr: number;
  fc: number;
  spawn: boolean;
  merged: boolean;
}
interface Ghost {
  v: number;
  fr: number;
  fc: number;
  r: number;
  c: number;
}

const TILE: Record<number, [string, string]> = {
  2: ["#eee4da", "#776e65"],
  4: ["#ede0c8", "#776e65"],
  8: ["#f2b179", "#ffffff"],
  16: ["#f59563", "#ffffff"],
  32: ["#f67c5f", "#ffffff"],
  64: ["#f65e3b", "#ffffff"],
  128: ["#edcf72", "#ffffff"],
  256: ["#edcc61", "#ffffff"],
  512: ["#edc850", "#ffffff"],
  1024: ["#edc53f", "#ffffff"],
  2048: ["#edc22e", "#ffffff"],
};

function drawTile(
  ctx: CanvasRenderingContext2D,
  v: number,
  x: number,
  y: number,
  size: number,
  scale: number,
) {
  const [bg, fg] = TILE[v] ?? ["#3c3a32", "#ffffff"];
  const s = size * scale;
  const ox = x + (size - s) / 2;
  const oy = y + (size - s) / 2;
  ctx.fillStyle = bg;
  if (v >= 128) {
    ctx.shadowColor = bg;
    ctx.shadowBlur = 14;
  }
  rr(ctx, ox, oy, s, s, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const digits = String(v).length;
  ctx.font = `bold ${Math.round(s * (digits <= 2 ? 0.5 : digits === 3 ? 0.42 : 0.34))}px monospace`;
  ctx.fillText(String(v), ox + s / 2, oy + s / 2 + 2);
  ctx.textBaseline = "alphabetic";
}

export class MergeGame implements GameInstance {
  readonly width = SIZE;
  readonly height = SIZE;
  finished = false;
  score = 0;

  private n: number;
  private mult: number;
  private fourChance: number;
  private board: (Tile | null)[][];
  private ghosts: Ghost[] = [];
  private anim = ANIM;
  private nextId = 1;
  private moves = 0;
  private dead = false;
  private deadTimer = 0;
  private won = false;
  private banner = 0;

  constructor(mode: Difficulty) {
    this.n = N[mode];
    this.mult = MULT[mode];
    this.fourChance = FOUR[mode];
    this.board = Array.from({ length: this.n }, () =>
      Array<Tile | null>(this.n).fill(null),
    );
    this.spawnTile();
    this.spawnTile();
  }

  private tiles(): Tile[] {
    return this.board.flat().filter((t): t is Tile => !!t);
  }
  private get maxTile() {
    return this.tiles().reduce((m, t) => Math.max(m, t.v), 2);
  }
  get level() {
    return Math.max(1, Math.round(Math.log2(this.maxTile)));
  }

  hud(): HudItem[] {
    return [
      { label: "Score", value: this.score, color: "#ffd23f" },
      { label: "Top tile", value: this.maxTile, color: "#ff9a4d" },
      { label: "Moves", value: this.moves, color: "#7dff9a" },
    ];
  }

  private spawnTile() {
    const empty: [number, number][] = [];
    for (let r = 0; r < this.n; r++)
      for (let c = 0; c < this.n; c++)
        if (!this.board[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.board[r][c] = {
      id: this.nextId++,
      v: Math.random() < this.fourChance ? 4 : 2,
      r,
      c,
      fr: r,
      fc: c,
      spawn: true,
      merged: false,
    };
  }

  private canMove() {
    const n = this.n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const t = this.board[r][c];
        if (!t) return true;
        if (c + 1 < n && this.board[r][c + 1]?.v === t.v) return true;
        if (r + 1 < n && this.board[r + 1][c]?.v === t.v) return true;
      }
    }
    return false;
  }

  private move(dir: Dir) {
    if (this.dead || this.finished) return;
    this.ghosts = [];
    const n = this.n;
    const all = this.tiles();
    for (const t of all) {
      t.fr = t.r;
      t.fc = t.c;
      t.spawn = false;
      t.merged = false;
    }

    let moved = false;
    let gained = 0;
    const ghosts: Ghost[] = [];

    for (let i = 0; i < n; i++) {
      const cells: [number, number][] = [];
      for (let j = 0; j < n; j++) {
        if (dir === "left") cells.push([i, j]);
        else if (dir === "right") cells.push([i, n - 1 - j]);
        else if (dir === "up") cells.push([j, i]);
        else cells.push([n - 1 - j, i]);
      }
      const line = cells
        .map(([r, c]) => this.board[r][c])
        .filter((t): t is Tile => !!t);
      let j = 0;
      let k = 0;
      while (k < line.length) {
        const t = line[k];
        const [tr, tc] = cells[j];
        if (k + 1 < line.length && line[k + 1].v === t.v) {
          const u = line[k + 1];
          ghosts.push({ v: u.v, fr: u.r, fc: u.c, r: tr, c: tc });
          t.v *= 2;
          t.merged = true;
          gained += Math.round(t.v * this.mult);
          t.r = tr;
          t.c = tc;
          moved = true;
          k += 2;
        } else {
          if (t.r !== tr || t.c !== tc) moved = true;
          t.r = tr;
          t.c = tc;
          k++;
        }
        j++;
      }
    }
    if (!moved) return;

    for (let r = 0; r < n; r++) this.board[r].fill(null);
    for (const t of all) {
      // tiles absorbed by a merge are not on the board any more
      if (
        ghosts.some(
          (g) =>
            g.fr === t.fr &&
            g.fc === t.fc &&
            g.r === t.r &&
            g.c === t.c &&
            g.v === t.v &&
            !t.merged,
        )
      )
        continue;
      this.board[t.r][t.c] = t;
    }
    this.ghosts = ghosts;
    this.score += gained;
    this.moves++;
    this.anim = 0;
    if (gained > 0) blip(420 + Math.min(600, gained), 0.07, "triangle", 0.05);
    else blip(260, 0.03, "square", 0.03);
    this.spawnTile();

    if (!this.won && this.maxTile >= 2048) {
      this.won = true;
      this.banner = 1800;
      fanfare();
    }
    if (!this.canMove()) {
      this.dead = true;
      this.deadTimer = 900;
      blip(160, 0.5, "sawtooth", 0.07, 45);
    }
  }

  key(code: string, down: boolean) {
    if (!down) return;
    const d = KEYS[code];
    if (d) this.move(d);
  }

  update(dt: number) {
    if (this.finished) return;
    if (this.anim < ANIM) {
      this.anim = Math.min(ANIM, this.anim + dt);
      if (this.anim >= ANIM) this.ghosts = [];
    }
    if (this.banner > 0) this.banner -= dt;
    if (this.dead) {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.finished = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#14110d";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#1f1b16";
    rr(ctx, 4, 4, SIZE - 8, SIZE - 8, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,154,77,0.5)";
    ctx.lineWidth = 3;
    rr(ctx, 4, 4, SIZE - 8, SIZE - 8, 14);
    ctx.stroke();

    const n = this.n;
    const size = (SIZE - 2 * PAD - GAP * (n - 1)) / n;
    const pos = (i: number) => PAD + i * (size + GAP);
    ctx.fillStyle = "#2b2620";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        rr(ctx, pos(c), pos(r), size, size, 8);
        ctx.fill();
      }
    }

    const p = this.anim / ANIM;
    const e = 1 - Math.pow(1 - p, 3);
    for (const g of this.ghosts) {
      const x = pos(g.fc + (g.c - g.fc) * e);
      const y = pos(g.fr + (g.r - g.fr) * e);
      drawTile(ctx, g.v, x, y, size, 1);
    }
    for (const t of this.tiles()) {
      const x = pos(t.fc + (t.c - t.fc) * e);
      const y = pos(t.fr + (t.r - t.fr) * e);
      let scale = 1;
      if (t.spawn) scale = 0.2 + 0.8 * e;
      else if (t.merged) scale = 1 + 0.18 * Math.sin(Math.PI * p);
      drawTile(ctx, t.v, x, y, size, scale);
    }

    ctx.textBaseline = "alphabetic";
    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 300);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, SIZE / 2 - 50, SIZE, 100);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffe08a";
      ctx.font = "bold 44px monospace";
      ctx.fillText("2048! KEEP GOING", SIZE / 2, SIZE / 2 + 14);
      ctx.globalAlpha = 1;
    }
    if (this.dead) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff9a4d";
      ctx.font = "bold 36px monospace";
      ctx.fillText("NO MOVES LEFT", SIZE / 2, SIZE / 2);
    }
  }
}

import { blip, fanfare } from "@/lib/snakeSfx";
import {
  MULT,
  type Difficulty,
  type GameInstance,
  type HudItem,
} from "./types";
import { clamp, rr } from "./util";

const W = 440;
const H = 484;
export const SUDOKU_DIM = { width: W, height: H } as const;

const CELL = 44;
const OX = 22;
const OY = 40;
const BOARD = CELL * 9; // 396

const FULL = 0x1ff;
const POP = new Uint8Array(512);
for (let i = 1; i < 512; i++) POP[i] = POP[i >> 1] + (i & 1);

const rowOf = (i: number) => (i / 9) | 0;
const colOf = (i: number) => i % 9;
const boxOf = (i: number) => ((rowOf(i) / 3) | 0) * 3 + ((colOf(i) / 3) | 0);

const rowCells = (r: number) => Array.from({ length: 9 }, (_, k) => r * 9 + k);
const colCells = (c: number) => Array.from({ length: 9 }, (_, k) => k * 9 + c);
const boxCells = (b: number) => {
  const r0 = ((b / 3) | 0) * 3;
  const c0 = (b % 3) * 3;
  return Array.from(
    { length: 9 },
    (_, k) => (r0 + ((k / 3) | 0)) * 9 + c0 + (k % 3),
  );
};

const CFG: Record<
  Difficulty,
  { clues: number; mistakes: number; par: number }
> = {
  easy: { clues: 42, mistakes: 5, par: 480 },
  normal: { clues: 35, mistakes: 4, par: 540 },
  hard: { clues: 30, mistakes: 3, par: 600 },
  insane: { clues: 26, mistakes: 3, par: 720 },
};

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A random completed grid (backtracking with the fewest-candidates cell first). */
function randomSolution(): Int8Array {
  const g = new Int8Array(81);
  const rows = new Int16Array(9);
  const cols = new Int16Array(9);
  const boxes = new Int16Array(9);
  const dfs = (): boolean => {
    let best = -1;
    let bm = 0;
    let bn = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = FULL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = POP[m];
      if (n === 0) return false;
      if (n < bn) {
        bn = n;
        best = i;
        bm = m;
        if (n === 1) break;
      }
    }
    if (best < 0) return true;
    const r = rowOf(best);
    const c = colOf(best);
    const b = boxOf(best);
    const digits: number[] = [];
    for (let d = 0; d < 9; d++) if (bm & (1 << d)) digits.push(d);
    shuffle(digits);
    for (const d of digits) {
      const bit = 1 << d;
      g[best] = d + 1;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (dfs()) return true;
      g[best] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  };
  dfs();
  return g;
}

/** Number of solutions of a puzzle, counting up to `limit`. */
function countSolutions(cells: Int8Array, limit: number): number {
  const g = cells.slice();
  const rows = new Int16Array(9);
  const cols = new Int16Array(9);
  const boxes = new Int16Array(9);
  for (let i = 0; i < 81; i++) {
    if (!g[i]) continue;
    const bit = 1 << (g[i] - 1);
    rows[rowOf(i)] |= bit;
    cols[colOf(i)] |= bit;
    boxes[boxOf(i)] |= bit;
  }
  let count = 0;
  const dfs = () => {
    if (count >= limit) return;
    let best = -1;
    let bm = 0;
    let bn = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = FULL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = POP[m];
      if (n === 0) return;
      if (n < bn) {
        bn = n;
        best = i;
        bm = m;
        if (n === 1) break;
      }
    }
    if (best < 0) {
      count++;
      return;
    }
    const r = rowOf(best);
    const c = colOf(best);
    const b = boxOf(best);
    for (let d = 0; d < 9 && count < limit; d++) {
      const bit = 1 << d;
      if (!(bm & bit)) continue;
      g[best] = d + 1;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      dfs();
      g[best] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
  };
  dfs();
  return count;
}

/**
 * A puzzle with exactly one solution. Cells are removed one by one while the solution stays unique,
 * until `target` clues are left or the time budget runs out (then the puzzle just has a few extra clues).
 */
function makePuzzle(target: number): {
  solution: Int8Array;
  puzzle: Int8Array;
} {
  const solution = randomSolution();
  const puzzle = solution.slice();
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let clues = 81;
  const t0 = performance.now();
  for (const i of order) {
    if (clues <= target || performance.now() - t0 > 170) break;
    const v = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[i] = v;
    else clues--;
  }
  return { solution, puzzle };
}

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  KeyW: [-1, 0],
  ArrowDown: [1, 0],
  KeyS: [1, 0],
  ArrowLeft: [0, -1],
  KeyA: [0, -1],
  ArrowRight: [0, 1],
  KeyD: [0, 1],
};

interface Flash {
  cells: number[];
  t: number;
}

export class SudokuGame implements GameInstance {
  readonly width = W;
  readonly height = H;
  finished = false;
  score = 0;
  level = 1;

  private mult: number;
  private cfg: { clues: number; mistakes: number; par: number };
  private solution: Int8Array = new Int8Array(81);
  private values: Int8Array = new Int8Array(81);
  private given: boolean[] = [];
  private notes: Int16Array = new Int16Array(81);
  private sel = 40;
  private notesMode = false;
  private mistakes = 0;
  private hints = 3;
  private streak = 0;
  private time = 0;
  private banner = 0;
  private bannerText = "";
  private bannerSub = "";
  private dead = false;
  private deadTimer = 0;
  private shake = 0;
  private wrongCell = -1;
  private wrongT = 0;
  private flashes: Flash[] = [];

  constructor(mode: Difficulty) {
    this.cfg = CFG[mode];
    this.mult = MULT[mode];
    this.newPuzzle();
  }

  private newPuzzle() {
    const target = Math.max(
      this.cfg.clues - 6,
      this.cfg.clues - (this.level - 1),
    );
    const { solution, puzzle } = makePuzzle(target);
    this.solution = solution;
    this.values = puzzle.slice();
    this.given = Array.from(puzzle, (v) => v !== 0);
    this.notes = new Int16Array(81);
    this.hints = 3;
    this.streak = 0;
    this.time = 0;
    this.flashes = [];
    this.wrongCell = -1;
    const empty = this.given.findIndex((g) => !g);
    this.sel = empty >= 0 ? empty : 40;
  }

  hud(): HudItem[] {
    return [
      { label: "Score", value: this.score, color: "#ffd23f" },
      { label: "Puzzle", value: this.level, color: "#ff9a4d" },
      {
        label: "Mistakes",
        value: `${this.mistakes}/${this.cfg.mistakes}`,
        color: "#ff7a7a",
      },
    ];
  }

  private clearNotes(i: number, d: number) {
    const mask = ~(1 << (d - 1));
    for (const j of [
      ...rowCells(rowOf(i)),
      ...colCells(colOf(i)),
      ...boxCells(boxOf(i)),
    ])
      this.notes[j] &= mask;
  }

  private checkUnits(i: number) {
    for (const cells of [
      rowCells(rowOf(i)),
      colCells(colOf(i)),
      boxCells(boxOf(i)),
    ]) {
      if (cells.every((j) => this.values[j] !== 0)) {
        this.flashes.push({ cells, t: 600 });
        this.score += Math.round(50 * this.mult);
        blip(880, 0.1, "triangle", 0.05, 1200);
      }
    }
  }

  private isSolved() {
    return this.values.every((v) => v !== 0);
  }

  private solve() {
    const seconds = this.time / 1000;
    const bonus = Math.round(
      (500 + Math.max(0, this.cfg.par - seconds) * 3) * this.mult,
    );
    this.score += bonus;
    this.banner = 1600;
    this.bannerText = "SOLVED!";
    this.bannerSub = `+${bonus}`;
    fanfare();
  }

  private place(d: number) {
    const i = this.sel;
    if (this.dead || this.banner > 0 || this.given[i] || this.values[i]) return;

    if (this.notesMode) {
      this.notes[i] ^= 1 << (d - 1);
      blip(500, 0.02, "square", 0.02);
      return;
    }

    if (this.solution[i] === d) {
      this.values[i] = d;
      this.notes[i] = 0;
      this.streak++;
      this.score += Math.round(
        10 * this.mult * Math.min(5, 1 + Math.floor(this.streak / 4)),
      );
      this.clearNotes(i, d);
      blip(600 + d * 40, 0.06);
      this.checkUnits(i);
      if (this.isSolved()) this.solve();
    } else {
      this.mistakes++;
      this.streak = 0;
      this.score = Math.max(0, this.score - Math.round(20 * this.mult));
      this.wrongCell = i;
      this.wrongT = 500;
      this.shake = 0.6;
      blip(150, 0.15, "sawtooth", 0.06, 90);
      if (this.mistakes >= this.cfg.mistakes) {
        this.dead = true;
        this.deadTimer = 900;
      }
    }
  }

  private hint() {
    const i = this.sel;
    if (
      this.dead ||
      this.banner > 0 ||
      this.hints <= 0 ||
      this.given[i] ||
      this.values[i]
    )
      return;
    this.hints--;
    this.values[i] = this.solution[i];
    this.notes[i] = 0;
    this.streak = 0;
    this.score = Math.max(0, this.score - Math.round(50 * this.mult));
    this.clearNotes(i, this.solution[i]);
    blip(740, 0.1, "triangle", 0.05);
    this.checkUnits(i);
    if (this.isSolved()) this.solve();
  }

  key(code: string, down: boolean) {
    if (!down) return;
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(code);
    if (m) {
      this.place(Number(m[1]));
      return;
    }
    const mv = MOVES[code];
    if (mv) {
      const r = clamp(rowOf(this.sel) + mv[0], 0, 8);
      const c = clamp(colOf(this.sel) + mv[1], 0, 8);
      this.sel = r * 9 + c;
      return;
    }
    if (code === "KeyN" || code === "Space") {
      this.notesMode = !this.notesMode;
      blip(420, 0.04, "triangle", 0.03);
    } else if (code === "KeyH") {
      this.hint();
    } else if (code === "Backspace" || code === "Delete") {
      if (!this.given[this.sel] && !this.values[this.sel])
        this.notes[this.sel] = 0;
    }
  }

  press(nx: number, ny: number) {
    const col = Math.floor((nx * W - OX) / CELL);
    const row = Math.floor((ny * H - OY) / CELL);
    if (col < 0 || col > 8 || row < 0 || row > 8) return;
    this.sel = row * 9 + col;
    blip(380, 0.02, "square", 0.02);
  }

  update(dt: number) {
    if (this.finished) return;
    if (this.banner > 0) {
      this.banner -= dt;
      if (this.banner <= 0) {
        this.level++;
        this.newPuzzle();
      }
    } else if (!this.dead) {
      this.time += dt;
    }
    if (this.wrongT > 0) this.wrongT -= dt;
    this.shake = Math.max(0, this.shake - dt / 500);
    for (const f of this.flashes) f.t -= dt;
    this.flashes = this.flashes.filter((f) => f.t > 0);
    if (this.dead) {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) this.finished = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0d18";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (this.shake > 0)
      ctx.translate(
        (Math.random() - 0.5) * 8 * this.shake,
        (Math.random() - 0.5) * 8 * this.shake,
      );

    // header
    ctx.font = "bold 13px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = this.notesMode ? "#ffd23f" : "#6c7488";
    ctx.fillText(`NOTES ${this.notesMode ? "ON" : "OFF"}`, OX, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = "#c9d0e6";
    const secs = Math.floor(this.time / 1000);
    ctx.fillText(
      `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`,
      W / 2,
      26,
    );
    ctx.textAlign = "right";
    ctx.fillStyle = this.hints > 0 ? "#7dff9a" : "#6c7488";
    ctx.fillText(`HINTS ${this.hints}`, W - OX, 26);

    // cells
    const sel = this.sel;
    const sr = rowOf(sel);
    const sc = colOf(sel);
    const sb = boxOf(sel);
    const selV = this.values[sel];
    for (let i = 0; i < 81; i++) {
      const r = rowOf(i);
      const c = colOf(i);
      const x = OX + c * CELL;
      const y = OY + r * CELL;
      let bg = "#14131c";
      if (i === sel) bg = "#3a2a14";
      else if (r === sr || c === sc || boxOf(i) === sb) bg = "#1d1a28";
      else if (selV && this.values[i] === selV) bg = "#2c2416";
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, CELL, CELL);
    }
    for (const f of this.flashes) {
      ctx.fillStyle = `rgba(125,255,154,${0.45 * (f.t / 600)})`;
      for (const j of f.cells)
        ctx.fillRect(OX + colOf(j) * CELL, OY + rowOf(j) * CELL, CELL, CELL);
    }
    if (this.wrongT > 0 && this.wrongCell >= 0) {
      ctx.fillStyle = `rgba(255,70,70,${0.6 * (this.wrongT / 500)})`;
      ctx.fillRect(
        OX + colOf(this.wrongCell) * CELL,
        OY + rowOf(this.wrongCell) * CELL,
        CELL,
        CELL,
      );
    }

    // digits and pencil notes
    ctx.textAlign = "center";
    for (let i = 0; i < 81; i++) {
      const x = OX + colOf(i) * CELL;
      const y = OY + rowOf(i) * CELL;
      const v = this.values[i];
      if (v) {
        ctx.font = "bold 26px monospace";
        ctx.textBaseline = "middle";
        ctx.fillStyle = this.given[i] ? "#e8ecf5" : "#ff9a4d";
        ctx.fillText(String(v), x + CELL / 2, y + CELL / 2 + 2);
        ctx.textBaseline = "alphabetic";
      } else if (this.notes[i]) {
        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#8a93ad";
        for (let d = 0; d < 9; d++) {
          if (!(this.notes[i] & (1 << d))) continue;
          ctx.fillText(
            String(d + 1),
            x + 8 + (d % 3) * 14,
            y + 14 + ((d / 3) | 0) * 13,
          );
        }
      }
    }

    // grid
    for (let k = 0; k <= 9; k++) {
      const thick = k % 3 === 0;
      ctx.lineWidth = thick ? 2.5 : 1;
      ctx.strokeStyle = thick
        ? "rgba(255,154,77,0.85)"
        : "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(OX + k * CELL, OY);
      ctx.lineTo(OX + k * CELL, OY + BOARD);
      ctx.moveTo(OX, OY + k * CELL);
      ctx.lineTo(OX + BOARD, OY + k * CELL);
      ctx.stroke();
    }
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 3;
    rr(
      ctx,
      OX + colOf(sel) * CELL + 1.5,
      OY + rowOf(sel) * CELL + 1.5,
      CELL - 3,
      CELL - 3,
      4,
    );
    ctx.stroke();

    // how many of each digit are still missing
    const counts = new Array<number>(10).fill(0);
    for (let i = 0; i < 81; i++) counts[this.values[i]]++;
    for (let d = 1; d <= 9; d++) {
      const left = 9 - counts[d];
      const cx = OX + (d - 0.5) * CELL;
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = left === 0 ? "#3a4052" : "#c9d0e6";
      ctx.fillText(String(d), cx, OY + BOARD + 24);
      ctx.font = "10px monospace";
      ctx.fillStyle = left === 0 ? "#2a2f3d" : "#6c7488";
      ctx.fillText(left === 0 ? "done" : `${left} left`, cx, OY + BOARD + 38);
    }
    ctx.restore();

    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 300);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, H / 2 - 56, W, 112);
      ctx.textAlign = "center";
      ctx.shadowColor = "#ff9a4d";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#ffe0b8";
      ctx.font = "bold 44px monospace";
      ctx.fillText(this.bannerText, W / 2, H / 2 + 6);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 20px monospace";
      ctx.fillText(this.bannerSub, W / 2, H / 2 + 38);
      ctx.globalAlpha = 1;
    }
    if (this.dead) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "bold 28px monospace";
      ctx.fillText("TOO MANY MISTAKES", W / 2, H / 2);
    }
  }
}

export type Dir = "up" | "down" | "left" | "right";
export type Difficulty = "easy" | "normal" | "hard" | "insane";

export const GRID = 24;
export const DX: Record<Dir, number> = { up: 0, down: 0, left: -1, right: 1 };
export const DY: Record<Dir, number> = { up: -1, down: 1, left: 0, right: 0 };
const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export interface Cell {
  x: number;
  y: number;
}
export interface Bonus extends Cell {
  ttl: number;
  max: number;
}

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  blurb: string;
  /** ms per step on level 1 */
  baseTick: number;
  /** ms faster per level */
  tickStep: number;
  minTick: number;
  /** true: the snake wraps around the edges instead of dying on the wall */
  wrap: boolean;
  /** score multiplier */
  mult: number;
  obstacleBase: number;
  obstacleStep: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: "easy",
    label: "Easy",
    blurb: "Walls wrap around. Relax.",
    baseTick: 150,
    tickStep: 7,
    minTick: 85,
    wrap: true,
    mult: 1,
    obstacleBase: 0,
    obstacleStep: 1,
  },
  normal: {
    id: "normal",
    label: "Normal",
    blurb: "Solid walls. Classic.",
    baseTick: 125,
    tickStep: 8,
    minTick: 70,
    wrap: false,
    mult: 1.5,
    obstacleBase: 0,
    obstacleStep: 2,
  },
  hard: {
    id: "hard",
    label: "Hard",
    blurb: "Fast, with blocks from level 1.",
    baseTick: 100,
    tickStep: 8,
    minTick: 55,
    wrap: false,
    mult: 2,
    obstacleBase: 3,
    obstacleStep: 2,
  },
  insane: {
    id: "insane",
    label: "Insane",
    blurb: "Blazing speed, block maze.",
    baseTick: 78,
    tickStep: 6,
    minTick: 42,
    wrap: false,
    mult: 3,
    obstacleBase: 6,
    obstacleStep: 3,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "insane",
];

export type StepEvent =
  | { type: "ate"; at: Cell; points: number }
  | { type: "bonus"; at: Cell; points: number }
  | { type: "levelup"; level: number }
  | { type: "dead" };

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const rnd = () => Math.floor(Math.random() * GRID);

/** Pure game logic: no DOM, no timers. The component calls update() every frame and step() every tick. */
export class SnakeEngine {
  readonly difficulty: Difficulty;
  readonly cfg: DifficultyConfig;

  snake: Cell[];
  /** the snake as it was before the last step (used to draw smooth motion) */
  prev: Cell[];
  dir: Dir = "right";
  private queue: Dir[] = [];

  food: Cell = { x: -1, y: -1 };
  bonus: Bonus | null = null;
  obstacles: Cell[] = [];

  score = 0;
  level = 1;
  eatenThisLevel = 0;
  foodEaten = 0;
  combo = 1;
  sinceFood = Number.POSITIVE_INFINITY;
  alive = true;

  constructor(difficulty: Difficulty) {
    this.difficulty = difficulty;
    this.cfg = DIFFICULTIES[difficulty];
    this.snake = [
      { x: 8, y: 12 },
      { x: 7, y: 12 },
      { x: 6, y: 12 },
      { x: 5, y: 12 },
    ];
    this.prev = this.snake.map((c) => ({ ...c }));
    this.rebuildObstacles();
    this.food = this.freeCell();
  }

  /** ms per step at the current level */
  get tick() {
    return Math.max(
      this.cfg.minTick,
      this.cfg.baseTick - (this.level - 1) * this.cfg.tickStep,
    );
  }
  /** foods needed to finish the current level */
  get target() {
    return Math.min(20, 4 + this.level * 2);
  }
  get comboWindow() {
    return this.tick * 12;
  }
  get comboActive() {
    return this.combo > 1 && this.sinceFood < this.comboWindow;
  }

  /** Queue a turn (max 2 buffered). Reversing into yourself is ignored. */
  turn(d: Dir) {
    const last = this.queue.length
      ? this.queue[this.queue.length - 1]
      : this.dir;
    if (d === last || d === OPPOSITE[last]) return;
    if (this.queue.length >= 2) return;
    this.queue.push(d);
  }

  /** Real-time timers (combo window, bonus apple). dt in ms. */
  update(dt: number) {
    this.sinceFood += dt;
    if (this.sinceFood >= this.comboWindow) this.combo = 1;
    if (this.bonus) {
      this.bonus.ttl -= dt;
      if (this.bonus.ttl <= 0) this.bonus = null;
    }
  }

  step(): StepEvent[] {
    const ev: StepEvent[] = [];
    if (!this.alive) return ev;

    const queued = this.queue.shift();
    if (queued) this.dir = queued;

    const head = this.snake[0];
    let nx = head.x + DX[this.dir];
    let ny = head.y + DY[this.dir];
    if (this.cfg.wrap) {
      nx = (nx + GRID) % GRID;
      ny = (ny + GRID) % GRID;
    } else if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) {
      return this.die(ev);
    }
    const next: Cell = { x: nx, y: ny };

    if (this.obstacles.some((o) => same(o, next))) return this.die(ev);

    const eatsFood = same(next, this.food);
    const eatsBonus = !!this.bonus && same(next, this.bonus);
    const grow = eatsFood || eatsBonus;

    // the tail cell is free to enter when we are not growing (it moves away this step)
    const body = grow ? this.snake : this.snake.slice(0, -1);
    if (body.some((c) => same(c, next))) return this.die(ev);

    this.prev = this.snake.map((c) => ({ ...c }));
    this.snake.unshift(next);
    if (!grow) this.snake.pop();

    if (eatsBonus && this.bonus) {
      const points = Math.round(
        (50 + 50 * (this.bonus.ttl / this.bonus.max)) * this.cfg.mult,
      );
      this.score += points;
      this.bonus = null;
      ev.push({ type: "bonus", at: next, points });
    }

    if (eatsFood) {
      this.combo =
        this.sinceFood < this.comboWindow ? Math.min(5, this.combo + 1) : 1;
      this.sinceFood = 0;
      const points = Math.round(10 * this.cfg.mult * this.combo);
      this.score += points;
      this.eatenThisLevel++;
      this.foodEaten++;
      ev.push({ type: "ate", at: next, points });

      this.food = this.freeCell();
      if (this.foodEaten % 5 === 0 && !this.bonus) {
        const c = this.freeCell();
        this.bonus = { ...c, ttl: 7000, max: 7000 };
      }

      if (this.eatenThisLevel >= this.target) {
        this.score += Math.round(50 * this.level * this.cfg.mult);
        this.level++;
        this.eatenThisLevel = 0;
        this.rebuildObstacles();
        ev.push({ type: "levelup", level: this.level });
      }
    }
    return ev;
  }

  private die(ev: StepEvent[]) {
    this.alive = false;
    ev.push({ type: "dead" });
    return ev;
  }

  private obstacleCount(level: number) {
    return Math.min(
      40,
      this.cfg.obstacleBase + Math.floor((level - 1) * this.cfg.obstacleStep),
    );
  }

  private rebuildObstacles() {
    this.obstacles = [];
    const n = this.obstacleCount(this.level);
    for (let i = 0; i < n; i++) this.obstacles.push(this.freeCell(5));
  }

  private occupied(x: number, y: number) {
    const c = { x, y };
    return (
      this.snake.some((s) => same(s, c)) ||
      this.obstacles.some((o) => same(o, c)) ||
      same(this.food, c) ||
      (!!this.bonus && same(this.bonus, c))
    );
  }

  /** A random empty cell. avoidHead keeps it more than that many cells (manhattan) from the snake's head. */
  private freeCell(avoidHead = 0): Cell {
    const head = this.snake[0];
    const far = (x: number, y: number) =>
      avoidHead === 0 ||
      Math.abs(x - head.x) + Math.abs(y - head.y) > avoidHead;
    for (let i = 0; i < 300; i++) {
      const x = rnd();
      const y = rnd();
      if (!this.occupied(x, y) && far(x, y)) return { x, y };
    }
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) if (!this.occupied(x, y)) return { x, y };
    }
    return { x: 0, y: 0 };
  }
}

import { blip, fanfare } from "@/lib/snakeSfx";
import {
  MULT,
  type Difficulty,
  type GameInstance,
  type HudItem,
} from "./types";
import {
  burst,
  clamp,
  drawParticles,
  rr,
  stepParticles,
  type Particle,
} from "./util";

const W = 480;
const H = 560;
export const BREAKOUT_DIM = { width: W, height: H } as const;

const PADDLE_Y = 516;
const PADDLE_H = 12;
const R = 7;
const COLS = 10;
const MARGIN = 12;
const BRICK_H = 18;
const GAP = 3;
const TOP = 70;
const BRICK_W = (W - MARGIN * 2) / COLS;
const COLORS = [
  "#ff5a5a",
  "#ff9a4d",
  "#ffd23f",
  "#7dff9a",
  "#5eeaff",
  "#6a8dff",
  "#b57aff",
  "#ff7ad9",
];

const CFG: Record<
  Difficulty,
  { paddle: number; speed: number; lives: number }
> = {
  easy: { paddle: 110, speed: 290, lives: 5 },
  normal: { paddle: 90, speed: 330, lives: 3 },
  hard: { paddle: 72, speed: 370, lives: 3 },
  insane: { paddle: 58, speed: 420, lives: 2 },
};

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  stuck: boolean;
}
interface Brick {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  row: number;
}
interface Power {
  x: number;
  y: number;
  type: "W" | "M" | "S";
}

const POWER_COLOR = { W: "#5eeaff", M: "#ff7ad9", S: "#ffd23f" } as const;

export class BreakoutGame implements GameInstance {
  readonly width = W;
  readonly height = H;
  finished = false;
  score = 0;
  level = 1;

  private cfg: { paddle: number; speed: number; lives: number };
  private mult: number;
  private lives: number;
  private paddleX = W / 2;
  private target: number | null = null;
  private left = false;
  private right = false;
  private wide = 0;
  private slow = 0;
  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private powers: Power[] = [];
  private particles: Particle[] = [];
  private trail: { x: number; y: number }[] = [];
  private streak = 0;
  private banner = 0;
  private bannerText = "";
  private dead = false;
  private deadTimer = 0;
  private shake = 0;

  constructor(mode: Difficulty) {
    this.cfg = CFG[mode];
    this.mult = MULT[mode];
    this.lives = this.cfg.lives;
    this.buildLevel();
    this.resetBalls();
  }

  private get pw() {
    return this.cfg.paddle * (this.wide > 0 ? 1.6 : 1);
  }
  private get speedNow() {
    return (
      this.cfg.speed *
      Math.min(1.7, 1 + 0.05 * (this.level - 1)) *
      (this.slow > 0 ? 0.7 : 1)
    );
  }
  private get streakMult() {
    return 1 + Math.min(6, Math.floor(this.streak / 3)) * 0.5;
  }

  hud(): HudItem[] {
    return [
      { label: "Score", value: this.score, color: "#ffd23f" },
      { label: "Level", value: this.level, color: "#7dff9a" },
      {
        label: "Lives",
        value: "♥".repeat(Math.max(0, this.lives)) || "-",
        color: "#ff7a7a",
      },
    ];
  }

  private buildLevel() {
    this.bricks = [];
    const rows = Math.min(8, 4 + Math.floor((this.level + 1) / 2));
    const pattern = (this.level - 1) % 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        if (pattern === 1 && (r + c) % 2 !== 0) continue;
        if (pattern === 2 && r % 2 === 1 && c % 3 === 1) continue;
        if (pattern === 3 && Math.abs(c - 4.5) > r + 1.5) continue;
        const hp =
          this.level >= 2 && r < Math.min(3, Math.floor(this.level / 2))
            ? 2
            : 1;
        this.bricks.push({
          x: MARGIN + c * BRICK_W,
          y: TOP + r * (BRICK_H + GAP),
          hp,
          maxHp: hp,
          row: r,
        });
      }
    }
  }

  private resetBalls() {
    this.balls = [
      { x: this.paddleX, y: PADDLE_Y - R - 1, vx: 0, vy: 0, stuck: true },
    ];
    this.trail = [];
  }

  private launch() {
    for (const b of this.balls) {
      if (!b.stuck) continue;
      const a = (Math.random() - 0.5) * 0.6;
      const sp = this.speedNow;
      b.vx = sp * Math.sin(a);
      b.vy = -sp * Math.cos(a);
      b.stuck = false;
      blip(440, 0.05);
    }
  }

  key(code: string, down: boolean) {
    if (code === "ArrowLeft" || code === "KeyA") {
      this.left = down;
      if (down) this.target = null;
    } else if (code === "ArrowRight" || code === "KeyD") {
      this.right = down;
      if (down) this.target = null;
    } else if (
      (code === "Space" || code === "ArrowUp" || code === "KeyW") &&
      down
    ) {
      this.launch();
    }
  }
  pointer(nx: number) {
    this.target = clamp(nx, 0, 1) * W;
  }
  tap() {
    this.launch();
  }

  update(dt: number) {
    if (this.finished) return;
    if (this.dead) {
      this.deadTimer -= dt;
      this.shake = Math.max(0, this.shake - dt / 700);
      if (this.deadTimer <= 0) this.finished = true;
      this.particles = stepParticles(this.particles, dt);
      return;
    }

    // paddle
    const s = dt / 1000;
    if (this.left || this.right) {
      this.paddleX += ((this.right ? 1 : 0) - (this.left ? 1 : 0)) * 560 * s;
    } else if (this.target !== null) {
      this.paddleX += (this.target - this.paddleX) * Math.min(1, dt / 45);
    }
    this.paddleX = clamp(this.paddleX, this.pw / 2, W - this.pw / 2);

    if (this.wide > 0) this.wide -= dt;
    if (this.slow > 0) this.slow -= dt;
    for (const b of this.balls) if (b.stuck) b.x = this.paddleX;

    if (this.banner > 0) {
      this.banner -= dt;
      this.particles = stepParticles(this.particles, dt);
      return;
    }

    // power-ups
    for (const p of this.powers) p.y += 130 * s;
    this.powers = this.powers.filter((p) => {
      const caught =
        p.y + 10 >= PADDLE_Y &&
        p.y - 10 <= PADDLE_Y + PADDLE_H &&
        Math.abs(p.x - this.paddleX) <= this.pw / 2 + 10;
      if (caught) {
        this.applyPower(p.type);
        return false;
      }
      return p.y < H + 20;
    });

    // balls (small sub-steps so fast balls never tunnel)
    const lost: Ball[] = [];
    for (const b of this.balls) {
      if (b.stuck) continue;
      const mag = Math.hypot(b.vx, b.vy) || 1;
      const k = this.speedNow / mag;
      b.vx *= k;
      b.vy *= k;
      const steps = Math.max(1, Math.ceil((this.speedNow * s) / 4));
      const h = s / steps;
      for (let i = 0; i < steps; i++) {
        if (this.stepBall(b, h)) {
          lost.push(b);
          break;
        }
      }
    }
    if (this.balls[0] && !this.balls[0].stuck) {
      this.trail.push({ x: this.balls[0].x, y: this.balls[0].y });
      if (this.trail.length > 8) this.trail.shift();
    }
    if (lost.length) this.balls = this.balls.filter((b) => !lost.includes(b));

    if (this.balls.length === 0) {
      this.lives--;
      this.streak = 0;
      this.powers = [];
      this.wide = 0;
      this.slow = 0;
      if (this.lives <= 0) {
        this.dead = true;
        this.deadTimer = 900;
        this.shake = 1;
        blip(160, 0.5, "sawtooth", 0.07, 45);
      } else {
        blip(220, 0.25, "square", 0.06, 110);
        this.resetBalls();
      }
    } else if (this.bricks.length === 0) {
      this.score += Math.round(100 * this.level * this.mult);
      this.level++;
      this.buildLevel();
      this.resetBalls();
      this.powers = [];
      this.banner = 1300;
      this.bannerText = `LEVEL ${this.level}`;
      fanfare();
    }
    this.particles = stepParticles(this.particles, dt);
  }

  private applyPower(type: "W" | "M" | "S") {
    blip(880, 0.15, "triangle", 0.06, 1200);
    if (type === "W") this.wide = 10000;
    else if (type === "S") this.slow = 8000;
    else {
      const src = this.balls.find((b) => !b.stuck);
      if (!src) return;
      for (const a of [-0.4, 0.4]) {
        const c = Math.cos(a);
        const sn = Math.sin(a);
        this.balls.push({
          x: src.x,
          y: src.y,
          vx: src.vx * c - src.vy * sn,
          vy: src.vx * sn + src.vy * c,
          stuck: false,
        });
      }
    }
  }

  /** returns true when the ball fell off the bottom */
  private stepBall(b: Ball, h: number): boolean {
    const px = b.x;
    const py = b.y;
    b.x += b.vx * h;
    b.y += b.vy * h;

    if (b.x < R) {
      b.x = R;
      b.vx = Math.abs(b.vx);
    } else if (b.x > W - R) {
      b.x = W - R;
      b.vx = -Math.abs(b.vx);
    }
    if (b.y < R) {
      b.y = R;
      b.vy = Math.abs(b.vy);
    }

    const pw = this.pw;
    if (
      b.vy > 0 &&
      b.y + R >= PADDLE_Y &&
      b.y - R <= PADDLE_Y + PADDLE_H &&
      b.x >= this.paddleX - pw / 2 - R &&
      b.x <= this.paddleX + pw / 2 + R
    ) {
      const rel = clamp((b.x - this.paddleX) / (pw / 2), -1, 1);
      const ang = rel * 1.05;
      const sp = Math.hypot(b.vx, b.vy);
      b.vx = sp * Math.sin(ang);
      b.vy = -sp * Math.cos(ang);
      b.y = PADDLE_Y - R;
      this.streak = 0;
      blip(300, 0.04, "square", 0.04);
    }

    const bw = BRICK_W - GAP;
    for (let i = 0; i < this.bricks.length; i++) {
      const br = this.bricks[i];
      const cx = clamp(b.x, br.x, br.x + bw);
      const cy = clamp(b.y, br.y, br.y + BRICK_H);
      if ((b.x - cx) ** 2 + (b.y - cy) ** 2 >= R * R) continue;

      const vOut = py + R <= br.y || py - R >= br.y + BRICK_H;
      const hOut = px + R <= br.x || px - R >= br.x + bw;
      if (hOut && !vOut) {
        b.vx = -b.vx;
        b.x = b.vx < 0 ? br.x - R : br.x + bw + R;
      } else {
        b.vy = -b.vy;
        b.y = b.vy < 0 ? br.y - R : br.y + BRICK_H + R;
      }

      br.hp--;
      if (br.hp <= 0) {
        this.bricks.splice(i, 1);
        this.score += Math.round(10 * this.mult * br.maxHp * this.streakMult);
        this.streak++;
        burst(
          this.particles,
          br.x + bw / 2,
          br.y + BRICK_H / 2,
          COLORS[br.row % COLORS.length],
          8,
        );
        blip(400 + br.row * 60, 0.05);
        if (Math.random() < 0.14) {
          const r = Math.random();
          this.powers.push({
            x: br.x + bw / 2,
            y: br.y,
            type: r < 0.4 ? "W" : r < 0.75 ? "M" : "S",
          });
        }
      } else {
        this.score += Math.round(2 * this.mult);
        blip(200, 0.05, "square", 0.04);
      }
      break;
    }
    return b.y - R > H;
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0d0820");
    g.addColorStop(1, "#05030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (this.shake > 0)
      ctx.translate(
        (Math.random() - 0.5) * 10 * this.shake,
        (Math.random() - 0.5) * 10 * this.shake,
      );

    // stars
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    for (let i = 0; i < 40; i++)
      ctx.fillRect((i * 97) % W, (i * 53 + 20) % H, 1.5, 1.5);

    // walls
    ctx.strokeStyle = "rgba(255,122,217,0.45)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

    // bricks
    const bw = BRICK_W - GAP;
    for (const br of this.bricks) {
      const col = COLORS[br.row % COLORS.length];
      ctx.fillStyle = col;
      rr(ctx, br.x, br.y, bw, BRICK_H, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(br.x + 2, br.y + 2, bw - 4, 3);
      if (br.maxHp > 1) {
        ctx.strokeStyle =
          br.hp > 1 ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.35)";
        ctx.lineWidth = 2;
        rr(ctx, br.x + 2, br.y + 2, bw - 4, BRICK_H - 4, 2);
        ctx.stroke();
      }
    }

    // power-ups
    for (const p of this.powers) {
      ctx.fillStyle = POWER_COLOR[p.type];
      ctx.shadowColor = POWER_COLOR[p.type];
      ctx.shadowBlur = 10;
      rr(ctx, p.x - 12, p.y - 8, 24, 16, 8);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0a0614";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.type, p.x, p.y + 4);
    }

    // paddle
    const pw = this.pw;
    ctx.shadowColor = this.wide > 0 ? "#5eeaff" : "#c9d6ff";
    ctx.shadowBlur = 14;
    const pg = ctx.createLinearGradient(0, PADDLE_Y, 0, PADDLE_Y + PADDLE_H);
    pg.addColorStop(0, "#ffffff");
    pg.addColorStop(1, this.wide > 0 ? "#3aa8c4" : "#7a8ec4");
    ctx.fillStyle = pg;
    rr(ctx, this.paddleX - pw / 2, PADDLE_Y, pw, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ball trail + balls
    this.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / this.trail.length) * 0.35;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(
        t.x,
        t.y,
        R * (0.4 + (i / this.trail.length) * 0.5),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    for (const b of this.balls) {
      ctx.shadowColor = this.slow > 0 ? "#ffd23f" : "#ffffff";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    drawParticles(ctx, this.particles);
    ctx.restore();

    // overlays
    ctx.textAlign = "left";
    if (this.streak >= 3) {
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`STREAK x${this.streakMult.toFixed(1)}`, 14, 30);
    }
    if (this.wide > 0 || this.slow > 0) {
      ctx.textAlign = "right";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#5eeaff";
      if (this.wide > 0)
        ctx.fillText(`WIDE ${Math.ceil(this.wide / 1000)}s`, W - 14, 26);
      ctx.fillStyle = "#ffd23f";
      if (this.slow > 0)
        ctx.fillText(`SLOW ${Math.ceil(this.slow / 1000)}s`, W - 14, 42);
    }
    if (this.balls.some((b) => b.stuck) && !this.dead && this.banner <= 0) {
      ctx.textAlign = "center";
      ctx.fillStyle = Math.floor(now / 500) % 2 ? "#c9d6ff" : "#7a8ec4";
      ctx.font = "bold 14px monospace";
      ctx.fillText("SPACE / TAP TO LAUNCH", W / 2, PADDLE_Y - 40);
    }
    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 300);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, H / 2 - 50, W, 100);
      ctx.textAlign = "center";
      ctx.shadowColor = "#ff7ad9";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#ffd0f2";
      ctx.font = "bold 44px monospace";
      ctx.fillText(this.bannerText, W / 2, H / 2 + 14);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
}

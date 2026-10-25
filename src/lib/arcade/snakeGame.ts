import {
  DX,
  DY,
  GRID,
  SnakeEngine,
  type Dir,
  type Difficulty,
} from "@/lib/snakeEngine";
import { blip, fanfare } from "@/lib/snakeSfx";
import type { GameInstance, HudItem } from "./types";
import { burst, drawParticles, rr, stepParticles, type Particle } from "./util";

const CELL = 20;
const SIZE = GRID * CELL;
export const SNAKE_DIM = { width: SIZE, height: SIZE } as const;

const KEYS: Record<string, Dir> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

export class SnakeGame implements GameInstance {
  readonly width = SIZE;
  readonly height = SIZE;
  finished = false;

  private e: SnakeEngine;
  private acc = 0;
  private banner = 0;
  private bannerText = "";
  private bannerSub = "";
  private shake = 0;
  private dead = false;
  private deadTimer = 0;
  private particles: Particle[] = [];

  constructor(mode: Difficulty) {
    this.e = new SnakeEngine(mode);
  }

  get score() {
    return this.e.score;
  }
  get level() {
    return this.e.level;
  }

  hud(): HudItem[] {
    const e = this.e;
    return [
      { label: "Score", value: e.score, color: "#ffd23f" },
      { label: "Level", value: e.level, color: "#7dff9a" },
      {
        label: "Apples",
        value: `${e.eatenThisLevel}/${e.target}`,
        color: "#ff7a7a",
      },
    ];
  }

  key(code: string, down: boolean) {
    if (!down) return;
    const d = KEYS[code];
    if (d) this.e.turn(d);
  }

  update(dt: number) {
    if (this.finished) return;
    const e = this.e;

    if (!this.dead) {
      if (this.banner > 0) {
        this.banner -= dt;
      } else {
        e.update(dt);
        this.acc += dt;
        let guard = 0;
        while (this.acc >= e.tick && guard++ < 4) {
          this.acc -= e.tick;
          let stop = false;
          for (const ev of e.step()) {
            if (ev.type === "ate") {
              burst(
                this.particles,
                (ev.at.x + 0.5) * CELL,
                (ev.at.y + 0.5) * CELL,
                "#ff5a5a",
              );
              blip(520 + e.combo * 90, 0.07);
            } else if (ev.type === "bonus") {
              burst(
                this.particles,
                (ev.at.x + 0.5) * CELL,
                (ev.at.y + 0.5) * CELL,
                "#ffd23f",
              );
              blip(880, 0.18, "triangle", 0.06, 1320);
            } else if (ev.type === "levelup") {
              this.banner = 1300;
              this.bannerText = `LEVEL ${ev.level}`;
              this.bannerSub = `FASTER${e.obstacles.length ? ` • ${e.obstacles.length} BLOCKS` : ""}`;
              this.acc = 0;
              fanfare();
              stop = true;
            } else if (ev.type === "dead") {
              this.dead = true;
              this.deadTimer = 900;
              this.shake = 1;
              stop = true;
            }
          }
          if (stop) break;
        }
      }
    } else {
      this.deadTimer -= dt;
      this.shake = Math.max(0, this.shake - dt / 700);
      if (this.deadTimer <= 0) this.finished = true;
    }
    this.particles = stepParticles(this.particles, dt);
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    const e = this.e;
    const t = this.dead || this.banner > 0 ? 1 : Math.min(1, this.acc / e.tick);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#04100a";
    ctx.fillRect(0, 0, SIZE, SIZE);

    ctx.save();
    if (this.shake > 0)
      ctx.translate(
        (Math.random() - 0.5) * 10 * this.shake,
        (Math.random() - 0.5) * 10 * this.shake,
      );

    ctx.strokeStyle = "rgba(90,255,150,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= GRID; i++) {
      ctx.moveTo(i * CELL + 0.5, 0);
      ctx.lineTo(i * CELL + 0.5, SIZE);
      ctx.moveTo(0, i * CELL + 0.5);
      ctx.lineTo(SIZE, i * CELL + 0.5);
    }
    ctx.stroke();

    // solid green border = deadly walls, dashed blue = wrap-around
    ctx.lineWidth = 3;
    ctx.strokeStyle = e.cfg.wrap
      ? "rgba(90,200,255,0.55)"
      : "rgba(90,255,150,0.7)";
    if (e.cfg.wrap) ctx.setLineDash([6, 6]);
    ctx.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
    ctx.setLineDash([]);

    for (const o of e.obstacles) {
      const x = o.x * CELL;
      const y = o.y * CELL;
      ctx.fillStyle = "#2a3a30";
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
      ctx.strokeStyle = "#7fb59a";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
      ctx.beginPath();
      ctx.moveTo(x + 2, y + CELL / 2);
      ctx.lineTo(x + CELL - 2, y + CELL / 2);
      ctx.stroke();
    }

    // apple
    {
      const pulse = 1 + Math.sin(now / 180) * 0.08;
      ctx.save();
      ctx.translate((e.food.x + 0.5) * CELL, (e.food.y + 0.5) * CELL);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = "#ff4040";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ff4d4d";
      rr(ctx, -7, -6, 14, 13, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#7dff9a";
      ctx.fillRect(-1, -9, 2, 4);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(-4, -4, 3, 3);
      ctx.restore();
    }

    // bonus diamond with timer ring
    if (e.bonus && (e.bonus.ttl > 2200 || Math.floor(now / 120) % 2 === 0)) {
      const cx = (e.bonus.x + 0.5) * CELL;
      const cy = (e.bonus.y + 0.5) * CELL;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = "#ffd23f";
      ctx.shadowBlur = 14;
      ctx.rotate(now / 400);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,210,63,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        12,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * (e.bonus.ttl / e.bonus.max),
      );
      ctx.stroke();
    }

    // snake, tweened between the previous and current step
    ctx.shadowColor = "rgba(90,255,150,0.6)";
    ctx.shadowBlur = 8;
    for (let i = e.snake.length - 1; i >= 0; i--) {
      const cur = e.snake[i];
      const p = e.prev[i] ?? cur;
      let dx = cur.x - p.x;
      let dy = cur.y - p.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        dx = 0;
        dy = 0; // wrapped around an edge: no tween
      }
      const px = (cur.x - dx * (1 - t)) * CELL;
      const py = (cur.y - dy * (1 - t)) * CELL;
      ctx.fillStyle =
        i === 0
          ? e.alive
            ? "#c9ffd9"
            : "#ff6b6b"
          : `hsl(${140 - i * 0.8},85%,${Math.max(28, 52 - i * 0.9)}%)`;
      rr(ctx, px + 1.5, py + 1.5, CELL - 3, CELL - 3, 5);
      ctx.fill();
      if (i === 0) {
        ctx.shadowBlur = 0;
        const fx = DX[e.dir];
        const fy = DY[e.dir];
        const cx = px + CELL / 2;
        const cy = py + CELL / 2;
        ctx.fillStyle = "#04100a";
        for (const s of [-1, 1])
          ctx.fillRect(
            cx + fx * 3 + -fy * s * 4 - 1.5,
            cy + fy * 3 + fx * s * 4 - 1.5,
            3,
            3,
          );
        ctx.shadowBlur = 8;
      }
    }
    ctx.shadowBlur = 0;

    drawParticles(ctx, this.particles);
    ctx.restore();

    if (e.comboActive && !this.dead) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffd23f";
      ctx.shadowColor = "rgba(255,210,63,0.8)";
      ctx.shadowBlur = 10;
      ctx.font = "bold 20px monospace";
      ctx.fillText(`COMBO x${e.combo}`, SIZE - 10, 26);
      ctx.shadowBlur = 0;
    }

    if (this.banner > 0) {
      ctx.globalAlpha = Math.min(1, this.banner / 300);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, SIZE / 2 - 56, SIZE, 112);
      ctx.textAlign = "center";
      ctx.shadowColor = "#4dff88";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#9dffbd";
      ctx.font = "bold 44px monospace";
      ctx.fillText(this.bannerText, SIZE / 2, SIZE / 2 + 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#c9ffd9";
      ctx.font = "bold 16px monospace";
      ctx.fillText(this.bannerSub, SIZE / 2, SIZE / 2 + 34);
      ctx.globalAlpha = 1;
    }
  }
}

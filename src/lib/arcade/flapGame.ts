import { blip } from "@/lib/snakeSfx";
import {
  MULT,
  type Difficulty,
  type GameInstance,
  type HudItem,
} from "./types";
import { clamp } from "./util";

const W = 360;
const H = 540;
export const FLAP_DIM = { width: W, height: H } as const;

const GROUND = 64;
const BIRD_X = 96;
const R = 13;
const PW = 62;
const SPACING = 205;
const GRAV = 1450;
const FLAP_V = -400;
const MAX_FALL = 580;
const CFG: Record<Difficulty, { gap: number; speed: number }> = {
  easy: { gap: 190, speed: 125 },
  normal: { gap: 165, speed: 145 },
  hard: { gap: 145, speed: 170 },
  insane: { gap: 125, speed: 200 },
};
const SKIES = [
  ["#4ec0ff", "#bfeaff"],
  ["#ff9a5a", "#ffe0a8"],
  ["#2b2f77", "#7a5fb5"],
];

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
  coin: boolean;
}

export class FlapGame implements GameInstance {
  readonly width = W;
  readonly height = H;
  finished = false;
  score = 0;
  level = 1;

  private cfg: { gap: number; speed: number };
  private mult: number;
  private state: "ready" | "play" | "dead" = "ready";
  private birdY = H / 2 - 40;
  private vy = 0;
  private pipes: Pipe[] = [];
  private passed = 0;
  private coins = 0;
  private groundX = 0;
  private clouds = Array.from({ length: 5 }, (_, i) => ({
    x: i * 80,
    y: 40 + ((i * 67) % 200),
    s: 0.7 + (i % 3) * 0.3,
  }));
  private deadTimer = 0;
  private shake = 0;
  private held = false;
  private t = 0;

  constructor(mode: Difficulty) {
    this.cfg = CFG[mode];
    this.mult = MULT[mode];
  }

  private get speed() {
    return this.cfg.speed * Math.min(1.5, 1 + 0.04 * (this.level - 1));
  }

  hud(): HudItem[] {
    return [
      { label: "Score", value: this.score, color: "#ffd23f" },
      { label: "Level", value: this.level, color: "#5eeaff" },
      { label: "Coins", value: this.coins, color: "#ff9a4d" },
    ];
  }

  private flap() {
    if (this.state === "ready") {
      this.state = "play";
      this.vy = FLAP_V;
      blip(520, 0.06, "square", 0.05, 760);
    } else if (this.state === "play") {
      this.vy = FLAP_V;
      blip(520, 0.06, "square", 0.05, 760);
    }
  }

  key(code: string, down: boolean) {
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
      if (down && !this.held) this.flap();
      this.held = down;
    }
  }
  tap() {
    this.flap();
  }

  private die() {
    this.state = "dead";
    this.vy = -200;
    this.deadTimer = 1000;
    this.shake = 1;
    blip(160, 0.5, "sawtooth", 0.07, 45);
  }

  update(dt: number) {
    if (this.finished) return;
    const s = dt / 1000;
    this.t += dt;
    const spd = this.speed;

    if (this.state !== "dead") this.groundX = (this.groundX + spd * s) % 24;
    for (const c of this.clouds) {
      c.x -= spd * 0.2 * s * c.s;
      if (c.x < -80) c.x += W + 160;
    }

    if (this.state === "ready") {
      this.birdY = H / 2 - 40 + Math.sin(this.t / 220) * 8;
      return;
    }

    if (this.state === "play") {
      this.vy = Math.min(MAX_FALL, this.vy + GRAV * s);
      this.birdY += this.vy * s;
      if (this.birdY < R) {
        this.birdY = R;
        this.vy = 0;
      }
      for (const p of this.pipes) p.x -= spd * s;
      this.pipes = this.pipes.filter((p) => p.x > -PW - 10);
      const last = this.pipes[this.pipes.length - 1];
      if (!last || last.x <= W - SPACING + 10) {
        const gap = this.cfg.gap;
        const lo = 90 + gap / 2;
        const hi = H - GROUND - 90 - gap / 2;
        this.pipes.push({
          x: last ? last.x + SPACING : W + 60,
          gapY: lo + Math.random() * (hi - lo),
          passed: false,
          coin: Math.random() < 0.4,
        });
      }

      if (this.birdY + R >= H - GROUND) {
        this.birdY = H - GROUND - R;
        this.die();
        return;
      }
      for (const p of this.pipes) {
        if (BIRD_X + R - 3 > p.x && BIRD_X - R + 3 < p.x + PW) {
          if (
            this.birdY - R + 3 < p.gapY - this.cfg.gap / 2 ||
            this.birdY + R - 3 > p.gapY + this.cfg.gap / 2
          ) {
            this.die();
            return;
          }
        }
        if (!p.passed && p.x + PW < BIRD_X - R) {
          p.passed = true;
          this.passed++;
          this.score += Math.round(10 * this.mult);
          this.level = 1 + Math.floor(this.passed / 5);
          blip(660, 0.06);
        }
        if (
          p.coin &&
          Math.hypot(BIRD_X - (p.x + PW / 2), this.birdY - p.gapY) < R + 9
        ) {
          p.coin = false;
          this.coins++;
          this.score += Math.round(25 * this.mult);
          blip(1200, 0.08, "triangle", 0.06);
        }
      }
      return;
    }

    // dead: fall to the ground
    this.vy += GRAV * s;
    this.birdY += this.vy * s;
    if (this.birdY >= H - GROUND - R) {
      this.birdY = H - GROUND - R;
      this.vy = 0;
    }
    this.deadTimer -= dt;
    this.shake = Math.max(0, this.shake - dt / 700);
    if (this.deadTimer <= 0) this.finished = true;
  }

  draw(ctx: CanvasRenderingContext2D, now: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sky = SKIES[(this.level - 1) % SKIES.length];
    const g = ctx.createLinearGradient(0, 0, 0, H - GROUND);
    g.addColorStop(0, sky[0]);
    g.addColorStop(1, sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (this.shake > 0)
      ctx.translate(
        (Math.random() - 0.5) * 10 * this.shake,
        (Math.random() - 0.5) * 10 * this.shake,
      );

    // clouds
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (const c of this.clouds) {
      const r = 16 * c.s;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.arc(c.x + r * 1.1, c.y + 3, r * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x - r * 1.1, c.y + 4, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // pipes
    const gap = this.cfg.gap;
    for (const p of this.pipes) {
      const top = p.gapY - gap / 2;
      const bot = p.gapY + gap / 2;
      ctx.fillStyle = "#3fbf55";
      ctx.fillRect(p.x, 0, PW, top - 24);
      ctx.fillRect(p.x, bot + 24, PW, H - GROUND - bot - 24);
      ctx.fillRect(p.x - 4, top - 24, PW + 8, 24);
      ctx.fillRect(p.x - 4, bot, PW + 8, 24);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(p.x + 6, 0, 8, top - 24);
      ctx.fillRect(p.x + 6, bot + 24, 8, H - GROUND - bot - 24);
      ctx.strokeStyle = "#1f6b30";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, -2, PW, top - 22);
      ctx.strokeRect(p.x - 4, top - 24, PW + 8, 24);
      ctx.strokeRect(p.x - 4, bot, PW + 8, 24);
      ctx.strokeRect(p.x, bot + 24, PW, H - GROUND - bot - 22);
      if (p.coin) {
        const cx = p.x + PW / 2;
        const sq = Math.abs(Math.cos(now / 220));
        ctx.fillStyle = "#ffd23f";
        ctx.shadowColor = "#ffd23f";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(cx, p.gapY, 9 * (0.3 + 0.7 * sq), 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // ground
    ctx.fillStyle = "#d9b56a";
    ctx.fillRect(0, H - GROUND, W, GROUND);
    ctx.fillStyle = "#6ccf4f";
    ctx.fillRect(0, H - GROUND, W, 12);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let x = -24 - this.groundX; x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, H - GROUND + 12);
      ctx.lineTo(x + 12, H - GROUND + 12);
      ctx.lineTo(x + 24, H - GROUND + 24);
      ctx.lineTo(x + 12, H - GROUND + 24);
      ctx.closePath();
      ctx.fill();
    }

    // bird
    ctx.save();
    ctx.translate(BIRD_X, this.birdY);
    ctx.rotate(clamp(this.vy / 700, -0.5, 1.1));
    ctx.fillStyle = "#ffd23f";
    ctx.strokeStyle = "#c98a00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3b0";
    ctx.beginPath();
    ctx.ellipse(
      -3,
      3 + Math.sin(now / 70) * (this.state === "dead" ? 0 : 2),
      7,
      4,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(7.5, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff7a2a";
    ctx.beginPath();
    ctx.moveTo(R - 2, -1);
    ctx.lineTo(R + 8, 2);
    ctx.lineTo(R - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // score + hint
    ctx.textAlign = "center";
    ctx.font = "bold 44px monospace";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(String(this.score), W / 2, 72);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(this.score), W / 2, 72);
    if (this.state === "ready") {
      ctx.font = "bold 16px monospace";
      ctx.fillStyle =
        Math.floor(now / 500) % 2 ? "#ffffff" : "rgba(255,255,255,0.6)";
      ctx.strokeText("TAP / SPACE TO FLAP", W / 2, H / 2 + 60);
      ctx.fillText("TAP / SPACE TO FLAP", W / 2, H / 2 + 60);
    }
  }
}

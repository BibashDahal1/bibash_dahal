"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  DX,
  DY,
  GRID,
  SnakeEngine,
  type Difficulty,
  type Dir,
} from "@/lib/snakeEngine";
import { blip, fanfare } from "@/lib/snakeSfx";
import { useGameStore } from "@/store/useGameStore";

const CELL = 20;
const SIZE = GRID * CELL;

type Screen = "menu" | "playing" | "paused" | "over";

interface ScoreRow {
  name: string;
  score: number;
  level: number;
  difficulty: string;
}
interface ApiResult {
  top: ScoreRow[];
  best: number;
  rank: number;
  isNewBest: boolean;
  inTop10: boolean;
}
type RunResult =
  | { status: "none" }
  | { status: "saving" }
  | { status: "error" }
  | ({ status: "done" } & ApiResult);

interface Hud {
  score: number;
  level: number;
  eaten: number;
  target: number;
  combo: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
interface Fx {
  acc: number;
  banner: number;
  bannerText: string;
  bannerSub: string;
  shake: number;
  dead: boolean;
  deadTimer: number;
  particles: Particle[];
}

const newFx = (): Fx => ({
  acc: 0,
  banner: 0,
  bannerText: "",
  bannerSub: "",
  shake: 0,
  dead: false,
  deadTimer: 0,
  particles: [],
});

const snapshot = (e: SnakeEngine): Hud => ({
  score: e.score,
  level: e.level,
  eaten: e.eatenThisLevel,
  target: e.target,
  combo: e.comboActive ? e.combo : 1,
});

async function postScore(
  name: string,
  score: number,
  level: number,
  difficulty: Difficulty,
): Promise<ApiResult> {
  const r = await fetch("/api/snake/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score, level, difficulty }),
    keepalive: true,
  });
  if (!r.ok) throw new Error("save failed");
  return r.json();
}

// ------------------------------------------------------------------ drawing
function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  e: SnakeEngine | null,
  t: number,
  now: number,
  fx: Fx,
  wrap: boolean,
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#04100a";
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.save();
  if (fx.shake > 0)
    ctx.translate(
      (Math.random() - 0.5) * 10 * fx.shake,
      (Math.random() - 0.5) * 10 * fx.shake,
    );

  // grid
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

  // border: solid green = deadly walls, dashed blue = wrap-around
  ctx.lineWidth = 3;
  ctx.strokeStyle = wrap ? "rgba(90,200,255,0.55)" : "rgba(90,255,150,0.7)";
  if (wrap) ctx.setLineDash([6, 6]);
  ctx.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
  ctx.setLineDash([]);

  if (e) {
    // obstacles
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

    // food (apple)
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

    // bonus (gold diamond with a timer ring)
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

    // snake (smoothly interpolated between the previous and current step)
    const n = e.snake.length;
    ctx.shadowColor = "rgba(90,255,150,0.6)";
    ctx.shadowBlur = 8;
    for (let i = n - 1; i >= 0; i--) {
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
        const fxv = DX[e.dir];
        const fyv = DY[e.dir];
        const sx = -fyv;
        const sy = fxv;
        const cx = px + CELL / 2;
        const cy = py + CELL / 2;
        ctx.fillStyle = "#04100a";
        for (const s of [-1, 1]) {
          ctx.fillRect(
            cx + fxv * 3 + sx * s * 4 - 1.5,
            cy + fyv * 3 + sy * s * 4 - 1.5,
            3,
            3,
          );
        }
        ctx.shadowBlur = 8;
      }
    }
    ctx.shadowBlur = 0;
  }

  // particles
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // level banner
  if (fx.banner > 0) {
    const a = Math.min(1, fx.banner / 300);
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, SIZE / 2 - 56, SIZE, 112);
    ctx.textAlign = "center";
    ctx.shadowColor = "#4dff88";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#9dffbd";
    ctx.font = "bold 44px monospace";
    ctx.fillText(fx.bannerText, SIZE / 2, SIZE / 2 + 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#c9ffd9";
    ctx.font = "bold 16px monospace";
    ctx.fillText(fx.bannerSub, SIZE / 2, SIZE / 2 + 34);
    ctx.globalAlpha = 1;
  }
}

// ------------------------------------------------------------------ leaderboard
function Leaderboard({
  rows,
  state,
  me,
  mine,
  fresh,
}: {
  rows: ScoreRow[];
  state: "loading" | "ready" | "error";
  me: string;
  mine: { best: number; rank: number } | null;
  fresh: boolean;
}) {
  const mineLower = me.toLowerCase();
  return (
    <div className="w-full max-w-[560px] rounded-2xl border-4 border-[#2b2b33] bg-gradient-to-b from-[#1b1b22] to-[#0d0d12] p-4 font-mono shadow-[0_0_40px_rgba(255,210,63,0.08)] lg:w-80">
      <h3 className="text-center text-sm font-bold uppercase tracking-[0.3em] text-[#ffd23f]">
        Top 10
      </h3>
      <div className="mt-3 space-y-1">
        {state === "loading" && (
          <p className="py-6 text-center text-xs text-[#7dff9a]/70">LOADING…</p>
        )}
        {state === "error" && (
          <p className="py-6 text-center text-xs text-[#ff8a8a]">
            SCORE BOARD OFFLINE
          </p>
        )}
        {state === "ready" && rows.length === 0 && (
          <p className="py-6 text-center text-xs text-[#7dff9a]/70">
            NO SCORES YET. BE THE FIRST!
          </p>
        )}
        {rows.map((r, i) => {
          const isMe = r.name.toLowerCase() === mineLower;
          const diff =
            DIFFICULTIES[r.difficulty as Difficulty]?.label ?? r.difficulty;
          return (
            <div
              key={`${r.name}-${i}`}
              className={`flex items-center gap-2 rounded px-2 py-1 text-xs uppercase ${
                isMe
                  ? `bg-[#7dff9a]/15 text-[#c9ffd9] ${fresh ? "animate-pulse" : ""}`
                  : "text-[#cfd8d2]"
              }`}
            >
              <span
                className={`w-6 text-right ${i < 3 ? "text-[#ffd23f]" : "text-[#7a8a80]"}`}
              >
                {i + 1}.
              </span>
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="tabular-nums text-[#ffd23f]">{r.score}</span>
              <span className="w-14 text-right text-[10px] text-[#7a8a80]">
                L{r.level} {diff.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
      {mine && mine.best > 0 && mine.rank > 10 && (
        <div className="mt-3 rounded border border-[#7dff9a]/30 px-2 py-1.5 text-center text-[11px] uppercase text-[#c9ffd9]">
          Your best: {mine.best} (#{mine.rank})
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the arcade
export default function SnakeArcade({ onClose }: { onClose: () => void }) {
  const name = useGameStore((s) => s.name);

  const [screen, setScreen] = useState<Screen>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [hud, setHud] = useState<Hud>({
    score: 0,
    level: 1,
    eaten: 0,
    target: 6,
    combo: 1,
  });
  const [top, setTop] = useState<ScoreRow[]>([]);
  const [mine, setMine] = useState<{ best: number; rank: number } | null>(null);
  const [board, setBoard] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<RunResult | null>(null);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SnakeEngine | null>(null);
  const fxRef = useRef<Fx>(newFx());
  const hudKey = useRef("");
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // load the leaderboard (and this player's best)
  useEffect(() => {
    let live = true;
    fetch(`/api/snake/scores?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { top: ScoreRow[]; best: number; rank: number }) => {
        if (!live) return;
        setTop(d.top);
        setMine({ best: d.best, rank: d.rank });
        setBoard("ready");
      })
      .catch(() => live && setBoard("error"));
    return () => {
      live = false;
    };
  }, [name]);

  const startGame = useCallback((d: Difficulty) => {
    const e = new SnakeEngine(d);
    engineRef.current = e;
    fxRef.current = newFx();
    hudKey.current = "";
    setDifficulty(d);
    setResult(null);
    setHud(snapshot(e));
    setScreen("playing");
    blip(520, 0.06);
  }, []);

  const finishRun = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    setScreen("over");
    setHud(snapshot(e));
    blip(160, 0.5, "sawtooth", 0.07, 45);
    if (e.score <= 0) {
      setResult({ status: "none" });
      return;
    }
    setResult({ status: "saving" });
    postScore(name, e.score, e.level, e.difficulty)
      .then((d) => {
        setTop(d.top);
        setMine({ best: d.best, rank: d.rank });
        setBoard("ready");
        setResult({ status: "done", ...d });
        if (d.inTop10) fanfare();
      })
      .catch(() => setResult({ status: "error" }));
  }, [name]);

  const exit = useCallback(() => {
    const e = engineRef.current;
    // leaving mid-run still saves the score
    if ((screen === "playing" || screen === "paused") && e && e.score > 0) {
      postScore(name, e.score, e.level, e.difficulty).catch(() => {});
    }
    onClose();
  }, [screen, name, onClose]);

  // keyboard
  useEffect(() => {
    const dirs: Record<string, Dir> = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();
      if (dirs[k]) {
        ev.preventDefault();
        if (screen === "playing") engineRef.current?.turn(dirs[k]);
        return;
      }
      if (k === "escape") {
        ev.preventDefault();
        if (screen === "playing") setScreen("paused");
        else if (screen === "paused") setScreen("playing");
        else exit();
        return;
      }
      if (k === "p" || k === " " || k === "enter") {
        ev.preventDefault();
        if (screen === "playing" && k !== "enter") setScreen("paused");
        else if (screen === "paused") setScreen("playing");
        else if (screen === "menu" || screen === "over") startGame(difficulty);
        return;
      }
      if ((screen === "menu" || screen === "over") && k >= "1" && k <= "4") {
        ev.preventDefault();
        startGame(DIFFICULTY_ORDER[Number(k) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, difficulty, startGame, exit]);

  // static frame when not playing (menu / paused / game over)
  useEffect(() => {
    if (screen === "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const e = engineRef.current;
    const wrap = DIFFICULTIES[difficulty].wrap;
    drawScene(
      ctx,
      screen === "menu" ? null : e,
      1,
      performance.now(),
      screen === "menu" ? newFx() : fxRef.current,
      wrap,
    );
  }, [screen, difficulty]);

  // the game loop
  useEffect(() => {
    if (screen !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    const e = engineRef.current;
    if (!ctx || !e) return;

    let raf = 0;
    let last = performance.now();

    const syncHud = () => {
      const s = snapshot(e);
      const key = `${s.score}|${s.level}|${s.eaten}|${s.combo}`;
      if (key !== hudKey.current) {
        hudKey.current = key;
        setHud(s);
      }
    };
    const burst = (cx: number, cy: number, color: string) => {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1 + Math.random() * 3;
        fxRef.current.particles.push({
          x: (cx + 0.5) * CELL,
          y: (cy + 0.5) * CELL,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          color,
        });
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const fx = fxRef.current;

      if (!fx.dead) {
        if (fx.banner > 0) {
          fx.banner -= dt;
        } else {
          e.update(dt);
          fx.acc += dt;
          let guard = 0;
          while (fx.acc >= e.tick && guard++ < 4) {
            fx.acc -= e.tick;
            const events = e.step();
            let stop = false;
            for (const ev of events) {
              if (ev.type === "ate") {
                burst(ev.at.x, ev.at.y, "#ff5a5a");
                blip(520 + e.combo * 90, 0.07);
              } else if (ev.type === "bonus") {
                burst(ev.at.x, ev.at.y, "#ffd23f");
                blip(880, 0.18, "triangle", 0.06, 1320);
              } else if (ev.type === "levelup") {
                fx.banner = 1300;
                fx.bannerText = `LEVEL ${ev.level}`;
                fx.bannerSub = `FASTER${e.obstacles.length ? ` • ${e.obstacles.length} BLOCKS` : ""}`;
                fx.acc = 0;
                fanfare();
                stop = true;
              } else if (ev.type === "dead") {
                fx.dead = true;
                fx.deadTimer = 900;
                fx.shake = 1;
                stop = true;
              }
            }
            if (stop) break;
          }
        }
      } else {
        fx.deadTimer -= dt;
        fx.shake = Math.max(0, fx.shake - dt / 700);
        if (fx.deadTimer <= 0) {
          finishRun();
          return;
        }
      }

      for (const p of fx.particles) {
        p.x += (p.vx * dt) / 16;
        p.y += (p.vy * dt) / 16;
        p.life -= dt / 600;
      }
      fx.particles = fx.particles.filter((p) => p.life > 0);

      syncHud();
      const t = fx.dead || fx.banner > 0 ? 1 : Math.min(1, fx.acc / e.tick);
      drawScene(ctx, e, t, now, fx, e.cfg.wrap);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [screen, finishRun]);

  // swipe + d-pad
  const turn = (d: Dir) => {
    if (screen === "playing") engineRef.current?.turn(d);
  };
  const onPointerDown = (ev: React.PointerEvent) => {
    swipe.current = { x: ev.clientX, y: ev.clientY };
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = ev.clientX - s.x;
    const dy = ev.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  };

  const cfg = DIFFICULTIES[difficulty];
  const myBest = mine?.best ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-label="Snake arcade"
    >
      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-4 p-3 sm:p-6 lg:flex-row lg:items-start">
        {/* cabinet */}
        <div className="w-full max-w-[560px] rounded-2xl border-4 border-[#2b2b33] bg-gradient-to-b from-[#1b1b22] to-[#0d0d12] p-3 font-mono shadow-[0_0_60px_rgba(80,255,140,0.14)]">
          <div className="mb-2 flex items-center justify-between">
            <h2
              className="text-lg font-bold uppercase tracking-[0.35em] text-[#7dff9a]"
              style={{ textShadow: "0 0 12px rgba(80,255,140,0.7)" }}
            >
              Snake
            </h2>
            <div className="flex gap-2">
              {(screen === "playing" || screen === "paused") && (
                <button
                  type="button"
                  onClick={() =>
                    setScreen(screen === "playing" ? "paused" : "playing")
                  }
                  className="rounded border border-white/20 px-3 py-1 text-[11px] uppercase tracking-widest text-[#e8dfc9] transition hover:border-[#7dff9a]"
                >
                  {screen === "playing" ? "Pause" : "Resume"}
                </button>
              )}
              <button
                type="button"
                onClick={exit}
                className="rounded bg-[#d4af37] px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-black transition hover:bg-[#ffe08a]"
              >
                Exit
              </button>
            </div>
          </div>

          {/* HUD */}
          <div className="mb-2 grid grid-cols-4 gap-1 text-center text-[10px] uppercase tracking-widest text-[#7a8a80]">
            <div className="rounded bg-black/50 py-1">
              Score
              <div className="text-sm tabular-nums text-[#ffd23f]">
                {hud.score}
              </div>
            </div>
            <div className="rounded bg-black/50 py-1">
              Level
              <div className="text-sm tabular-nums text-[#7dff9a]">
                {hud.level}
              </div>
            </div>
            <div className="rounded bg-black/50 py-1">
              Apples
              <div className="text-sm tabular-nums text-[#ff7a7a]">
                {hud.eaten}/{hud.target}
              </div>
            </div>
            <div className="rounded bg-black/50 py-1">
              Best
              <div className="text-sm tabular-nums text-[#c9ffd9]">
                {Math.max(myBest, hud.score)}
              </div>
            </div>
          </div>

          {/* screen */}
          <div
            className="relative mx-auto aspect-square w-full touch-none select-none overflow-hidden rounded-lg border-2 border-[#1d3b2a] bg-[#04100a]"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              className="block h-full w-full"
            />
            {/* scanlines */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)",
              }}
            />
            {hud.combo > 1 && screen === "playing" && (
              <div
                className="pointer-events-none absolute right-2 top-2 text-xl font-bold text-[#ffd23f]"
                style={{ textShadow: "0 0 10px rgba(255,210,63,0.8)" }}
              >
                COMBO x{hud.combo}
              </div>
            )}

            {screen === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center">
                <p
                  className="text-3xl font-bold uppercase tracking-[0.3em] text-[#7dff9a]"
                  style={{ textShadow: "0 0 18px rgba(80,255,140,0.8)" }}
                >
                  Snake
                </p>
                <p className="text-[11px] uppercase tracking-widest text-[#c9ffd9]">
                  Player: {name || "Guest"} • Best: {myBest}
                </p>
                <div className="mt-2 grid w-full max-w-xs gap-2">
                  {DIFFICULTY_ORDER.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => startGame(d)}
                      className="rounded border border-[#7dff9a]/40 bg-black/40 px-3 py-2 text-left transition hover:border-[#7dff9a] hover:bg-[#7dff9a]/10 active:scale-[0.98]"
                    >
                      <span className="flex items-center justify-between text-sm font-bold uppercase text-[#7dff9a]">
                        <span>
                          {i + 1}. {DIFFICULTIES[d].label}
                        </span>
                        <span className="text-[10px] text-[#ffd23f]">
                          x{DIFFICULTIES[d].mult} SCORE
                        </span>
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8fa398]">
                        {DIFFICULTIES[d].blurb}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[#6c7d73]">
                  Arrows / WASD or swipe • P pause • Esc exit
                </p>
              </div>
            )}

            {screen === "paused" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4 text-center">
                <p className="text-2xl font-bold uppercase tracking-[0.3em] text-[#ffd23f]">
                  Paused
                </p>
                <button
                  type="button"
                  onClick={() => setScreen("playing")}
                  className="w-48 rounded bg-[#7dff9a] px-4 py-2 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-[#c9ffd9]"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={finishRun}
                  className="w-48 rounded border border-white/25 px-4 py-2 text-xs uppercase tracking-widest text-[#e8dfc9] transition hover:border-[#ff7a7a]"
                >
                  End run &amp; save
                </button>
              </div>
            )}

            {screen === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 p-4 text-center">
                <p
                  className="text-3xl font-bold uppercase tracking-[0.25em] text-[#ff6b6b]"
                  style={{ textShadow: "0 0 16px rgba(255,80,80,0.7)" }}
                >
                  Game Over
                </p>
                <p className="text-sm uppercase tracking-widest text-[#c9ffd9]">
                  Score <span className="text-[#ffd23f]">{hud.score}</span> •
                  Level {hud.level} • {cfg.label}
                </p>
                <div className="min-h-10 text-xs uppercase tracking-widest">
                  {result?.status === "saving" && (
                    <span className="text-[#7dff9a]/80">Saving score…</span>
                  )}
                  {result?.status === "error" && (
                    <span className="text-[#ff8a8a]">
                      Couldn&apos;t reach the score board. Score not saved.
                    </span>
                  )}
                  {result?.status === "none" && (
                    <span className="text-[#8fa398]">
                      Eat an apple next time!
                    </span>
                  )}
                  {result?.status === "done" && (
                    <span className="flex flex-col gap-0.5">
                      {result.inTop10 && (
                        <span className="text-[#ffd23f]">
                          You&apos;re #{result.rank} in the Top 10!
                        </span>
                      )}
                      {result.isNewBest ? (
                        <span className="text-[#7dff9a]">
                          New personal best!
                        </span>
                      ) : (
                        <span className="text-[#8fa398]">
                          Your best: {result.best}
                        </span>
                      )}
                      {!result.inTop10 && (
                        <span className="text-[#8fa398]">
                          Rank #{result.rank}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-1 grid w-full max-w-xs gap-2">
                  <button
                    type="button"
                    onClick={() => startGame(difficulty)}
                    className="rounded bg-[#7dff9a] px-4 py-2 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-[#c9ffd9]"
                  >
                    Play again
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen("menu")}
                    className="rounded border border-white/25 px-4 py-2 text-xs uppercase tracking-widest text-[#e8dfc9] transition hover:border-[#7dff9a]"
                  >
                    Change difficulty
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* touch d-pad */}
          {isTouch && (
            <div className="mx-auto mt-3 grid w-40 grid-cols-3 gap-1">
              {(
                [
                  [null, "up", null],
                  ["left", null, "right"],
                  [null, "down", null],
                ] as const
              )
                .flat()
                .map((d, i) =>
                  d ? (
                    <button
                      key={i}
                      type="button"
                      onPointerDown={(ev) => {
                        ev.preventDefault();
                        turn(d);
                      }}
                      aria-label={d}
                      className="h-12 rounded-lg border border-[#7dff9a]/40 bg-black/50 text-lg text-[#7dff9a] active:bg-[#7dff9a]/20"
                    >
                      {d === "up"
                        ? "▲"
                        : d === "down"
                          ? "▼"
                          : d === "left"
                            ? "◀"
                            : "▶"}
                    </button>
                  ) : (
                    <span key={i} />
                  ),
                )}
            </div>
          )}

          <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-[#6c7d73]">
            {cfg.wrap
              ? "Blue dashed border: walls wrap around"
              : "Green border: walls are deadly"}{" "}
            • Gold diamond = bonus
          </p>
        </div>

        <Leaderboard
          rows={top}
          state={board}
          me={name}
          mine={mine}
          fresh={result?.status === "done" && result.inTop10}
        />
      </div>
    </div>
  );
}

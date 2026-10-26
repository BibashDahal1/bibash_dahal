"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArcadeGameId } from "@/constants/arcade";
import { GAMES } from "@/lib/arcade/registry";
import { MULT, type GameInstance, type HudItem } from "@/lib/arcade/types";
import {
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  type Difficulty,
} from "@/lib/snakeEngine";
import { blip, fanfare } from "@/lib/snakeSfx";
import { useGameStore } from "@/store/useGameStore";

type Screen = "menu" | "playing" | "paused" | "over";

interface ScoreRow {
  name: string;
  score: number;
  level: number;
  mode: string;
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

/** keys that belong to the game while it is running (the page must not scroll or act on them) */
const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyN",
  "KeyH",
  "ShiftLeft",
  "ShiftRight",
  "Backspace",
  "Delete",
  ...Array.from({ length: 9 }, (_, i) => `Digit${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `Numpad${i + 1}`),
]);

async function postScore(
  game: ArcadeGameId,
  name: string,
  score: number,
  level: number,
  mode: Difficulty,
): Promise<ApiResult> {
  const r = await fetch("/api/arcade/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game, name, score, level, mode }),
    keepalive: true,
  });
  if (!r.ok) throw new Error("save failed");
  return r.json();
}

function Leaderboard({
  title,
  color,
  rows,
  state,
  me,
  mine,
  fresh,
}: {
  title: string;
  color: string;
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
      <p
        className="text-center text-[10px] uppercase tracking-[0.25em]"
        style={{ color }}
      >
        {title}
      </p>
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
          const diff = DIFFICULTIES[r.mode as Difficulty]?.label ?? r.mode;
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

/** The arcade screen for any game: menu, game loop, pause, game over, score saving and the top-10 board. */
export default function ArcadeShell({
  game,
  onClose,
}: {
  game: ArcadeGameId;
  onClose: () => void;
}) {
  const def = GAMES[game];
  const name = useGameStore((s) => s.name);

  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<Difficulty>("normal");
  const [hud, setHud] = useState<HudItem[]>([]);
  const [final, setFinal] = useState({ score: 0, level: 1 });
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
  const instRef = useRef<GameInstance | null>(null);
  const modeRef = useRef<Difficulty>("normal");
  const hudKey = useRef("");
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // load this game's leaderboard (and this player's best)
  useEffect(() => {
    let live = true;
    fetch(`/api/arcade/scores?game=${game}&name=${encodeURIComponent(name)}`)
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
  }, [game, name]);

  const syncHud = useCallback((g: GameInstance) => {
    const items = g.hud();
    const key = items.map((i) => i.value).join("|");
    if (key !== hudKey.current) {
      hudKey.current = key;
      setHud(items);
    }
  }, []);

  const startGame = useCallback(
    (m: Difficulty) => {
      const g = def.create(m);
      instRef.current = g;
      modeRef.current = m;
      hudKey.current = "";
      setMode(m);
      setResult(null);
      setHud(g.hud());
      setScreen("playing");
      blip(520, 0.06);
    },
    [def],
  );

  const finishRun = useCallback(() => {
    const g = instRef.current;
    if (!g) return;
    const score = g.score;
    const level = Math.min(99, Math.max(1, g.level));
    setFinal({ score, level });
    setHud(g.hud());
    setScreen("over");
    blip(160, 0.5, "sawtooth", 0.07, 45);
    if (score <= 0) {
      setResult({ status: "none" });
      return;
    }
    setResult({ status: "saving" });
    postScore(game, name, score, level, modeRef.current)
      .then((d) => {
        setTop(d.top);
        setMine({ best: d.best, rank: d.rank });
        setBoard("ready");
        setResult({ status: "done", ...d });
        if (d.inTop10) fanfare();
      })
      .catch(() => setResult({ status: "error" }));
  }, [game, name]);

  const exit = useCallback(() => {
    const g = instRef.current;
    // leaving mid-run still saves the score
    if ((screen === "playing" || screen === "paused") && g && g.score > 0) {
      postScore(
        game,
        name,
        g.score,
        Math.min(99, Math.max(1, g.level)),
        modeRef.current,
      ).catch(() => {});
    }
    onClose();
  }, [screen, game, name, onClose]);

  // keyboard
  useEffect(() => {
    const onDown = (ev: KeyboardEvent) => {
      const code = ev.code;
      if (code === "Escape") {
        ev.preventDefault();
        if (screen === "playing") setScreen("paused");
        else if (screen === "paused") setScreen("playing");
        else exit();
        return;
      }
      if (code === "KeyP") {
        ev.preventDefault();
        if (screen === "playing") setScreen("paused");
        else if (screen === "paused") setScreen("playing");
        return;
      }
      if (screen === "menu" || screen === "over") {
        if (code === "Enter" || code === "Space") {
          ev.preventDefault();
          startGame(mode);
          return;
        }
        const m = /^(?:Digit|Numpad)([1-4])$/.exec(code);
        if (m) {
          ev.preventDefault();
          startGame(DIFFICULTY_ORDER[Number(m[1]) - 1]);
        }
        return;
      }
      if (screen === "paused") {
        if (code === "Enter" || code === "Space") {
          ev.preventDefault();
          setScreen("playing");
        }
        return;
      }
      if (GAME_KEYS.has(code)) {
        ev.preventDefault();
        if (!ev.repeat) instRef.current?.key(code, true);
      }
    };
    const onUp = (ev: KeyboardEvent) => {
      if (GAME_KEYS.has(ev.code)) instRef.current?.key(ev.code, false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [screen, mode, startGame, exit]);

  // a still frame when not playing (menu / paused / game over)
  useEffect(() => {
    if (screen === "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const g = instRef.current;
    if (screen === "menu" || !g) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#05080d";
      ctx.fillRect(0, 0, def.width, def.height);
      return;
    }
    g.draw(ctx, performance.now());
  }, [screen, def]);

  // the game loop
  useEffect(() => {
    if (screen !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    const g = instRef.current;
    if (!ctx || !g) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      g.update(dt, now);
      g.draw(ctx, now);
      syncHud(g);
      if (g.finished) {
        finishRun();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [screen, finishRun, syncHud]);

  // pointer: press (select), follow (paddle), swipe, tap
  const norm = (ev: React.PointerEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return null;
    return {
      nx: (ev.clientX - r.left) / r.width,
      ny: (ev.clientY - r.top) / r.height,
    };
  };
  const onPointerDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (screen !== "playing") return;
    swipe.current = { x: ev.clientX, y: ev.clientY };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    const p = norm(ev);
    if (p) {
      instRef.current?.pointer?.(p.nx, p.ny);
      instRef.current?.press?.(p.nx, p.ny);
    }
  };
  const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (screen !== "playing") return;
    const p = norm(ev);
    if (p) instRef.current?.pointer?.(p.nx, p.ny);
  };
  const onPointerUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    const g = instRef.current;
    if (!s || screen !== "playing" || !g) return;
    const dx = ev.clientX - s.x;
    const dy = ev.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      g.tap?.();
      return;
    }
    if (def.swipe === false) return;
    const code =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "ArrowRight"
          : "ArrowLeft"
        : dy > 0
          ? "ArrowDown"
          : "ArrowUp";
    g.key(code, true);
    g.key(code, false);
  };

  const myBest = mine?.best ?? 0;
  const liveScore = instRef.current?.score ?? 0;
  const items = hud.length
    ? hud
    : [
        { label: "Score", value: 0 },
        { label: "Level", value: 1 },
        { label: "", value: "" },
      ];
  const showPad =
    (isTouch || def.showPad) &&
    def.touch.length > 0 &&
    (screen === "playing" || screen === "paused");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-label={`${def.title} arcade`}
    >
      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center gap-4 p-3 sm:p-6 lg:flex-row lg:items-start">
        {/* cabinet */}
        <div className="w-full max-w-[560px] rounded-2xl border-4 border-[#2b2b33] bg-gradient-to-b from-[#1b1b22] to-[#0d0d12] p-3 font-mono shadow-[0_0_60px_rgba(80,255,140,0.14)]">
          <div className="mb-2 flex items-center justify-between">
            <h2
              className="text-lg font-bold uppercase tracking-[0.3em]"
              style={{ color: def.color, textShadow: `0 0 12px ${def.color}` }}
            >
              {def.title}
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
            {items.map((it, i) => (
              <div key={i} className="rounded bg-black/50 py-1">
                {it.label || "\u00a0"}
                <div
                  className="text-sm tabular-nums"
                  style={{ color: it.color ?? "#c9ffd9" }}
                >
                  {it.value}
                </div>
              </div>
            ))}
            <div className="rounded bg-black/50 py-1">
              Best
              <div className="text-sm tabular-nums text-[#c9ffd9]">
                {Math.max(myBest, screen === "menu" ? 0 : liveScore)}
              </div>
            </div>
          </div>

          {/* screen */}
          <div
            className="relative mx-auto touch-none select-none overflow-hidden rounded-lg border-2 border-[#1d3b2a] bg-[#04100a]"
            style={{
              aspectRatio: `${def.width} / ${def.height}`,
              width: `min(100%, calc(66dvh * ${def.width} / ${def.height}))`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <canvas
              ref={canvasRef}
              width={def.width}
              height={def.height}
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

            {screen === "menu" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto bg-black/75 p-4 text-center">
                <p
                  className="text-3xl font-bold uppercase tracking-[0.25em]"
                  style={{
                    color: def.color,
                    textShadow: `0 0 18px ${def.color}`,
                  }}
                >
                  {def.title}
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
                      className="rounded border border-white/25 bg-black/40 px-3 py-2 text-left transition hover:bg-white/10 active:scale-[0.98]"
                      style={{ borderColor: `${def.color}66` }}
                    >
                      <span
                        className="flex items-center justify-between text-sm font-bold uppercase"
                        style={{ color: def.color }}
                      >
                        <span>
                          {i + 1}. {DIFFICULTIES[d].label}
                        </span>
                        <span className="text-[10px] text-[#ffd23f]">
                          x{MULT[d]} SCORE
                        </span>
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8fa398]">
                        {def.blurbs[d]}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[#6c7d73]">
                  {def.help} • P pause • Esc exit
                </p>
              </div>
            )}

            {screen === "paused" && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center ${
                  def.hideOnPause ? "bg-[#05080d]" : "bg-black/70"
                }`}
              >
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto bg-black/75 p-4 text-center">
                <p
                  className="text-3xl font-bold uppercase tracking-[0.2em] text-[#ff6b6b]"
                  style={{ textShadow: "0 0 16px rgba(255,80,80,0.7)" }}
                >
                  Game Over
                </p>
                <p className="text-sm uppercase tracking-widest text-[#c9ffd9]">
                  Score <span className="text-[#ffd23f]">{final.score}</span> •
                  Level {final.level} • {DIFFICULTIES[mode].label}
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
                      Score something next time!
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
                    onClick={() => startGame(mode)}
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

          {/* on-screen buttons (touch devices, and always for Sudoku's digit pad) */}
          {showPad && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {def.touch.map((b) => (
                <button
                  key={b.code + b.label}
                  type="button"
                  onPointerDown={(ev) => {
                    ev.preventDefault();
                    if (screen === "playing")
                      instRef.current?.key(b.code, true);
                  }}
                  onPointerUp={() => instRef.current?.key(b.code, false)}
                  onPointerLeave={() => instRef.current?.key(b.code, false)}
                  onPointerCancel={() => instRef.current?.key(b.code, false)}
                  className="h-12 min-w-12 rounded-lg border border-[#7dff9a]/40 bg-black/50 px-3 text-sm font-bold text-[#7dff9a] active:bg-[#7dff9a]/20"
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}

          <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-[#6c7d73]">
            {def.help}
          </p>
        </div>

        <Leaderboard
          title={def.title}
          color={def.color}
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

import { ARCADE_META, type ArcadeGameId } from "@/constants/arcade";
import { DIFFICULTIES } from "@/lib/snakeEngine";
import { BLOCKS_DIM, BlocksGame } from "./blocksGame";
import { BREAKOUT_DIM, BreakoutGame } from "./breakoutGame";
import { FLAP_DIM, FlapGame } from "./flapGame";
import { MERGE_DIM, MergeGame } from "./mergeGame";
import { SNAKE_DIM, SnakeGame } from "./snakeGame";
import type { GameDef } from "./types";

export const GAMES: Record<ArcadeGameId, GameDef> = {
  snake: {
    id: "snake",
    title: ARCADE_META.snake.title,
    color: ARCADE_META.snake.color,
    ...SNAKE_DIM,
    help: "Arrows / WASD or swipe",
    blurbs: {
      easy: DIFFICULTIES.easy.blurb,
      normal: DIFFICULTIES.normal.blurb,
      hard: DIFFICULTIES.hard.blurb,
      insane: DIFFICULTIES.insane.blurb,
    },
    touch: [
      { label: "◀", code: "ArrowLeft" },
      { label: "▲", code: "ArrowUp" },
      { label: "▼", code: "ArrowDown" },
      { label: "▶", code: "ArrowRight" },
    ],
    create: (m) => new SnakeGame(m),
  },
  breakout: {
    id: "breakout",
    title: ARCADE_META.breakout.title,
    color: ARCADE_META.breakout.color,
    ...BREAKOUT_DIM,
    help: "◀ ▶ or mouse / drag • Space or tap to launch",
    blurbs: {
      easy: "Wide paddle, 5 lives, slow ball.",
      normal: "3 lives, steady ball.",
      hard: "Narrow paddle, quick ball.",
      insane: "Tiny paddle, 2 lives, rocket ball.",
    },
    touch: [
      { label: "◀", code: "ArrowLeft" },
      { label: "LAUNCH", code: "Space" },
      { label: "▶", code: "ArrowRight" },
    ],
    create: (m) => new BreakoutGame(m),
  },
  blocks: {
    id: "blocks",
    title: ARCADE_META.blocks.title,
    color: ARCADE_META.blocks.color,
    ...BLOCKS_DIM,
    help: "◀ ▶ move • ▲ rotate • ▼ soft • Space drop • C hold",
    blurbs: {
      easy: "Gentle gravity. Stack away.",
      normal: "Classic speed.",
      hard: "Fast from the start.",
      insane: "Lightning gravity.",
    },
    touch: [
      { label: "◀", code: "ArrowLeft" },
      { label: "⟳", code: "ArrowUp" },
      { label: "▶", code: "ArrowRight" },
      { label: "▼", code: "ArrowDown" },
      { label: "DROP", code: "Space" },
      { label: "HOLD", code: "KeyC" },
    ],
    create: (m) => new BlocksGame(m),
  },
  flap: {
    id: "flap",
    title: ARCADE_META.flap.title,
    color: ARCADE_META.flap.color,
    ...FLAP_DIM,
    help: "Space / ▲ / tap to flap",
    blurbs: {
      easy: "Wide gaps, slow pipes.",
      normal: "Balanced.",
      hard: "Tight gaps, fast pipes.",
      insane: "Needle gaps at warp speed.",
    },
    touch: [{ label: "FLAP", code: "Space" }],
    create: (m) => new FlapGame(m),
  },
  merge: {
    id: "merge",
    title: ARCADE_META.merge.title,
    color: ARCADE_META.merge.color,
    ...MERGE_DIM,
    help: "Arrows / WASD or swipe",
    blurbs: {
      easy: "Roomy 5×5 board.",
      normal: "Classic 4×4.",
      hard: "4×4 with more 4-tiles.",
      insane: "Cramped 3×3 board.",
    },
    touch: [
      { label: "◀", code: "ArrowLeft" },
      { label: "▲", code: "ArrowUp" },
      { label: "▼", code: "ArrowDown" },
      { label: "▶", code: "ArrowRight" },
    ],
    create: (m) => new MergeGame(m),
  },
};

import type { Rect } from "./lobbyLayout";

export type ArcadeGameId = "snake" | "breakout" | "blocks" | "flap" | "sudoku";

/** Name, marquee text and neon colour of each machine. */
export const ARCADE_META: Record<
  ArcadeGameId,
  { title: string; marquee: string; color: string }
> = {
  snake: { title: "Snake", marquee: "SNAKE", color: "#7dff9a" },
  breakout: { title: "Brick Breaker", marquee: "BRICKS", color: "#ff7ad9" },
  blocks: { title: "Blocks", marquee: "BLOCKS", color: "#5eeaff" },
  flap: { title: "Sky Hop", marquee: "SKY HOP", color: "#ffd23f" },
  sudoku: { title: "Sudoku", marquee: "SUDOKU", color: "#ff9a4d" },
};

/** Left-to-right order along the wall (increasing z). Add a game here to add a cabinet. */
export const ARCADE_ORDER: ArcadeGameId[] = [
  "snake",
  "breakout",
  "blocks",
  "flap",
  "sudoku",
];

/** The row stands against the LEFT wall (x = -13) and faces +x (into the room). */
export const ARCADE_WALL_X = -12.5;
export const ARCADE_ROT = Math.PI / 2;
export const ARCADE_Z0 = 1.8; // z of the first cabinet
export const ARCADE_SPACING = 1.1; // distance between cabinets
export const ARCADE_WHERE = "against the left wall";

export const ARCADE_CABINETS = ARCADE_ORDER.map((id, i) => ({
  id,
  ...ARCADE_META[id],
  z: ARCADE_Z0 + i * ARCADE_SPACING,
}));

export const ARCADE_CENTER_Z =
  ARCADE_Z0 + ((ARCADE_ORDER.length - 1) * ARCADE_SPACING) / 2;
export const ARCADE_LENGTH = ARCADE_ORDER.length * ARCADE_SPACING + 0.6;

// ---- collision ----
const HALF_W = 0.43; // half width of a cabinet (local x)
const HALF_D = 0.47; // half depth (local z)

function footprint(x: number, z: number, rotY: number): Rect {
  const c = Math.abs(Math.cos(rotY));
  const s = Math.abs(Math.sin(rotY));
  return {
    cx: x,
    cz: z,
    hw: c * HALF_W + s * HALF_D,
    hd: s * HALF_W + c * HALF_D,
  };
}

export const ARCADE_COLLIDERS: Rect[] = ARCADE_CABINETS.map((c) =>
  footprint(ARCADE_WALL_X, c.z, ARCADE_ROT),
);

/** How far the visitor's centre is kept away from a cabinet. */
export const PLAYER_PAD = 0.32;

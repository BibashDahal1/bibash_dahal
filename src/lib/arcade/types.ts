import type { ArcadeGameId } from "@/constants/arcade";
import type { Difficulty } from "@/lib/snakeEngine";

export type { Difficulty };

/** Score multiplier per difficulty (same for every game, so boards stay comparable). */
export const MULT: Record<Difficulty, number> = {
  easy: 1,
  normal: 1.5,
  hard: 2,
  insane: 3,
};

export interface HudItem {
  label: string;
  value: string | number;
  color?: string;
}

/** What the arcade shell needs from a game. The shell owns the loop, menus, pause and score saving. */
export interface GameInstance {
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly level: number;
  /** true once the game-over animation is done */
  readonly finished: boolean;
  update(dtMs: number, now: number): void;
  draw(ctx: CanvasRenderingContext2D, now: number): void;
  /** exactly three items; the shell adds BEST as the fourth */
  hud(): HudItem[];
  /** KeyboardEvent.code, pressed (true) or released (false). Auto-repeat is filtered out. */
  key(code: string, down: boolean): void;
  /** pointer position over the screen, 0..1 (called while the pointer moves over the screen) */
  pointer?(nx: number, ny: number): void;
  /** the pointer went down on the screen at this position, 0..1 */
  press?(nx: number, ny: number): void;
  /** a tap / click on the screen with no swipe */
  tap?(): void;
}

export interface TouchButton {
  label: string;
  code: string;
}

export interface GameDef {
  id: ArcadeGameId;
  title: string;
  color: string;
  width: number;
  height: number;
  help: string;
  blurbs: Record<Difficulty, string>;
  touch: TouchButton[];
  create(mode: Difficulty): GameInstance;
  /** false: swiping on the screen does not send arrow keys (default true) */
  swipe?: boolean;
  /** true: always show the on-screen buttons, not only on touch devices */
  showPad?: boolean;
  /** true: the screen is fully covered while paused (so you can't study the board) */
  hideOnPause?: boolean;
}

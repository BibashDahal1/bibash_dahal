import type { Rect } from "./lobbyLayout";

/**
 * Where the snake arcade cabinet stands in the lobby.
 * rotY = PI/2 makes it face +x (into the room) when it stands against the LEFT wall (x = -13).
 * Move it by editing x / z (and rotY if you put it on another wall).
 */
export const ARCADE = { x: -12.5, z: 4, rotY: Math.PI / 2 } as const;

/** Used in the receptionist's dialogue. */
export const ARCADE_WHERE = "against the left wall";

/** Add this to FURNITURE_COLLIDERS in lobbyLayout.ts so visitors can't walk through the cabinet. */
export const ARCADE_COLLIDER: Rect = {
  cx: ARCADE.x,
  cz: ARCADE.z,
  hw: 0.6,
  hd: 0.5,
};

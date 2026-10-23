export const ROOM = { width: 26, depth: 30, height: 7 } as const;

export const EYE_HEIGHT = 1.65;
export const LYING_HEIGHT = 0.35;
export const MOVE_SPEED = 3.6;
export const RUN_MULTIPLIER = 1.6;
export const LOOK_SENSITIVITY = 0.0022; // radians per mouse pixel
export const WAKE_DURATION = 4.5; // seconds

// Semi-circular reception desk, close to the back wall, bulging toward the visitor (+z)
export const DESK = { z: -14, radius: 3 } as const;

// The receptionist sits INSIDE the curve of the desk, facing the visitor
export const RECEPTIONIST_SEAT_HEIGHT = 0.55;
export const RECEPTIONIST_HIPS_Z = DESK.z + 1.15;
export const RECEPTIONIST_HEAD = {
  x: 0,
  y: 1.25,
  z: RECEPTIONIST_HIPS_Z,
} as const;

// Walking inside this ring (in front of the desk) counts as "arrived"
export const ARRIVAL_RADIUS = DESK.radius + 1.6;

export const SPAWN = { x: 0, z: ROOM.depth / 2 - 4 } as const;

export const BACK_WALL_Z = -ROOM.depth / 2;

export const GOLD = "#d4af37";
export const GOLD_LIGHT = "#ffe08a";

// ---- the doors on the back wall: Office, Certificates | desk | Projects, Staff only ----
/**
 * x of each door, and which way the guide steps aside when opening it
 * (-1 = toward the left wall, 1 = toward the middle, so he never stands in front of a neighbouring door).
 */
export const DOORS = {
  office: { x: -10.2, aside: -1 },
  certificates: { x: -6.6, aside: 1 },
  projects: { x: 6.6, aside: -1 },
} as const;
export const STAFF_DOOR_X = 10.2; // decorative, never opens

export const doorX = (dest: keyof typeof DOORS) => DOORS[dest].x;

// Where the guide waits in front of a door, and the "step through" trigger
export const DOOR_STAND_Z = BACK_WALL_Z + 2.2;
export const DOOR_TRIGGER = { halfWidth: 1.5, z: BACK_WALL_Z + 2.6 } as const;

export const ROOM = { width: 26, depth: 30, height: 7 } as const;

export const EYE_HEIGHT = 1.65;
export const LYING_HEIGHT = 0.35;
export const MOVE_SPEED = 3.6;
export const RUN_MULTIPLIER = 1.6;
export const LOOK_SENSITIVITY = 0.0022; // radians per mouse pixel
export const WAKE_DURATION = 4.5; // seconds

// Desk now sits close to the back wall (wall is at z = -15)
export const DESK = { z: -14, radius: 3 } as const;

// Receptionist sits INSIDE the curve of the desk, facing the visitor (+z)
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

// Doors sit on the back wall, one on each side of the desk
export const DOOR_X = 9;
export const BACK_WALL_Z = -ROOM.depth / 2;

export const GOLD = "#d4af37";
export const GOLD_LIGHT = "#ffe08a";

// Where the guide waits in front of a door, and the "step through" trigger
export const DOOR_STAND_Z = BACK_WALL_Z + 2.2;
export const DOOR_TRIGGER = { halfWidth: 1.5, z: BACK_WALL_Z + 2.6 } as const;
export const doorX = (dest: "office" | "projects") =>
  dest === "office" ? -DOOR_X : DOOR_X;

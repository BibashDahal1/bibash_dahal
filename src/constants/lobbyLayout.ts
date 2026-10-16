export interface Rect {
  cx: number;
  cz: number;
  hw: number; // half width (x)
  hd: number; // half depth (z)
}

// Two identical lounge areas, left and right of the central walkway
export const LOUNGE_X = [-8, 8] as const;
export const SOFA_Z = [1.9, 4.5] as const; // [0] faces +z, [1] faces -z
export const TABLE_Z = 3.2;
export const SOFA_SIZE = { w: 2.2, d: 0.95 } as const;
export const SOFA_SEAT_HEIGHT = 0.56; // hip height of someone sitting on a sofa

export const PLANTS: readonly (readonly [number, number])[] = [
  [-12, -13.5],
  [12, -13.5],
  [-12, 13.5],
  [12, 13.5],
  [-5.3, -13.6],
  [5.3, -13.6],
  [-5.5, 13.6],
  [5.5, 13.6],
];

// rotY: 90° = left wall, -90° = right wall, 180° = front wall (faces into the room)
const L = { x: -12.95, rotY: Math.PI / 2 };
const R = { x: 12.95, rotY: -Math.PI / 2 };
export const WALL_ART = [
  { x: L.x, z: 3.2, rotY: L.rotY, w: 2.6, h: 1.7, seed: 1 },
  { x: L.x, z: -3.5, rotY: L.rotY, w: 1.6, h: 1.2, seed: 2 },
  { x: L.x, z: 10, rotY: L.rotY, w: 1.6, h: 1.2, seed: 3 },
  { x: R.x, z: 3.2, rotY: R.rotY, w: 2.6, h: 1.7, seed: 4 },
  { x: R.x, z: -3.5, rotY: R.rotY, w: 1.6, h: 1.2, seed: 5 },
  { x: R.x, z: 10, rotY: R.rotY, w: 1.6, h: 1.2, seed: 6 },
  { x: -6, z: 14.95, rotY: Math.PI, w: 2.2, h: 1.5, seed: 7 },
  { x: 6, z: 14.95, rotY: Math.PI, w: 2.2, h: 1.5, seed: 8 },
] as const;

export const FURNITURE_COLLIDERS: Rect[] = [
  ...LOUNGE_X.flatMap((x) => [
    ...SOFA_Z.map((z) => ({
      cx: x,
      cz: z,
      hw: SOFA_SIZE.w / 2,
      hd: SOFA_SIZE.d / 2,
    })),
    { cx: x, cz: TABLE_Z, hw: 0.6, hd: 0.35 },
  ]),
  ...PLANTS.map(([x, z]) => ({ cx: x, cz: z, hw: 0.35, hd: 0.35 })),
];

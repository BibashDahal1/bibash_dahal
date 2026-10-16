import type { PoseName } from "@/components/characters/poses";
import { LOUNGE_X, SOFA_SEAT_HEIGHT, SOFA_Z } from "./lobbyLayout";

export interface StaticNpcConfig {
  id: string;
  seed: number; // drives look AND animation timing; consecutive seeds take turns speaking
  pose: PoseName;
  position: [number, number, number];
  rotationY: number;
  seatHeight?: number;
  /** Turns the upper body (radians, + = toward the person's left, i.e. local +x). */
  bodyTurn?: number;
}

export interface WalkingNpcConfig {
  id: string;
  seed: number;
  speed: number; // m/s
  path: [number, number][]; // [x, z] waypoints, visited in a loop
}

const PI = Math.PI;

/**
 * A seat on a sofa. `offset` slides sideways along the sofa (in the sofa's own left/right).
 * Hips sit just past the cushion centre so the knees clear the front of the sofa.
 */
function onSofa(lounge: 0 | 1, sofa: 0 | 1, offset: number) {
  const dir = sofa === 0 ? 1 : -1; // sofa 1 is rotated 180°, so forward and sideways flip
  return {
    position: [
      LOUNGE_X[lounge] + offset * dir,
      0,
      SOFA_Z[sofa] + 0.02 * dir,
    ] as [number, number, number],
    rotationY: sofa === 0 ? 0 : PI,
    seatHeight: SOFA_SEAT_HEIGHT,
  };
}

export const STATIC_NPCS: StaticNpcConfig[] = [
  // ---- on the sofas ----
  // two friends chatting, turned toward each other
  {
    id: "sofa-l0a-1",
    seed: 11,
    pose: "sitTalk",
    ...onSofa(0, 0, -0.45),
    bodyTurn: 0.6,
  },
  {
    id: "sofa-l0a-2",
    seed: 12,
    pose: "sitTalk",
    ...onSofa(0, 0, 0.45),
    bodyTurn: -0.6,
  },
  // reading the paper
  { id: "sofa-l0b-1", seed: 13, pose: "sitRead", ...onSofa(0, 1, 0) },
  // looking at a phone
  { id: "sofa-r0a-1", seed: 14, pose: "sitPhone", ...onSofa(1, 0, -0.45) },
  // another pair, chatting
  {
    id: "sofa-r0b-1",
    seed: 15,
    pose: "sitTalk",
    ...onSofa(1, 1, -0.45),
    bodyTurn: 0.6,
  },
  {
    id: "sofa-r0b-2",
    seed: 16,
    pose: "sitTalk",
    ...onSofa(1, 1, 0.45),
    bodyTurn: -0.6,
  },

  // ---- standing pairs, facing each other, taking turns to talk ----
  {
    id: "pairA-1",
    seed: 21,
    pose: "talk",
    position: [-11, 0, -6.5],
    rotationY: PI / 2,
  },
  {
    id: "pairA-2",
    seed: 22,
    pose: "talk",
    position: [-10, 0, -6.5],
    rotationY: -PI / 2,
  },
  {
    id: "pairB-1",
    seed: 23,
    pose: "talk",
    position: [10, 0, -6.5],
    rotationY: PI / 2,
  },
  {
    id: "pairB-2",
    seed: 24,
    pose: "talk",
    position: [11, 0, -6.5],
    rotationY: -PI / 2,
  },
  {
    id: "pairC-1",
    seed: 25,
    pose: "talk",
    position: [-4, 0, 9.8],
    rotationY: 0,
  },
  {
    id: "pairC-2",
    seed: 26,
    pose: "talk",
    position: [-4, 0, 10.8],
    rotationY: PI,
  },

  // ---- people on their own, each doing something ----
  {
    id: "phone-1",
    seed: 31,
    pose: "phone",
    position: [11.8, 0, 11.5],
    rotationY: -PI / 2,
  },
  {
    id: "read-1",
    seed: 32,
    pose: "readPaper",
    position: [-12.0, 0, 5.8],
    rotationY: PI / 2,
  },
  {
    id: "coffee-1",
    seed: 33,
    pose: "coffee",
    position: [-12.0, 0, -0.8],
    rotationY: PI / 2,
  },
  {
    id: "case-1",
    seed: 34,
    pose: "briefcase",
    position: [3.6, 0, 6.5],
    rotationY: -1.2,
  },
  {
    id: "wait-1",
    seed: 35,
    pose: "clasped",
    position: [4.9, 0, -6.2],
    rotationY: -2.3,
  },
];

export const WALKING_NPCS: WalkingNpcConfig[] = [
  {
    id: "walk-1",
    seed: 41,
    speed: 1.1,
    path: [
      [-6.5, -3],
      [6.5, -3],
    ],
  },
  {
    id: "walk-2",
    seed: 42,
    speed: 1.0,
    path: [
      [-11.5, 8],
      [-6.5, 8],
      [-6.5, 12],
      [-11.5, 12],
    ],
  },
  {
    id: "walk-3",
    seed: 43,
    speed: 1.2,
    path: [
      [11.6, 8.5],
      [11.6, -4],
    ],
  },
];

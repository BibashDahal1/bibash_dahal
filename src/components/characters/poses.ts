import * as THREE from "three";

export type PoseName =
  | "stand"
  | "walk"
  | "clasped"
  | "briefcase"
  | "coffee"
  | "readPaper"
  | "talk"
  | "phone"
  | "sit"
  | "sitRead"
  | "sitTalk"
  | "sitPhone";

export const SEATED: readonly PoseName[] = [
  "sit",
  "sitRead",
  "sitTalk",
  "sitPhone",
];
export const isSeated = (p: PoseName) => SEATED.includes(p);

export interface ArmPose {
  shoulderX: number;
  shoulderZ: number;
  elbowX: number;
}
export interface LegPose {
  hipX: number;
  hipZ: number;
  kneeX: number;
}
export interface Pose {
  hipsY: number;
  torsoX: number;
  headX: number;
  headZ: number;
  armL: ArmPose;
  armR: ArmPose;
  legL: LegPose;
  legR: LegPose;
}

// Conventions (the character faces +z, "L" is the +x side):
//  - negative X rotation lifts an arm / thigh FORWARD, positive swings it back
//  - positive knee X folds the shin backward
//  - Z rotation moves a limb outward on the left side when positive, and inward on the right side
const arm = (
  shoulderX: number,
  shoulderZ: number,
  elbowX: number,
): ArmPose => ({ shoulderX, shoulderZ, elbowX });
const leg = (hipX: number, hipZ: number, kneeX: number): LegPose => ({
  hipX,
  hipZ,
  kneeX,
});

const BASE: Pose = {
  hipsY: 0.95,
  torsoX: 0,
  headX: 0,
  headZ: 0,
  armL: arm(0.04, 0.09, -0.25),
  armR: arm(0.04, -0.09, -0.25),
  legL: leg(0, 0.03, 0),
  legR: leg(0, -0.03, 0),
};

// Elbows tucked, forearms forward and up: hands land at the two edges of a held newspaper
const READ_ARMS = { armL: arm(-0.2, 0.22, -2.0), armR: arm(-0.2, -0.22, -2.0) };
// Seated, hands resting on the thighs
const LAP_ARMS = { armL: arm(-0.2, -0.25, -1.0), armR: arm(-0.2, 0.25, -1.0) };
// Ready to gesture (the animation adds the movement)
const TALK_ARMS = {
  armL: arm(-0.25, 0.12, -1.2),
  armR: arm(-0.3, -0.15, -1.3),
};
// Thighs forward, shins down
const SEAT_LEGS = { legL: leg(-1.5, 0.06, 1.5), legR: leg(-1.5, -0.06, 1.5) };

export const POSES: Record<PoseName, Pose> = {
  stand: BASE,
  walk: BASE, // the walk cycle is procedural, layered on top in Humanoid

  clasped: {
    ...BASE,
    armL: arm(-0.25, -0.3, -1.7),
    armR: arm(-0.25, 0.3, -1.7),
  }, // hands together in front
  briefcase: { ...BASE, armR: arm(0.02, -0.1, -0.12) },
  coffee: { ...BASE, headX: 0.03, armR: arm(-0.4, -0.1, -1.8) },
  readPaper: { ...BASE, ...READ_ARMS, headX: 0.3, torsoX: 0.03 },
  talk: { ...BASE, ...TALK_ARMS },
  phone: { ...BASE, headZ: 0.08, armR: arm(-0.45, -0.12, -2.6) },

  sit: { ...BASE, hipsY: 0.5, torsoX: -0.06, ...LAP_ARMS, ...SEAT_LEGS },
  sitRead: {
    ...BASE,
    hipsY: 0.5,
    torsoX: -0.05,
    headX: 0.28,
    ...READ_ARMS,
    ...SEAT_LEGS,
  },
  sitTalk: { ...BASE, hipsY: 0.5, torsoX: 0.02, ...TALK_ARMS, ...SEAT_LEGS },
  sitPhone: {
    ...BASE,
    hipsY: 0.5,
    torsoX: -0.04,
    headX: 0.12,
    headZ: 0.08,
    armL: arm(-0.2, -0.25, -1.0),
    armR: arm(-0.45, -0.12, -2.6),
    ...SEAT_LEGS,
  },
};

export const clonePose = (p: Pose): Pose => JSON.parse(JSON.stringify(p));

/** Smoothly moves `cur` toward `target`, in place, joint by joint. */
export function blendPose(cur: Pose, target: Pose, lambda: number, dt: number) {
  const walk = (c: any, t: any) => {
    for (const k in t) {
      if (typeof t[k] === "number")
        c[k] = THREE.MathUtils.damp(c[k], t[k], lambda, dt);
      else walk(c[k], t[k]);
    }
  };
  walk(cur, target);
}

import type { Gender } from "@/store/useGameStore";
import type { FaceType } from "./face";
import type { HairStyle } from "./hair";

export type { HairStyle };

export interface CharacterLook {
  face: FaceType; // head shape
  skin: string;
  eye: string; // iris colour
  hair: string;
  hairStyle: HairStyle;
  lipstick?: string;
  stubble?: boolean;
  top: string; // jacket / blazer
  bottom: string; // trousers
  shirt: string; // shirt or blouse, shown at the collar and cuffs
  accent: string; // tie or scarf
  shoes: string;
  shoulderWidth: number; // distance between shoulder joints
  hipWidth: number; // distance between hip joints
  height: number; // uniform scale, 1 = ~1.8 m
}

const BODY = {
  male: { shoulderWidth: 0.4, hipWidth: 0.2, height: 1.0 },
  female: { shoulderWidth: 0.34, hipWidth: 0.22, height: 0.95 },
  other: { shoulderWidth: 0.37, hipWidth: 0.21, height: 0.97 },
} as const;

const faceFor = (gender: Gender): FaceType =>
  gender === "female" ? "female" : "male";

/** Look for the visitor's own character (used later in mirrors / cutscenes). */
export function lookForGender(gender: Gender): CharacterLook {
  return {
    face: faceFor(gender),
    skin: "#e0ac84",
    eye: "#4a2c17",
    hair: "#2b1b12",
    hairStyle: gender === "female" ? "long" : "side",
    top: "#2b2b30",
    bottom: "#2b2b30",
    shirt: "#f3efe6",
    accent: "#2f4156",
    shoes: "#111111",
    ...BODY[gender],
  };
}

export const RECEPTIONIST_LOOK: CharacterLook = {
  face: "female",
  skin: "#d9a67c",
  eye: "#5a3a22",
  hair: "#241812",
  hairStyle: "bun",
  lipstick: "#a8323a",
  top: "#1c2a44", // navy blazer
  bottom: "#1c2a44",
  shirt: "#f3efe6",
  accent: "#d4af37", // gold scarf
  shoes: "#111111",
  ...BODY.female,
};

export const GUIDE_LOOK: CharacterLook = {
  face: "male",
  skin: "#c68642",
  eye: "#2a2018",
  hair: "#1a1412",
  hairStyle: "side",
  stubble: true,
  top: "#2b2b30", // charcoal suit
  bottom: "#2b2b30",
  shirt: "#f3efe6",
  accent: "#8c3b3b", // burgundy tie
  shoes: "#111111",
  ...BODY.male,
};

// ---- random but repeatable NPCs for the crowd ----
const SKIN = ["#f1c9a5", "#e0ac84", "#c68642", "#8d5524", "#5c3a21"];
const EYES = ["#4a2c17", "#6b4a2b", "#3d5a73", "#4f6b3e", "#2a2018"];
const HAIR = ["#1a1412", "#3b2a1d", "#6b4a2b", "#a67c3d", "#8a8a8a", "#2b1b12"];
const LIPSTICK = ["#b04a52", "#a8323a", "#c46a6a", "#8c3b4a"];
const SUITS = [
  "#1e2a3d",
  "#2b2b30",
  "#3a3f4a",
  "#4a3b34",
  "#22302a",
  "#2f2a3a",
  "#5b5a60",
];
const SHIRTS = ["#f3efe6", "#dfe8f2", "#f2dfe0", "#e8e4d4", "#d9e4dc"];
const TIES = ["#8c3b3b", "#2f4156", "#c9a24a", "#4c6b6a", "#6a3d8a", "#2b2b30"];
const SHOES = ["#111111", "#2b1d14", "#1a1410"];

function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNpcLook(seed: number): CharacterLook {
  const r = rng(seed * 9973 + 11);
  const pick = <T>(list: readonly T[]) => list[Math.floor(r() * list.length)];

  const gender: Gender = r() < 0.5 ? "male" : "female";
  const hairStyle: HairStyle =
    gender === "female"
      ? pick(["long", "bob", "bun"] as const)
      : r() < 0.1
        ? "bald"
        : pick(["crop", "side", "slick"] as const);

  const suit = pick(SUITS);
  return {
    face: faceFor(gender),
    skin: pick(SKIN),
    eye: pick(EYES),
    hair: pick(HAIR),
    hairStyle,
    lipstick: gender === "female" && r() < 0.45 ? pick(LIPSTICK) : undefined,
    stubble: gender === "male" && r() < 0.35,
    top: suit,
    bottom: r() < 0.7 ? suit : pick(SUITS), // mostly a matching suit
    shirt: pick(SHIRTS),
    accent: pick(TIES),
    shoes: pick(SHOES),
    ...BODY[gender],
    height: BODY[gender].height * (0.95 + r() * 0.1),
  };
}

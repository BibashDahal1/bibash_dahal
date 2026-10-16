import type { PoseName } from "@/components/characters/poses";

interface CharacterConfig {
  /** false = always use the built-in procedural people. */
  enabled: boolean;
  /** Character files (.glb, .gltf or .fbx). Missing files are skipped; with none, the procedural people are used. */
  models: { male: string[]; female: string[] };
  /** Standing height in metres each model is scaled to. */
  height: { male: number; female: number };
  /** Set to Math.PI if your models face backwards. */
  facingOffset: number;
  /** Nudge for seated people if they sink into, or float above, the sofa (metres; z is forward). */
  seat: { y: number; z: number };
  /** One animation file per pose (Mixamo: FBX, "Without Skin", "In Place" for walking). Missing poses fall back. */
  animations: Partial<Record<PoseName, string>>;
  /** The speed (m/s) your walk animation represents. */
  walkClipSpeed: number;
  /** Heads turn toward the visitor (the receptionist, the guide). */
  headTracking: boolean;
  /** People further away than this are hidden and not animated. */
  cullDistance: { high: number; low: number };
}

export const CHARACTERS: CharacterConfig = {
  enabled: true,
  models: {
    // The FIRST female is the receptionist and the FIRST male is the guide.
    male: ["/models/characters/male-1.glb", "/models/characters/male-2.glb"],
    female: [
      "/models/characters/female-1.glb",
      "/models/characters/female-2.glb",
    ],
  },
  height: { male: 1.78, female: 1.66 },
  facingOffset: 0,
  seat: { y: 0, z: 0 },
  animations: {
    stand: "/models/animations/idle.fbx",
    walk: "/models/animations/walk.fbx",
    talk: "/models/animations/talk.fbx",
    phone: "/models/animations/phone.fbx",
    sit: "/models/animations/sit.fbx",
    sitTalk: "/models/animations/sit-talk.fbx",
    // Optional extras, add any you download:
    // clasped: "/models/animations/clasped.fbx",
    // coffee: "/models/animations/drinking.fbx",
    // sitPhone: "/models/animations/sit-phone.fbx",
  },
  walkClipSpeed: 1.4,
  headTracking: true,
  cullDistance: { high: 26, low: 14 },
};

/**
 * Which animation each pose uses, in order of preference. A seated pose never falls back to
 * standing: a person standing inside a sofa would look worse than the procedural one.
 */
export const FALLBACKS: Record<PoseName, PoseName[]> = {
  stand: ["stand"],
  walk: ["walk", "stand"],
  talk: ["talk", "stand"],
  phone: ["phone", "stand"],
  clasped: ["clasped", "stand"],
  briefcase: ["briefcase", "stand"],
  coffee: ["coffee", "stand"],
  readPaper: ["readPaper", "stand"],
  sit: ["sit"],
  sitRead: ["sitRead", "sit"],
  sitTalk: ["sitTalk", "sit"],
  sitPhone: ["sitPhone", "sit"],
};

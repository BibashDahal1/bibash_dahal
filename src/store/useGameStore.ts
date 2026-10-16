import { create } from "zustand";
import type { DetailContent } from "@/data/types";
import type { Quality } from "@/constants/quality";

export type Gender = "male" | "female" | "other";
export type Destination = "office" | "projects";
export type Scene = "lobby" | Destination;
export type Speaker = "receptionist" | "guide";

/** ...as before, plus "viewing": a detail card / PDF is open and the world is paused. */
export type Phase =
  | "intro"
  | "waking"
  | "explore"
  | "greeting"
  | "menu"
  | "guided"
  | "transition"
  | "viewing";

type Hover = { id: string; label: string } | null;

type GameState = {
  name: string;
  gender: Gender | null;
  phase: Phase;
  scene: Scene;
  destination: Destination | null;
  greetCount: number;
  receptionistPose: "sit" | "sitPhone";
  lines: Record<Speaker, string | null>;
  reply: string | null;
  openDoor: Destination | null;
  fade: boolean;
  hover: Hover;
  detail: DetailContent | null;
  quality: Quality;
  muted: boolean;
  sceneReady: boolean;

  setQuality: (q: Quality) => void;
  toggleMuted: () => void;
  setSceneReady: (ready: boolean) => void;

  startGame: (name: string, gender: Gender) => void;
  setPhase: (phase: Phase) => void;
  setScene: (scene: Scene) => void;
  setDestination: (d: Destination | null) => void;
  arrive: () => void;
  setReceptionistPose: (p: "sit" | "sitPhone") => void;
  setLine: (who: Speaker, text: string | null) => void;
  setReply: (text: string | null) => void;
  setOpenDoor: (d: Destination | null) => void;
  setFade: (fade: boolean) => void;
  setHover: (hover: Hover) => void;
  openDetail: (detail: DetailContent) => void;
  closeDetail: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  name: "",
  gender: null,
  phase: "intro",
  scene: "lobby",
  destination: null,
  greetCount: 0,
  receptionistPose: "sit",
  lines: { receptionist: null, guide: null },
  reply: null,
  openDoor: null,
  fade: false,
  hover: null,
  detail: null,
  quality: "high",
  muted: false,
  sceneReady: false,
  setQuality: (quality) => set({ quality }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setSceneReady: (sceneReady) => set({ sceneReady }),

  startGame: (name, gender) =>
    set({ name: name.trim(), gender, phase: "waking" }),
  setPhase: (phase) => set({ phase }),
  setScene: (scene) => set({ scene }),
  setDestination: (destination) => set({ destination }),
  arrive: () =>
    set((s) => ({ phase: "greeting", greetCount: s.greetCount + 1 })),
  setReceptionistPose: (receptionistPose) => set({ receptionistPose }),
  setLine: (who, text) => set((s) => ({ lines: { ...s.lines, [who]: text } })),
  setReply: (reply) => set({ reply }),
  setOpenDoor: (openDoor) => set({ openDoor }),
  setFade: (fade) => set({ fade }),
  setHover: (hover) => set({ hover }),
  openDetail: (detail) => set({ detail, phase: "viewing", hover: null }),
  closeDetail: () =>
    set((s) =>
      s.phase === "viewing"
        ? { detail: null, phase: "explore" }
        : { detail: null },
    ),
}));

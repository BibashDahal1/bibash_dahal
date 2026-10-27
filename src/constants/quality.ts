export type Quality = "high" | "low";

export const QUALITY: Record<
  Quality,
  {
    dpr: [number, number];
    antialias: boolean;
    crystals: number;
    sun: boolean;
    walkers: number;
    statics: number; // how many standing / seated people the lobby shows
    videos: number; // how many in-world videos may play at once
    motes: number; // floating particles in the Projects room
  }
> = {
  high: {
    dpr: [1, 1.5],
    antialias: true,
    crystals: 120,
    sun: true,
    walkers: 3,
    statics: 99,
    videos: 2,
    motes: 180,
  },
  low: {
    dpr: [1, 1],
    antialias: false,
    crystals: 30,
    sun: false,
    walkers: 1,
    statics: 8,
    videos: 1,
    motes: 60,
  },
};

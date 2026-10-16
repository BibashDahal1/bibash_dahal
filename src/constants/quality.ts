export type Quality = "high" | "low";

export const QUALITY: Record<
  Quality,
  {
    dpr: [number, number];
    antialias: boolean;
    crystals: number;
    sun: boolean;
    walkers: number;
    videos: number; // how many in-world videos may play at once
    motes: number; // floating particles in the Projects room
  }
> = {
  high: {
    dpr: [1, 1.75],
    antialias: true,
    crystals: 150,
    sun: true,
    walkers: 3,
    videos: 2,
    motes: 180,
  },
  low: {
    dpr: [1, 1.25],
    antialias: false,
    crystals: 36,
    sun: false,
    walkers: 1,
    videos: 1,
    motes: 60,
  },
};

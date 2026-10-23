export const PALETTES = {
  // electric blue (stroke colours are blue only, never white)
  blue: {
    stroke: ["#5fd8ff", "#2a9bff", "#1f5cff"],
    a: "#2aa8ff", // glow / platform main
    b: "#0a3cff", // platform deep
    c: "#4fd0ff", // contour rim / platform accents
  },
  // lighter, icier blue
  ice: {
    stroke: ["#9fe6ff", "#5cb8ff", "#3a7bff"],
    a: "#6fd0ff",
    b: "#1a5cff",
    c: "#7cc8ff",
  },
} as const;

export type PaletteName = keyof typeof PALETTES;

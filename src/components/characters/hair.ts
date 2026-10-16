export type HairStyle =
  | "crop"
  | "side"
  | "slick"
  | "long"
  | "bob"
  | "bun"
  | "bald";

type V3 = [number, number, number];

export interface HairPart {
  shape: "sphere" | "hemi" | "box"; // keys of the shared character geometries
  position: V3;
  rotation?: V3;
  scale: V3; // half-sizes for spheres, full sizes for boxes
}

const part = (
  shape: HairPart["shape"],
  position: V3,
  scale: V3,
  rotation?: V3,
): HairPart => ({
  shape,
  position,
  scale,
  rotation,
});

// All positions are relative to the centre of the head.
// The cap is tilted back, so the hairline clears the brows and the nape is covered.
const CAP = part(
  "hemi",
  [0, 0.012, -0.004],
  [0.088, 0.11, 0.098],
  [-0.85, 0, 0],
);

const sideburns = ([1, -1] as const).map((s) =>
  part("box", [s * 0.082, -0.014, 0.034], [0.012, 0.04, 0.02]),
);
const fringe = part(
  "box",
  [0, 0.078, 0.078],
  [0.098, 0.014, 0.026],
  [0.4, 0, 0],
);
const nape = part("sphere", [0, -0.04, -0.056], [0.072, 0.05, 0.05]);

export const HAIR: Record<HairStyle, HairPart[]> = {
  bald: [],

  // short and neat
  crop: [
    CAP,
    part("sphere", [0, 0.098, 0], [0.066, 0.024, 0.07]),
    fringe,
    nape,
    ...sideburns,
  ],

  // side parting, swept across
  side: [
    CAP,
    part("sphere", [0, 0.098, 0], [0.07, 0.026, 0.074]),
    part("sphere", [0.03, 0.092, 0.04], [0.055, 0.022, 0.07], [0, 0, -0.3]),
    part("box", [0.02, 0.078, 0.078], [0.1, 0.014, 0.028], [0.4, 0, -0.15]),
    nape,
    ...sideburns,
  ],

  // combed back
  slick: [
    CAP,
    part("sphere", [0, 0.1, -0.012], [0.07, 0.026, 0.092]),
    part("sphere", [0, -0.035, -0.06], [0.074, 0.055, 0.05]),
    ...sideburns,
  ],

  // long, layered down the back, with side locks framing the face
  long: [
    CAP,
    part("box", [-0.02, 0.076, 0.078], [0.105, 0.015, 0.028], [0.4, 0, 0.2]),
    part("sphere", [0, -0.04, -0.07], [0.092, 0.08, 0.062]),
    part("sphere", [0, -0.17, -0.08], [0.09, 0.12, 0.055]),
    part("sphere", [0, -0.3, -0.085], [0.075, 0.12, 0.045]),
    ...([1, -1] as const).flatMap((s) => [
      part("sphere", [s * 0.082, -0.1, 0.012], [0.024, 0.1, 0.04]),
      part("sphere", [s * 0.085, -0.2, -0.02], [0.022, 0.09, 0.035]),
    ]),
  ],

  // shoulder-length bob
  bob: [
    CAP,
    part("box", [0, 0.078, 0.078], [0.1, 0.015, 0.028], [0.4, 0, 0.12]),
    part("sphere", [0, -0.07, -0.07], [0.1, 0.095, 0.06]),
    ...([1, -1] as const).map((s) =>
      part("sphere", [s * 0.084, -0.07, 0], [0.03, 0.085, 0.07]),
    ),
  ],

  // pulled back into a low bun
  bun: [
    CAP,
    part("sphere", [0, 0.095, -0.01], [0.07, 0.025, 0.085]),
    part("sphere", [0, 0.075, -0.105], [0.05, 0.05, 0.05]),
    nape,
  ],
};

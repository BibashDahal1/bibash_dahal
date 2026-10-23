import { CERTIFICATES } from "@/data/certificates";
import { PROJECTS } from "@/data/projects";
import { SKILLS } from "@/data/skills";
import type { Certificate, Project, Skill } from "@/data/types";
import type { Rect } from "./lobbyLayout";

export type RoomId = "office" | "projects" | "certificates";
export type PlantVariant = "bush" | "tall" | "snake";

export interface RoomLayout {
  width: number;
  depth: number;
  height: number;
  spawn: { x: number; z: number };
  colliders: Rect[];
}
export interface PlantSlot {
  x: number;
  z: number;
  variant: PlantVariant;
  scale: number;
}

const VARIANTS: PlantVariant[] = ["bush", "tall", "snake", "tall", "bush"];

// ============================ OFFICE ============================
const OFFICE_W = 16;
export const SKILL_ROW_SPACING = 3.1;
export const SKILL_X = 6;

const perSide = Math.ceil(SKILLS.length / 2);
const OFFICE_D = Math.max(30, 15 + (perSide - 1) * SKILL_ROW_SPACING);
const FIRST_ROW_Z = OFFICE_D / 2 - 5;

export interface SkillSlot {
  skill: Skill;
  x: number;
  z: number;
  side: -1 | 1;
}

/** Skill i goes on the left (even) or right (odd) wall, two per row. */
export const skillSlots: SkillSlot[] = SKILLS.map((skill, i) => {
  const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
  return {
    skill,
    side,
    x: side * SKILL_X,
    z: FIRST_ROW_Z - Math.floor(i / 2) * SKILL_ROW_SPACING,
  };
});

/** A plant in every gap between rows (and one before the first / after the last). */
export const officePlants: PlantSlot[] = Array.from(
  { length: perSide + 1 },
  (_, r) =>
    ([-1, 1] as const).map((side) => ({
      x: side * SKILL_X,
      z: FIRST_ROW_Z + SKILL_ROW_SPACING / 2 - r * SKILL_ROW_SPACING,
      variant: VARIANTS[(r * 2 + (side < 0 ? 0 : 1)) % VARIANTS.length],
      scale: 1 + ((r + (side < 0 ? 0 : 1)) % 3) * 0.12,
    })),
).flat();

export const OFFICE_DESK = { x: 0, z: -OFFICE_D / 2 + 4.6 } as const;

export const OFFICE: RoomLayout = {
  width: OFFICE_W,
  depth: OFFICE_D,
  height: 5.5,
  spawn: { x: 0, z: OFFICE_D / 2 - 2.5 },
  colliders: [
    ...skillSlots.map((s) => ({ cx: s.x, cz: s.z, hw: 0.6, hd: 0.6 })),
    ...officePlants.map((p) => ({ cx: p.x, cz: p.z, hw: 0.35, hd: 0.35 })),
    { cx: OFFICE_DESK.x, cz: OFFICE_DESK.z - 0.6, hw: 1.5, hd: 1.9 }, // desk + owner's chair
    { cx: -1.5, cz: OFFICE_DESK.z + 1.9, hw: 0.3, hd: 0.3 }, // visitor chairs
    { cx: 1.5, cz: OFFICE_DESK.z + 1.9, hw: 0.3, hd: 0.3 },
  ],
};

// =========================== PROJECTS ===========================
// The first project marked `featured` gets the FRONT wall (the one you face on entering).
// Every other project gets a bay on the left or right wall, alternating, two bays per row.
// All of it is computed from data/projects.ts, so adding a project needs no layout edits.
export const PROJECTS_W = 18;
export const PROJECTS_H = 6.2;
export const BAY_SPACING = 10.5; // length of side wall each bay uses
const ENTRY = 8; // empty space by the entrance
const END = 6; // empty space behind the last bay

const featuredProject = PROJECTS.find((p) => p.featured);
const regularProjects = PROJECTS.filter((p) => p !== featuredProject);

const projectRows = Math.ceil(regularProjects.length / 2);
const PROJ_D = Math.max(30, ENTRY + projectRows * BAY_SPACING + END);
const PROJ_FIRST_Z = PROJ_D / 2 - ENTRY - BAY_SPACING / 2;

export interface ProjectSlot {
  project: Project;
  wall: "left" | "right" | "front";
  /** Centre of the display wall: a z for the side walls, an x for the front wall. */
  along: number;
  /** Where the hologram pedestal stands. */
  plinthX: number;
  plinthZ: number;
  featured: boolean;
}

/** Side-wall bays (every project except the featured one). */
export const projectSlots: ProjectSlot[] = regularProjects.map((project, i) => {
  const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
  const z = PROJ_FIRST_Z - Math.floor(i / 2) * BAY_SPACING;
  return {
    project,
    wall: side < 0 ? "left" : "right",
    along: z,
    plinthX: side * (PROJECTS_W / 2 - 3.4),
    plinthZ: z,
    featured: false,
  };
});

/** The featured project on the front wall, with its hologram on the right-hand side. */
export const featuredSlot: ProjectSlot | null = featuredProject
  ? {
      project: featuredProject,
      wall: "front",
      along: 0,
      plinthX: 6.9,
      plinthZ: -PROJ_D / 2 + 3.4,
      featured: true,
    }
  : null;

const allProjectSlots = featuredSlot
  ? [featuredSlot, ...projectSlots]
  : projectSlots;

export const PROJECTS_ROOM: RoomLayout = {
  width: PROJECTS_W,
  depth: PROJ_D,
  height: PROJECTS_H,
  spawn: { x: 0, z: PROJ_D / 2 - 2.5 },
  colliders: allProjectSlots.map((s) => ({
    cx: s.plinthX,
    cz: s.plinthZ,
    hw: 0.85,
    hd: 0.85,
  })),
};

// ========================== CERTIFICATES ==========================
// A gallery: one glass frame per certificate on the side walls (alternating), a bench in front of each row,
// and a trophy under a glass dome at the far end. Computed from data/certificates.ts.
export const CERT_W = 16;
export const CERT_H = 5.8;
export const CERT_SPACING = 4.4; // wall length each frame uses

const certRows = Math.ceil(CERTIFICATES.length / 2);
const CERT_D = Math.max(30, 8 + certRows * CERT_SPACING + 10);
const CERT_FIRST_Z = CERT_D / 2 - 8 - CERT_SPACING / 2;

export interface CertificateSlot {
  certificate: Certificate;
  index: number;
  side: -1 | 1; // -1 = left wall, 1 = right wall
  z: number;
}

export const certificateSlots: CertificateSlot[] = CERTIFICATES.map(
  (certificate, index) => ({
    certificate,
    index,
    side: index % 2 === 0 ? -1 : 1,
    z: CERT_FIRST_Z - Math.floor(index / 2) * CERT_SPACING,
  }),
);

/** z of each viewing bench (one per row of frames). */
export const certificateBenches: number[] = Array.from(
  { length: certRows },
  (_, r) => CERT_FIRST_Z - r * CERT_SPACING,
);

export const SHOWPIECE = { x: 0, z: -CERT_D / 2 + 5.5 } as const;

export const certificatePlants: PlantSlot[] = (
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const
).map(([sx, sz], i) => ({
  x: sx * 7,
  z: sz * (CERT_D / 2 - 1.3),
  variant: VARIANTS[i % VARIANTS.length],
  scale: 1.3,
}));

export const CERTIFICATES_ROOM: RoomLayout = {
  width: CERT_W,
  depth: CERT_D,
  height: CERT_H,
  spawn: { x: 0, z: CERT_D / 2 - 2.5 },
  colliders: [
    ...certificateBenches.map((z) => ({ cx: 0, cz: z, hw: 0.35, hd: 1.2 })),
    { cx: SHOWPIECE.x, cz: SHOWPIECE.z, hw: 0.8, hd: 0.8 },
    ...certificatePlants.map((p) => ({ cx: p.x, cz: p.z, hw: 0.35, hd: 0.35 })),
  ],
};

export const ROOM_LAYOUTS: Record<RoomId, RoomLayout> = {
  office: OFFICE,
  projects: PROJECTS_ROOM,
  certificates: CERTIFICATES_ROOM,
};

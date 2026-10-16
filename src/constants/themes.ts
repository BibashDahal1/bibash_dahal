import type { WoodKind } from "@/lib/woodTexture";
import { GOLD } from "./world";

export interface RoomTheme {
  wood: WoodKind; // wall paneling
  plaster: string; // upper wall colour
  wainscot: number; // paneling height
  accent: string;
  windowZ: number[]; // sunset windows along both side walls (empty = none)
}

export const THEMES: Record<"lobby" | "office" | "projects", RoomTheme> = {
  lobby: {
    wood: "walnut",
    plaster: "#dcc6a2",
    wainscot: 3.2,
    accent: GOLD,
    windowZ: [-8, -1, 6, 12],
  },
  office: {
    wood: "dark",
    plaster: "#3a3036",
    wainscot: 2.6,
    accent: GOLD,
    windowZ: [],
  },
  projects: {
    wood: "dark",
    plaster: "#2d3340",
    wainscot: 2.6,
    accent: "#5eeaff",
    windowZ: [],
  },
};

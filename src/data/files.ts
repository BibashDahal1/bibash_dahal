import type { DocFile } from "./types";

/** Folders lying on the desk. Add more entries (PDFs in /public/docs) and they appear next to the CV. */
export const DESK_FILES: DocFile[] = [
  {
    id: "cv",
    label: "CV",
    title: "Curriculum Vitae — Bibash Dahal",
    src: "/docs/Bibash_Dahal_CV.pdf",
    color: "#c9a24a",
  },
];

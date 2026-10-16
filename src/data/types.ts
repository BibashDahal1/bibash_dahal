export type SkillCategory =
  | "Frontend"
  | "Mobile"
  | "Backend"
  | "Databases & Infra"
  | "Tools";

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** Glow / label colour. Use a light colour for logos that are black. */
  color: string;
  summary: string;
  /** Devicon slug ("react"), a local path ("/logos/x.png") or a full URL. null = lettered badge. */
  logo?: string | null;
  /** Text shown on the badge when there is no logo. */
  badge?: string;
  usedIn?: string[];
}

export interface ProjectMedia {
  type: "image" | "video";
  /** A Cloudinary public ID ("folder/name") or a full URL. */
  src: string;
  caption?: string;
  /** Optional still for a video (public ID or URL). Cloudinary videos get one automatically. */
  poster?: string;
}

export interface Project {
  id: string;
  name: string;
  /** Short name printed on the hologram and the bay. */
  label: string;
  kind: string;
  tagline: string;
  description: string;
  highlights: string[];
  tech: string[];
  color: string;
  logo?: string | null;
  badge?: string;
  link?: { label: string; url: string };
  /** Videos and images shown in the project's bay. The first video becomes the big screen. */
  media?: ProjectMedia[];
}

export interface DocFile {
  id: string;
  label: string; // printed on the folder
  title: string; // header of the viewer
  src: string; // path under /public
  color: string;
}

export type DetailContent =
  | { kind: "skill"; skill: Skill }
  | { kind: "project"; project: Project }
  | { kind: "media"; project: Project; index: number }
  | { kind: "doc"; file: DocFile };

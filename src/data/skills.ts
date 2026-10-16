import type { Skill, SkillCategory } from "./types";

const skill = (
  id: string,
  name: string,
  category: SkillCategory,
  color: string,
  summary: string,
  extra: Partial<Skill> = {},
): Skill => ({ id, name, category, color, summary, logo: null, ...extra });

/**
 * ADD A SKILL: add one line anywhere in this list. Order = order in the room.
 * Rows are filled left/right alternately, so keep each category together.
 */
export const SKILLS: Skill[] = [
  // ---- Frontend ----
  skill(
    "react",
    "React.js",
    "Frontend",
    "#61dafb",
    "Production-grade web apps at IOXET Labs, a reusable component library, and the frontend of the Kalaa Ghar marketplace.",
    { logo: "react", usedIn: ["IOXET Labs", "Kalaa Ghar"] },
  ),
  skill(
    "nextjs",
    "Next.js",
    "Frontend",
    "#e8e8e8",
    "Part of my React-ecosystem toolkit, and the framework this portfolio is built with.",
    { logo: "nextjs", usedIn: ["This portfolio"] },
  ),
  skill(
    "redux",
    "Redux",
    "Frontend",
    "#a97bdc",
    "State management for larger React applications.",
    { logo: "redux" },
  ),
  skill(
    "threejs",
    "Three.js / R3F",
    "Frontend",
    "#e8e8e8",
    "Built the immersive 3D virtual exhibition for Kalaa Ghar, and this 3D portfolio.",
    { logo: "threejs", usedIn: ["Kalaa Ghar", "This portfolio"] },
  ),
  skill(
    "tailwind",
    "Tailwind CSS",
    "Frontend",
    "#38bdf8",
    "Utility-first styling for fast, responsive interfaces.",
    { logo: "tailwindcss" },
  ),
  skill(
    "html5",
    "HTML5",
    "Frontend",
    "#ff7a4d",
    "Semantic, accessible markup.",
    { logo: "html5" },
  ),
  skill(
    "css3",
    "CSS3",
    "Frontend",
    "#4f8cff",
    "Layouts, animation and responsive design.",
    { logo: "css3" },
  ),
  skill(
    "javascript",
    "JavaScript (ES6+)",
    "Frontend",
    "#f7df1e",
    "The language behind my frontend and Node.js work.",
    { logo: "javascript" },
  ),

  // ---- Mobile ----
  skill(
    "react-native",
    "React Native",
    "Mobile",
    "#61dafb",
    "Mobile apps using the React ecosystem.",
    { logo: "react" },
  ),

  // ---- Backend ----
  skill(
    "nodejs",
    "Node.js",
    "Backend",
    "#6cc24a",
    "Server-side JavaScript and API development.",
    { logo: "nodejs" },
  ),
  skill(
    "express",
    "Express.js",
    "Backend",
    "#e8e8e8",
    "Lightweight REST backends on Node.js.",
    { logo: "express" },
  ),
  skill(
    "django",
    "Django",
    "Backend",
    "#44b78b",
    "Python backend of Kalaa Ghar: marketplace, auctions and virtual exhibitions.",
    { logo: "django", usedIn: ["Kalaa Ghar"] },
  ),
  skill(
    "channels",
    "Django Channels",
    "Backend",
    "#44b78b",
    "Real-time layer for live auction bidding and exhibition interactions.",
    { badge: "DC", usedIn: ["Kalaa Ghar"] },
  ),
  skill(
    "rest",
    "REST APIs",
    "Backend",
    "#ffb454",
    "Integrated third-party REST APIs at IOXET Labs and designed the backend APIs behind Kalaa Ghar.",
    { badge: "API", usedIn: ["IOXET Labs", "Kalaa Ghar"] },
  ),
  skill(
    "websockets",
    "WebSockets",
    "Backend",
    "#5eeaff",
    "Real-time auction bidding and live exhibition interactions.",
    { badge: "WS", usedIn: ["Kalaa Ghar"] },
  ),

  // ---- Databases & Infra ----
  skill(
    "mongodb",
    "MongoDB",
    "Databases & Infra",
    "#58c24a",
    "Document database for flexible data models.",
    { logo: "mongodb" },
  ),
  skill(
    "postgresql",
    "PostgreSQL",
    "Databases & Infra",
    "#6aa0d8",
    "Relational database for structured, production data.",
    { logo: "postgresql" },
  ),
  skill(
    "sql",
    "SQL",
    "Databases & Infra",
    "#ffa94d",
    "Querying and modelling relational data.",
    { badge: "SQL" },
  ),
  skill(
    "redis",
    "Redis",
    "Databases & Infra",
    "#ff5a4d",
    "Powers real-time auction bidding and live exhibition interactions.",
    { logo: "redis", usedIn: ["Kalaa Ghar"] },
  ),
  skill(
    "neon",
    "Neon",
    "Databases & Infra",
    "#00e599",
    "Serverless cloud PostgreSQL hosting.",
    { badge: "NEON" },
  ),

  // ---- Tools ----
  skill(
    "git",
    "Git",
    "Tools",
    "#ff6a4d",
    "Version control for every project.",
    { logo: "git" },
  ),
  skill(
    "github",
    "GitHub",
    "Tools",
    "#e8e8e8",
    "Code hosting and collaboration.",
    { logo: "github" },
  ),
  skill(
    "postman",
    "Postman",
    "Tools",
    "#ff6c37",
    "Designing and testing APIs.",
    { logo: "postman" },
  ),
  skill(
    "render",
    "Render",
    "Tools",
    "#7b8cff",
    "Cloud hosting for backend services.",
    { badge: "R" },
  ),
  skill(
    "vercel",
    "Vercel",
    "Tools",
    "#ffffff",
    "Hosting for Kalaa Ghar and web frontends.",
    { logo: "vercel", usedIn: ["Kalaa Ghar"] },
  ),
  skill(
    "cloudinary",
    "Cloudinary",
    "Tools",
    "#6f86ff",
    "Image and media management.",
    { badge: "CLD" },
  ),
];

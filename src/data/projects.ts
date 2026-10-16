import type { Project } from "./types";

/**
 * ADD A PROJECT: add one object to this list. The Projects room grows a new bay for it.
 *
 * media: Cloudinary public IDs ("folder/name") or full URLs.
 *  - the FIRST video becomes the big screen (if there is no video, the first image does)
 *  - up to 5 more items show as panels under it; everything is still in the card's gallery
 *
 * The IDs below ("dog", "sample", ...) are from Cloudinary's public demo cloud: REPLACE them with yours,
 * and set your cloud name in constants/cloudinary.ts.
 */
export const PROJECTS: Project[] = [
  {
    id: "Artigo Virtual Exhibition",
    name: "Artigo Virtual Exhibition",
    label: "Artigo Virtual Exhibition",
    kind: "Full-stack platform",
    tagline: "virtual exhibition platform",
    description:
      "A full-stack platform where artists sell artworks, digital art and photography, with live auctions and bidding.",
    highlights: [
      "Unique selling point: an immersive 3D virtual exhibition where artists show their work in virtual rooms and visitors buy tickets to explore online.",
      "Backend in Python/Django, with Redis and WebSockets powering real-time auction bidding and live exhibition interactions.",
      "Frontend in React.js, with a Three.js-based 3D gallery alongside the core marketplace UI.",
    ],
    tech: ["React.js", "Three.js", "Django", "Redis", "WebSockets"],
    color: "#ffcf5a",
    badge: "KG",
    logo: "/logos/logo.png",
    link: {
      label: "Visit arti-go.vercel.app",
      url: "https://arti-go.vercel.app",
    },
    media: [
      {
        type: "video",
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1789653500/artigo2.mp4",
        caption: "Platform walkthrough",
      }, // REPLACE
      { type: "image", src: "sample", caption: "Marketplace home" }, // REPLACE
      { type: "image", src: "cld-sample", caption: "Live auction" }, // REPLACE
      { type: "image", src: "cld-sample-2", caption: "3D exhibition" }, // REPLACE
      { type: "image", src: "cld-sample-3", caption: "Artist dashboard" }, // REPLACE
    ],
  },
  {
    id: "nepali-ocr",
    name: "AI Nepali Image Text Recognition & Translation",
    label: "Nepali OCR",
    kind: "Final year project",
    tagline: "Extract and translate Nepali text from images",
    description:
      "An OCR system that reads Nepali text out of images and translates it, built on a custom image-processing pipeline.",
    highlights: [
      "Custom image-processing pipeline that prepares images for recognition.",
      "Delivered as a full-stack web application combining image processing, OCR and translation APIs.",
    ],
    tech: ["Image processing", "OCR", "Translation APIs", "Full-stack web app"],
    color: "#5eeaff",
    badge: "OCR",
    media: [
      { type: "video", src: "elephants", caption: "Demo" }, // REPLACE
      { type: "image", src: "sample", caption: "Input image" }, // REPLACE
      { type: "image", src: "cld-sample-3", caption: "Recognised text" }, // REPLACE
    ],
  },

  {
    id: "plannedit",
    name: "PlannedIT",
    label: "PlannedIT",
    kind: "Full-stack mobile application",
    tagline: "Plan activities, find people, and join local communities",
    description:
      "A location-based activity platform that helps people organize activities, discover nearby opportunities, and connect with others who share similar interests.",
    highlights: [
      "Users can create activities with specific locations, dates, times, and participant requirements, such as finding more players for a futsal match.",
      "Location-based activity discovery, joining requests, group chat, and participant coordination help people connect and plan activities together.",
      "Built with Flutter and Django REST Framework, using PostgreSQL, JWT authentication, and a scalable backend architecture.",
      "Designed with safety-focused features to help users review participation requests and make more informed decisions before joining activities.",
    ],
    tech: [
      "Flutter",
      "Dart",
      "Python",
      "Django REST Framework",
      "PostgreSQL",
      "JWT Authentication",
      "WebSockets",
    ],
    color: "#a7c7e7",
    badge: "PI",
    logo: "/logos/PlannedIt.png",
    link: {
      label: "View PlannedIT",
      url: "https://github.com/YOUR_USERNAME/YOUR_REPOSITORY",
    },
    media: [
      {
        type: "video",
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1792070554/plannedIt.mp4",
        caption: "PlannedIt",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792070291/homepage.png",
        caption: "Homepage",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792070291/map.png",
        caption: "Locate your Activity",
      },
      {
        type: "image",
        src: "YOUR_CLOUDINARY_PLANNEDIT_SCREENSHOT",
        caption: "Chat and group coordination",
      },
    ],
  },
];

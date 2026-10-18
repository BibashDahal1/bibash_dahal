import type { Project } from "./types";

/**
 * ADD A PROJECT: add one object to this list. The Projects room grows a new bay for it.
 *
 * featured: true  puts the project on the FRONT wall of the room (the first featured one only).
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
    id: "portfolio",
    name: "Bibash Dahal: Interactive 3D Portfolio",
    label: "Bibash Dahal Portfolio",
    kind: "Interactive 3D portfolio",
    tagline: "A walkable 3D world instead of a résumé page",
    description:
      "The site you are standing in: a story-driven 3D portfolio where visitors wake up in a reception lobby, are greeted by name, and are guided to an office of skill holograms or this project gallery.",
    highlights: [
      "A story-driven experience: a reception lobby, a receptionist who greets each visitor by name, and a guide who walks them to the office or the projects.",
      "Skill and project holograms, a CV on the office desk, and videos and images streamed from Cloudinary.",
      "Built with Next.js, React Three Fiber and Three.js, with keyboard and mouse on desktop, touch controls on phones, and a quality switch.",
    ],
    tech: [
      "Next.js",
      "React Three Fiber",
      "Three.js",
      "TypeScript",
      "Tailwind CSS",
      "Zustand",
      "Cloudinary",
    ],
    color: "#ffe08a",
    logo: "/logos/favicon.ico",
    badge: "BD",
    featured: true,
    link: {
      label: "Visit bibashdahal.com.np",
      url: "https://bibashdahal.com.np",
    },
    media: [
      {
        type: "video",
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1792305959/Portfolio_1.mp4",
        caption: "Bibash Dahal Portfolio Walkthrough",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port1.png",
        caption: "Lobby Entrance",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port2.png",
        caption: "Lobby Reception",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port3.png",
        caption: "Lobby Guide",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port4.png",
        caption: "Lobby Office Door",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port5.png",
        caption: "Office Entrance",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port6.png",
        caption: "Office Desk",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port8.png",
        caption: "Project Room Entrance",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port9.png",
        caption: "Project Room Bay",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792304047/port10.png",
        caption: "Project Room Portfolio",
      },
    ], // add screenshots or a walkthrough video here, like the other projects
  },
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
      "Cutomizatible Room Color and size, with Music Selection",
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
      {
        type: "video",
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1789653188/artigo1.mp4",
        caption: "Virtual Exhibition Creation",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792247826/Screenshot_2026-10-17_201844.png",
        caption: "Entrance Room",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792247826/Screenshot_2026-10-17_201931.png",
        caption: "Multi Rooms",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792247827/Screenshot_2026-10-17_201959.png",
        caption: "Virtual Experience",
      }, // REPLACE
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
      "Used Custom Icons Boxes and Background With unique Design and Feel to the User Interface.",
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
      url: "https://github.com/BibashDahal1/PlannedIt_front_flutter",
    },
    media: [
      {
        type: "video",
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1792252556/PlannedItVideo_1.mp4",
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
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252039/profileplanned.png",
        caption: "Profile",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan2.png",
        caption: "Dashboard Groups",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan3.png",
        caption: "Dashboard Cost Management",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan4.png",
        caption: "Dashboard Reviews",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan5.png",
        caption: "Dashboard Requests",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan6.png",
        caption: "Dashboard Chat Management",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan7.png",
        caption: "Dashboard Chat Management 1",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792252036/plan8.png",
        caption: "Dashboard Chat",
      },
    ],
  },
  {
    id: "Artigo",
    name: "Artigo",
    label: "Artigo",
    kind: "Full-stack platform",
    tagline:
      "Ecommerce platform for artists to sell artworks, digital art and photography",
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
        src: "https://res.cloudinary.com/urvcfynq/video/upload/v1792247163/Artigo3_1.mp4",
        caption: "Site Walkthrough",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248721/ss1.png",
        caption: "Browse Section",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248720/ss2.png",
        caption: "Art Detail and Buy",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248720/ss3.png",
        caption: "Comments and Reviews",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248720/ss4.png",
        caption: "Bidders and Auction",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248720/ss5.png",
        caption: "Exhibition Detail and Buy Tickets",
      },
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792248720/ss6.png",
        caption: "Dashboard Overview",
      }, // REPLACE
    ],
  },
  {
    id: "nepali-ocr",
    name: "AI Nepali Image Text Recognition & Translation",
    label: "Nepali OCR- Aksar",
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
    logo: "/logos/Aksar.png",
    badge: "OCR",
    media: [
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792249311/Aksar1.png",
        caption: "Landing Page Aksar",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792249310/Aksar2.png",
        caption: "Aksar Zone",
      }, // REPLACE
      {
        type: "image",
        src: "https://res.cloudinary.com/urvcfynq/image/upload/v1792249310/Aksar3.png",
        caption: "OCR and Translator Hub",
      }, // REPLACE
    ],
  },
];

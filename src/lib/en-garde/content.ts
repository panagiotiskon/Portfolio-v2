import type { LogoName } from "./logos";

export const LINKS = {
  github: "https://github.com/panagiotiskon",
  linkedin: "https://www.linkedin.com/in/panagiotis-kontoeidis/",
  fencingRef: "https://fencingref.xyz/",
  email: "panos.kontoeidis@gmail.com",
  resume: null as string | null,
};

/** Line under the victory card heading: the ask. */
export const VICTORY_PITCH = "You made it this far. If you're building something, or just want to chat, I'd like to hear about it.";

export const RN = ["", "START","ABOUT", "EXPERIENCE", "PROJECTS", "TROPHIES", "CONTACT"];
export const RF = ["", "TITLE SCREEN", "CHARACTER SELECT", "CAREER PATH", "TOURNAMENT", "TROPHY ROOM", "FINAL ROUND"];
export const RS = ["", "TTL", "ABT", "EXP", "PRJ", "TRO", "CON"];

export type Run = { t: string; g: boolean };
export type Bio = { tag: string; paras: Run[][] };

const parseRuns = (s: string): Run[] =>
  s
    .split(/(\[\[.*?\]\])/)
    .filter(Boolean)
    .map((t) => (t.startsWith("[[") ? { t: t.slice(2, -2), g: true } : { t, g: false }));

export const BIO: Bio = {
  tag: "THE DEVELOPER WHO FENCES",
  paras: [
    "Computer Science graduate from the University of Athens, building web applications across the full stack. Programming and science contests since high school, then hackathons and seminars at university.",
    "Off the keyboard: 18 years in sabre fencing, 10 of them at a professional level. I've represented Greece at the 2026 [[Mediterranean Games]], the 2023 [[European Games]], and European and World Championships, and I'm a certified [[International Fencing Referee]].",
  ].map(parseRuns),
};

export const PROFILE = [
  ["NAME", "Panagiotis Kontoeidis"],
  ["CLASS", "Developer"],
  ["WEAPON", "Sabre"],
  ["ORIGIN", "University of Athens"],
] as const;

export const STATS: [string, number][] = [
  ["FRONTEND", 9],
  ["BACKEND", 8],
  ["CREATIVITY", 9],
  ["CURIOSITY", 10],
  ["ADAPTABILITY", 8],
  ["TEAMWORK", 10],
];

export type IconName =
  | "blade" | "armor" | "shield" | "scroll" | "trophy" | "star" | "medal" | "globe" | "whistle"
  | "diploma" | "badge" | "badgeG" | "orb" | "orbG" | "bug" | "lock" | "term" | "inbox";

export const EQUIPPED: [string, IconName][] = [
  ["React", "armor"],
  ["Redux-Observables", "armor"],
  ["REST APIs", "armor"],
  ["Java + Spring Boot", "blade"],
  ["MySQL", "shield"],
];
export const BACKPACK: [string, IconName][] = [
  ["JavaScript", "blade"],
  ["Spring AI", "armor"],
  ["Tailwind", "armor"],
  ["Node.js", "scroll"],
  ["Microservices", "scroll"],
];

export type Experience = {
  tier: string;
  dates: string;
  role: string;
  company: string;
  brand: string;
  accent: string;
  logo?: LogoName;
  current?: boolean;
  bullets: string[];
};

export const EXP: Experience[] = [
  {
    tier: "CURRENT BOUT",
    dates: "Dec 2024 – Present",
    role: "Software Engineer · ReactJS & ReduxJS",
    company: "Kotsovolos · PPC Group",
    brand: "#b0122c",
    accent: "#ff6b7f",
    logo: "kotsovolos",
    current: true,
    bullets: [
      "Build and optimize the Kotsovolos website and the KRetail B2B/B2C app for in-store sales agents (ReactJS, ReduxJS).",
      "Analyze & implement new features focused on performance, scalability and UX.",
      "Work in an agile cross-functional team, keeping frontend and backend tightly integrated.",
    ],
  },
  {
    tier: "PREVIOUS ROUND",
    dates: "Feb 2024 – Aug 2024",
    role: "Software Engineer Intern · Backend",
    company: "Logicea",
    brand: "#7b3fe4",
    accent: "#b39bff",
    logo: "logicea",
    bullets: [
      "Built RESTful APIs with Spring Boot and MySQL.",
      "Integrated and tested third-party APIs, eg. Stripe.",
      "Worked in a large Agile team on backend development and deployment.",
    ],
  },
];

/** Pixel motif drawn in each project's art box (see ProjectsCard). */
export type ProjectArt = "parcels" | "whistle" | "network";

export type Project = {
  title: string;
  /** Label on the coloured strip above the project. */
  tag: string;
  tagline: string;
  desc: string;
  note?: string;
  chips: string[];
  /** Strip colour, and the text colour on it. */
  brand: string;
  onBrand: string;
  /** Readable tint of the brand on the dark panel: title, chips, art frame. */
  accent: string;
  art: ProjectArt;
  /** Two-line caption under the art. */
  artLabel: [string, string];
  src?: string;
  live?: string;
  logo?: LogoName;
};

/** Every project, in order. Each gets its own colour so no two read alike. */
export const PROJECTS: Project[] = [
  {
    title: "myField",
    tag: "SATELLITE SCREENING",
    tagline: "Satellite screening for wildfire plot clearing",
    desc: "Greek landowners must declare each spring that they've cleared dry brush from their plots. myField helps Civil Protection decide which plots to inspect first with Sentinel-2 imagery",
    note: "Built for the GenAI Summit Hackathon.",
    chips: ["Next.js", "MapLibre GL", "Sentinel-2", "Turf.js"],
    brand: "#b8430f",
    onBrand: "#ffffff",
    accent: "#ff9a4d",
    art: "parcels",
    artLabel: ["NDVI SCAN", "1 PLOT FLAGGED"],
    src: "https://github.com/panagiotiskon/myField-GenAISummitHackathon",
    live: "https://myfield-vert.vercel.app/",
    logo: "myfield",
  },
  {
    title: "FencingRef",
    tag: "★ FEATURED BOUT",
    tagline: "AI fencing referee assistant",
    desc: "Ask a question; every answer cites the rules it stands on.",
    note: "Delivered for the fencing community.",
    chips: ["Spring AI", "React", "Tailwind"],
    brand: "#ffc94a",
    onBrand: "#0b0a17",
    accent: "#ffc94a",
    art: "whistle",
    artLabel: ["WHISTLE", "MEETS TERMINAL"],
    live: LINKS.fencingRef,
    logo: "fencingref",
  },
  {
    title: "ConnectIn",
    tag: "FULL STACK",
    tagline: "A professional network, LinkedIn-style",
    desc: "Profiles, connections, job listings and private messaging, with personalised recommendations from Matrix Factorization.",
    note: "With a recommendation engine built in Spring Boot and MySQL, pre AI era.",
    chips: ["Spring Boot", "React", "MySQL"],
    brand: "#2c6e7d",
    onBrand: "#ffffff",
    accent: "#6fd3e0",
    art: "network",
    artLabel: ["WHO TO", "KNOW NEXT"],
    src: "https://github.com/panagiotiskon/ConnectIn-V2",
    live: "https://connectinapp.xyz",
    logo: "connectin",
  },
];

export type MilestoneKind = "fence" | "code" | "life" | "both";
export type Milestone = { when: string; kind: MilestoneKind; icon: IconName; title: string; note: string };

/**
 * One continuous run, oldest first. `when` is a year where it's known, otherwise an honest era
 * label: swap those for real years when you have them. Keep `note` short (about 50 chars):
 * on desktop each label is only two timeline columns wide.
 */
export const TIMELINE: Milestone[] = [
  { when: "2008", kind: "fence", icon: "blade", title: "First sabre", note: "Starts sabre fencing. 18 years on, still at it." },
  { when: "School years", kind: "life", icon: "medal", title: "5th Experimental Physics Olympiad", note: "Plus contests in programming, astrophysics and business." },
  { when: "2016", kind: "fence", icon: "armor", title: "Goes professional", note: "First of ten seasons at the top level of sabre." },
  { when: "Pro career", kind: "fence", icon: "trophy", title: "5× Panhellenic Champion", note: "Greek sabre titles, and a top-64 world ranking." },
  { when: "Uni years", kind: "code", icon: "diploma", title: "B.Sc. Computer Science", note: "University of Athens, with hackathons on the side." },
  { when: "2023", kind: "fence", icon: "globe", title: "European Games & Worlds", note: "Represents Greece at both senior events." },
  { when: "Feb 2024", kind: "code", icon: "term", title: "Backend intern, Logicea", note: "Builds REST APIs with Spring Boot and MySQL." },
  { when: "Dec 2024", kind: "code", icon: "term", title: "Software Engineer, Kotsovolos", note: "React and Node.js for web and in-store retail apps." },
  { when: "Ongoing", kind: "fence", icon: "whistle", title: "International Referee", note: "Certified to officiate high-level tournaments." },
  { when: "Live", kind: "both", icon: "badgeG", title: "FencingRef ships", note: "An AI referee assistant. Where the two worlds meet." },
  { when: "2026", kind: "fence", icon: "star", title: "Mediterranean Games", note: "Represents Greece in Taranto." },
];

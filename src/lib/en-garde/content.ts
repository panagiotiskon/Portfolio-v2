// All portfolio copy lives here so it can be edited without touching the engine.

export const LINKS = {
  github: "https://github.com/panagiotiskon",
  linkedin: "https://www.linkedin.com/in/panagiotis-kontoeidis/",
  fencingRef: "https://fencingref.xyz/",
};

export const RESUME_PREFILL =
  "Hello! I saw your portfolio and would love to request a copy of your resume. Thanks!";

/** Round names, indexed 1..7 (index 0 unused). */
export const RN = ["", "TITLE", "ABOUT", "SKILLS", "EXPERIENCE", "PROJECTS", "TROPHIES", "CONTACT"];
export const RF = ["", "TITLE SCREEN", "CHARACTER SELECT", "INVENTORY", "CAREER PATH", "TOURNAMENT", "TROPHY ROOM", "FINAL ROUND"];
export const RS = ["", "TTL", "ABT", "SKL", "EXP", "PRJ", "TRO", "CON"];
/** Plain-language "what's in this round", shown on the round-intro screen. */
export const RD = [
  "",
  "",
  "Who I am, on and off the piste",
  "The tools and tech I fight with",
  "Where I've worked so far",
  "Things I've designed and built",
  "The road so far, on and off the piste",
  "Get in touch — one last touch to win",
];

export type Run = { t: string; g: boolean };
export type Bio = { tag: string; runs: Run[] };

/** `[[text]]` marks a highlighted (gold) run. */
const parseRuns = (s: string): Run[] =>
  s
    .split(/(\[\[.*?\]\])/)
    .filter(Boolean)
    .map((t) => (t.startsWith("[[") ? { t: t.slice(2, -2), g: true } : { t, g: false }));

export const BIO: Bio[] = [
  [
    "TOUCHÉ 1 · THE DEVELOPER",
    "Computer Science graduate from the University of Athens, building web applications across the full stack. I started competing in programming and science contests in high school and kept sharpening my skills through hackathons and seminars at university.",
  ],
  [
    "TOUCHÉ 2 · THE FENCER",
    "18 years in sabre fencing, 10 of them at a professional level. I've represented Greece at the 2026 [[Mediterranean Games]], the 2023 [[European Games]], and European and World Championships. I'm also a certified [[International Fencing Referee]], officiating high-level tournaments.",
  ],
].map(([tag, s]) => ({ tag, runs: parseRuns(s) }));

export const PROFILE = [
  ["NAME", "Panagiotis Kontoeidis"],
  ["CLASS", "Developer"],
  ["WEAPON", "Sabre"],
  ["ORIGIN", "University of Athens"],
] as const;

export const STATS: [string, number][] = [
  ["FRONTEND", 10],
  ["BACKEND", 8],
  ["CREATIVITY", 9],
  ["DRIVE TO SUCCEED", 10],
  ["TEAMWORK", 10],
  ["COMMUNICATION", 9],
  ["ADAPTABILITY", 8],
];

export type IconName =
  | "blade" | "armor" | "shield" | "scroll" | "trophy" | "star" | "medal" | "globe" | "whistle"
  | "diploma" | "badge" | "badgeG" | "orb" | "orbG" | "bug" | "lock" | "term" | "inbox";

export const EQUIPPED: [string, IconName][] = [
  ["React", "armor"],
  ["Redux-Observables", "armor"],
  ["Node.js", "armor"],
  ["Java + Spring Boot", "blade"],
  ["MySQL", "shield"],
];
export const BACKPACK: [string, IconName][] = [
  ["JavaScript", "blade"],
  ["Spring AI", "armor"],
  ["Tailwind", "armor"],
  ["REST APIs", "scroll"],
  ["Microservices", "scroll"],
];
export const ABILITIES = [
  "Communication & Presenting",
  "Teamwork",
  "Composure Under Pressure",
  "Strategic Thinking",
  "Discipline",
  "Fair Judgment",
];

export type Experience = {
  tier: string;
  dates: string;
  role: string;
  company: string;
  brand: string;
  accent: string;
  current?: boolean;
  foot: string;
  bullets: string[];
};

export const EXP: Experience[] = [
  {
    tier: "NODE 1 · CURRENT BOUT",
    dates: "Dec 2024 – Present",
    role: "Software Engineer · ReactJS & NodeJS",
    company: "Kotsovolos · PPC Group",
    brand: "#b0122c",
    accent: "#ff6b7f",
    current: true,
    foot: "NOW PLAYING ▸ NEXT: THE FINAL",
    bullets: [
      "Build and optimize the Kotsovolos website and the KRetail B2B/B2C app for in-store sales agents (ReactJS, Redux-Observables).",
      "Add features and improve performance in the NodeJS microservices layer.",
      "Work in a cross-functional team, keeping frontend and backend tightly integrated.",
    ],
  },
  {
    tier: "NODE 2 · PREVIOUS ROUND",
    dates: "Feb 2024 – Aug 2024",
    role: "Software Engineer Intern · Backend",
    company: "Logicea",
    brand: "#7b3fe4",
    accent: "#b39bff",
    foot: "▲ ADVANCED",
    bullets: [
      "Built RESTful APIs with Spring Boot and MySQL.",
      "Integrated and tested third-party APIs.",
      "Worked in a large team on backend development and deployment.",
    ],
  },
];

export const FEATURED_CHIPS = ["Spring AI", "React", "Tailwind"];

export type Project = { title: string; desc: string; chips: string[]; src: string; live?: string };

export const PROJ: Project[] = [
  {
    title: "ConnectIn",
    desc: "LinkedIn-style professional network with profiles, connections, job listings, private messaging, and personalized recommendations using Matrix Factorization.",
    chips: ["Spring Boot", "React", "MySQL"],
    src: "https://github.com/panagiotiskon/ConnectIn-V2",
    live: "https://connectinapp.xyz",
  },
  {
    title: "MiniJava Compiler",
    desc: "Compiler for a subset of Java that runs semantic analysis and generates intermediate code.",
    chips: ["Java", "Visitor Pattern"],
    src: "https://github.com/panagiotiskon/Minijava-Compiler",
  },
];

/** What a milestone is about. Drives its colour on the timeline; "both" = fencing meets code. */
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

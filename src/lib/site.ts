import { LINKS } from "@/lib/en-garde/content";

// Set NEXT_PUBLIC_SITE_URL to the live domain. Vercel prod URL is the fallback.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

export const SITE = {
  name: "Panagiotis Kontoeidis",
  title: "Panagiotis Kontoeidis · Full Stack Developer",
  shortTitle: "FENCE_THE_BUG.EXE",
  description:
    "Full stack developer from Athens, Greece. I build web apps with React, Node.js and Java + Spring Boot, from fast frontends to REST APIs and microservices. See my experience, projects and skills.",
  jobTitle: "Software Engineer",
  keywords: [
    "Panagiotis Kontoeidis",
    "full stack developer",
    "software engineer",
    "React",
    "Node.js",
    "Spring Boot",
    "Java",
    "portfolio",
    "Athens",
    "Greece",
    "web developer",
    "TypeScript",
    "JavaScript",
    "Redux",
    "MySQL",
    "REST APIs",
    "microservices",
  ],
  sameAs: [LINKS.github, LINKS.linkedin],
};

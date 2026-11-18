# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Tech recruiters** looking to fill frontend or full-stack roles. They skim fast, often on a phone, and need role, stack, experience and a way to make contact in seconds.
- **Engineering leads and hiring managers** who judge craft. They are likely to open the projects and GitHub and to notice detail in how the site itself is built.

## Product Purpose

The personal portfolio of Panagiotis Kontoeidis, a software engineer (React/Redux frontend, Java/Spring Boot backend) who is also a professional sabre fencer. The site exists to land engineering conversations.

A visit counts as a success when the visitor does one or more of these:
1. reaches out by email from the victory (contact) card;
2. opens the work: FencingRef, myField, ConnectIn, GitHub;
3. remembers the site, because the fencing bout is memorable and gets shared.

## Positioning

"The developer who fences." The whole portfolio is played as a scroll-driven pixel-art sabre bout ("FENCE_THE_BUG.EXE"): each scroll beat is a lunge, and each touch reveals the next card. A generic dev portfolio could not truthfully copy this. It rests on 18 years of real sabre (10 at a professional level, national team, international referee), and the site's engineering is itself a demonstration of frontend craft.

## Operating Context

- One page, read top to bottom by scrolling. The bout is a 5-touch pool bout that ends 5–4, and the HUD shows round, score and a section menu.
- Visitors arrive from CVs, LinkedIn, GitHub and direct shares. Both desktop and phone use matter; phones (< 600px) get their own HUD and type scale.

## Capabilities and Constraints

- **The fencing bout is the core mechanism and must not be removed.** One card per touch. New jobs or projects go inside existing cards, not into new touches.
- **Static only.** The site is a Next.js static export to GitHub Pages, with no backend and no forms. Contact happens through direct links (email, copy, LinkedIn, GitHub).
- All copy lives in `src/lib/en-garde/content.ts`.
- **Resume download:** built, but hidden until `LINKS.resume` is set. No resume file is on hand.
- Any motion must respect reduced motion, from both the OS setting and the `forceReducedMotion` prop (repo convention, see CLAUDE.md).

## Brand Commitments

- **Pixel-art / 8-bit world is binding:** Press Start 2P and VT323 type, the CRT effect, and game framing (rounds, HUD, "character select", "trophy room").
- **Voice:** game-flavoured labels around plain, first-person, factual bio and project copy.
- **Name and title:** FENCE_THE_BUG.EXE. Tagline: "The developer who fences".

## Evidence on Hand

- **Real jobs:** Kotsovolos · PPC Group (Dec 2024 – present), Logicea (Feb–Aug 2024).
- **Real projects with live or source links:** FencingRef (fencingref.xyz), myField (GenAI Summit Hackathon), ConnectIn.
- **Real fencing record:** Greece at the 2026 Mediterranean Games, the 2023 European Games, and European and World Championships. 5× Panhellenic Champion, top-64 world ranking, certified International Fencing Referee.
- **Assets:** portrait at `public/portrait.png`; company and project logos as pixel grids in `logos.ts`.
- **Absent, so never invent:** testimonials, client names beyond the employers above, metrics or impact numbers, and a resume file.

## Product Principles

1. **Contact is never more than one step away.** Recruiters must find role, stack and email fast, even inside the game.
2. **The game serves the story.** Every playful layer must still carry real facts about the work and the person.
3. **The build is the proof.** Performance, polish and detail are part of the pitch to engineering leads.
4. **Truth only.** Use real dates, real titles and real results. Leave a gap rather than inflate it.

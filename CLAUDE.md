# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Node 22 (`.nvmrc`; needs 20.9+).

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm start            # serve the build
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npx tsc --noEmit     # type check (no script for it)
```

There is no test suite.

## Stack notes

Next.js 16 (App Router), React 19, Tailwind CSS v4 via `@tailwindcss/turbopack`. `next.config.ts` turns on `cacheComponents` and `partialPrefetching`. As AGENTS.md says, check `node_modules/next/dist/docs/` before using Next APIs. Path alias: `@/*` → `src/*`.

`NEXT_PUBLIC_SITE_URL` sets canonical URLs, sitemap, robots and OG. It falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then to localhost (`src/lib/site.ts`).

## Architecture

The whole site is one scroll-driven pixel-art fencing bout ("FENCE_THE_BUG.EXE"). `src/app/page.tsx` renders `<EnGarde />` plus Person JSON-LD. Each scroll beat the fencer lunges at a target, and each hit reveals the next portfolio card.

Two layers:

- **`src/lib/en-garde/`**: a framework-free engine. No React and no DOM access, except `scene.ts`/`arena.ts`, which draw onto a canvas context they are handed.
- **`src/components/en-garde/`**: React. `useEnGarde.ts` owns the scroll, resize and tick listeners, DOM measurement and canvas drawing. `EnGarde.tsx` composes the HUD, overlays and cards.

Data flows one way: `content` → `rounds` → `layout` → `model` → (`cards`, `hud`, `scene`) → components.

- `content.ts` holds **all** portfolio copy. Edit copy only here.
- `rounds.ts` gives each card a numeric id, built from content counts (0 = title, 1 = profile, then bios, inventory, jobs, featured, projects, trophies, contact). It also maps rounds 2–7 to the card ids they reveal. Adding a job or project extends the timeline, targets and score with no other change.
- `layout.ts` turns viewport size + measured card overflow into a timeline of segments (`title` / `trans` / `touche`), snap points and per-card slide windows. Rounds in the middle of the bout use a short `BRIEF` banner transition. The opening and final rounds use the full `CURTAIN`.
- `model.ts` is a pure function from (layout, scroll y, motion input) to the arena state: pose, bug, score, effects. `HIT` = 0.45 is the progress point in a touché where the blade lands.
- `cards.ts` gives each card's slide transform, opacity, glow and content scroll.

### Reading pauses (page y vs bout y)

Tall cards do not scroll on their own, because a nested scroller would fight page swipes. Instead, `layout.ts` puts a `Hold`: the bout stops at the card's resting point for `len` px of page scroll, and that scroll moves the card's content (`readOffset`). This gives two coordinate spaces:

- **page y**: `window.scrollY`, includes every pause.
- **bout y**: what segments, windows and snaps are written in, with pauses removed.

Convert with `boutY(L, pageY)` and `pageY(L, boutY)`. Mixing the two is the most likely source of scroll bugs. Overflow is measured from the DOM in `useEnGarde.ts`, so layout depends on rendered card heights. When the layout changes, the hook re-anchors the scroll so the user stays at the same bout position. When the mobile keyboard is open, cards fall back to native scroll (`read: null`).

### Props and accessibility

`<EnGarde pace="Snappy" | "Normal" | "Leisurely" crt forceReducedMotion />`. Reduced motion (OS setting or `forceReducedMotion`, which shows up as `m.red`) turns lunges and slides into fades. New motion must respect both, not just the Tailwind `motion-reduce:` variant. Tabbing into an off-screen card scrolls to it (a focusin handler in `useEnGarde.ts`). Phones (< 600px) get larger type, 44px tap targets and a menu sheet (`hud/MobileHud.tsx`).

## Where things live

- Design tokens (`bg-ink`, `text-gold`, `text-lime`, `font-pixel`, `font-vt`), the responsive type scale and pixel-border utilities: `src/app/globals.css`. Fonts (Press Start 2P, VT323) load in `layout.tsx`.
- Pixel sprites and dither helpers: `pixel.ts`. 12×12 icons rasterised to data URLs: `icons.ts`. Company logos as pixel grids: `logos.ts`.
- Portrait: `public/portrait.png` (square, shown at 128×128, pixelated).

## Known gap

The contact form only shows a success state. `submitContact` in `src/components/en-garde/useContactForm.ts` is not wired to a backend yet.

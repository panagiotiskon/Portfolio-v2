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
- `rounds.ts` gives each card a fixed id (0 = title, 1 = profile, then about, experience, projects, trophies, contact) and maps rounds 2–6 to them. The bout is a 5-touch pool bout: one touch per round, the bug ripostes after each of the first four, so it ends 5–4 with la belle at 4–4. A new job or project goes inside its existing card, not into a new touch.
- `layout.ts` turns viewport size + measured card overflow into a timeline of segments (`title` / `trans` / `touche`), snap points and per-card slide windows. Every round change is a short `TRANS` walk past the round sign: no interstitial screen, the HUD carries the round. The final card (contact) slides in only after the winning hit.
- `model.ts` is a pure function from (layout, scroll y, motion input) to the arena state: pose, bug, score, effects. `HIT` = 0.45 (defined in `layout.ts`) is the progress point in a touché where the blade lands.
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

## Contact

There is no form. The victory card (`cards/VictoryCard.tsx`) shows direct links. `LINKS.email` and `LINKS.resume` in `content.ts` turn on the email/copy buttons and the resume download (title + victory cards); both are hidden while unset.

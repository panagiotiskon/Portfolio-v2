# FENCE_THE_BUG.EXE — Portfolio v2

A scroll-driven, pixel-art fencing bout. Each scroll beat the fencer lunges at a target; every hit reveals the next portfolio card.

Built with Next.js (App Router), React, TypeScript and Tailwind CSS v4.

## Getting started

Requires Node 20.9+ (`.nvmrc` pins 22).

```bash
nvm use
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://example.com`) for canonical URLs, sitemap, robots.txt and Open Graph.
On Vercel it falls back to the production domain.

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx            fonts (Press Start 2P, VT323), metadata
│  ├─ page.tsx              renders <EnGarde /> + Person JSON-LD
│  ├─ robots.ts, sitemap.ts robots.txt and sitemap.xml
│  ├─ opengraph-image.tsx   generated social share card
│  ├─ icon.png, apple-icon.png
│  └─ globals.css           design tokens, responsive type scale, pixel-border utilities
├─ lib/site.ts             site URL + SEO copy
├─ lib/en-garde/            framework-free engine (no React)
│  ├─ content.ts            ALL portfolio copy: bio, stats, skills, jobs, projects, trophies, links
│  ├─ rounds.ts             card ids + which cards each round reveals (derived from content)
│  ├─ layout.ts             viewport → scroll timeline (segments, snap points, card windows)
│  ├─ model.ts              scroll position → animation state (pose, bug, score, effects)
│  ├─ cards.ts              per-card slide position and lock/reveal state
│  ├─ hud.ts                HUD view-model (round, score, lamps, section menu)
│  ├─ scene.ts              draws one arena frame + the sabre-slash round wipe onto canvas
│  ├─ arena.ts              backdrop: floodlight rig, dithered lighting, crowd, LED ribbon, piste
│  ├─ pixel.ts              pixel-art primitives, dither/hash helpers and sprites (fencer, bug, props)
│  └─ icons.ts              12×12 pixel icons, rasterised to data URLs
└─ components/en-garde/
   ├─ EnGarde.tsx           top-level client component; composes everything
   ├─ useEnGarde.ts         scroll/resize/tick listeners, layout + model, canvas drawing
   ├─ useContactForm.ts     contact form state + submit (see TODO)
   ├─ ui.tsx                shared primitives: Panel, CardSlot, Lockable, PixelIcon, buttons
   ├─ ArenaOverlays.tsx     VICTORY label, round banner, TOUCHÉ flash, scroll hint, CRT
   ├─ cards/                one component per card type
   └─ hud/                  desktop and mobile HUDs
```

Data flows one way: `content` → `layout` → `model` → (`cards`, `hud`, `scene`) → React components.

## Common edits

- **Change copy / add a job, project, trophy or skill**: edit `src/lib/en-garde/content.ts`. The scroll timeline,
  targets on the piste and score extend automatically.
- **Portrait**: replace `public/portrait.png` (square; shown at 128×128 with pixelated scaling).
- **Colours / fonts**: tokens live in `src/app/globals.css` (`bg-ink`, `text-gold`, `text-lime`, `font-pixel`, `font-vt`, …).
- **Pacing**: `<EnGarde pace="Snappy" | "Normal" | "Leisurely" />` in `src/app/page.tsx`.
  Other props: `crt` (scanlines on by default), `forceReducedMotion`.

## Accessibility

- `prefers-reduced-motion` turns lunges/slides into fades.
- Tabbing into a card that is off screen jumps the scroll to it.
- Phones (< 600px) get larger type, 44px tap targets and a menu sheet.

## TODO

- The contact form only shows the success state. Wire `submitContact` in
  `src/components/en-garde/useContactForm.ts` to a backend (e.g. a Route Handler that sends email).

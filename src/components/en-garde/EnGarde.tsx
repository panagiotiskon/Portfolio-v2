"use client";

import { useCallback, useState, type CSSProperties, type RefObject } from "react";
import { cardFrame, cardReveal, cardScroll, isCardHit, segProgress } from "@/lib/en-garde/cards";
import { BACKPACK, EQUIPPED } from "@/lib/en-garde/content";
import { computeHud } from "@/lib/en-garde/hud";
import { getIcons } from "@/lib/en-garde/icons";
import { TRANS, roundSnap, type Layout } from "@/lib/en-garde/layout";
import { HIT, clamp, toucheFlashPos, type Model } from "@/lib/en-garde/model";
import { CARD } from "@/lib/en-garde/rounds";
import { CrtScanlines, ScrollHint, ToucheFlash, VictoryLabel } from "./ArenaOverlays";
import { AboutCard, type ItemAnim } from "./cards/AboutCard";
import { ExperienceCard } from "./cards/ExperienceCard";
import { ProfileCard } from "./cards/ProfileCard";
import { ProjectsCard } from "./cards/ProjectsCard";
import { TitleCard } from "./cards/TitleCard";
import { TrophyCard } from "./cards/TrophyCard";
import { VictoryCard } from "./cards/VictoryCard";
import { DesktopHud } from "./hud/DesktopHud";
import { MobileHud } from "./hud/MobileHud";
import { IconsContext } from "./ui";
import { jumpTo, useEnGarde, type EnGardeOptions } from "./useEnGarde";

export type EnGardeProps = EnGardeOptions & {
  /** CRT scanline overlay. */
  crt?: boolean;
};

/**
 * FENCE_THE_BUG.EXE — a scroll-driven fencing bout. Each scroll "beat" the fencer lunges at a
 * target and the hit reveals the next portfolio card.
 */
export default function EnGarde({ crt = true, ...options }: EnGardeProps) {
  const { rootRef, hudRef, sceneRef, scrollerRef, inner, layout, model, scroll, by, tick, keyboard } = useEnGarde(options);
  const [menuOpen, setMenuOpen] = useState(false);

  const L = layout;
  // icons are rasterised on a canvas, so only once we're on the client (layout exists)
  const icons = L ? getIcons() : null;
  const onJump = useCallback(
    (round: number) => {
      setMenuOpen(false);
      if (L) jumpTo(L, roundSnap(L, round));
    },
    [L],
  );

  return (
    <div ref={rootRef} className="relative font-vt text-[22px]/[1.2] text-fg">
      {L && model && icons ? (
        <IconsContext.Provider value={icons}>
          <Arena
            L={L}
            m={model}
            y={by}
            pageY={scroll.y}
            moving={scroll.moving}
            tick={tick}
            keyboard={keyboard}
            hudRef={hudRef}
            sceneRef={sceneRef}
            scrollerRef={scrollerRef}
            inner={inner}
            crt={crt}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            onJump={onJump}
          />
        </IconsContext.Provider>
      ) : (
        <main className="fixed inset-0 bg-ink" />
      )}
    </div>
  );
}

type ArenaProps = {
  L: Layout;
  m: Model;
  /** Bout y (drives the arena). */
  y: number;
  /** Raw page scroll (drives card reading). */
  pageY: number;
  moving: boolean;
  tick: number;
  keyboard: ReturnType<typeof useEnGarde>["keyboard"];
  hudRef: RefObject<HTMLElement | null>;
  sceneRef: RefObject<HTMLCanvasElement | null>;
  scrollerRef: (el: HTMLDivElement | null) => void;
  /** Touch device: the bout scrolls an inner box, not the window (see useEnGarde). */
  inner: boolean;
  crt: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onJump: (round: number) => void;
};

function Arena({ L, m, y, pageY, moving, tick, keyboard, hudRef, sceneRef, scrollerRef, inner, crt, menuOpen, onToggleMenu, onJump }: ArenaProps) {
  const { S } = L;
  const red = m.red;

  const blinkOn = red || (tick >> 1) % 2 === 0;
  const frame = (id: number, maxW: number) => ({ ...cardFrame(L, m, y, id, maxW), ...cardScroll(L, pageY, id, !!keyboard) });
  const card = (id: number, maxW: number) => ({ frame: frame(id, maxW), reveal: cardReveal(L, m, id) });

  // area between the HUD and the fencer where cards live (shrinks with the mobile keyboard)
  const areaTop = L.areaTop + (keyboard ? keyboard.top : 0);
  const areaH = keyboard ? Math.max(160, Math.min(L.areaH, keyboard.h - L.areaTop - 8)) : L.areaH;

  // profile stat bars fill in once the profile card is in on round 2
  const statFill = red ? 1 : clamp((segProgress(m, 1) - TRANS.openE) / (1 - TRANS.openE));

  // skill items are always shown; right after the hit they "equip" with a quick staggered pop
  const invProgress = segProgress(m, L.segOf[CARD.about]);
  const itemTotal = EQUIPPED.length + BACKPACK.length;
  // stable while the about card is parked off screen, so its memo holds
  const itemAnim = useCallback(
    (n: number): ItemAnim => {
      if (red) return { opacity: 1, scale: 1 };
      const u = clamp((invProgress - HIT - (0.06 * n) / itemTotal) / 0.03);
      return { opacity: 1, scale: 1 + 0.14 * Math.sin(Math.PI * u) };
    },
    [red, invProgress, itemTotal],
  );

  // overlays
  const cs = m.s;
  const fs = Math.round(m.ox - m.camX);
  const flash = toucheFlashPos(L, m);
  const maxY = L.end;
  const atRest =
    cs.kind === "title" || (cs.kind === "touche" && ((m.q >= 0.5 && m.q < 0.62) || m.q >= 0.97)) || (cs.kind === "trans" && m.q >= 0.97);
  const hud = computeHud(L, m, y, tick);
  const score = `${m.me}–${m.bug}`;
  // the current job's card pulses once its target is hit
  const glow = isCardHit(L, m, CARD.experience) ? (red || tick % 4 < 2 ? 30 : 16) : null;

  // scroll track: provides the scroll height and snap points. With an inner scroller the sticky
  // arena already fills the first screen, so the track is one screen shorter.
  const track = (
    <div aria-hidden="true" className="pointer-events-none relative" style={{ height: inner ? L.trackH - L.H : L.trackH }}>
      {/* a reading pause is one snap area taller than the viewport: free scrolling inside it */}
      {L.snaps.map(({ y: top, span }) => (
        <div key={top} className="absolute left-0 w-px snap-start" style={{ top, height: span ? span + L.H : 1 }} />
      ))}
    </div>
  );

  const arena = (
    <>
      {!inner && track}
      {/* clip, not hidden: a hidden-overflow box is still scrollable, and focusing a control in a
          card parked off screen would scroll the whole arena sideways */}
      {/* inner: sticky, not fixed. A fixed child would not scroll its scroll-box ancestor on touch. */}
      <main className={`${inner ? "sticky top-0 h-full" : "fixed inset-0"} overflow-clip bg-ink`}>
        <div className="absolute inset-0" style={{ transform: m.shake ? `translate(${S}px,${-S}px)` : "none" }}>
          <canvas ref={sceneRef} aria-hidden="true" className="pixelated absolute top-0 left-0" style={{ width: L.Wa * S, height: L.Ha * S }} />
          <CrtScanlines on={crt} />
          <VictoryLabel
            x={(fs + 24) * S}
            y={(L.pisteTop - 40 - Math.round(m.podK * L.lift) + 6) * S - 12}
            // phones: the card sits right above the podium and its heading already says VICTORY
            opacity={!L.mob && m.podK > 0.6 ? clamp((m.podK - 0.6) / 0.4) : 0}
            score={score}
          />

          <div className="absolute inset-x-0" style={{ top: areaTop, height: areaH, "--area-h": `${areaH}px` } as CSSProperties}>
            <TitleCard frame={frame(CARD.title, 960)} blinkOn={blinkOn} still={red} />
            <ProfileCard frame={frame(CARD.profile, 900)} fill={statFill} />
            <AboutCard {...card(CARD.about, 920)} itemAnim={itemAnim} />
            <ExperienceCard {...card(CARD.experience, 780)} glow={glow} />
            <ProjectsCard {...card(CARD.projects, 980)} />
            <TrophyCard {...card(CARD.trophies, 980)} />
            <VictoryCard frame={frame(CARD.contact, 640)} score={score} />
          </div>
        </div>

        <ToucheFlash x={flash.x} y={flash.y} opacity={flash.op} scale={flash.sc} />
        <ScrollHint visible={!moving && blinkOn && y < maxY - 20 && atRest} />

        {L.mob ? (
          <MobileHud
            hud={hud}
            hudRef={hudRef}
            menuOpen={menuOpen}
            menuTop={L.areaTop - 14 + 3}
            onToggleMenu={onToggleMenu}
            onJump={onJump}
            red={red}
          />
        ) : (
          <DesktopHud hud={hud} hudRef={hudRef} onJump={onJump} />
        )}

        {/* bout progress: a quiet strip along the bottom edge */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[env(safe-area-inset-bottom)] z-3 h-0.75 bg-white/4">
          {/* scaled, not resized: no layout per scroll frame. The 4px head is a sibling so it isn't squashed. */}
          <div className="absolute inset-0 origin-left bg-lime/35" style={{ transform: `scaleX(${hud.xp})` }} />
          <div className="absolute inset-0" style={{ transform: `translateX(${hud.xp * 100}%)` }}>
            <span className="absolute inset-y-0 -left-1 w-1 bg-lime/80" />
          </div>
        </div>
      </main>
      {inner && track}
    </>
  );

  return inner ? (
    <div ref={scrollerRef} className="fixed inset-0 overflow-y-auto overscroll-none [scrollbar-width:none]">
      {arena}
    </div>
  ) : (
    arena
  );
}

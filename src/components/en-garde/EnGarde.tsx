"use client";

import { useCallback, useState, type CSSProperties, type RefObject } from "react";
import { cardFrame, cardReveal, isCardHit, segProgress } from "@/lib/en-garde/cards";
import { ABILITIES, BACKPACK, BIO, EQUIPPED, EXP, PROJ, RD, RESUME_PREFILL, RF, RN, RS } from "@/lib/en-garde/content";
import { computeHud } from "@/lib/en-garde/hud";
import { getIcons } from "@/lib/en-garde/icons";
import { CURTAIN, roundSnap, type Layout } from "@/lib/en-garde/layout";
import { HIT, clamp, toucheFlashPos, type Model } from "@/lib/en-garde/model";
import { CARD, TOTAL_ROUNDS } from "@/lib/en-garde/rounds";
import { CrtScanlines, RoundBanner, RoundIntro, ScrollHint, ToucheFlash, VictoryLabel } from "./ArenaOverlays";
import { BioCard } from "./cards/BioCard";
import { ContactCard } from "./cards/ContactCard";
import { ExperienceCard } from "./cards/ExperienceCard";
import { FeaturedCard } from "./cards/FeaturedCard";
import { InventoryCard, type ItemAnim } from "./cards/InventoryCard";
import { ProfileCard } from "./cards/ProfileCard";
import { ProjectCard } from "./cards/ProjectCard";
import { TitleCard } from "./cards/TitleCard";
import { TrophyCard } from "./cards/TrophyCard";
import { DesktopHud } from "./hud/DesktopHud";
import { MobileHud } from "./hud/MobileHud";
import { IconsContext } from "./ui";
import { useContactForm } from "./useContactForm";
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
  const { rootRef, hudRef, sceneRef, wipeRef, layout, model, scroll, tick, keyboard } = useEnGarde(options);
  const contact = useContactForm();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inspect, setInspect] = useState<string | null>(null);

  const L = layout;
  // icons are rasterised on a canvas, so only once we're on the client (layout exists)
  const icons = L ? getIcons() : null;
  const { prefill } = contact;
  const onResume = useCallback(() => {
    prefill(RESUME_PREFILL);
    setMenuOpen(false);
    if (L) jumpTo(L.cardSnap[CARD.contact]);
  }, [prefill, L]);
  const onJump = useCallback(
    (round: number) => {
      setMenuOpen(false);
      if (L) jumpTo(roundSnap(L, round));
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
            y={scroll.y}
            moving={scroll.moving}
            tick={tick}
            keyboard={keyboard}
            hudRef={hudRef}
            sceneRef={sceneRef}
            wipeRef={wipeRef}
            crt={crt}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            inspect={inspect}
            onInspect={setInspect}
            contact={contact}
            onResume={onResume}
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
  y: number;
  moving: boolean;
  tick: number;
  keyboard: ReturnType<typeof useEnGarde>["keyboard"];
  hudRef: RefObject<HTMLElement | null>;
  sceneRef: RefObject<HTMLCanvasElement | null>;
  wipeRef: RefObject<HTMLCanvasElement | null>;
  crt: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  inspect: string | null;
  onInspect: (s: string) => void;
  contact: ReturnType<typeof useContactForm>;
  onResume: () => void;
  onJump: (round: number) => void;
};

function Arena({ L, m, y, moving, tick, keyboard, hudRef, sceneRef, wipeRef, crt, menuOpen, onToggleMenu, inspect, onInspect, contact, onResume, onJump }: ArenaProps) {
  const { W, S } = L;
  const red = m.red;
  const blinkOn = (tick >> 1) % 2 === 0;
  const card = (id: number, maxW: number) => ({ frame: cardFrame(L, m, y, id, maxW), reveal: cardReveal(L, m, id) });

  // area between the HUD and the fencer where cards live (shrinks with the mobile keyboard)
  const areaTop = L.areaTop + (keyboard ? keyboard.top : 0);
  const areaH = keyboard ? Math.max(160, Math.min(L.areaH, keyboard.h - L.areaTop - 8)) : L.areaH;

  // profile stat bars fill in once the curtain opens on round 2
  const statFill = red ? 1 : clamp((segProgress(m, 1) - CURTAIN.openE) / (1 - CURTAIN.openE));

  // inventory items are always shown; right after the hit they "equip" with a quick staggered pop
  const invProgress = segProgress(m, L.segOf[CARD.inventory]);
  const itemTotal = EQUIPPED.length + BACKPACK.length + ABILITIES.length;
  // stable while the inventory card is parked off screen, so its memo holds
  const itemAnim = useCallback(
    (n: number): ItemAnim => {
      if (red) return { opacity: 1, scale: 1 };
      const u = clamp((invProgress - HIT - (0.06 * n) / itemTotal) / 0.03);
      return { opacity: 1, scale: 1 + 0.14 * Math.sin(Math.PI * u) };
    },
    [red, invProgress, itemTotal],
  );
  const cw = Math.min(960, W - (L.mob ? 32 : 24)) - 44;
  const rowW = W < 620 ? cw : cw - 120;
  const eqW = L.mob ? Math.floor((cw - 30) / 4) : Math.max(96, Math.floor((rowW - 48) / 5));
  const bpW = L.mob ? eqW : Math.max(90, Math.floor(eqW * 0.86));

  // overlays
  const cs = m.s;
  const fs = Math.round(m.ox - m.camX);
  const flash = toucheFlashPos(L, m);
  const maxY = L.trackH - L.H;
  const atRest =
    cs.kind === "title" || (cs.kind === "touche" && ((m.q >= 0.5 && m.q < 0.62) || m.q >= 0.97)) || (cs.kind === "trans" && m.q >= 0.97);
  const inIntro = m.intro >= 0;
  const hud = computeHud(L, m, y, tick);

  return (
    <>
      {/* scroll track: provides the document height and snap points */}
      <div aria-hidden="true" className="pointer-events-none relative" style={{ height: L.trackH }}>
        {L.snaps.map((top) => (
          <div key={top} className="absolute left-0 size-px snap-start" style={{ top }} />
        ))}
      </div>

      <main className="fixed inset-0 overflow-hidden bg-ink">
        <div className="absolute inset-0" style={{ transform: m.shake ? `translate(${S}px,${-S}px)` : "none" }}>
          <canvas ref={sceneRef} aria-hidden="true" className="pixelated absolute top-0 left-0" style={{ width: L.Wa * S, height: L.Ha * S }} />
          <VictoryLabel
            x={(fs + 24) * S}
            y={(L.pisteTop - 40 - Math.round(m.podK * L.lift) + 6) * S - 12}
            opacity={m.podK > 0.6 ? clamp((m.podK - 0.6) / 0.4) : 0}
          />

          <div className="absolute inset-x-0" style={{ top: areaTop, height: areaH, "--area-h": `${areaH}px` } as CSSProperties}>
            <TitleCard
              frame={cardFrame(L, m, y, CARD.title, 960)}
              blinkOn={blinkOn}
              still={red}
              onResume={onResume}
            />
            <ProfileCard frame={cardFrame(L, m, y, CARD.profile, 900)} fill={statFill} />
            {BIO.map((bio, k) => (
              <BioCard key={bio.tag} card={CARD.bios[k]} bio={bio} {...card(CARD.bios[k], 780)} />
            ))}
            <InventoryCard
              {...card(CARD.inventory, 960)}
              itemAnim={itemAnim}
              equippedWidth={eqW}
              backpackWidth={bpW}
              inspect={inspect}
              onInspect={onInspect}
            />
            {EXP.map((exp, k) => {
              const id = CARD.exps[k];
              const glowing = exp.current && isCardHit(L, m, id);
              return <ExperienceCard key={exp.company} card={id} exp={exp} glow={glowing ? (tick % 4 < 2 ? 30 : 16) : null} {...card(id, 780)} />;
            })}
            <FeaturedCard {...card(CARD.featured, Math.min(980, W - 48))} />
            {PROJ.map((p, k) => (
              <ProjectCard key={p.title} card={CARD.projects[k]} project={p} bout={k + 2} {...card(CARD.projects[k], 700)} />
            ))}
            <TrophyCard {...card(CARD.trophies, 980)} />
            <ContactCard {...card(CARD.contact, 640)} form={contact} messageRows={L.areaH < 420 ? 2 : 3} />
            {cs.kind === "trans" && cs.brief && (
              <RoundBanner
                progress={m.banner}
                still={red}
                round={cs.to}
                total={TOTAL_ROUNDS}
                title={RF[cs.to] === RN[cs.to] ? RF[cs.to] : `${RF[cs.to]} · ${RN[cs.to]}`}
                blurb={RD[cs.to]}
              />
            )}
          </div>
        </div>

        <canvas ref={wipeRef} aria-hidden="true" className="pixelated pointer-events-none absolute top-0 left-0 z-4" style={{ width: L.Wa * S, height: L.Ha * S }} />
        <RoundIntro
          intro={m.intro}
          still={red}
          from={cs.kind === "trans" ? cs.from : m.round - 1}
          to={cs.kind === "trans" ? cs.to : m.round}
          total={TOTAL_ROUNDS}
          top={L.hudH}
          blinkOn={blinkOn}
          short={RS}
          long={RN}
          names={RF}
          blurbs={RD}
        />
        <ToucheFlash x={flash.x} y={flash.y} opacity={flash.op} scale={flash.sc} />
        <ScrollHint visible={!inIntro && !moving && blinkOn && y < maxY - 20 && atRest} />

        {L.mob ? (
          <MobileHud
            hud={hud}
            hudRef={hudRef}
            menuOpen={menuOpen}
            menuTop={L.areaTop - 14 + 3}
            onToggleMenu={onToggleMenu}
            onJump={onJump}
          />
        ) : (
          <DesktopHud hud={hud} hudRef={hudRef} onJump={onJump} />
        )}

        {/* bout progress: a quiet strip along the bottom edge */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-0.75 bg-white/4">
          {/* scaled, not resized: no layout per scroll frame. The 4px head is a sibling so it isn't squashed. */}
          <div className="absolute inset-0 origin-left bg-lime/35" style={{ transform: `scaleX(${hud.xp})` }} />
          <div className="absolute inset-0" style={{ transform: `translateX(${hud.xp * 100}%)` }}>
            <span className="absolute inset-y-0 -left-1 w-1 bg-lime/80" />
          </div>
        </div>

        <CrtScanlines on={crt} />
      </main>
    </>
  );
}

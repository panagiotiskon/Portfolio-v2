import { memo, type CSSProperties } from "react";
import type { CardFrame } from "@/lib/en-garde/cards";
import { LINKS } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, PixelIcon, pixelButton, sameCardProps } from "../ui";

type Props = { frame: CardFrame; blinkOn: boolean; still: boolean; onResume: () => void };

export const TitleCard = memo(function TitleCard({ frame, blinkOn, still, onResume }: Props) {
  const menu = pixelButton("menu", "flex text-ps-10");
  return (
    <CardSlot card={CARD.title} frame={frame}>
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <div className="font-pixel text-ps-10 tracking-[1px] whitespace-nowrap text-muted min-[400px]:tracking-[2px]">FENCE_THE_BUG.EXE · v1.0</div>
        <h1 className="m-0 flex flex-col items-center gap-4">
          <span className="font-pixel text-[clamp(14px,2.6vw,34px)]/[1.3] text-fg [text-shadow:4px_4px_0_var(--color-crimson)]">
            PANAGIOTIS KONTOEIDIS
          </span>
          <span className="font-pixel text-[clamp(min(26px,6.6vw),5.4vw,68px)]/none whitespace-nowrap text-lime [text-shadow:5px_5px_0_var(--color-lime-dk)]">
            FENCE THE BUG
          </span>
        </h1>
        <div className="flex flex-col gap-1 font-vt text-[clamp(22px,2.2vw,30px)]/[1.15]">
          <span>Welcome to</span>
          <span className="text-gold">A Full Stack Developer's Game</span>
        </div>
        <nav aria-label="Main menu" className="flex flex-wrap justify-center gap-3.5">
          <a href={LINKS.github} target="_blank" rel="noopener" className={menu}>
            <PixelIcon name="term" size={24} />
            GITHUB
          </a>
          <a href={LINKS.linkedin} target="_blank" rel="noopener" className={menu}>
            <PixelIcon name="inbox" size={24} />
            LINKEDIN
          </a>
          <button type="button" onClick={onResume} className={menu}>
            <PixelIcon name="scroll" size={24} />
            RESUME
          </button>
        </nav>
        <StartPrompt blinkOn={blinkOn} still={still} />
      </div>
    </CardSlot>
  );
}, sameCardProps);

/** Attract-mode prompt, as on an idle cabinet: a hard-blinking call to action over a steady "FREE PLAY". */
function StartPrompt({ blinkOn, still }: { blinkOn: boolean; still: boolean }) {
  return (
    <div aria-hidden="true" className="mt-1 flex flex-col items-center gap-2.5 font-pixel">
      <span
        className="arcade-outline text-[clamp(13px,1.15vw,17px)] tracking-[3px] text-gold"
        style={{ "--arcade-drop": "var(--color-gold-dk)", visibility: still || blinkOn ? "visible" : "hidden" } as CSSProperties}
      >
        SCROLL TO START
      </span>
      <span className="arcade-outline text-ps-9 tracking-[2px] text-fg/75">FREE PLAY</span>
    </div>
  );
}

import { memo } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import { FEATURED_CHIPS, LINKS } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Chip, Panel, PixelIcon, StatusTag, pixelButton, sameCardProps } from "../ui";

type Props = { frame: CardFrame; reveal: Reveal };

export const FeaturedCard = memo(function FeaturedCard({ frame, reveal }: Props) {
  return (
    <CardSlot card={CARD.featured} frame={frame}>
      <Panel
        accent="var(--color-gold)"
        extraShadow="0 0 0 8px #0b0a17, 0 0 0 11px #ff3b4e, 0 0 28px 10px rgba(255,201,74,.22)"
        className="gap-3.5 bg-panel-alt px-5.5 pt-4.5 pb-5.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-pixel text-ps-9">
          <div className="flex flex-wrap gap-2">
            <span className="bg-crimson px-2 py-1.5 text-white">BOUT 01</span>
            <span className="bg-gold px-2 py-1.5 text-ink">★ FEATURED BOUT</span>
          </div>
          <StatusTag reveal={reveal} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6.5 gap-y-4.5">
          <div aria-hidden="true" className="flex flex-[0_0_200px] flex-col items-center gap-3 bg-ink px-2.5 py-4 shadow-[0_0_0_3px_var(--color-edge)]">
            <div className="flex items-center gap-2.5">
              <PixelIcon name="whistle" size={56} />
              <span className="font-pixel text-[14px] text-gold">+</span>
              <PixelIcon name="term" size={56} />
            </div>
            <span className="text-center font-pixel text-ps-8/[1.6] text-muted">
              WHISTLE
              <br />
              MEETS TERMINAL
            </span>
          </div>
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <h3 className="m-0 flex flex-col gap-1.5">
              <span className="font-pixel text-[clamp(16px,1.9vw,22px)] text-gold">FencingRef</span>
              <span className="font-vt text-[22px] text-fg">AI fencing referee assistant</span>
            </h3>
            <p className="m-0 font-vt text-[22px]/[1.15] text-pretty">Ask a question; every answer cites the rules it stands on.</p>
            <p className="m-0 font-vt text-[20px]/[1.15] text-pretty text-muted">
              The bridge between my two worlds: the referee&apos;s whistle meets the terminal.
            </p>
            <div className="flex flex-wrap gap-2">
              {FEATURED_CHIPS.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-3.5">
              <a href={LINKS.fencingRef} target="_blank" rel="noopener" className={pixelButton("primary", "px-3.5 py-2.75 text-ps-10")}>
                PLAY LIVE ▶
              </a>
            </div>
          </div>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

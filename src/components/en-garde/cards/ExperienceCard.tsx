import { memo } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import type { Experience } from "@/lib/en-garde/content";
import { CardSlot, Panel, TitleRow, sameCardProps } from "../ui";

type Props = {
  card: number;
  frame: CardFrame;
  reveal: Reveal;
  exp: Experience;
  /** Glow radius for the "current job" pulse, or null for the regular drop shadow. */
  glow: number | null;
};

export const ExperienceCard = memo(function ExperienceCard({ card, frame, reveal, exp, glow }: Props) {
  return (
    <CardSlot card={card} frame={frame}>
      <Panel accent={exp.brand} extraShadow={glow != null ? `0 0 ${glow}px 6px ${exp.brand}99` : undefined} className="bg-panel">
        <div className="flex flex-wrap justify-between gap-2 px-4 py-2.5 font-pixel text-ps-9 text-white" style={{ background: exp.brand }}>
          <span>{exp.tier}</span>
          <span>{reveal.status}</span>
        </div>
        <div className="mx-5 mt-4 mb-5 flex flex-col gap-3">
          <TitleRow logo={exp.logo}>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="m-0 font-pixel text-[clamp(max(12px,var(--hmin,0px)),1.3vw,15px)]/[1.4]">{exp.role}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-vt text-[22px]">
                <span className="whitespace-nowrap" style={{ color: exp.accent }}>
                  @ {exp.company}
                </span>
                <span className="text-muted">{exp.dates}</span>
              </div>
            </div>
          </TitleRow>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {exp.bullets.map((t) => (
              <li key={t} className="grid grid-cols-[14px_minmax(0,1fr)] gap-1.5 font-vt text-[21px]/[1.12] text-pretty">
                <span aria-hidden="true" style={{ color: exp.accent }}>
                  ▸
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="font-pixel text-ps-8 text-muted">
            {exp.foot}
          </div>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

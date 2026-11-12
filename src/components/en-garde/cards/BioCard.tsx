import { memo } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import type { Bio } from "@/lib/en-garde/content";
import { CardSlot, Panel, StatusTag, sameCardProps } from "../ui";

type Props = { card: number; frame: CardFrame; reveal: Reveal; bio: Bio };

export const BioCard = memo(function BioCard({ card, frame, reveal, bio }: Props) {
  return (
    <CardSlot card={card} frame={frame}>
      <Panel className="gap-3.5 bg-panel px-6 pt-4.5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="m-0 bg-crimson px-2.5 py-1.75 font-pixel text-ps-9 text-white">{bio.tag}</h3>
          <StatusTag reveal={reveal} />
        </div>
        <p className="m-0 font-vt text-[clamp(21px,2vw,27px)]/[1.25] text-pretty">
          {bio.runs.map((r, i) => (
            <span key={i} className={r.g ? "text-gold" : "text-fg"}>
              {r.t}
            </span>
          ))}
        </p>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

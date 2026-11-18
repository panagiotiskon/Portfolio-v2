import { memo } from "react";
import Image from "next/image";
import portrait from "../../../../public/portrait.png";
import type { CardFrame } from "@/lib/en-garde/cards";
import { PROFILE, STATS } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Panel, sameCardProps } from "../ui";

type Props = {
  frame: CardFrame;
  /** 0..1 — how far the stat bars have filled in. */
  fill: number;
};

export const ProfileCard = memo(function ProfileCard({ frame, fill }: Props) {
  return (
    <CardSlot card={CARD.profile} frame={frame}>
      <Panel className="gap-4 bg-panel px-5.5 pt-4.5 pb-5">
        <div className="flex justify-between gap-2.5 font-pixel text-ps-10">
          <span className="text-crimson">PLAYER 1</span>
          <h2 className="m-0 font-pixel text-ps-10 text-muted">CHARACTER SELECT</h2>
        </div>

        <div className="flex flex-wrap gap-x-7.5 gap-y-5">
          <div className="flex min-w-0 flex-[1_1_300px] items-start gap-4.5">
            <div className="size-32 flex-none bg-ink shadow-[0_0_0_4px_var(--color-gold)]">
              <Image src={portrait} alt="Pixel-art portrait of Panagiotis" width={128} height={128} className="pixelated block size-32" />
            </div>
            <dl className="m-0 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 font-vt text-vt-sm">
              {PROFILE.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className={k === "WEAPON" ? "m-0 text-gold" : "m-0"}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.75">
            <h3 className="m-0 mb-0.75 font-pixel text-ps-10 text-gold">STATS</h3>
            {STATS.map(([label, val]) => (
              <StatBar key={label} label={label} value={val} filled={Math.round(val * fill)} />
            ))}
          </div>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

function StatBar({ label, value, filled }: { label: string; value: number; filled: number }) {
  const on = value === 10 ? "bg-gold" : "bg-lime";
  return (
    <div className="grid grid-cols-[17ch_minmax(0,1fr)_2ch] items-center gap-2.5 font-vt text-vt-sm">
      {/* VT323 is monospaced: 17ch fits the longest label ("DRIVE TO SUCCEED") on one line */}
      <span>{label}</span>
      <div role="img" aria-label={`${label} ${value} of 10`} className="flex gap-0.75">
        {Array.from({ length: 10 }, (_, k) => (
          <span key={k} className={`h-2.75 flex-1 ${k < filled ? on : "bg-edge"}`} />
        ))}
      </div>
      <span aria-hidden="true" className="text-right text-muted">
        {value}
      </span>
    </div>
  );
}

import { memo, type CSSProperties, type ReactNode } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import { TIMELINE, type Milestone, type MilestoneKind } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Panel, PixelIcon, StatusTag, sameCardProps } from "../ui";

type Props = { frame: CardFrame; reveal: Reveal };

const CRIMSON = "var(--color-crimson-hi)";
const LIME = "var(--color-lime)";
// plain hex: a theme var only used inline gets tree-shaken out of the CSS
const SKY = "#5aa7ff";

/** Kind colour: tile border, flag and flag pole. */
const KIND: Record<MilestoneKind, { color: string; tile: string; flag: string }> = {
  fence: { color: CRIMSON, tile: ring(CRIMSON, CRIMSON), flag: CRIMSON },
  code: { color: LIME, tile: ring(LIME, LIME), flag: LIME },
  life: { color: SKY, tile: ring(SKY, SKY), flag: SKY },
  // fencing meets code: the tile and flag are split down the middle
  both: { color: LIME, tile: ring(CRIMSON, LIME), flag: `linear-gradient(90deg,${CRIMSON} 50%,${LIME} 50%)` },
};
const LEGEND: [string, string][] = [
  ["Fencing", CRIMSON],
  ["Code", LIME],
  ["Personal", SKY],
];

/** Hard 2px pixel ring: `a` on the top/left edges, `b` on the bottom/right. */
function ring(a: string, b: string) {
  return `0 -2px 0 0 ${a},-2px 0 0 0 ${a},0 2px 0 0 ${b},2px 0 0 0 ${b}`;
}

// Below 780px of card width the run turns into a vertical list (phones, narrow tablets).
// Wide: a 12-column level track. Checkpoints sit on the rail in columns 1–11, the locked next
// level in column 12, and labels alternate above/below so each one gets two columns of room.

export const TrophyCard = memo(function TrophyCard({ frame, reveal }: Props) {
  return (
    <CardSlot card={CARD.trophies} frame={frame}>
      <Panel accent="var(--color-gold)" className="gap-4 bg-panel px-5.5 pt-4.5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-pixel text-ps-13 text-gold">TROPHY ROOM</h2>
          <StatusTag reveal={reveal} />
        </div>

        {/* the key comes before the run: the flag colours are needed to read it */}
        <ul aria-label="Key" className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 font-vt text-vt-17 text-muted">
          {LEGEND.map(([label, color]) => (
            <li key={label} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5" style={{ background: color }} />
              {label}
            </li>
          ))}
        </ul>

        <div className="@container">
          <ol
            className={`relative m-0 flex list-none flex-col gap-4 p-0 before:absolute before:inset-y-4.5 before:left-4 before:w-1 before:bg-gold-dk @min-[780px]:grid @min-[780px]:grid-cols-12 @min-[780px]:grid-rows-[auto_40px_auto] @min-[780px]:gap-0 @min-[780px]:before:hidden`}
          >
            {TIMELINE.map((m, i) => (
              <Checkpoint key={m.title} m={m} col={i + 1} above={i % 2 === 0} />
            ))}
            <NextLevel col={TIMELINE.length + 1} />
          </ol>
        </div>

      </Panel>
    </CardSlot>
  );
}, sameCardProps);

function Checkpoint({ m, col, above }: { m: Milestone; col: number; above: boolean }) {
  const k = KIND[m.kind];
  const vars = { "--c": col, "--k": k.color } as CSSProperties;
  return (
    <li style={vars} className={`relative grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3 @min-[780px]:contents`}>
      {/* rail segment under this column (wide layout only); the first one starts at the tile centre */}
      <span
        aria-hidden="true"
        className={`hidden h-2 self-center bg-gold-dk shadow-[0_-3px_0_0_#ffc94a,0_3px_0_0_#3a2508] @min-[780px]:row-start-2 @min-[780px]:col-start-(--c) @min-[780px]:block ${col === 1 ? "ml-4.5" : ""}`}
      />
      <Tile ring={k.tile} className={`@min-[780px]:row-start-2 @min-[780px]:col-start-(--c)`}>
        <PixelIcon name={m.icon} size={24} />
      </Tile>
      <div
        className={`col-start-2 row-start-1 flex min-w-0 flex-col items-start gap-1 @min-[780px]:col-span-2 @min-[780px]:col-start-(--c) @min-[780px]:ml-4 @min-[780px]:border-l-2 @min-[780px]:border-(--k) @min-[780px]:pr-2 @min-[780px]:pl-2 ${
          above ? `@min-[780px]:row-start-1 @min-[780px]:self-end @min-[780px]:pb-3` : `@min-[780px]:row-start-3 @min-[780px]:self-start @min-[780px]:pt-3`
        }`}
      >
        <span className="px-1.5 py-1 font-pixel text-ps-8 text-ink" style={{ background: k.flag }}>
          {m.when}
        </span>
        <h3 className="m-0 font-vt text-[20px]/[1.05] font-normal text-balance text-fg">{m.title}</h3>
        <p className="m-0 font-vt text-vt-17/[1.05] text-pretty text-muted">{m.note}</p>
      </div>
    </li>
  );
}

/** The locked checkpoint at the end of the rail: the run isn't over. */
function NextLevel({ col }: { col: number }) {
  return (
    <li
      style={{ "--c": col, "--k": "var(--color-edge-hi)" } as CSSProperties}
      className={`relative grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-3 @min-[780px]:contents`}
    >
      <Tile ring={ring("var(--color-edge-hi)", "var(--color-edge-hi)")} className={`@min-[780px]:row-start-2 @min-[780px]:col-start-(--c)`}>
        <PixelIcon name="lock" size={24} style={{ filter: "grayscale(1) brightness(.6)" }} />
      </Tile>
      <div
        className={`col-start-2 row-start-1 flex min-w-0 flex-col items-start gap-1 @min-[780px]:row-start-3 @min-[780px]:col-start-(--c) @min-[780px]:ml-4 @min-[780px]:self-start @min-[780px]:border-l-2 @min-[780px]:border-(--k) @min-[780px]:pt-3 @min-[780px]:pl-2`}
      >
        <span className="bg-edge-hi px-1.5 py-1 font-pixel text-ps-8 text-muted">Next</span>
        <p className="m-0 font-vt text-[20px]/[1.05] text-dim @min-[780px]:hidden">To be continued</p>
      </div>
    </li>
  );
}

function Tile({ ring, className, children }: { ring: string; className: string; children: ReactNode }) {
  return (
    <div
      className={`relative z-1 col-start-1 row-start-1 flex size-9 items-center justify-center self-start bg-ink @min-[780px]:self-center ${className}`}
      style={{ boxShadow: ring }}
    >
      {children}
    </div>
  );
}

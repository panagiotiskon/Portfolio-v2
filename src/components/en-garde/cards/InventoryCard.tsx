import { memo, type CSSProperties, type ReactNode } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import { ABILITIES, BACKPACK, EQUIPPED, type IconName } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Panel, PixelIcon, StatusTag, sameCardProps } from "../ui";

/** Per-item state; items do a quick staggered pop right after the hit. */
export type ItemAnim = { opacity: number; scale: number };

type Props = {
  frame: CardFrame;
  reveal: Reveal;
  /** Index → pop-in state, counted across equipped, backpack and abilities in order. */
  itemAnim: (index: number) => ItemAnim;
};

/** Longest unbreakable word in a set of labels, in characters (VT323 is monospaced, so `ch` is exact). */
const longestWord = (labels: string[]) => Math.max(...labels.flatMap((l) => l.split(/[\s-]+/)).map((w) => w.length));
// equipped tiles share one column width: as many columns as fit, never narrower than the longest
// word (+1ch slack for the hyphen kept on a "Redux-" line) plus the tile's side padding
const EQUIPPED_COLS = { "--tile": `calc(${longestWord(EQUIPPED.map(([n]) => n)) + 1}ch + 8px)` } as CSSProperties;

export const InventoryCard = memo(function InventoryCard({ frame, reveal, itemAnim }: Props) {
  const bpOffset = EQUIPPED.length;
  const abOffset = EQUIPPED.length + BACKPACK.length;
  return (
    <CardSlot card={CARD.inventory} frame={frame}>
      <Panel className="gap-3.5 bg-panel px-5.5 pt-4.5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-pixel text-ps-13 text-gold">INVENTORY</h2>
          <StatusTag reveal={reveal} />
        </div>

        <div className="flex flex-col gap-3.5">
          <Shelf title="EQUIPPED" subtitle="daily stack" titleClass="text-gold" list="grid grid-cols-[repeat(auto-fit,minmax(var(--tile),1fr))] gap-3" style={EQUIPPED_COLS}>
            {EQUIPPED.map(([name, icon], n) => (
              <ItemTile key={name} name={name} icon={icon} anim={itemAnim(n)} variant="equipped" />
            ))}
          </Shelf>
          <Shelf title="BACKPACK" subtitle="also carried" titleClass="text-fg" list="flex flex-wrap gap-2.5">
            {BACKPACK.map(([name, icon], n) => (
              <ItemTile key={name} name={name} icon={icon} anim={itemAnim(bpOffset + n)} variant="backpack" />
            ))}
          </Shelf>
          <Shelf title="ABILITIES" subtitle="passive buffs" titleClass="text-lime" list="flex flex-wrap gap-2.5">
            {ABILITIES.map((name, n) => (
              <AbilityChip key={name} name={name} gold={n % 2 === 1} anim={itemAnim(abOffset + n)} />
            ))}
          </Shelf>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

type ShelfProps = { title: string; subtitle: string; titleClass: string; list: string; style?: CSSProperties; children: ReactNode };

function Shelf({ title, subtitle, titleClass, list, style, children }: ShelfProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex flex-[0_0_104px] flex-col gap-1">
        <h3 className={`m-0 font-pixel text-ps-9 ${titleClass}`}>{title}</h3>
        <span className="font-vt text-vt-17 text-muted">{subtitle}</span>
      </div>
      <ul className={`m-0 min-w-0 flex-[1_1_300px] list-none p-0 font-vt text-vt-17 ${list}`} style={style}>
        {children}
      </ul>
    </div>
  );
}

function ItemTile({ name, icon, anim, variant }: { name: string; icon: IconName; anim: ItemAnim; variant: "equipped" | "backpack" }) {
  const equipped = variant === "equipped";
  return (
    // backpack items size to their label and grow to fill the row; equipped ones fill a grid cell
    <li
      className={
        equipped
          ? "box-border flex min-h-15 bg-ink pixel-border-3 [--px-color:var(--color-gold)] [--px-extra:0_0_0_6px_rgba(255,201,74,.12)]"
          : "box-border flex min-h-11 flex-[1_0_auto] bg-ink pixel-border-2 [--px-color:var(--color-dim)]"
      }
    >
      <span
        className={
          equipped
            ? "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center"
            : "flex h-full w-full items-center justify-center gap-1.5 px-2"
        }
        style={{ opacity: anim.opacity, transform: `scale(${anim.scale})` }}
      >
        <PixelIcon name={icon} size={equipped ? 26 : 18} />
        <span className={equipped ? "leading-[.95]" : "whitespace-nowrap"}>{name}</span>
      </span>
    </li>
  );
}

function AbilityChip({ name, gold, anim }: { name: string; gold: boolean; anim: ItemAnim }) {
  return (
    <li
      className="box-border flex min-h-(--tap) items-center gap-2 bg-ink py-1 pr-2.5 pl-1.5"
      style={{
        opacity: anim.opacity,
        transform: `scale(${anim.scale})`,
        boxShadow: gold
          ? "0 0 0 2px #8a5a12, 0 0 12px 2px rgba(255,201,74,.28)"
          : "0 0 0 2px #145a32, 0 0 12px 2px rgba(60,255,122,.28)",
      }}
    >
      <PixelIcon name={gold ? "orbG" : "orb"} size={20} />
      <span className="text-[18px]/none">{name}</span>
    </li>
  );
}

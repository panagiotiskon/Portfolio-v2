import { memo, type ReactNode } from "react";
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
  equippedWidth: number;
  backpackWidth: number;
  inspect: string | null;
  onInspect: (text: string) => void;
};

export const InventoryCard = memo(function InventoryCard({ frame, reveal, itemAnim, equippedWidth, backpackWidth, inspect, onInspect }: Props) {
  const bpOffset = EQUIPPED.length;
  const abOffset = EQUIPPED.length + BACKPACK.length;
  return (
    <CardSlot card={CARD.inventory} frame={frame}>
      <Panel className="gap-3.5 bg-panel px-5.5 pt-4.5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-pixel text-ps-13 text-gold">INVENTORY</h2>
          <StatusTag reveal={reveal} />
        </div>
        <div aria-live="polite" className={`bg-ink px-2.5 py-1.5 font-vt text-[20px]/[1.1] ${inspect ? "text-gold" : "text-muted"}`}>
          ▸ {inspect ?? "TAP AN ITEM TO INSPECT"}
        </div>

        <div className="flex flex-col gap-3.5">
          <Shelf title="EQUIPPED" subtitle="daily stack" titleClass="text-gold" gap="gap-3">
            {EQUIPPED.map(([name, icon], n) => (
              <ItemTile
                key={name}
                name={name}
                icon={icon}
                anim={itemAnim(n)}
                width={equippedWidth}
                onClick={() => onInspect(`${name} · EQUIPPED · daily stack`)}
                variant="equipped"
              />
            ))}
          </Shelf>
          <Shelf title="BACKPACK" subtitle="also carried" titleClass="text-fg" gap="gap-2.5">
            {BACKPACK.map(([name, icon], n) => (
              <ItemTile
                key={name}
                name={name}
                icon={icon}
                anim={itemAnim(bpOffset + n)}
                width={backpackWidth}
                onClick={() => onInspect(`${name} · BACKPACK · also carried`)}
                variant="backpack"
              />
            ))}
          </Shelf>
          <Shelf title="ABILITIES" subtitle="passive buffs" titleClass="text-lime" gap="gap-2.5">
            {ABILITIES.map((name, n) => (
              <AbilityChip key={name} name={name} gold={n % 2 === 1} anim={itemAnim(abOffset + n)} onClick={() => onInspect(`${name} · ABILITY · passive buff`)} />
            ))}
          </Shelf>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

function Shelf({ title, subtitle, titleClass, gap, children }: { title: string; subtitle: string; titleClass: string; gap: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex flex-[0_0_104px] flex-col gap-1">
        <h3 className={`m-0 font-pixel text-ps-9 ${titleClass}`}>{title}</h3>
        <span className="font-vt text-vt-17 text-muted">{subtitle}</span>
      </div>
      <ul className={`m-0 flex flex-[1_1_300px] list-none flex-wrap p-0 ${gap}`}>{children}</ul>
    </div>
  );
}

function ItemTile({
  name,
  icon,
  anim,
  width,
  onClick,
  variant,
}: {
  name: string;
  icon: IconName;
  anim: ItemAnim;
  width: number;
  onClick: () => void;
  variant: "equipped" | "backpack";
}) {
  const equipped = variant === "equipped";
  return (
    <li
      title={name}
      onClick={onClick}
      className={
        equipped
          ? "flex min-h-15 cursor-pointer bg-ink pixel-border-3 [--px-color:var(--color-gold)] [--px-extra:0_0_0_6px_rgba(255,201,74,.12)]"
          : "flex min-h-11 cursor-pointer bg-ink pixel-border-2 [--px-color:var(--color-dim)]"
      }
      style={{ width }}
    >
      <div
        className={
          equipped
            ? "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center"
            : "flex h-full w-full items-center justify-center gap-1.5 px-1"
        }
        style={{ opacity: anim.opacity, transform: `scale(${anim.scale})` }}
      >
        <PixelIcon name={icon} size={equipped ? 26 : 18} />
        <span className={`font-vt text-vt-17 ${equipped ? "leading-[.95]" : ""}`}>{name}</span>
      </div>
    </li>
  );
}

function AbilityChip({ name, gold, anim, onClick }: { name: string; gold: boolean; anim: ItemAnim; onClick: () => void }) {
  return (
    <li
      onClick={onClick}
      className="box-border flex min-h-(--tap) cursor-pointer items-center gap-2 bg-ink py-1 pr-2.5 pl-1.5"
      style={{
        opacity: anim.opacity,
        transform: `scale(${anim.scale})`,
        boxShadow: gold
          ? "0 0 0 2px #8a5a12, 0 0 12px 2px rgba(255,201,74,.28)"
          : "0 0 0 2px #145a32, 0 0 12px 2px rgba(60,255,122,.28)",
      }}
    >
      <PixelIcon name={gold ? "orbG" : "orb"} size={20} />
      <span className="font-vt text-[18px]/none">{name}</span>
    </li>
  );
}

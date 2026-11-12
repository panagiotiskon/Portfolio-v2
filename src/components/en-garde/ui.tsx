"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import type { IconName } from "@/lib/en-garde/content";
import type { IconSet } from "@/lib/en-garde/icons";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

// ---------------------------------------------------------------- icons
export const IconsContext = createContext<IconSet | null>(null);

export function PixelIcon({ name, size, style }: { name: IconName; size: number; style?: CSSProperties }) {
  const icons = useContext(IconsContext);
  return (
    <span
      aria-hidden="true"
      className="pixelated inline-block flex-none bg-size-[100%_100%] bg-no-repeat"
      style={{ width: size, height: size, backgroundImage: icons ? `url(${icons[name]})` : undefined, ...style }}
    />
  );
}

// ---------------------------------------------------------------- buttons
type Variant = "menu" | "primary" | "secondary";
const VARIANT: Record<Variant, string> = {
  menu: "bg-raised text-fg pixel-border-4 gap-2.5 px-3.5 py-2.5 hover:bg-lime hover:text-ink",
  primary: "bg-lime text-ink pixel-border-3 [--px-color:var(--color-lime)] hover:bg-lime-hi hover:text-ink",
  secondary: "bg-raised text-fg pixel-border-3 hover:bg-fg hover:text-ink",
};

/** Shared class string for pixel buttons / button-styled links. */
export const pixelButton = (variant: Variant, extra?: string) =>
  cx(
    "inline-flex items-center justify-center min-h-(--tap) box-border font-pixel no-underline border-none cursor-pointer",
    VARIANT[variant],
    extra,
  );

export function ExternalLink({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={className} style={style}>
      {children}
    </a>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="bg-lime-dk px-2 py-1.5 font-pixel text-ps-8 text-lime">+ {children}</span>;
}

// ---------------------------------------------------------------- card scaffolding

const shallowEqual = (a: unknown, b: unknown) =>
  !!a && !!b && typeof a === "object" && typeof b === "object" &&
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([k, v]) => Object.is(v, (b as Record<string, unknown>)[k]));

/**
 * memo() comparator for cards. `frame` and `reveal` are rebuilt on every scroll frame, so they're
 * compared by value: cards that are off screen (or parked) skip re-rendering entirely.
 */
export function sameCardProps<P extends object>(a: P, b: P) {
  const ka = Object.keys(a) as (keyof P)[];
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.is(a[k], b[k]) || ((k === "frame" || k === "reveal") && shallowEqual(a[k], b[k])));
}

/** Absolutely positioned slot that slides horizontally with scroll. */
export function CardSlot({ card, frame, children }: { card: number; frame: CardFrame; children: ReactNode }) {
  return (
    <div
      data-ti={card}
      className="absolute inset-y-0 left-0 flex items-center-safe"
      style={{ width: frame.width, transform: frame.transform, opacity: frame.opacity, filter: frame.filter }}
    >
      {children}
    </div>
  );
}

/** The bordered pixel box every card is drawn in. Height is capped to the free arena area. */
export function Panel({
  accent,
  extraShadow,
  drop = true,
  className,
  children,
}: {
  accent?: string;
  /** Replaces the default drop shadow (e.g. a glow). */
  extraShadow?: string;
  drop?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const style: CSSVars = {};
  if (accent) style["--px-color"] = accent;
  if (extraShadow) style["--px-extra"] = extraShadow;
  return (
    <div
      className={cx(
        "scrollbar-pixel box-border flex max-h-(--area-h) w-full flex-col overflow-y-auto pixel-border-4",
        drop && !extraShadow && "pixel-drop",
        className ?? "bg-panel",
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function StatusTag({ reveal }: { reveal: Pick<Reveal, "status" | "statusColor"> }) {
  return (
    <span className="font-pixel text-ps-8" style={{ color: reveal.statusColor }}>
      {reveal.status}
    </span>
  );
}

"use client";

import { createContext, memo, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { CardFrame, CardScroll, Reveal } from "@/lib/en-garde/cards";
import type { IconName } from "@/lib/en-garde/content";
import type { IconSet } from "@/lib/en-garde/icons";
import { gridPath, LOGOS, type LogoName } from "@/lib/en-garde/logos";

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

// ---------------------------------------------------------------- logos
const LOGO_SCALE = 2; // CSS px per art pixel
const LOGO_BOX = 22; // plate size in art px, grown only if a mark needs it

/**
 * A mark centred on a square plate so every mark has the same footprint. Built once per mark:
 * the paths depend only on the mark, not on the card that shows it.
 */
function logoArt(name: LogoName) {
  const { rows, colors, bg, dots } = LOGOS[name];
  const gw = rows[0].length, gh = rows.length;
  const size = Math.max(LOGO_BOX, gw + 2, gh + 2);
  const x0 = Math.round((gw - size) / 2), y0 = Math.round((gh - size) / 2);
  const paths = Object.entries(colors).map(([ch, fill]) => ({ d: gridPath(rows, ch), fill }));
  if (dots) {
    let d = "";
    for (let y = y0 + 2; y < y0 + size; y += 4) for (let x = x0 + 2; x < x0 + size; x += 4) d += `M${x} ${y}h1v1h-1z`;
    paths.unshift({ d, fill: dots });
  }
  return { x0, y0, size, bg, paths };
}
const LOGO_ART = Object.fromEntries((Object.keys(LOGOS) as LogoName[]).map((n) => [n, logoArt(n)])) as Record<LogoName, ReturnType<typeof logoArt>>;

/** A company/project mark as pixel art in its ink frame, for the top-right corner of a card. */
export const LogoTile = memo(function LogoTile({ name }: { name: LogoName }) {
  const { x0, y0, size, bg, paths } = LOGO_ART[name];
  return (
    <div className="flex-none pixel-border-2 pixel-drop-sm [--px-color:var(--color-ink)]">
      <svg aria-hidden="true" viewBox={`${x0} ${y0} ${size} ${size}`} width={size * LOGO_SCALE} height={size * LOGO_SCALE} shapeRendering="crispEdges" className="block flex-none">
        <rect x={x0} y={y0} width={size} height={size} fill={bg} />
        {paths.map(({ d, fill }) => (
          <path key={fill} d={d} fill={fill} />
        ))}
      </svg>
    </div>
  );
});

/** Card heading row: title on the left, the company/project mark (if any) on the right. */
export function TitleRow({ logo, children }: { logo?: LogoName; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      {children}
      {logo && <LogoTile name={logo} />}
    </div>
  );
}

// ---------------------------------------------------------------- buttons
type Variant = "menu" | "primary" | "secondary";
const VARIANT: Record<Variant, string> = {
  menu: "bg-raised text-fg pixel-border-4 gap-2.5 px-3.5 py-2.5 hover:bg-lime hover:text-ink",
  // hard 4px drop: the pressable-button look, the same in every card
  primary: "bg-lime text-ink pixel-border-3 pixel-drop-sm [--px-color:var(--color-lime)] hover:bg-lime-hi hover:text-ink",
  secondary: "bg-raised text-fg pixel-border-3 pixel-drop-sm hover:bg-fg hover:text-ink",
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

/** Tech tag. Lime by default; `accent` tints it to a project's own colour. */
export function Chip({ accent, children }: { accent?: string; children: ReactNode }) {
  const style = accent ? { color: accent, background: `color-mix(in srgb, ${accent} 18%, transparent)` } : undefined;
  return (
    <span className={cx("px-2 py-0.5 font-vt text-vt-sm", !accent && "bg-lime-dk text-lime")} style={style}>
      + {children}
    </span>
  );
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

const CardScrollContext = createContext<CardScroll>({ read: null, more: false });

/** Absolutely positioned slot that slides horizontally with scroll. */
export function CardSlot({ card, frame, children }: { card: number; frame: CardFrame; children: ReactNode }) {
  return (
    <div
      data-ti={card}
      data-settled={frame.settled || undefined}
      className="absolute inset-y-0 left-0 flex items-center-safe"
      style={{
        width: frame.width,
        transform: frame.transform,
        opacity: frame.opacity,
        filter: frame.filter,
        visibility: frame.opacity === 0 ? "hidden" : undefined,
        pointerEvents: frame.opacity < 0.5 ? "none" : undefined,
      }}
    >
      <CardScrollContext.Provider value={{ read: frame.read, more: frame.more }}>{children}</CardScrollContext.Provider>
    </div>
  );
}

/**
 * The bordered pixel box every card is drawn in. Height is capped to the free arena area.
 * Content that doesn't fit is scrolled by the page scroll (CardScroll), not by the user directly:
 * one scroller, so a swipe always means the same thing. With the mobile keyboard open it falls
 * back to native scrolling so a form field can still be reached.
 */
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
  const { read, more } = useContext(CardScrollContext);
  const ref = useRef<HTMLDivElement>(null);
  // before paint, in the same frame as the scroll that moved it
  useLayoutEffect(() => {
    if (read != null && ref.current) ref.current.scrollTop = read;
  }, [read]);

  const style: CSSVars = {};
  if (accent) style["--px-color"] = accent;
  if (extraShadow) style["--px-extra"] = extraShadow;
  return (
    <div className="relative w-full">
      <div
        ref={ref}
        data-panel=""
        className={cx(
          "box-border max-h-(--area-h) w-full pixel-border-4",
          read == null ? "scrollbar-pixel overflow-y-auto" : "overflow-y-hidden",
          drop && !extraShadow && "pixel-drop",
        )}
        style={style}
      >
        {/* content box: its height is what gets measured for the reading pause */}
        <div className={cx("box-border flex flex-col", className ?? "bg-panel")}>{children}</div>
      </div>
      <MoreHint on={more} />
    </div>
  );
}

/** "There's more below" cue over the bottom edge of an overflowing card. */
function MoreHint({ on }: { on: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-linear-to-t from-ink/85 to-transparent pb-1.5 transition-opacity duration-200"
      style={{ opacity: on ? 1 : 0 }}
    >
      {/* animated only while shown: a hidden hint sits in every card */}
      <span className={cx("bg-ink px-2 py-1 font-pixel text-ps-8 text-gold pixel-border-2 [--px-color:var(--color-gold-dk)]", on && "animate-[nudge_.9s_steps(1)_infinite] motion-reduce:animate-none")}>
        ▼ MORE
      </span>
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

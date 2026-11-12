import type { CSSProperties } from "react";

/** "VICTORY 10 – 9" label floating above the winner on the podium. */
export function VictoryLabel({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-2 flex flex-col items-center gap-2.5 whitespace-nowrap"
      // it follows the fencer every frame: move it with a transform, not left/top (no layout)
      style={{ transform: `translate(${x}px,${y}px) translate(-50%,-100%)`, opacity }}
    >
      <span className="font-pixel text-[clamp(18px,2.4vw,30px)] text-gold [text-shadow:3px_3px_0_var(--color-gold-dk)]">VICTORY</span>
      <span className="bg-ink px-2 py-1.5 font-pixel text-[clamp(max(10px,var(--hmin,0px)),1.1vw,13px)] text-fg shadow-[0_0_0_3px_var(--color-lime)]">
        10 – 9
      </span>
    </div>
  );
}

type RoundIntroProps = {
  /** Progress through the intro hold (0..1), or -1 when hidden. */
  intro: number;
  /** Reduced motion: no staggered build, everything shows at once. */
  still: boolean;
  from: number;
  to: number;
  total: number;
  /** Space reserved for the HUD at the top. */
  top: number;
  blinkOn: boolean;
  /** Short section codes and long names, indexed by round. */
  short: string[];
  long: string[];
  names: string[];
  blurbs: string[];
};

/**
 * Round-intro screen shown while the curtain is closed. It answers the three questions
 * a first-time visitor has at that moment: what just happened (previous round cleared),
 * where am I (round N of 7 on a section map), and what's next (plain-language blurb).
 * Lines build in quickly one after another, so the whole screen is up for most of the hold
 * even when scrolling fast. Only the opening and the final round use this full screen;
 * the rounds in between get a RoundBanner.
 */
export function RoundIntro({ intro, still, from, to, total, top, blinkOn, short, long, names, blurbs }: RoundIntroProps) {
  const on = intro >= 0;
  const first = from <= 1;
  const belle = to === total;
  // each line fades/lifts in at its own point in the hold and they all leave together
  const line = (i: number): CSSProperties => {
    if (!on) return { opacity: 0 };
    if (still) return { opacity: 1 };
    const u = Math.max(0, Math.min(1, (intro - 0.02 - i * 0.035) / 0.08));
    const out = intro > 0.92 ? Math.max(0, 1 - (intro - 0.92) / 0.08) : 1;
    return { opacity: u * out, transform: `translateY(${Math.round((1 - u) * 10)}px)` };
  };
  const rounds = Array.from({ length: total - 1 }, (_, i) => i + 2);

  return (
    <>
      {/* screen readers get the round change as a single announcement */}
      <p className="sr-only" aria-live="polite">
        {on ? `Round ${to} of ${total}: ${long[to]}. ${blurbs[to]}` : ""}
      </p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-4 flex flex-col items-center justify-center gap-[clamp(10px,2.2vh,20px)] px-4 text-center"
        style={{ top, visibility: on ? "visible" : "hidden" }}
      >
        <span className="font-pixel text-ps-10 tracking-[1px] text-lime" style={line(0)}>
          {first ? "THE BOUT BEGINS" : `${long[from]} CLEARED!`}
        </span>

        <span
          className="font-pixel text-[clamp(22px,4vw,44px)]/none text-gold [text-shadow:4px_4px_0_var(--color-gold-dk)]"
          style={line(1)}
        >
          ROUND {to}
          <span className="text-[0.55em] text-gold-dk [text-shadow:none]">/{total}</span>
        </span>

        <span className="font-pixel text-ps-12 text-fg" style={line(2)}>
          {names[to] === long[to] ? names[to] : `${names[to]} · ${long[to]}`}
        </span>

        {blurbs[to] && (
          <span className="max-w-[36ch] text-balance font-vt text-[clamp(24px,2.6vw,30px)]/[1.1] text-muted" style={line(3)}>
            {blurbs[to]}
          </span>
        )}

        {/* section map: where you are in the whole bout */}
        <ol className="m-0 mt-1 flex list-none gap-[clamp(6px,1.4vw,14px)] p-0" style={line(4)}>
          {rounds.map((r) => {
            const done = r < to, cur = r === to;
            return (
              <li key={r} className="flex flex-col items-center gap-1.5">
                <span
                  className="block size-3"
                  style={{
                    background: done ? "var(--color-gold)" : cur ? (blinkOn || still ? "var(--color-fg)" : "var(--color-ink)") : "var(--color-raised)",
                    boxShadow: cur ? "0 0 0 2px var(--color-gold)" : "0 0 0 2px var(--color-edge)",
                  }}
                />
                <span className={`font-pixel text-ps-8 ${cur ? "text-fg" : done ? "text-gold" : "text-dim"}`}>{short[r]}</span>
              </li>
            );
          })}
        </ol>

        {belle && (
          <span className="font-pixel text-ps-10 text-crimson" style={line(5)}>
            LA BELLE · NEXT TOUCH WINS
          </span>
        )}

        {first && (
          <span className="mt-1 bg-raised px-3 py-2 text-balance font-vt text-[clamp(20px,2.2vw,26px)]/[1.1] text-fg shadow-[0_0_0_2px_var(--color-edge)]" style={line(5)}>
            <span className="text-gold">SCROLL</span> to lunge · every <span className="text-lime">hit</span> scores a point
          </span>
        )}

        <span className="mt-1 font-pixel text-ps-9 text-muted" style={{ ...line(6), opacity: on && (blinkOn || still) ? line(6).opacity : 0 }}>
          SCROLL ▼ TO ENTER
        </span>
      </div>
    </>
  );
}

type RoundBannerProps = {
  /** Progress (0..1) through the banner's time on screen, or -1 when hidden. */
  progress: number;
  /** Reduced motion: no fade or lift. */
  still: boolean;
  round: number;
  total: number;
  /** "INVENTORY · SKILLS" */
  title: string;
  /** Plain-language "what's in this round". */
  blurb: string;
};

/**
 * Brief round change: the arena stays in view and a small panel names the new round in the
 * card area, between the card that just left and the next one. Same three facts as the full
 * intro (round N of 7, its name, what's in it), minus the curtain.
 */
export function RoundBanner({ progress, still, round, total, title, blurb }: RoundBannerProps) {
  const on = progress >= 0;
  const u = !on ? 0 : still ? 1 : Math.max(0, Math.min(1, progress / 0.14, (1 - progress) / 0.12));
  return (
    <>
      <p className="sr-only" aria-live="polite">
        {on ? `Round ${round} of ${total}: ${title}. ${blurb}` : ""}
      </p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
        style={{ visibility: on ? "visible" : "hidden", opacity: u, transform: `translateY(${Math.round((1 - u) * 12)}px)` }}
      >
        <div className="flex max-w-[min(560px,100%)] flex-col items-center gap-[clamp(8px,1.6vh,14px)] bg-panel px-6 py-4.5 text-center pixel-border-4 pixel-drop [--px-color:var(--color-gold)]">
          <span className="font-pixel text-[clamp(20px,3vw,32px)]/none text-gold [text-shadow:3px_3px_0_var(--color-gold-dk)]">
            ROUND {round}
            <span className="text-[0.55em] text-gold-dk [text-shadow:none]">/{total}</span>
          </span>
          <span className="font-pixel text-ps-12 text-balance text-fg">{title}</span>
          {blurb && <span className="max-w-[36ch] font-vt text-[clamp(22px,2.2vw,26px)]/[1.1] text-balance text-muted">{blurb}</span>}
        </div>
      </div>
    </>
  );
}

const OUTLINE: CSSProperties = { textShadow: "3px 3px 0 #0b0a17,-3px 0 0 #0b0a17,0 -3px 0 #0b0a17,3px 0 0 #0b0a17" };

export function ToucheFlash({ x, y, opacity, scale }: { x: number; y: number; opacity: number; scale: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-4 font-pixel text-[clamp(18px,2.4vw,30px)] whitespace-nowrap text-lime"
      style={{ ...OUTLINE, opacity, transform: `translate(${x}px,${y}px) translate(-50%,-100%) scale(${scale})` }}
    >
      TOUCHÉ!
    </div>
  );
}

export function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div aria-hidden="true" className="absolute right-4 bottom-2.5 z-4 font-pixel text-ps-9 text-muted" style={{ opacity: visible ? 1 : 0 }}>
      SCROLL ▼
    </div>
  );
}

export function CrtScanlines({ on }: { on: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-8 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,.24)_0px,rgba(0,0,0,.24)_2px,transparent_2px,transparent_4px)]"
      style={{ opacity: on ? 1 : 0 }}
    />
  );
}

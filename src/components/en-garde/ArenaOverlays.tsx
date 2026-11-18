import type { CSSProperties } from "react";

/** "VICTORY 5 – 4" label floating above the winner on the podium. */
export function VictoryLabel({ x, y, opacity, score }: { x: number; y: number; opacity: number; score: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-2 flex flex-col items-center gap-2.5 whitespace-nowrap"
      // it follows the fencer every frame: move it with a transform, not left/top (no layout)
      style={{ transform: `translate(${x}px,${y}px) translate(-50%,-100%)`, opacity }}
    >
      <span className="font-pixel text-[clamp(18px,2.4vw,30px)] text-gold [text-shadow:3px_3px_0_var(--color-gold-dk)]">VICTORY</span>
      <span className="bg-ink px-2 py-1.5 font-pixel text-[clamp(max(10px,var(--hmin,0px)),1.1vw,13px)] text-fg shadow-[0_0_0_3px_var(--color-lime)]">
        {score}
      </span>
    </div>
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
      className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,.24)_0px,rgba(0,0,0,.24)_2px,transparent_2px,transparent_4px)]"
      style={{ opacity: on ? 1 : 0 }}
    />
  );
}

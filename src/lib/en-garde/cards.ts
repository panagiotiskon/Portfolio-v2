// Per-card presentation state derived from scroll: slide position and hit state.
// Card content is always readable while the card is on screen; the hit is a reward, not a gate.
import { readOffset, type Layout } from "./layout";
import { HIT, type Model } from "./model";
import { CARD } from "./rounds";

export type CardFrame = CardScroll & {
  width: number;
  transform: string;
  opacity: number;
  filter: string;
  /** False while the card's size is animating (its overflow isn't measured then). */
  settled: boolean;
};

/** Where a card's content is scrolled to, driven by the page scroll (see Hold in layout.ts). */
export type CardScroll = {
  /** px from the top, or null to let the card scroll natively (mobile keyboard open). */
  read: number | null;
  /** More content below what's showing. */
  more: boolean;
};

export function cardScroll(L: Layout, pageY: number, card: number, native: boolean): CardScroll {
  if (native) return { read: null, more: false };
  const h = L.holdOf[card];
  const read = readOffset(L, pageY, card);
  return { read, more: !!h && read < h.len - 1 };
}

export type Reveal = {
  status: string;
  statusColor: string;
};

/** Progress (0..1) of the segment at index k relative to the current one. */
export const segProgress = (m: Model, k: number) => (k < m.si ? 1 : k > m.si ? 0 : m.q);

export const isCardHit = (L: Layout, m: Model, card: number) => segProgress(m, L.segOf[card]) >= HIT;

/** Lime glow that flares on a card the moment its target is hit, then fades (0..1). */
function hitGlow(L: Layout, m: Model, card: number) {
  const k = L.segOf[card];
  if (k == null || m.red) return 0;
  const qq = segProgress(m, k);
  return qq >= HIT && qq < HIT + 0.12 ? 1 - (qq - HIT) / 0.12 : 0;
}

/** Horizontal slide in/out of a card as its scroll window passes. */
export function cardFrame(L: Layout, m: Model, y: number, card: number, maxW: number): Omit<CardFrame, keyof CardScroll> {
  const { W } = L, wn = L.win[card], slide = W * 1.05;
  let cx = W / 2, op = 1, w = Math.min(maxW, W - 2 * L.gutter);
  if (y < wn.inS) { cx = W / 2 + slide; op = 0; }
  else if (y < wn.inE) {
    const u = (y - wn.inS) / (wn.inE - wn.inS);
    if (m.red) op = u; else cx = W / 2 + (1 - u) * slide;
  } else if (y >= wn.outE) { cx = -W; op = 0; }
  else if (y >= wn.outS) {
    const u = (y - wn.outS) / (wn.outE - wn.outS);
    if (m.red) op = 1 - u; else cx = W / 2 - u * slide;
  }
  // on the podium the contact card moves aside to make room for the winner
  const podium = card === CARD.contact && m.podK > 0 && W >= 760;
  if (podium) {
    const k = m.podK;
    cx = W / 2 + (W * 0.69 - W / 2) * k;
    w = w + (Math.min(560, W * 0.58) - w) * k;
  }
  const g = hitGlow(L, m, card);
  return {
    width: Math.round(w),
    transform: `translate3d(${Math.round(cx - w / 2)}px,0,0)`,
    opacity: op,
    filter: g > 0 ? `drop-shadow(0 0 ${Math.round(6 + 18 * g)}px rgba(60,255,122,${(0.75 * g).toFixed(2)}))` : "none",
    settled: !podium,
  };
}

/** Status tag: "EN GARDE" while the target stands, "TOUCHÉ ✓" once it's hit. */
export function cardReveal(L: Layout, m: Model, card: number): Reveal {
  return isCardHit(L, m, card)
    ? { status: "TOUCHÉ ✓", statusColor: "#3cff7a" }
    : { status: "EN GARDE", statusColor: "#a49fbd" };
}

/** A card is "open" when it's fully on screen. */
export function isCardOpen(L: Layout, y: number, card: number) {
  const wn = L.win[card];
  return y >= wn.inE && y < wn.outS;
}

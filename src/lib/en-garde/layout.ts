// Scroll timeline: converts the viewport size into a sequence of scroll segments
// (title → transition → touché → …), plus snap points and per-card visibility windows.
import { FINAL_CARD, ROUNDS } from "./rounds";

/** Fencer reach in art pixels: distance from rest position to the target. */
export const REACH = 63;

/**
 * Full round-transition timeline (progress through a "trans" segment): the fencer walks past
 * the round sign, a curtain closes, the round-intro screen holds long enough to read,
 * then the curtain opens on the next round. Only the opening and the final round get this.
 */
export const CURTAIN = { sign: 0.12, closeS: 0.3, closeE: 0.4, openS: 0.72, openE: 0.82 } as const;

/**
 * Brief round change (rounds in the middle of the bout): no curtain. The previous card leaves,
 * the fencer keeps walking past the round sign and a banner names the new round over the
 * open arena. Same keys as CURTAIN so the motion code reads both the same way:
 * closeS = previous card gone, closeE = round number flips, openS = next target appears.
 */
export const BRIEF = { sign: 0.12, closeS: 0.3, closeE: 0.3, openS: 0.5, openE: 0.6 } as const;

/** Where the round banner shows during a brief transition. */
export const BANNER = { s: 0.28, e: 0.94 } as const;

export type TransTiming = { sign: number; closeS: number; closeE: number; openS: number; openE: number };
export const transTiming = (g: TransSeg): TransTiming => (g.brief ? BRIEF : CURTAIN);

export type Pace = "Snappy" | "Normal" | "Leisurely";
const PACE: Record<Pace, number> = { Snappy: 0.7, Normal: 1, Leisurely: 1.4 };

type SegBase = { y0: number; len: number; xs: number; xe: number };
export type TitleSeg = SegBase & { kind: "title"; round: 1 };
export type TransSeg = SegBase & {
  kind: "trans";
  from: number;
  to: number;
  sign: number;
  first: boolean;
  belle: boolean;
  /** Banner instead of the full curtain + intro screen. */
  brief: boolean;
  lastB: number | null;
  nB: number;
};
export type ToucheSeg = SegBase & {
  kind: "touche";
  card: number;
  t: number;
  round: number;
  R: number;
  B: number;
  TB: number;
  final: boolean;
  nextT: boolean;
  nB?: number;
};
export type Seg = TitleSeg | TransSeg | ToucheSeg;

/** Scroll range where a card slides in and out. */
export type CardWindow = { inS: number; inE: number; outS: number; outE: number };

export type Layout = {
  mob: boolean;
  W: number;
  H: number;
  /** Device pixels per art pixel. */
  S: number;
  /** Canvas size in art pixels. */
  Wa: number;
  Ha: number;
  pisteTop: number;
  camFrac: number;
  hudH: number;
  areaTop: number;
  areaH: number;
  segs: Seg[];
  snaps: number[];
  allSnaps: number[];
  cardSnap: Record<number, number>;
  win: Record<number, CardWindow>;
  /** Card id → index of the touché segment that reveals it. */
  segOf: Record<number, number>;
  end: number;
  lift: number;
  trackH: number;
};

export function computeLayout(W: number, H: number, hudH: number, pace: Pace = "Normal"): Layout {
  const mob = W < 600;
  const S = mob
    ? Math.max(3, Math.min(Math.floor(W / 92), Math.round((H * 0.26) / 44)))
    : Math.max(2, Math.min(4, Math.floor(Math.min(W / 300, H / 190))));
  const Wa = Math.ceil(W / S), Ha = Math.ceil(H / S), pf = PACE[pace] ?? 1;
  // touché segment: about one swipe on mobile, a few wheel notches on desktop. The card is
  // readable for most of it, so it doesn't need to be long.
  const TU = Math.round(Math.max(520, H * (mob ? 1.1 : 0.85)) * pf);
  // full transition: sized off the viewport, not TU, so the intro screen keeps its reading room
  const TR = Math.round(Math.max(560, H * (mob ? 1.3 : 1)) * pf * 0.75);
  const TB = Math.round(TU * 0.55); // brief transition (round banner)
  const TI = Math.round(TU * 0.45); // title
  const pisteTop = Ha - (mob ? 16 : 24);
  const camFrac = mob ? 2 / Wa : W < 700 ? 0.06 : 0.2;
  const fencerTop = (pisteTop - 31) * S;
  const areaTop = hudH + (mob ? 14 : 16);
  const areaH = Math.max(240, fencerTop - areaTop - 8);

  const segs: Seg[] = [{ kind: "title", y0: 0, len: TI, xs: 30, xe: 30, round: 1 }];
  let y = TI, x = 30, t = 0;
  for (const [r, cards] of ROUNDS) {
    const first = r === 2, belle = r === ROUNDS[ROUNDS.length - 1][0], brief = !first && !belle;
    const tr: TransSeg = { kind: "trans", from: r - 1, to: r, y0: y, len: brief ? TB : TR, xs: x, sign: x + 90, xe: x + 110, first, belle, brief, lastB: null, nB: 0 };
    segs.push(tr);
    x = tr.xe;
    y += tr.len;
    cards.forEach((card, n) => {
      const R = x + (n ? 18 : 24);
      const nextT = n < cards.length - 1;
      const g: ToucheSeg = { kind: "touche", card, t: t++, round: r, y0: y, len: TU, xs: x, R, B: R + REACH + 3, TB: R + REACH + 8, final: card === FINAL_CARD, nextT, xe: nextT ? R + 18 : R };
      x = g.xe;
      y += TU;
      segs.push(g);
    });
  }
  segs.forEach((g, k) => {
    const n = segs[k + 1], p = segs[k - 1];
    if (g.kind === "touche" && g.nextT && n.kind === "touche") g.nB = n.B;
    if (g.kind === "trans") {
      g.lastB = p && p.kind === "touche" ? p.B : null;
      if (n.kind === "touche") g.nB = n.B;
    }
  });

  const end = y, t1 = segs[1];
  const cardSnap: Record<number, number> = { 0: 0, 1: t1.y0 + t1.len };
  const snaps = [0, cardSnap[1]];
  const win: Record<number, CardWindow> = {
    0: { inS: -1, inE: -1, outS: t1.y0, outE: t1.y0 + t1.len * CURTAIN.closeS },
    1: { inS: t1.y0 + t1.len * CURTAIN.openS, inE: t1.y0 + t1.len, outS: Infinity, outE: Infinity },
  };
  // a resting point in the middle of every full round-intro screen (brief banners pass by)
  const introSnaps = segs
    .filter((g): g is TransSeg => g.kind === "trans" && !g.brief)
    .map((g) => Math.round(g.y0 + g.len * ((CURTAIN.closeE + CURTAIN.openS) / 2)));
  snaps.push(...introSnaps);
  const segOf: Record<number, number> = {};
  let firstTouche = true;
  segs.forEach((g, k) => {
    if (g.kind !== "touche") return;
    segOf[g.card] = k;
    const v = Math.round(g.y0 + g.len * 0.57);
    cardSnap[g.card] = v;
    snaps.push(v);
    const n = segs[k + 1];
    win[g.card] = {
      inS: g.y0,
      inE: g.y0 + g.len * 0.3,
      outS: n ? n.y0 : Infinity,
      outE: n ? n.y0 + n.len * (n.kind === "trans" ? transTiming(n).closeS : 0.3) : Infinity,
    };
    if (firstTouche) {
      // the profile card stays up until the first lunge pushes it out
      win[1].outS = g.y0;
      win[1].outE = g.y0 + g.len * 0.3;
      firstTouche = false;
    }
  });
  snaps.push(end);

  return {
    mob, W, H, S, Wa, Ha, pisteTop, camFrac, hudH, areaTop, areaH, segs,
    snaps: mob ? [] : snaps,
    allSnaps: snaps,
    cardSnap, win, segOf, end,
    lift: W < 760 ? 12 : 26,
    trackH: Math.round(end + H),
  };
}

/** Scroll position of the first card of a round (round 2 lands on the profile card). */
export function roundSnap(L: Layout, round: number): number {
  if (round === 2) return L.cardSnap[1];
  const g = L.segs.find((s): s is ToucheSeg => s.kind === "touche" && s.round === round);
  return g ? L.cardSnap[g.card] : 0;
}

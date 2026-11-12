// Pure animation model: given the layout and the current scroll position, returns
// where everything in the arena is and which effects are active. No DOM access.
import { BANNER, REACH, transTiming, type Layout, type Seg, type TransTiming } from "./layout";
import { ADV, EG, I1, L1, L2, L4, LX, RET, SHIFT, type BugState, type Pose } from "./pixel";

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, u: number) => a + (b - a) * clamp(u);

/** Scroll progress through a touché at which the blade lands. */
export const HIT = 0.45;

export type MotionInput = { y: number; dir: number; moving: boolean; tick: number; reduced: boolean };

export type Wipe = { mode: 0 | 1; k: number };

export type Model = {
  si: number;
  s: Seg;
  q: number;
  T: boolean;
  fx: number;
  camX: number;
  pose: Pose;
  ox: number;
  round: number;
  me: number;
  bug: number;
  red: boolean;
  flashRed: boolean;
  bugS: BugState | null;
  podK: number;
  green: boolean;
  redL: boolean;
  scoreOn: boolean;
  belle: boolean;
  win: boolean;
  rise: number;
  dust: number;
  spark: number;
  burst: number;
  shake: boolean;
  toucheP: number;
  riposteP: number;
  bgFx: number;
  wipe: Wipe | null;
  /** Progress (0..1) through the round-intro hold, or -1 when it isn't showing. */
  intro: number;
  /** Progress (0..1) through a brief round change's banner, or -1 when it isn't showing. */
  banner: number;
  /** HUD round label highlight after the round number changes (0..1), or -1. */
  roundPop: number;
};

export function computeModel(L: Layout, { y, dir, moving, tick, reduced: red }: MotionInput): Model {
  const segs = L.segs;
  let si = 0;
  for (let k = 0; k < segs.length; k++) if (y >= segs[k].y0) si = k;
  const s = segs[si], q = clamp((y - s.y0) / s.len), T = s.kind === "touche";
  const tt: TransTiming | null = s.kind === "trans" ? transTiming(s) : null;

  // --- fencer x position along the piste
  let fx = s.xs, walk = false;
  if (s.kind === "trans" && tt) {
    const { closeE: cE, openS: oS } = tt;
    if (red) fx = q < cE ? s.xs : s.xe;
    else if (s.brief) {
      // no curtain to hide behind: one steady walk past the round sign
      fx = lerp(s.xs, s.xe, (q - 0.04) / 0.92);
      walk = q > 0.04 && q < 0.96;
    } else {
      // walk up to the sign, cross it behind the curtain, then walk on into the new round
      fx = q < 0.08 ? s.xs
        : q < cE ? lerp(s.xs, s.sign - 40, (q - 0.08) / (cE - 0.08))
        : q < oS ? lerp(s.sign - 40, s.sign - 10, (q - cE) / (oS - cE))
        : lerp(s.sign - 10, s.xe, (q - oS) / (1 - oS));
      walk = q > 0.08;
    }
  } else if (s.kind === "touche") {
    if (red) fx = s.R;
    else {
      fx = q < 0.3 ? lerp(s.xs, s.R, q / 0.3) : q < 0.76 ? s.R : lerp(s.R, s.xe, (q - 0.76) / 0.24);
      walk = (q < 0.3 && s.xs !== s.R) || (q > 0.76 && s.xe !== s.R);
    }
  }

  const isFinal = s.kind === "touche" && s.final;
  const podK = isFinal && q >= 0.8 ? (red ? 1 : easeOut((q - 0.8) / 0.2)) : 0;
  const camX = fx - L.Wa * L.camFrac + (L.mob ? podK * (L.Wa * L.camFrac + 24 - L.Wa / 2) : 0);

  // --- fencer pose
  let pose: Pose = EG, ox = fx;
  if (red) pose = EG;
  else if (T && q >= 0.3 && q < 0.55) pose = q < (L.mob ? 0.45 : 0.36) ? L1 : q < 0.45 ? L2 : q < 0.5 ? LX : L4;
  else if (walk && moving) {
    const d = (((fx - 30) % 6) + 6) % 6;
    if (dir >= 0) {
      const f = Math.min(3, Math.floor(d / 1.5));
      pose = ADV[f];
      ox = fx - SHIFT[f];
    } else {
      const f = Math.min(3, Math.floor(((6 - d) % 6) / 1.5));
      pose = RET[f];
      ox = fx + SHIFT[f];
    }
  } else if (!moving && tick % 2) pose = I1;

  // the bug's riposte knocks the fencer back
  const counter = T && !isFinal && !red;
  const slide = counter ? (q < 0.7 ? 0 : q < 0.73 ? (-3 * (q - 0.7)) / 0.03 : q < 0.76 ? -3 : q < 0.85 ? -3 * (1 - (q - 0.76) / 0.09) : 0) : 0;
  ox += Math.round(slide);
  const flashRed = counter && q >= 0.7 && q < 0.76;

  // --- the bug
  let bugS: BugState | null = null;
  const offR = (xx: number) => xx + L.Wa * (1 - L.camFrac) + 24;
  if (s.kind === "trans" && tt) {
    if (red) {
      if (q < tt.closeE) { if (s.lastB != null) bugS = { x: s.lastB, pose: "guard", f: 0 }; }
      else bugS = { x: s.nB, pose: "guard", f: 0 };
    } else if (q < 0.2) {
      if (s.lastB != null) {
        const x = lerp(s.lastB, offR(s.xs), easeOut(q / 0.2));
        bugS = { x, pose: "scurry", f: Math.floor(x / 2) };
      }
    } else if (q >= tt.openS) {
      const u = (q - tt.openS) / (0.94 - tt.openS), x = lerp(offR(s.sign - 10), s.nB, easeOut(clamp(u)));
      bugS = u < 1 ? { x, pose: "scurry", f: Math.floor(x / 2) } : { x: s.nB, pose: "guard", f: tick };
    }
  } else if (s.kind === "touche") {
    const B = s.B;
    if (red) bugS = s.final && q >= 0.8 ? null : { x: B, pose: "guard", f: 0 };
    else if (q < HIT) bugS = { x: B, pose: "guard", f: tick };
    else if (q < 0.6) {
      const u = (q - HIT) / 0.15;
      bugS = { x: B + (u < 0.1 ? 1 : 2), pose: "hit", sq: u < 0.25 ? 1 : Math.max(0, 0.6 - u), stars: u > 0.1, f: tick };
    } else if (!s.final) {
      const front = s.R + 36;
      if (q < 0.7) {
        const u = (q - 0.6) / 0.1;
        bugS = { x: lerp(B, front, u), lift: 10 * u + 6 * Math.sin(Math.PI * u), pose: "launch" };
      } else if (q < 0.76) {
        const u = (q - 0.7) / 0.06;
        bugS = { x: lerp(front, B, u), lift: 10 * (1 - u) + 4 * Math.sin(Math.PI * u), pose: "launch" };
      } else if (s.nextT && s.nB != null && q < 0.95) {
        const x = lerp(B, s.nB, easeOut((q - 0.76) / 0.19));
        bugS = { x, pose: "scurry", f: Math.floor(x / 2) };
      } else bugS = { x: s.nextT && s.nB != null ? s.nB : B, pose: "guard", f: tick };
    } else {
      const miss = s.R + 44;
      if (q < 0.68) {
        const u = (q - 0.6) / 0.08;
        bugS = { x: lerp(B, miss, u), lift: 7 * Math.sin(Math.PI * u), pose: "launch" };
      } else if (q < 0.8) {
        const u = (q - 0.68) / 0.12;
        bugS = { x: miss + u * 4, pose: "back", rot: u < 0.5 ? 1 : 2, broken: true, f: 0, piece: miss - 6 };
      } else bugS = { x: miss + 4, pose: "back", rot: 2, broken: true, f: tick, piece: miss - 6, alpha: clamp(1 - podK * 1.6) };
    }
  }

  // --- score
  let me = 0, bug = 0;
  segs.forEach((g, k) => {
    if (g.kind !== "touche") return;
    const gq = k < si ? 1 : k > si ? 0 : q;
    if (gq >= HIT) me++;
    if (!g.final && gq >= 0.7) bug++;
  });
  const round = s.kind === "title" ? 1 : s.kind === "trans" ? (q < transTiming(s).closeE ? s.from : s.to) : s.round;

  // --- scoring lamps
  let green = false, redL = false;
  if (s.kind === "touche") {
    green = s.final ? q >= HIT : q >= HIT && q < 0.6;
    redL = !s.final && q >= 0.7 && q < 0.8;
  } else if (s.kind === "trans" && tt && s.belle && q >= tt.closeE + 0.04 && q < tt.openS - 0.04) {
    // la belle: both lamps alternate while the final-round screen is up
    const k = Math.floor((q - tt.closeE) / 0.025);
    green = k % 2 === 1;
    redL = k % 2 === 0;
  }

  const fxOn = T && !red;
  return {
    si, s, q, T, fx, camX, pose, ox, round, me, bug, red, flashRed, bugS, podK, green, redL,
    scoreOn: si > 1 || (si === 1 && q >= 0.6),
    belle: (s.kind === "trans" && tt && s.belle && q >= tt.closeE) || (isFinal && q < HIT),
    win: isFinal && q >= HIT,
    rise: round === 7 ? 1 : 0,
    dust: fxOn && q >= 0.36 && q < HIT ? (q - 0.36) / 0.09 : -1,
    spark: fxOn && q >= HIT && q < 0.5 ? (q - HIT) / 0.05 : -1,
    burst: fxOn && q >= HIT && q < 0.5 ? (q - HIT) / 0.05 : -1,
    shake: fxOn && q >= HIT && q < 0.47,
    toucheP: fxOn && q >= HIT && q < 0.58 ? (q - HIT) / 0.13 : -1,
    riposteP: fxOn && !isFinal && q >= 0.7 && q < 0.8 ? (q - 0.7) / 0.1 : -1,
    bgFx: fxOn ? (q >= HIT && q < 0.48 ? 1 : !isFinal && q >= 0.7 && q < 0.73 ? -1 : 0) : 0,
    wipe: curtain(s, q, red),
    intro: s.kind === "trans" && tt && !s.brief && q >= tt.closeE && q < tt.openS ? (q - tt.closeE) / (tt.openS - tt.closeE) : -1,
    banner: s.kind === "trans" && s.brief && q >= BANNER.s && q < BANNER.e ? (q - BANNER.s) / (BANNER.e - BANNER.s) : -1,
    roundPop: tt && q >= tt.closeE && q < tt.openE + 0.06 ? (q - tt.closeE) / (tt.openE + 0.06 - tt.closeE) : -1,
  };
}

/** Curtain state for the round transition. Reduced motion: a plain cut to the intro screen. */
function curtain(s: Seg, q: number, red: boolean): Wipe | null {
  if (s.kind !== "trans" || s.brief) return null;
  const { closeS, closeE, openS, openE } = transTiming(s);
  if (red) return q >= closeE && q < openS ? { mode: 0, k: 1 } : null;
  if (q < closeS || q >= openE) return null;
  if (q < closeE) return { mode: 0, k: (q - closeS) / (closeE - closeS) };
  if (q < openS) return { mode: 0, k: 1 };
  return { mode: 1, k: (q - openS) / (openE - openS) };
}

/** Where the "TOUCHÉ!" label sits, in CSS pixels. */
export function toucheFlashPos(L: Layout, m: Model) {
  if (m.toucheP < 0 || m.s.kind !== "touche") return { x: 0, y: 0, op: 0, sc: 1 };
  const qq = m.toucheP;
  return {
    x: Math.round((m.s.R + REACH - m.camX) * L.S),
    y: (L.pisteTop - 36) * L.S,
    op: qq > 0.75 ? 1 - (qq - 0.75) / 0.25 : 1,
    sc: qq < 0.1 ? 1.25 : 1,
  };
}

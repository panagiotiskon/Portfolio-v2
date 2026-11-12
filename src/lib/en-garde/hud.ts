// HUD view-model: round label, scoreboard, lamps and the section menu.
import { RF, RN, RS } from "./content";
import type { Layout } from "./layout";
import { clamp, type Model } from "./model";
import { TOTAL_ROUNDS } from "./rounds";

export type HudSection = { round: number; label: string; long: string; current: boolean };

export type Hud = {
  round: number;
  sub: string;
  subColor: string;
  /** Short label for the mobile bar ("R3/7", "LA BELLE", "VICTORY"). */
  short: string;
  shortColor: string;
  /** True right after the round number changes: the HUD round label lights up. */
  roundPop: boolean;
  me: string;
  bug: string;
  meName: string;
  scoreAria: string;
  greenOn: boolean;
  redOn: boolean;
  mePlus: boolean;
  bugPlus: boolean;
  /** Scroll progress, 0..1 (rounded to 0.1%). */
  xp: number;
  sections: HudSection[];
};

export function computeHud(L: Layout, m: Model, y: number, tick: number): Hud {
  const narrow = L.W < 760;
  const maxY = L.trackH - L.H;
  const flash = tick % 2 ? "#ff3b4e" : "#ffc94a";
  const pad = (n: number) => (m.scoreOn ? String(n).padStart(2, "0") : "--");
  const sub = m.win
    ? "VICTORY · 10–9"
    : m.belle
      ? "LA BELLE – NEXT TOUCH WINS"
      : RF[m.round] + (narrow || RF[m.round] === RN[m.round] ? "" : " · " + RN[m.round]);

  return {
    round: m.round,
    sub,
    subColor: m.win ? "#3cff7a" : m.belle ? flash : "#a49fbd",
    short: m.win ? "VICTORY" : m.belle ? "LA BELLE" : `R${m.round}/${TOTAL_ROUNDS}`,
    shortColor: m.win ? "#3cff7a" : m.belle ? flash : "#ffc94a",
    roundPop: m.roundPop >= 0 && m.roundPop < 1,
    me: pad(m.me),
    bug: pad(m.bug),
    meName: narrow ? "YOU" : "PANAGIOTIS",
    scoreAria: m.scoreOn ? `Score: Panagiotis ${m.me}, The Bug ${m.bug}.` : "Scoreboard off",
    greenOn: m.green,
    redOn: m.redL,
    mePlus: m.toucheP >= 0 && m.toucheP < 0.6,
    bugPlus: m.riposteP >= 0 && m.riposteP < 0.8,
    xp: Math.round(clamp(y / maxY) * 1000) / 1000,
    sections: Array.from({ length: TOTAL_ROUNDS - 1 }, (_, i) => i + 2).map((r) => ({
      round: r,
      label: narrow ? RS[r] : RN[r],
      long: `R${r} · ${RN[r]}`,
      current: r === m.round,
    })),
  };
}

export const lampStyle = (on: boolean, color: "green" | "red") =>
  color === "green"
    ? { background: on ? "#3cff7a" : "#0f3320", boxShadow: on ? "0 0 0 3px #1b1530,0 0 18px 5px rgba(60,255,122,.65)" : "0 0 0 3px #1b1530" }
    : { background: on ? "#ff3b4e" : "#3a1018", boxShadow: on ? "0 0 0 3px #1b1530,0 0 16px 5px rgba(255,59,78,.65)" : "0 0 0 3px #1b1530" };

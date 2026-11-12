// Card registry: every on-screen card gets a numeric id, derived from content counts,
// so adding a project / job / bio entry automatically extends the scroll timeline.
import { BIO, EXP, PROJ } from "./content";

export const TOTAL_ROUNDS = 7;

function buildCards() {
  let next = 2; // 0 = title, 1 = profile
  const take = (n: number) => {
    const ids = Array.from({ length: n }, (_, i) => next + i);
    next += n;
    return ids;
  };
  const bios = take(BIO.length);
  const [inventory] = take(1);
  const exps = take(EXP.length);
  const [featured] = take(1);
  const projects = take(PROJ.length);
  const [trophies] = take(1);
  const [contact] = take(1);
  return { title: 0, profile: 1, bios, inventory, exps, featured, projects, trophies, contact, count: next };
}

export const CARD = buildCards();

/** [round number, card ids revealed by a lunge in that round]. Round 1 is the title screen. */
export const ROUNDS: [number, number[]][] = [
  [2, CARD.bios],
  [3, [CARD.inventory]],
  [4, CARD.exps],
  [5, [CARD.featured, ...CARD.projects]],
  [6, [CARD.trophies]],
  [7, [CARD.contact]],
];

/** The final card ends the bout (no riposte, podium instead). */
export const FINAL_CARD = CARD.contact;

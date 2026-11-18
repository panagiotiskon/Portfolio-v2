// Card registry: every on-screen card has a numeric id. The bout is a 5-touch pool bout:
// one touch per round, so the score runs to 5–4 with la belle at 4–4.

export const TOTAL_ROUNDS = 6;

export const CARD = {
  title: 0,
  profile: 1,
  about: 2,
  experience: 3,
  projects: 4,
  trophies: 5,
  contact: 6,
  count: 7,
} as const;

/** [round number, card ids revealed by a lunge in that round]. Round 1 is the title screen. */
export const ROUNDS: [number, number[]][] = [
  [2, [CARD.about]],
  [3, [CARD.experience]],
  [4, [CARD.projects]],
  [5, [CARD.trophies]],
  [6, [CARD.contact]],
];

/** The final card ends the bout (no riposte, podium instead). */
export const FINAL_CARD = CARD.contact;

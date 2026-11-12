// 12×12 pixel icons, rasterised once on the client into data URLs.
import type { IconName } from "./content";

type Grid = string[];

const ICONS: Record<Exclude<IconName, "badgeG" | "orbG">, Grid> = {
  blade: ["..........kk", ".........kwk", "........kwk.", ".......kwk..", "......kwk...", ".....kwk....", "....kwk.....", ".k.kwk......", "..kgk.......", ".kgkg.......", "kgk..k......", "kk.........."],
  armor: ["...kk..kk...", "..kwwkkwwk..", ".kwwwwwwwwk.", "kwwwwsswwwwk", "kwkwwsswwkwk", "kk.kwsswk.kk", "...kwsswk...", "...kwwwwk...", "...kwwwwk...", "...kssssk...", "...kwwwwk...", "....kkkk...."],
  shield: ["kkkkkkkkkkkk", "kssssssssssk", "kswwwwwwwwsk", "kswwGGGGwwsk", "kswwGwwGwwsk", "kswwGGGGwwsk", ".kswwGGwwsk.", ".kswwwwwwsk.", "..kswwwwsk..", "...kswwsk...", "....kssk....", ".....kk....."],
  scroll: [".kkkkkkkkk..", "kpppppppppk.", "kpkkkkkkkpk.", ".kpppppppk..", ".kpnnnnnpk..", ".kpppppppk..", ".kpnnnnppk..", ".kpppppppk..", ".kpnnnnnpk..", "kpppppppppk.", "kpkkkkkkkpk.", ".kkkkkkkkk.."],
  trophy: ["..kkkkkkkk..", "kkggggggggkk", "kgkggwgggkgk", "kgkggwgggkgk", ".kkggggggkk.", "...kggggk...", "....kggk....", ".....kk.....", "....kddk....", "...kggggk...", "..kddddddk..", "..kkkkkkkk.."],
  star: [".....kk.....", "....kggk....", "....kggk....", "kkkkkggkkkkk", "kggggggggggk", ".kggggwgggk.", "..kgggwggk..", "..kggggggk..", ".kgggkkgggk.", ".kggk..kggk.", "kggk....kggk", "kkk......kkk"],
  medal: ["kbbk....kbbk", ".kbbk..kbbk.", "..kbbkkbbk..", "...kbbbbk...", "....kkkk....", "...kggggk...", "..kgggwggk..", "..kggwgggk..", "..kgggggdk..", "...kgggdk...", "....kkkk....", "............"],
  globe: ["....kkkk....", "..kkbGGbkk..", ".kbbGGGbbbk.", ".kbGGbbbGbk.", "kbbGbbbGGbbk", "kbbbbbGGGbbk", "kbGGbbbGbbbk", "kbGGGbbbbbbk", ".kbGGbbbbbk.", ".kbbbbbGbbk.", "..kkbbbbkk..", "....kkkk...."],
  whistle: ["............", "............", "......kkkkkk", "....kkssssk.", "..kksswwsk..", ".ksssssssk..", "kssskkssk...", "ksssksssk...", "kssssssk....", ".ksssssk....", "..kkkkk.....", "............"],
  diploma: ["............", "............", "..........kk", "........kkpk", "......kkppk.", "....kkpppk..", "..kkppppk...", "kkpppprk....", "kppppkrk....", "kpppk.rrk...", ".kkk...rk...", "............"],
  badge: ["...kkkkkk...", "..kGGGGGGk..", ".kGGGwwGGGk.", "kGGGGwwGGGGk", "kGwwwwwwwwGk", "kGGwwwwwwGGk", "kGGGwwwwGGGk", "kGGwwkkwwGGk", ".kGwkGGkwGk.", "..kGGGGGGk..", "...kkkkkk...", "............"],
  orb: ["....kkkk....", "..kkGGGGkk..", ".kGGwwGGGGk.", ".kGwwGGGGGk.", "kGGwGGGGGGGk", "kGGGGGGGGGGk", "kGGGGGGGGGDk", "kGGGGGGGGGDk", ".kGGGGGGGDk.", ".kGGGGGGDDk.", "..kkGDDDkk..", "....kkkk...."],
  bug: ["..k......k..", "...k....k...", "....kkkk....", "...krrrrk...", "k.krwkkwrk.k", ".kkrrrrrrkk.", "..krrkkrrk..", "kkkrrrrrrkkk", "..krrkkrrk..", ".kkrrrrrrkk.", "k..krrrrk..k", "....kkkk...."],
  lock: ["....kkkk....", "...kssssk...", "..ksk..ksk..", "..ks....sk..", "..ks....sk..", ".kkkkkkkkkk.", ".kggggggggk.", ".kgggkkgggk.", ".kgggkkgggk.", ".ggggkkgggg.", ".kddddddddk.", ".kkkkkkkkkk."],
  term: ["kkkkkkkkkkkk", "krkgkGkssssk", "kkkkkkkkkkkk", "kzzzzzzzzzzk", "kzGzzzzzzzzk", "kzzGzzzzzzzk", "kzzzGzzzzzzk", "kzzGzzzzzzzk", "kzGzzzwwwzzk", "kzzzzzzzzzzk", "kzzzzzzzzzzk", "kkkkkkkkkkkk"],
  inbox: ["kkkkkkkkkkkk", "kwwwwwwwwwwk", "kwnwwwwwwwwk", "kwwwwwwwwwwk", "kwnwnnnwwwwk", "kwnwnwwnwwwk", "kwnwnwwnwwwk", "kwnwnwwnwwwk", "kwnwnwwnwwwk", "kwwwwwwwwwwk", "kwwwwwwwwwwk", "kkkkkkkkkkkk"],
};

/** Palette-swapped variants: [base icon, colour-key remap]. */
const VARIANTS: Record<"badgeG" | "orbG", [keyof typeof ICONS, Record<string, string>]> = {
  badgeG: ["badge", { G: "g" }],
  orbG: ["orb", { G: "g", D: "d" }],
};

const ICOL: Record<string, string> = {
  k: "#1b1530", w: "#f2efe6", s: "#b8c3d8", g: "#ffc94a", d: "#8a5a12", r: "#ff3b4e", G: "#3cff7a",
  D: "#145a32", b: "#5aa7ff", p: "#e8dcb8", n: "#3b3754", z: "#0b0a17",
};

export type IconSet = Record<IconName, string>;

function rasterise(rows: Grid, remap?: Record<string, string>): string {
  const cv = document.createElement("canvas");
  cv.width = rows[0].length;
  cv.height = rows.length;
  const c = cv.getContext("2d")!;
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      const key = remap?.[ch] ?? ch;
      if (ICOL[key]) {
        c.fillStyle = ICOL[key];
        c.fillRect(x, y, 1, 1);
      }
    }),
  );
  return cv.toDataURL();
}

let cache: IconSet | null = null;
export function getIcons(): IconSet {
  if (cache) return cache;
  const out = {} as IconSet;
  for (const k of Object.keys(ICONS) as (keyof typeof ICONS)[]) out[k] = rasterise(ICONS[k]);
  for (const k of Object.keys(VARIANTS) as (keyof typeof VARIANTS)[]) out[k] = rasterise(ICONS[VARIANTS[k][0]], VARIANTS[k][1]);
  cache = out;
  return out;
}

// Company marks redrawn as pixel art, hand-drawn on a grid from each company's official artwork
// (downsampling turns them to mush at this size). Rendered as SVG paths on a square plate.

export type LogoName = "kotsovolos" | "logicea" | "connectin" | "fencingref" | "myfield";

type Grid = string[];
type PixelLogoDef = {
  rows: Grid;
  /** Grid character → colour. */
  colors: Record<string, string>;
  bg: string;
  /** Optional dot grid on the plate (every 4 art px). */
  dots?: string;
};

export const LOGOS: Record<LogoName, PixelLogoDef> = {
  // the K from the Kotsovolos app icon: white on brand red, 3px strokes
  kotsovolos: {
    rows: [
      "###.....###.", "###....###..", "###...###...", "###..###....",
      "###.###.....", "######......", "#####.......", "####........",
      "#####.......", "######......", "###.###.....", "###..###....",
      "###...###...", "###....###..", "###.....###.", "###......###",
    ],
    colors: { "#": "#ffffff" },
    bg: "#b0122c",
  },
  // the Logicea emblem (three bars, the inner two hooking into chevrons): brand purple on paper
  logicea: {
    rows: [
      "#........", "#........", "#.#......", "#.#......", "#.#......", "#.#......", "#.#...#..", "#.#...#..",
      "#.#...#.#", "#.#...#.#", "#.#..#..#", "#.#....#.", "#.#...#..", "#.#..#...", "..#.#....", "..##.....",
    ],
    colors: { "#": "#553894" },
    bg: "#f2efe6",
  },
  // magnifying glass between two people, from the ConnectIn logo: teal on paper
  connectin: {
    rows: [
      "........####........", "......##....##......", "......#......#......", ".....#........#..##.",
      ".##..#........#..##.", ".##..#........#.....", ".....#........#.####", "####..#......#..####",
      "####..##....##......", "........####.##.....", "..............##....", "...............##...",
      "................##..",
    ],
    colors: { "#": "#2c6e7d" },
    bg: "#f2efe6",
  },
  // FencingRef app icon: bold serif F (bone) + R (red) on a dotted near-black tile
  fencingref: {
    rows: [
      "########.rrrrrrr..", ".##....#..rr...rr.", ".##.......rr...rr.", ".##..#....rr...rr.",
      ".######...rr..rr..", ".##..#....rrrrr...", ".##.......rr.rr...", ".##.......rr..rr..",
      ".##.......rr..rr..", ".##.......rr...rr.", ".##.......rr...rr.", "####.....rrrr..rrr",
    ],
    colors: { "#": "#e8e6df", r: "#e8483f" },
    bg: "#0c0d10",
    dots: "#252831",
  },
  // myField favicon: isometric field cut by two roads, one pale parcel flagged; mint on deep teal
  myfield: {
    rows: [
      "........###.........", ".......######.......", "......########......", ".......########.....",
      "...##...#####.......", ".######..##....###..", "#######........#####", "######.....lll..####",
      ".###.....#..lll..##.", "......####..lll.....", "....#######..lll....", ".....#######..l.....",
      ".......#####........", "........####........",
    ],
    colors: { "#": "#22d07f", l: "#b4f2d0" },
    bg: "#0c2227",
  },
};

/** SVG path for the pixels drawn with `ch`: one rectangle per horizontal run. */
export function gridPath(rows: Grid, ch: string): string {
  const run = new RegExp(`${ch.replace(/[^\w]/g, "\\$&")}+`, "g");
  let d = "";
  rows.forEach((row, y) => {
    for (const m of row.matchAll(run)) d += `M${m.index} ${y}h${m[0].length}v1h-${m[0].length}z`;
  });
  return d;
}

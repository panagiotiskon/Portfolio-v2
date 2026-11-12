// Pixel-art drawing primitives and sprites for the arena canvas.
// Everything draws in "art pixels"; the canvas is scaled up with image-rendering: pixelated.

export type Ctx = CanvasRenderingContext2D;
export type Pt = [number, number];
export type Pose = Record<"hip" | "neck" | "head" | "fe" | "fh" | "tip" | "re" | "rh" | "fk" | "ff" | "bk" | "bf", Pt>;
type Joint = keyof Pose;

export const PAL = {
  ol: "#1b1530", wh: "#f2efe6", sh: "#a7a3bf", lame: "#b8c3d8", lameHi: "#e3e9f3", gr: "#3b3754", grHi: "#6d6889",
  shoe: "#2c2642", shoeHi: "#4a4466", blade: "#d9e1ee", btn: "#7d869c", guard: "#c3ccda", spark: "#ffe36b",
  green: "#3cff7a", dust: "#8d84a0",
};
export type Palette = typeof PAL;
/** Palette swap used when the fencer gets hit by the riposte. */
export const FRED: Palette = { ...PAL, wh: "#ff8a95", sh: "#c9364a", lame: "#ff3b4e", lameHi: "#ffb3bb", gr: "#7a0c1e", grHi: "#b0122c", blade: "#ffd0d5" };

// ---------------------------------------------------------------- poses
const UPPER: Joint[] = ["hip", "neck", "head", "fe", "fh", "tip", "re", "rh"];
export const lerpP = (a: Pose, b: Pose, t: number): Pose => {
  const o = {} as Pose;
  for (const k in a) {
    const j = k as Joint;
    o[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
  }
  return o;
};
const mod = (p: Pose, dx: number, dy: number, legs?: Partial<Pose>): Pose => {
  const o = {} as Pose;
  for (const k in p) {
    const j = k as Joint;
    o[j] = UPPER.includes(j) ? [p[j][0] + dx, p[j][1] + dy] : p[j];
  }
  return Object.assign(o, legs || {});
};

/** FENCE_THE_BUG stance. */
export const EG: Pose = { hip: [20, 29], neck: [21, 19], head: [22, 15], fe: [26, 25], fh: [31, 25], tip: [47, 18], re: [16, 20], rh: [17, 13], fk: [26, 36], ff: [28, 44], bk: [16, 37], bf: [13, 44] };
export const L1: Pose = { ...EG, fe: [27, 22], fh: [33, 21], tip: [50, 19], re: [16, 22], rh: [15, 17] };
export const L2: Pose = { hip: [22, 31], neck: [25, 21], head: [26, 17], fe: [31, 23], fh: [37, 22], tip: [55, 27], re: [19, 25], rh: [14, 26], fk: [30, 31], ff: [35, 38], bk: [17, 38], bf: [13, 44] };
export const LX: Pose = { hip: [27, 35], neck: [31, 25], head: [33, 21], fe: [37, 26], fh: [43, 25], tip: [60, 33], re: [25, 29], rh: [19, 31], fk: [35, 35], ff: [37, 44], bk: [20, 40], bf: [13, 44] };
export const L4: Pose = (() => {
  const p = lerpP(LX, EG, 0.5);
  p.ff = [p.ff[0], 41];
  p.fk = [p.fk[0], p.fk[1] - 2];
  return p;
})();
export const ADV: Pose[] = [EG, mod(EG, 1, 0, { fk: [29, 34], ff: [32, 41] }), mod(EG, 3, 0, { fk: [29, 36], ff: [34, 44], bk: [18, 36], bf: [13, 44] }), mod(EG, 5, 0, { fk: [30, 36], ff: [34, 44], bk: [20, 35], bf: [17, 41] })];
export const RET: Pose[] = [EG, mod(EG, -1, 0, { bk: [14, 35], bf: [9, 41] }), mod(EG, -3, 0, { bk: [12, 37], bf: [7, 44], fk: [23, 36], ff: [28, 44] }), mod(EG, -5, 0, { fk: [21, 35], ff: [25, 41], bk: [11, 37], bf: [7, 44] })];
export const SHIFT = [0, 1, 3, 5];
/** Idle breathing frame. */
export const I1: Pose = mod(EG, 0, 1, { fk: [27, 37] });

// ---------------------------------------------------------------- primitives
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 4×4 ordered-dither threshold in (0,1): draw a pixel when intensity > bayer(x, y). */
export const bayer = (x: number, y: number) => (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
/** Cheap integer hash → uint32, for stable per-item randomness. */
export function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return (n ^ (n >>> 16)) >>> 0;
}
/** "#rrggbb" → packed RGBA for a little-endian Uint32Array view of ImageData. */
export function rgba32(hex: string, a = 255) {
  const v = parseInt(hex.slice(1), 16);
  return ((a << 24) | ((v & 0xff) << 16) | (v & 0xff00) | (v >> 16)) >>> 0;
}
export function stamp(c: Ctx, x: number, y: number, r: number) {
  const R = Math.ceil(r), rr = r * r;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= rr) c.fillRect(x + dx, y + dy, 1, 1);
}
export function stampE(c: Ctx, x: number, y: number, rx: number, ry: number) {
  const X = Math.ceil(rx), Y = Math.ceil(ry);
  for (let dy = -Y; dy <= Y; dy++) for (let dx = -X; dx <= X; dx++) if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) c.fillRect(x + dx, y + dy, 1, 1);
}
/** Bresenham line, optionally stamped with a round brush of radius r. */
export function line(c: Ctx, a: Pt, b: Pt, r: number) {
  let x0 = Math.round(a[0]), y0 = Math.round(a[1]);
  const x1 = Math.round(b[0]), y1 = Math.round(b[1]);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy;
  for (let g = 0; g < 600; g++) {
    if (r > 0) stamp(c, x0, y0, r);
    else c.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
function seg(c: Ctx, pts: Pt[], r: number, col: string, P: Palette) {
  c.fillStyle = P.ol;
  for (let i = 0; i < pts.length - 1; i++) line(c, pts[i], pts[i + 1], r + 1);
  c.fillStyle = col;
  for (let i = 0; i < pts.length - 1; i++) line(c, pts[i], pts[i + 1], r);
}

// ---------------------------------------------------------------- fencer
function shoe(c: Ctx, p: Pt, front: boolean, P: Palette) {
  const x = Math.round(p[0]), y = Math.round(p[1]);
  const x0 = front ? x - 1 : x - 2, w = front ? 5 : 4;
  c.fillStyle = P.ol; c.fillRect(x0 - 1, y - 2, w + 2, 4);
  c.fillStyle = P.shoe; c.fillRect(x0, y - 1, w, 2);
  c.fillStyle = P.shoeHi; c.fillRect(front ? x0 + w - 2 : x0 + 1, y - 1, 1, 1);
}
function head(c: Ctx, p: Pt, P: Palette) {
  const x = Math.round(p[0]), y = Math.round(p[1]);
  c.fillStyle = P.ol; stamp(c, x, y, 4); c.fillRect(x, y + 3, 4, 3);
  c.fillStyle = P.wh; stamp(c, x, y, 3); c.fillRect(x + 1, y + 3, 2, 2);
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = 0; dx <= 3; dx++)
      if (dx * dx + dy * dy <= 7) {
        c.fillStyle = (dx + dy) & 1 ? P.grHi : P.gr;
        c.fillRect(x + dx, y + dy, 1, 1);
      }
}
/** Offscreen canvas painted once by `draw`. */
function offscreen(w: number, h: number, draw: (g: Ctx) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  return cv;
}

// Poses are a small fixed set of constants, so each pose × palette is rendered once and blitted.
// Offsets are whole pixels, so the blit is pixel-identical to drawing in place.
const FENCER_PAD = 16;
const fencerSprites = new WeakMap<Pose, Map<Palette, HTMLCanvasElement>>();
export function drawFencer(c: Ctx, p: Pose, ox: number, oy: number, P: Palette = PAL) {
  if (!Number.isInteger(ox) || !Number.isInteger(oy)) return paintFencer(c, p, ox, oy, P);
  let byPal = fencerSprites.get(p);
  if (!byPal) fencerSprites.set(p, (byPal = new Map()));
  let cv = byPal.get(P);
  if (!cv) byPal.set(P, (cv = offscreen(64 + FENCER_PAD * 2, 48 + FENCER_PAD * 2, (g) => paintFencer(g, p, FENCER_PAD, FENCER_PAD, P))));
  c.drawImage(cv, ox - FENCER_PAD, oy - FENCER_PAD);
}
function paintFencer(c: Ctx, p: Pose, ox: number, oy: number, P: Palette) {
  const J = (k: Joint): Pt => [p[k][0] + ox, p[k][1] + oy];
  const S: Pt = [p.neck[0] + ox, p.neck[1] + oy + 2];
  seg(c, [J("hip"), J("bk"), J("bf")], 1.5, P.sh, P); shoe(c, J("bf"), false, P);
  seg(c, [S, J("re"), J("rh")], 1.1, P.sh, P);
  const hip = J("hip"), nk = J("neck"), waist: Pt = [hip[0] + (nk[0] - hip[0]) * 0.3, hip[1] + (nk[1] - hip[1]) * 0.3];
  seg(c, [hip, nk], 2.5, P.lame, P);
  c.fillStyle = P.lameHi; line(c, [waist[0] + 1, waist[1] - 1], [nk[0] + 1, nk[1] + 1], 0);
  c.fillStyle = P.wh; stamp(c, Math.round(hip[0]), Math.round(hip[1]), 2); line(c, hip, waist, 1.5);
  head(c, J("head"), P);
  seg(c, [hip, J("fk"), J("ff")], 1.5, P.wh, P); shoe(c, J("ff"), true, P);
  const h = J("fh"), tp = J("tip");
  c.fillStyle = P.blade; line(c, h, tp, 0);
  c.fillStyle = P.btn; c.fillRect(Math.round(tp[0]), Math.round(tp[1]), 1, 1);
  seg(c, [S, J("fe"), h], 1.1, P.wh, P);
  const L = Math.hypot(tp[0] - h[0], tp[1] - h[1]) || 1;
  const bx = Math.round(h[0] + ((tp[0] - h[0]) / L) * 1.5), by = Math.round(h[1] + ((tp[1] - h[1]) / L) * 1.5);
  c.fillStyle = P.ol; stamp(c, bx, by, 2.3);
  c.fillStyle = P.guard; stamp(c, bx, by, 1.3);
}

// ---------------------------------------------------------------- fx
export function fxSpark(c: Ctx, x: number, y: number, p: number) {
  x = Math.round(x); y = Math.round(y);
  const L = Math.max(1, Math.round(1 + (1 - p) * 3));
  c.fillStyle = PAL.spark;
  for (let i = 1; i <= L + 1; i++) { c.fillRect(x + i, y, 1, 1); c.fillRect(x - i, y, 1, 1); c.fillRect(x, y + i, 1, 1); c.fillRect(x, y - i, 1, 1); }
  for (let i = 1; i < L; i++) { c.fillRect(x + i, y + i, 1, 1); c.fillRect(x - i, y - i, 1, 1); c.fillRect(x + i, y - i, 1, 1); c.fillRect(x - i, y + i, 1, 1); }
  c.fillStyle = "#ffffff"; c.fillRect(x, y, 1, 1);
}
export function fxDust(c: Ctx, x: number, y: number, p: number) {
  for (let i = 0; i < 7; i++) {
    if (p > 0.75 && i % 2) continue;
    const a = Math.PI * (1 + i * 0.07), d = 1.5 + p * (5 + i * 1.3);
    c.fillStyle = i % 2 ? "#6f6787" : PAL.dust;
    const s = p < 0.5 && i % 3 === 0 ? 2 : 1;
    c.fillRect(Math.round(x + Math.cos(a) * d * 1.4), Math.round(y - 1 + Math.sin(a) * d * 0.7 - p * (i % 3)), s, s);
  }
}

// ---------------------------------------------------------------- 3x5 pixel font
const FONT3: Record<string, string[]> = {
  A: [".k.", "k.k", "kkk", "k.k", "k.k"], B: ["kk.", "k.k", "kk.", "k.k", "kk."], C: [".kk", "k..", "k..", "k..", ".kk"],
  E: ["kkk", "k..", "kk.", "k..", "kkk"], H: ["k.k", "k.k", "kkk", "k.k", "k.k"], I: ["kkk", ".k.", ".k.", ".k.", "kkk"],
  J: ["..k", "..k", "..k", "k.k", ".k."], K: ["k.k", "k.k", "kk.", "k.k", "k.k"], L: ["k..", "k..", "k..", "k..", "kkk"],
  N: ["kk.", "k.k", "k.k", "k.k", "k.k"], O: [".k.", "k.k", "k.k", "k.k", ".k."], P: ["kk.", "k.k", "kk.", "k..", "k.."],
  R: ["kk.", "k.k", "kk.", "k.k", "k.k"], S: [".kk", "k..", ".k.", "..k", "kk."], T: ["kkk", ".k.", ".k.", ".k.", ".k."],
  U: ["k.k", "k.k", "k.k", "k.k", "kkk"], X: ["k.k", "k.k", ".k.", "k.k", "k.k"], Y: ["k.k", "k.k", ".k.", ".k.", ".k."],
  ">": ["k..", "kk.", "kkk", "kk.", "k.."], " ": ["...", "...", "...", "...", "..."],
  D: ["kk.", "k.k", "k.k", "k.k", "kk."], F: ["kkk", "k..", "kk.", "k..", "k.."], G: [".kk", "k..", "k.k", "k.k", ".kk"],
  M: ["k.k", "kkk", "kkk", "k.k", "k.k"], V: ["k.k", "k.k", "k.k", "k.k", ".k."], W: ["k.k", "k.k", "kkk", "kkk", "k.k"],
  Z: ["kkk", "..k", ".k.", "k..", "kkk"], "!": [".k.", ".k.", ".k.", "...", ".k."], "-": ["...", "...", "kkk", "...", "..."],
  ".": ["...", "...", "...", "...", ".k."],
  "0": ["kkk", "k.k", "k.k", "k.k", "kkk"], "1": [".k.", "kk.", ".k.", ".k.", "kkk"], "2": ["kk.", "..k", ".k.", "k..", "kkk"],
  "3": ["kk.", "..k", ".k.", "..k", "kk."], "4": ["k.k", "k.k", "kkk", "..k", "..k"], "5": ["kkk", "k..", "kk.", "..k", "kk."],
  "6": [".kk", "k..", "kkk", "k.k", "kkk"], "7": ["kkk", "..k", ".k.", ".k.", ".k."], "8": ["kkk", "k.k", "kkk", "k.k", "kkk"],
  "9": ["kkk", "k.k", "kkk", "..k", "kk."],
};
/** 3×5 glyph rows for a character (blank if unknown). */
export const glyph = (ch: string) => FONT3[ch] || FONT3[" "];
export function pxText(c: Ctx, str: string, x: number, y: number, col: string) {
  c.fillStyle = col;
  [...str].forEach((ch, n) => {
    glyph(ch).forEach((r, yy) =>
      [...r].forEach((px, xx) => {
        if (px === "k") c.fillRect(x + n * 4 + xx, y + yy, 1, 1);
      }),
    );
  });
}

// ---------------------------------------------------------------- props on the piste
type BoardState = "dim" | "hit" | "cur";
const boardFaces = new Map<BoardState, HTMLCanvasElement>();
/** The target face (15×17 incl. outline), centred on x = 7. */
function boardFace(st: BoardState) {
  let cv = boardFaces.get(st);
  if (cv) return cv;
  const face = st === "dim" ? "#2e2952" : "#e8e1cf", ring = st === "hit" ? PAL.green : st === "cur" ? "#ff3b4e" : "#4a4466";
  cv = offscreen(15, 17, (c) => {
    c.fillStyle = PAL.ol; c.fillRect(0, 0, 15, 17);
    c.fillStyle = face; c.fillRect(1, 1, 13, 15);
    c.fillStyle = ring; stampE(c, 7, 8, 5, 6);
    c.fillStyle = face; stampE(c, 7, 8, 3.4, 4.2);
    c.fillStyle = ring; stampE(c, 7, 8, 1.5, 2);
  });
  boardFaces.set(st, cv);
  return cv;
}
export function drawBoard(c: Ctx, x: number, pt: number, st: BoardState, pulse: number) {
  const top = pt - 22, l = x - 6;
  c.fillStyle = PAL.ol; c.fillRect(x - 1, top + 14, 3, pt - top - 13); c.fillRect(x - 5, pt, 11, 3);
  c.fillStyle = "#3b3557"; c.fillRect(x, top + 14, 1, pt - top - 14); c.fillRect(x - 4, pt + 1, 9, 1);
  if (st !== "dim") {
    const g = st === "hit" ? "60,255,122" : "255,201,74", a = st === "hit" ? 0.2 : 0.08 + 0.14 * pulse;
    c.fillStyle = `rgba(${g},${a})`; c.fillRect(l - 3, top - 3, 19, 21);
    c.fillStyle = `rgba(${g},${a * 0.5})`; c.fillRect(l - 5, top - 1, 23, 17);
  }
  c.drawImage(boardFace(st), l - 1, top - 1);
}

export function drawSign(c: Ctx, x: number, pt: number, text: string, lit: boolean) {
  const tw = text.length * 4 - 1, bw = tw + 8, bx = x - Math.floor(bw / 2), by = pt - 32;
  if (lit) { c.fillStyle = "rgba(255,201,74,.16)"; c.fillRect(bx - 4, by - 4, bw + 8, 18); }
  c.fillStyle = PAL.ol; c.fillRect(x - 2, by + 10, 4, pt - by - 9);
  c.fillStyle = "#6a4a26"; c.fillRect(x - 1, by + 10, 2, pt - by - 10);
  c.fillStyle = PAL.ol; c.fillRect(bx - 1, by - 1, bw + 2, 12);
  c.fillStyle = lit ? "#5a3d1c" : "#2a2016"; c.fillRect(bx, by, bw, 10);
  c.fillStyle = lit ? "#7a5428" : "#352a1c"; c.fillRect(bx, by, bw, 1);
  pxText(c, text, bx + 4, by + 3, lit ? "#ffc94a" : "#5a5070");
  if (lit) { c.fillStyle = "#ffe36b"; c.fillRect(bx - 1, by - 3, 1, 1); c.fillRect(bx + bw, by - 3, 1, 1); c.fillRect(x, by - 4, 1, 1); }
}

export function drawStep(c: Ctx, x: number, y: number, w: number, h: number, face: string, side: string, dig: string) {
  if (h < 2) return;
  c.fillStyle = PAL.ol; c.fillRect(x - 1, y - 1, w + 2, h + 1);
  c.fillStyle = side; c.fillRect(x, y, w, h);
  c.fillStyle = face; c.fillRect(x, y, w, Math.min(h, 3)); c.fillRect(x + 2, y + 3, w - 4, Math.max(0, h - 5));
  if (h >= 11) pxText(c, dig, x + Math.floor(w / 2) - 1, y + 5, PAL.ol);
}

// ---------------------------------------------------------------- the bug (opponent)
export function drawCryBug(c: Ctx, cx: number, gy: number, f: number) {
  const P = (x: number, y: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const LN = (p: Pt, q: Pt, col: string) => { c.fillStyle = col; line(c, p, q, 0); };
  const sob = f % 2 === 1, by = gy - 5 + (sob ? 1 : 0), leg = "#6d6889", tear = "#4f7fb8";
  R(cx - 7, gy + 1, 15, 1, "#141225"); R(cx - 5, gy + 1, 3, 1, "#33507a"); R(cx + 3, gy + 1, 3, 1, "#33507a");
  LN([cx + 8, gy], [cx + 12, gy - 1], "#8a91a6"); R(cx + 7, gy - 1, 1, 2, "#6f7790"); LN([cx + 14, gy], [cx + 16, gy], "#8a91a6");
  for (const [x0, y0, x1] of [[-4, 2, -6], [-3, 3, -4], [-1, 4, -2], [4, 2, 6], [3, 3, 4], [1, 4, 2]]) LN([cx + x0, by + y0], [cx + x1, gy], leg);
  const tip = sob ? 1 : 0;
  LN([cx - 1, by - 4], [cx - 2, by - 6], leg); LN([cx - 2, by - 6], [cx - 4, by - 6], leg); P(cx - 5, by - 5 + tip, "#9c8240");
  LN([cx + 1, by - 4], [cx + 2, by - 6], leg); LN([cx + 2, by - 6], [cx + 4, by - 6], leg); P(cx + 5, by - 5 + tip, "#9c8240");
  c.fillStyle = PAL.ol; stamp(c, cx, by, 4.6);
  c.fillStyle = "#6e2a38"; stamp(c, cx, by, 3.8);
  c.fillStyle = "#8f3a4a"; stamp(c, cx, by - 1, 2.9);
  P(cx - 2, by - 3, "#b06a78");
  R(cx - 3, by - 2, 2, 2, "#c9c3d8"); R(cx + 1, by - 2, 2, 2, "#c9c3d8"); P(cx - 2, by - 1, PAL.ol); P(cx + 1, by - 1, PAL.ol);
  if (sob) R(cx - 1, by + 1, 2, 2, PAL.ol);
  else { P(cx - 2, by + 2, PAL.ol); P(cx - 1, by + 1, PAL.ol); P(cx, by + 1, PAL.ol); P(cx + 1, by + 2, PAL.ol); }
  P(cx - 3, by, tear); P(cx + 2, by, tear);
  const t = f % 4;
  if (by + 1 + t * 2 < gy) { P(cx - 4 - (t >> 1), by + 1 + t * 2, tear); P(cx + 3 + (t >> 1), by + 1 + t * 2, tear); }
}

export type BugState = {
  x: number;
  pose: "guard" | "scurry" | "hit" | "launch" | "back";
  f?: number;
  sq?: number;
  lift?: number;
  rot?: number;
  broken?: boolean;
  dazed?: boolean;
  stars?: boolean;
  piece?: number;
  alpha?: number;
};

let bugBuf: HTMLCanvasElement | null = null;
export function drawBug(C: Ctx, X: number, GY: number, b: BugState) {
  if (!bugBuf) { bugBuf = document.createElement("canvas"); bugBuf.width = 48; bugBuf.height = 40; }
  const c = bugBuf.getContext("2d")!;
  c.clearRect(0, 0, 48, 40);
  const ol = PAL.ol;
  const P = (x: number, y: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
  const R = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const LN = (p: Pt, q: Pt, col: string) => { c.fillStyle = col; line(c, p, q, 0); };
  const cx = 24, gy = 34, pose = b.pose, f = b.f || 0, air = pose === "launch", sq = b.sq || 0;
  const rx = 6 + sq * 1.5, ry = 5.5 - sq * 1.8, bob = pose === "guard" && f % 2 ? 1 : 0, by = Math.round(gy - 1 - ry) + bob;
  const leg = "#a49fbd", dizzy = pose === "hit" || pose === "back" || b.dazed;
  [-4, -3, -1, 1, 3, 4].forEach((o, k) => {
    const ax = cx + o, ay = by + Math.round(ry) - 1;
    if (air) LN([ax, ay], [ax + 3, ay + 3], leg);
    else {
      const w = pose === "scurry" || pose === "back" ? ((k + f) % 2 ? 1 : -1) : 0;
      LN([ax, ay], [cx + Math.round(o * 1.6) + w, gy], leg);
    }
  });
  c.fillStyle = ol; stampE(c, cx, by, rx + 1, ry + 1);
  c.fillStyle = "#b0122c"; stampE(c, cx, by, rx, ry);
  c.fillStyle = "#ff3b4e"; stampE(c, cx, by - 1, Math.max(1, rx - 1), Math.max(1, ry - 1.2));
  R(cx - 2, by - Math.round(ry) + 1, 2, 1, "#ff8a95"); P(cx + 3, by + 1, "#7a0c1e"); P(cx + 4, by - 2, "#7a0c1e"); P(cx + 1, by + 3, "#7a0c1e");
  const top = by - Math.round(ry);
  const t1 = pose === "guard" ? (f % 3 === 0 ? -1 : 0) : pose === "hit" ? 2 : 0, t2 = pose === "guard" ? (f % 3 === 1 ? -1 : 0) : t1;
  LN([cx - 2, top], [cx - 4, top - 3 + t1], leg); P(cx - 5, top - 4 + t1, "#ffc94a");
  LN([cx + 1, top], [cx + 2, top - 3 + t2], leg); P(cx + 3, top - 4 + t2, "#ffc94a");
  const ey = by - 2;
  for (const e of [cx - 4, cx - 1]) {
    R(e, ey, 2, 2, "#f2efe6");
    if (dizzy) { P(e, ey, ol); P(e + 1, ey + 1, ol); } else P(e, ey + 1, ol);
  }
  if (!dizzy) { P(cx - 4, ey - 2, ol); P(cx - 3, ey - 1, ol); P(cx, ey - 2, ol); P(cx - 1, ey - 1, ol); }
  if (air) R(cx - 4, by + 1, 2, 2, ol);
  else if (dizzy) R(cx - 3, by + 2, 2, 2, ol);
  else R(cx - 4, by + 2, 3, 1, ol);
  const hx = cx - Math.ceil(rx), hy = by + 1;
  if (b.broken) { LN([hx, hy], [hx - 3, hy - 1], PAL.blade); P(hx - 4, hy - 2, "#ffffff"); }
  else if (air) { LN([hx, hy], [hx - 8, hy], PAL.blade); P(hx - 9, hy, PAL.btn); }
  else { LN([hx, hy], [hx - 5, hy - 5], PAL.blade); P(hx - 6, hy - 6, PAL.btn); }
  R(hx - 1, hy - 1, 2, 2, PAL.guard);
  const rot = b.rot || 0;
  C.save();
  C.imageSmoothingEnabled = false;
  C.translate(Math.round(X), Math.round(GY - (gy - by) - (b.lift || 0)));
  if (rot) C.rotate((rot * Math.PI) / 2);
  C.drawImage(bugBuf, -cx, -by);
  C.restore();
}

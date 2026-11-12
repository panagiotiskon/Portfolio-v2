// The arena backdrop: architecture, floodlight rig, crowd, LED ribbon, boards and piste.
// Everything is drawn in art pixels; soft light is faked with 4×4 ordered dithering so it
// stays crisp when the canvas is scaled up with image-rendering: pixelated.
import { bayer, glyph, hash, line, rgba32, type Ctx } from "./pixel";

export type Theme = {
  wall: string;
  band: string;
  crowd: [string, string];
  board: string;
  /** Haze colour of the floodlight cones. */
  light: string;
  /** Faces and surfaces caught in a cone. */
  lit: string;
  prop: "flag" | "banner" | "rack" | "board" | "shelf" | "spot";
};
export const THEMES: Record<number, Theme> = {
  1: { wall: "#100e22", band: "#151230", crowd: ["#221c42", "#3a3266"], board: "#1a1636", light: "#453e86", lit: "#7d74c4", prop: "flag" },
  2: { wall: "#0d1324", band: "#121a30", crowd: ["#1b2442", "#2f3c64"], board: "#151e3a", light: "#33508a", lit: "#7088c0", prop: "banner" },
  3: { wall: "#150f1f", band: "#1c1429", crowd: ["#2a1d3a", "#43305c"], board: "#211731", light: "#5a3f7a", lit: "#9a78bc", prop: "rack" },
  4: { wall: "#0e1122", band: "#14182e", crowd: ["#1c2146", "#323a6a"], board: "#171c3a", light: "#3c4a8e", lit: "#7a86c8", prop: "board" },
  5: { wall: "#130c1e", band: "#1a1129", crowd: ["#2a1b42", "#48306e"], board: "#201534", light: "#583c8c", lit: "#9a7ad0", prop: "flag" },
  6: { wall: "#15110b", band: "#1d1710", crowd: ["#2e2416", "#4a3a22"], board: "#231b10", light: "#7a5c2c", lit: "#c49a52", prop: "shelf" },
  7: { wall: "#0b1517", band: "#0f1d20", crowd: ["#17302f", "#28504c"], board: "#122626", light: "#2c6e64", lit: "#62b8a6", prop: "spot" },
};

export type ArenaOpts = {
  Wa: number;
  Ha: number;
  /** Piste surface row. */
  pt: number;
  /** First art row below the HUD. */
  top: number;
  camX: number;
  th: Theme;
  /** Belle: the crowd is on its feet. */
  rise: number;
  lite: boolean;
  /** Idle-animation clock; 0 when motion is reduced. */
  at: number;
  animate: boolean;
  cheer: boolean;
  gasp: boolean;
  /** `color: null` = board on standby (LEDs dark). */
  ribbon: { text: string; color: string | null };
};

const SHADE = "#07060f";
const LENS = "#fff3c4";
const SHIRT_ACC = ["#3a1a2c", "#173a2a", "#3a3018"];
const SCARF = ["#1f7a44", "#8a1f30"];

// ---------------------------------------------------------------- dithered sprites
const sprites = new Map<string, HTMLCanvasElement>();
/** Paints (and caches) an offscreen sprite pixel by pixel: paint returns packed RGBA or 0. */
function sprite(key: string, w: number, h: number, paint: (x: number, y: number) => number) {
  let cv = sprites.get(key);
  if (cv) return cv;
  if (sprites.size > 128) sprites.clear();
  cv = document.createElement("canvas");
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, h);
  const g = cv.getContext("2d")!;
  const img = g.createImageData(cv.width, cv.height), buf = new Uint32Array(img.data.buffer);
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) buf[y * cv.width + x] = paint(x, y);
  g.putImageData(img, 0, 0);
  sprites.set(key, cv);
  return cv;
}

/** Light cone from an apex at (cx, top) down to `bottom`, `wb` px half-width at the base. */
export function drawCone(c: Ctx, cx: number, top: number, bottom: number, wb: number, color: string, dens = 1) {
  const h = Math.round(bottom - top);
  if (h < 4) return;
  const col = rgba32(color);
  const s = sprite(`cone|${h}|${wb}|${color}|${dens}`, wb * 2 + 1, h, (x, y) => {
    const t = y / h, hw = 3 + t * (wb - 3), r = Math.abs(x - wb) / hw;
    if (r > 1) return 0;
    return bayer(x, y) < (1 - r * r) * (0.22 - 0.12 * t) * dens ? col : 0;
  });
  c.drawImage(s, Math.round(cx - wb), Math.round(top));
}

/** Dithered radial glow (elliptical when ry ≠ r). */
export function drawGlow(c: Ctx, cx: number, cy: number, r: number, ry: number, color: string, dens = 0.7) {
  const col = rgba32(color);
  const s = sprite(`glow|${r}|${ry}|${color}|${dens}`, r * 2 + 1, ry * 2 + 1, (x, y) => {
    const d = Math.hypot((x - r) / r, (y - ry) / ry);
    return d < 1 && bayer(x, y) < Math.pow(1 - d, 1.4) * dens ? col : 0;
  });
  c.drawImage(s, Math.round(cx - r), Math.round(cy - ry));
}

/** Dithered darkness creeping in from the screen edges (and down from the ceiling). */
export function drawVignette(c: Ctx, Wa: number, Ha: number, top: number, color = SHADE, k = 1) {
  const col = rgba32(color), hw = Wa / 2;
  const s = sprite(`vig|${Wa}|${Ha}|${top}|${color}|${k}`, Wa, Ha, (x, y) => {
    const ex = Math.max(0, (Math.abs(x + 0.5 - hw) / hw - 0.6) / 0.4), ey = Math.max(0, 1 - (y - top) / 36);
    return bayer(x, y) < Math.max(Math.pow(ex, 1.6) * 0.75, ey * ey * 0.55) * k ? col : 0;
  });
  c.drawImage(s, 0, 0);
}

// ---------------------------------------------------------------- floodlight rig
type Rig = { xs: number[]; k0: number; apex: number; wb: number; pt: number };
function rig(o: ArenaOpts): Rig {
  const st = o.lite ? 120 : 150, off = o.camX * 0.6, xs: number[] = [], k0 = Math.floor(off / st) - 1;
  for (let k = k0; k <= Math.floor((off + o.Wa) / st) + 1; k++) xs.push(Math.round(k * st - off + st * 0.45));
  return { xs, k0, apex: o.top + 9, wb: o.lite ? 22 : 34, pt: o.pt };
}
/** Is screen pixel (x, y) inside the bright core of a cone? */
function litAt(R: Rig, x: number, y: number) {
  if (y <= R.apex) return false;
  const hw = (3 + ((y - R.apex) / (R.pt - R.apex)) * (R.wb - 3)) * 0.72;
  for (const sx of R.xs) if (Math.abs(x - sx) < hw) return true;
  return false;
}

function drawTruss(c: Ctx, o: ArenaOpts) {
  const y = o.top + 2, off = Math.round(o.camX * 0.6);
  c.fillStyle = o.th.crowd[0];
  c.fillRect(0, y, o.Wa, 1);
  c.fillRect(0, y + 4, o.Wa, 1);
  for (let x = 0; x < o.Wa; x++) {
    const p = (((x + off) % 8) + 8) % 8;
    c.fillRect(x, y + 1 + (p < 4 ? p : 7 - p) * 0.75, 1, 1);
  }
}

function drawLamps(c: Ctx, o: ArenaOpts, R: Rig) {
  const y = o.top + 5;
  for (const sx of R.xs) {
    if (sx < -12 || sx > o.Wa + 12) continue;
    c.fillStyle = "rgba(255,243,196,.12)"; c.fillRect(sx - 5, y + 3, 11, o.cheer ? 4 : 3);
    if (o.cheer) { c.fillStyle = "rgba(255,243,196,.1)"; c.fillRect(sx - 8, y + 2, 17, 7); }
    c.fillStyle = "#1b1530"; c.fillRect(sx - 4, y - 1, 9, 5);
    c.fillStyle = "#3b3754"; c.fillRect(sx - 3, y, 7, 3);
    c.fillStyle = "#6d6889"; c.fillRect(sx - 3, y, 7, 1);
    c.fillStyle = LENS; c.fillRect(sx - 2, y + 3, 5, 1);
    c.fillStyle = "#ffffff"; c.fillRect(sx, y + 3, 1, 1);
  }
}

/** Dust drifting through each beam. */
function drawMotes(c: Ctx, o: ArenaOpts, R: Rig) {
  const h = R.pt - R.apex - 30;
  if (h < 10) return;
  c.fillStyle = o.th.lit;
  R.xs.forEach((sx, k) => {
    for (let i = 0; i < 5; i++) {
      const s = hash((R.k0 + k) * 31 + i * 7);
      const yy = (((s >>> 8) % h) + o.at * (1 + (i & 1))) % h, t = yy / (R.pt - R.apex);
      const hw = (3 + t * (R.wb - 3)) * 0.7, xx = sx + (((s % 1000) / 1000) * 2 - 1) * hw + Math.round(Math.sin((o.at + i * 3) * 0.6));
      c.fillRect(Math.round(xx), R.apex + 4 + yy, 1, 1);
    }
  });
}

// ---------------------------------------------------------------- architecture & props
function drawPillars(c: Ctx, o: ArenaOpts) {
  const { th, pt, top } = o, off = o.camX * 0.35, st = 128, y0 = top + 7, h = pt - 104 - y0;
  if (h < 4) return;
  for (let k = Math.floor(off / st) - 1; k <= Math.floor((off + o.Wa) / st) + 1; k++) {
    const x = Math.round(k * st - off + 12);
    c.fillStyle = th.band; c.fillRect(x, y0, 10, h);
    c.fillStyle = th.crowd[0]; c.fillRect(x, y0, 1, h); c.fillRect(x - 1, y0, 12, 2);
    c.fillStyle = SHADE; c.fillRect(x + 9, y0 + 2, 1, h - 2);
    if (((k % 3) + 3) % 3 === 0 && h > 20) {
      // EXIT sign
      const ex = x + 16, ey = pt - 118;
      c.fillStyle = "rgba(60,255,122,.07)"; c.fillRect(ex - 3, ey - 3, 15, 10);
      c.fillStyle = "#0f2a1a"; c.fillRect(ex, ey, 9, 4);
      c.fillStyle = "#2f8a50"; c.fillRect(ex + 1, ey + 1, 7, 2);
      c.fillStyle = "#7dffaa"; c.fillRect(ex + 2, ey + 1, 1, 1);
    }
  }
}

function drawProp(c: Ctx, type: Theme["prop"], px: number, pt: number, k: number, top: number) {
  const y = Math.max(top + 12, pt - 146);
  if (type === "banner") {
    c.fillStyle = "#1f2a48"; c.fillRect(px, y, 14, 34); c.fillRect(px + 2, y + 34, 4, 3); c.fillRect(px + 8, y + 34, 4, 3);
    c.fillStyle = k % 2 ? "#5a1a26" : "#17482c"; c.fillRect(px + 4, y + 8, 6, 6);
    c.fillStyle = "#2b3658"; c.fillRect(px - 2, y - 2, 18, 2);
  } else if (type === "rack") {
    c.fillStyle = "#2a1f36"; c.fillRect(px, y + 10, 34, 2); c.fillRect(px, y + 30, 34, 2);
    c.fillStyle = "#4a4766"; for (let s = 0; s < 3; s++) line(c, [px + 6 + s * 10, y + 32], [px + 10 + s * 10, y + 4], 0);
    c.fillStyle = "#6a5a2a"; for (let s = 0; s < 3; s++) c.fillRect(px + 5 + s * 10, y + 30, 3, 2);
  } else if (type === "board") {
    c.fillStyle = "#1c2244"; c.fillRect(px, y, 38, 26);
    c.fillStyle = "#2c3462";
    for (const yy of [4, 10, 16, 22]) c.fillRect(px + 3, y + yy, 8, 1);
    c.fillRect(px + 11, y + 4, 1, 7); c.fillRect(px + 11, y + 16, 1, 7); c.fillRect(px + 11, y + 7, 9, 1); c.fillRect(px + 11, y + 19, 9, 1);
    c.fillRect(px + 20, y + 7, 1, 13); c.fillRect(px + 20, y + 13, 10, 1);
    c.fillStyle = "#6a5a2a"; c.fillRect(px + 30, y + 12, 4, 3);
  } else if (type === "flag") {
    c.fillStyle = "#2a2550"; c.fillRect(px, y, 1, 40);
    c.fillStyle = k % 2 ? "#4a1621" : "#124026"; for (let r = 0; r < 8; r++) c.fillRect(px + 1, y + r, 10 - r, 1);
  } else if (type === "shelf") {
    c.fillStyle = "#3a2a14"; c.fillRect(px, y + 28, 44, 3);
    c.fillStyle = "#5a4214";
    for (let s = 0; s < 3; s++) { c.fillRect(px + 5 + s * 14, y + 20, 6, 4); c.fillRect(px + 7 + s * 14, y + 24, 2, 2); c.fillRect(px + 6 + s * 14, y + 26, 4, 2); }
  } else if (type === "spot") {
    // belle bunting: a sagging string of lime / crimson pennants to the next anchor
    for (let x = 0; x < 110; x++) {
      const yy = y + 4 + Math.round(9 * Math.sin((Math.PI * x) / 110));
      c.fillStyle = "#2a3a3a"; c.fillRect(px + x, yy, 1, 1);
      if (x % 7 === 3) {
        c.fillStyle = SCARF[((x / 7) | 0) % 2];
        c.fillRect(px + x - 1, yy + 1, 3, 1); c.fillRect(px + x - 1, yy + 2, 2, 1); c.fillRect(px + x - 1, yy + 3, 1, 1);
      }
    }
  }
}

// ---------------------------------------------------------------- crowd
function drawUpperTier(c: Ctx, o: ArenaOpts, R: Rig) {
  const { th, pt, Wa } = o, uTop = pt - 102, off = o.camX * 0.22;
  c.fillStyle = th.band; c.fillRect(0, uTop, Wa, 34);
  // rail
  c.fillStyle = th.crowd[0]; c.fillRect(0, pt - 104, Wa, 1);
  for (let x = -(Math.round(off) % 8); x < Wa; x += 8) c.fillRect(x, pt - 104, 1, 3);
  c.globalAlpha = 0.6;
  for (let r = 0; r < 8; r++) {
    const y0 = uTop + 2 + r * 4, ro = off + (r % 2) * 1.5, base = Math.floor(ro / 3);
    c.fillStyle = th.wall; c.fillRect(0, y0 + 3, Wa, 1);
    for (let i = -1; i < Wa / 3 + 1; i++) {
      const s = hash((i + base) * 8 + r + 1);
      if (s % 6 === 0) continue;
      const sx = Math.round(i * 3 - (ro % 3)), y = y0 - (o.cheer && (s >>> 5) % 3 === 0 ? 1 : 0), lit = litAt(R, sx, y);
      c.fillStyle = lit ? th.crowd[1] : th.crowd[0]; c.fillRect(sx, y + 1, 2, 2);
      c.fillStyle = lit ? th.lit : th.crowd[1]; c.fillRect(sx, y, 1, 1);
    }
  }
  c.globalAlpha = 1;
}

function drawCrowd(c: Ctx, o: ArenaOpts, R: Rig) {
  const { th, pt, Wa, at, rise, cheer, animate } = o;
  for (let row = 0; row < 4; row++) {
    const y0 = pt - 58 + row * 7 - Math.round(rise * (4 - row)), o6 = o.camX * (0.3 + row * 0.06), base = Math.floor(o6 / 6);
    c.fillStyle = th.band; c.fillRect(0, y0 + 5, Wa, 1); // seat-row step
    for (let i = -1; i < Wa / 6 + 2; i++) {
      const s = hash((i + base) * 4 + row * 977 + 13), hh = s % 9, sx = Math.round(i * 6 - (o6 % 6)) + (row % 2 ? 3 : 0);
      if (hh === 0) { c.fillStyle = th.band; c.fillRect(sx, y0 + 3, 4, 2); continue; } // empty seat
      const ph = (s >>> 4) + at;
      let y = y0;
      if (cheer) y -= ph & 1;
      else if (rise && hh % 2) y -= 1;
      else if (animate && ph % 13 === 0) y -= 1;
      const lit = litAt(R, sx + 2, y), pick = (s >>> 9) % 8;
      const shirt = lit ? th.crowd[1] : pick < 5 ? th.crowd[0] : pick === 5 ? th.crowd[1] : SHIRT_ACC[(s >>> 13) % 3];
      const face = lit ? th.lit : th.crowd[1];
      c.fillStyle = th.wall; c.fillRect(sx - 1, y + 1, 6, 5); c.fillRect(sx, y - 1, 4, 2);
      c.fillStyle = shirt; c.fillRect(sx, y + 2, 4, 3);
      c.fillStyle = face; c.fillRect(sx + 1, y, 2, 2);
      if (cheer && hh % 3 === 0) {
        // arms up
        c.fillStyle = shirt; c.fillRect(sx - 1, y - 1, 1, 3); c.fillRect(sx + 4, y - 1, 1, 3);
        c.fillStyle = face; c.fillRect(sx - 1, y - 2, 1, 1); c.fillRect(sx + 4, y - 2, 1, 1);
      } else if (rise && hh % 4 === 1) {
        // belle: scarves held overhead, swaying
        const sw = animate ? ph % 2 : 0;
        c.fillStyle = SCARF[(s >>> 7) & 1]; c.fillRect(sx - 1 + sw, y - 2, 5, 1);
        c.fillStyle = face; c.fillRect(sx - 1 + sw, y - 1, 1, 1); c.fillRect(sx + 3 + sw, y - 1, 1, 1);
      }
    }
  }
}

/** Camera flashes popping in the stands: a constant trickle, a storm on a touché. */
function drawFlashes(c: Ctx, o: ArenaOpts) {
  if (!o.animate) return;
  const n = o.cheer ? 12 : o.at % 3 === 0 ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const s = hash(o.at * 977 + i * 131 + 5), x = s % o.Wa, y = o.pt - 100 + ((s >>> 12) % 64);
    const big = o.cheer && (s >>> 20) % 2 === 0;
    c.fillStyle = "#fff6d0"; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3);
    if (big) { c.fillStyle = "#8a8670"; c.fillRect(x - 2, y, 1, 1); c.fillRect(x + 2, y, 1, 1); c.fillRect(x, y - 2, 1, 1); c.fillRect(x, y + 2, 1, 1); }
    c.fillStyle = "#ffffff"; c.fillRect(x, y, 1, 1);
  }
}

// ---------------------------------------------------------------- LED ribbon board
/** One period of the scrolling LED text (4 px per glyph), lit pixels only. */
function ribbonStrip(txt: string, led: string) {
  const rows = [...txt].map(glyph), col = rgba32(led);
  return sprite(`rib|${txt}|${led}`, txt.length * 4, 5, (x, r) => ((x & 3) < 3 && rows[x >> 2][r][x & 3] === "k" ? col : 0));
}

function drawRibbon(c: Ctx, o: ArenaOpts) {
  const { Wa, pt, th, at } = o, y0 = pt - 68, txt = o.ribbon.text, led = o.ribbon.color;
  c.fillStyle = SHADE; c.fillRect(0, y0, Wa, 7);
  c.fillStyle = th.crowd[0]; c.fillRect(0, y0, Wa, 1); c.fillRect(0, y0 + 6, Wa, 1);
  // unlit LED grid: every other column on rows 0, 2 and 4; lit text is stamped over it
  const off = o.cheer && at % 2 ? "#0f3a22" : o.gasp ? "#2a0a14" : th.band, offC = rgba32(off);
  c.drawImage(sprite(`ribOff|${Wa}|${off}`, Wa, 5, (x, r) => ((x | r) & 1 ? 0 : offC)), 0, y0 + 1);
  if (led === null) return;
  const strip = ribbonStrip(txt, led), period = strip.width, scroll = Math.round(o.camX * 0.3) + at;
  for (let x = -(((scroll % period) + period) % period); x < Wa; x += period) c.drawImage(strip, x, y0 + 1);
}

// ---------------------------------------------------------------- boards & piste
function drawBoards(c: Ctx, o: ArenaOpts) {
  const { Wa, pt, th, camX } = o;
  c.fillStyle = th.board; c.fillRect(0, pt - 30, Wa, 26);
  c.fillStyle = "#2c2650"; c.fillRect(0, pt - 30, Wa, 1);
  const bo = camX * 0.9;
  for (let k = Math.floor(bo / 64) - 1; k <= Math.floor((bo + Wa) / 64) + 1; k++) {
    const x = Math.round(k * 64 - bo);
    c.fillStyle = SHADE; c.fillRect(x, pt - 29, 1, 25);
    const cols = ["#3a1520", "#123a24", "#3a2e10"];
    c.fillStyle = cols[((k % 3) + 3) % 3]; c.fillRect(x + 10, pt - 20, 20, 4);
    c.fillStyle = "#262046"; c.fillRect(x + 34, pt - 20, 16, 4);
  }
}

const POOL_TOP = rgba32("#b4bbd6"), POOL_MID = rgba32("#59617f"), POOL_LOW = rgba32("#26283e");
/**
 * Dithered pool of light where a beam lands, from the board row (pt - 30) down to pt + 9.
 * The dither is anchored to screen x, so there is one variant per x phase (mod 4).
 */
function lightPool(pw: number, lit: string, phase: number) {
  const litC = rgba32(lit);
  return sprite(`pool|${pw}|${lit}|${phase}`, pw * 2 + 1, 40, (lx, ly) => {
    const x = lx + phase, dx = lx - pw, I = 1 - (dx / pw) ** 2;
    if (ly === 0) return bayer(x, 1) < I ? litC : 0;
    if (ly === 30) return bayer(x, 0) < I * 1.3 ? POOL_TOP : 0;
    if (ly > 30 && ly < 38) { const y = ly - 30; return bayer(x, y) < I * (0.55 - y * 0.05) ? POOL_MID : 0; }
    if (ly === 39) return bayer(x, 2) < I * 0.4 ? POOL_LOW : 0;
    return 0;
  });
}

function drawPiste(c: Ctx, o: ArenaOpts, R: Rig) {
  const { Wa, Ha, pt, camX } = o;
  c.fillStyle = "#0f0d1f"; c.fillRect(0, pt - 4, Wa, 4);
  c.fillStyle = "#454b68"; c.fillRect(0, pt, Wa, 9);
  c.fillStyle = "#737b9b"; c.fillRect(0, pt, Wa, 1);
  c.fillStyle = "#2b2e44"; c.fillRect(0, pt + 8, Wa, 1);
  c.fillStyle = "#1e1f33"; c.fillRect(0, pt + 9, Wa, 4);
  c.fillStyle = "#0a0916"; c.fillRect(0, pt + 13, Wa, Ha - pt);
  // light pools where the beams land
  const pw = Math.round(R.wb * 0.9);
  for (const sx of R.xs) {
    const x0 = sx - pw;
    if (x0 > Wa || sx + pw < 0) continue;
    c.drawImage(lightPool(pw, o.th.lit, x0 & 3), x0, pt - 30);
  }
  for (let wx = Math.floor((camX - 20) / 10) * 10; wx < camX + Wa + 20; wx += 10) {
    const sx = Math.round(wx - camX);
    if (wx % 40 === 0) { c.fillStyle = wx % 120 === 0 ? "#e9ebf3" : "#9aa0bb"; c.fillRect(sx, pt + 1, 1, 7); }
    else { c.fillStyle = "#5a6181"; c.fillRect(sx, pt + 7, 1, 1); }
  }
}

// ---------------------------------------------------------------- cached layers
// The far stands and the crowd only change when the camera pans or the idle clock ticks, but
// they cost thousands of 1×1 fills. They're painted into offscreen canvases and reused until
// their inputs change (every scroll frame while the fencer stands still, e.g. while reading).
type Layer = { cv: HTMLCanvasElement; key: string };
const themeIds = new WeakMap<Theme, number>();
let nextThemeId = 0;
const themeId = (th: Theme) => {
  let id = themeIds.get(th);
  if (id == null) themeIds.set(th, (id = ++nextThemeId));
  return id;
};
let backLayer: Layer | null = null;
let crowdLayer: Layer | null = null;
const CROWD_Y = 72, CROWD_H = 48; // crowd band: pt - 72 … pt - 24

function cachedLayer(prev: Layer | null, w: number, h: number, key: string, paint: (g: Ctx) => void): Layer {
  const L = prev ?? { cv: document.createElement("canvas"), key: "" };
  if (L.key === key && L.cv.width === w && L.cv.height === h) return L;
  if (L.cv.width !== w || L.cv.height !== h) { L.cv.width = w; L.cv.height = h; }
  const g = L.cv.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.clearRect(0, 0, w, h);
  paint(g);
  g.setTransform(1, 0, 0, 1, 0, 0);
  L.key = key;
  return L;
}

/** Full arena backdrop: everything behind the fencer, the bug and the targets. */
export function drawBg(c: Ctx, o: ArenaOpts) {
  const { Wa, Ha, th } = o, R = rig(o);
  const base = `${Wa}|${Ha}|${o.pt}|${o.top}|${o.camX}|${themeId(th)}|${+o.lite}|${+o.cheer}`;
  backLayer = cachedLayer(backLayer, Wa, Ha, base, (g) => {
    g.fillStyle = th.wall; g.fillRect(0, 0, Wa, Ha);
    drawPillars(g, o);
    drawTruss(g, o);
    if (!o.lite) {
      const off = o.camX * 0.5, st = 110;
      for (let k = Math.floor(off / st) - 1; k <= Math.floor((off + Wa) / st) + 1; k++) drawProp(g, th.prop, Math.round(k * st - off + 30), o.pt, k, o.top);
    }
    drawUpperTier(g, o, R);
  });
  c.drawImage(backLayer.cv, 0, 0);
  drawRibbon(c, o);
  crowdLayer = cachedLayer(crowdLayer, Wa, CROWD_H, `${base}|${o.at}|${o.rise}|${+o.animate}`, (g) => {
    g.translate(0, CROWD_Y - o.pt);
    drawCrowd(g, o, R);
  });
  c.drawImage(crowdLayer.cv, 0, o.pt - CROWD_Y);
  drawFlashes(c, o);
  // depth haze: the stands sit well behind the action, so they never compete with the fencer
  c.fillStyle = "rgba(7,6,15,.42)";
  c.fillRect(0, 0, Wa, o.pt - 30);
  drawBoards(c, o);
  for (const sx of R.xs) drawCone(c, sx, R.apex, o.pt, R.wb, th.light, o.cheer ? 1.25 : 1);
  if (o.animate) drawMotes(c, o, R);
  drawVignette(c, Wa, Ha, o.top, SHADE, o.lite ? 0.6 : 1);
  drawPiste(c, o, R);
  drawLamps(c, o, R);
}

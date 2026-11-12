// Renders one frame of the arena (and the round-transition wipe) from a Model.
import { THEMES, drawBg, drawCone, drawGlow, drawVignette } from "./arena";
import { RN } from "./content";
import { transTiming, type Layout } from "./layout";
import { HIT, type Model } from "./model";
import { FRED, PAL, bayer, drawBoard, drawBug, drawCryBug, drawFencer, drawSign, drawStep, fxDust, fxSpark, hash, line, rgba32, type Ctx } from "./pixel";

function sizeCanvas(cv: HTMLCanvasElement, w: number, h: number) {
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
}

export function drawScene(cv: HTMLCanvasElement, L: Layout, m: Model, tick: number) {
  const { Wa, Ha, pisteTop: pt, segs } = L;
  sizeCanvas(cv, Wa, Ha);
  // every frame starts with an opaque wall fill, so the compositor can treat the canvas as opaque
  const c = cv.getContext("2d", { alpha: false });
  if (!c) return;
  const { camX, si, q } = m;
  const cs = segs[si];

  const top = Math.ceil(L.hudH / L.S), animate = !m.red;
  drawBg(c, {
    Wa, Ha, pt, top, camX, th: THEMES[m.round], rise: m.rise, lite: L.mob,
    at: animate ? tick : 0, animate,
    cheer: m.toucheP >= 0 || (m.win && m.podK < 1),
    gasp: m.riposteP >= 0,
    ribbon: ribbonFor(m),
  });
  if (m.bgFx > 0 && cs.kind === "touche") {
    c.save();
    c.beginPath(); c.rect(0, 0, Wa, pt); c.clip();
    drawGlow(c, cs.TB - camX, pt - 15, 34, 24, "#ffe9a0", 0.8);
    c.restore();
  }
  if (m.bgFx < 0) {
    c.fillStyle = "rgba(5,4,12,.35)";
    c.fillRect(0, 0, Wa, pt - 4);
    drawVignette(c, Wa, Ha, top, "#4a0c1a", 1.05);
  }

  // round signs
  segs.forEach((g, k) => {
    if (g.kind !== "trans") return;
    const sx = Math.round(g.sign - camX);
    if (sx < -70 || sx > Wa + 70) return;
    drawSign(c, sx, pt, RN[g.to] + " >", k < si || (k === si && q >= transTiming(g).sign));
  });

  // targets
  const pulse = m.red ? 0.5 : (Math.sin(tick * 1.2) + 1) / 2;
  segs.forEach((g, k) => {
    if (g.kind !== "touche") return;
    const sx = Math.round(g.TB - camX);
    if (sx < -24 || sx > Wa + 24) return;
    const gq = k < si ? 1 : k > si ? 0 : q, hit = gq >= HIT;
    const cur =
      !hit &&
      (k === si ||
        (cs.kind === "trans" && q >= transTiming(cs).openS && k === si + 1) ||
        (cs.kind === "touche" && cs.nextT && q >= 0.76 && k === si + 1));
    drawBoard(c, sx, pt, hit ? "hit" : cur ? "cur" : "dim", pulse);
  });

  const fs = Math.round(m.ox - camX), lift = Math.round(m.podK * L.lift), Y0 = pt - 40 - lift;
  if (m.podK <= 0) heroLight(c, Wa, pt, fs, Y0);
  if (m.podK > 0) drawPodium(c, L, m, fs, lift, tick);
  else shadow(c, fs + m.pose.bf[0] - 3, fs + m.pose.ff[0] + 5, pt + 5);
  if (m.bugS && !m.bugS.rot && (m.bugS.alpha ?? 1) > 0.5) {
    const bx = Math.round(m.bugS.x - camX), r = Math.max(2, 7 - Math.round((m.bugS.lift || 0) / 3));
    shadow(c, bx - r, bx + r, pt + 5);
  }

  drawFencer(c, m.pose, fs, Y0, m.flashRed ? FRED : PAL);

  if (m.bugS) {
    const b = m.bugS, bx = Math.round(b.x - camX);
    c.save();
    c.globalAlpha = b.alpha ?? 1;
    if (b.piece != null) {
      const px = Math.round(b.piece - camX);
      c.fillStyle = PAL.blade;
      line(c, [px, pt + 3], [px + 4, pt + 2], 0);
      c.fillStyle = PAL.btn;
      c.fillRect(px + 5, pt + 2, 1, 1);
    }
    drawBug(c, bx, pt + 4, b);
    if (b.stars) {
      const t = (b.f || 0) * 0.9;
      c.fillStyle = "#ffc94a";
      for (let k = 0; k < 3; k++) {
        const an = t + k * 2.09, x = Math.round(bx + Math.cos(an) * 6), yy = Math.round(pt - 14 + Math.sin(an) * 2);
        c.fillRect(x - 1, yy, 3, 1);
        c.fillRect(x, yy - 1, 1, 3);
      }
    }
    c.restore();
  }

  // gold medal
  if (m.podK > 0.5) {
    const nx = fs + m.pose.neck[0], ny = Y0 + m.pose.neck[1];
    c.fillStyle = "#5aa7ff"; c.fillRect(nx - 1, ny + 1, 1, 3); c.fillRect(nx + 2, ny + 1, 1, 3);
    c.fillStyle = PAL.ol; c.fillRect(nx - 1, ny + 4, 4, 4);
    c.fillStyle = "#ffc94a"; c.fillRect(nx, ny + 5, 2, 2);
  }
  // confetti
  if (m.podK >= 1 && !m.red) {
    const cols = ["#3cff7a", "#ffc94a", "#ff3b4e", "#f2efe6"];
    for (let k = 0; k < 26; k++) {
      const h = (k * 2654435761) >>> 0, x = fs - 34 + (h % 118), yy = (tick * 3 + (h >> 8)) % (pt - 20);
      c.fillStyle = cols[k % 4];
      c.fillRect(x + ((tick + k) % 3 === 0 ? 1 : 0), yy, k % 3 ? 1 : 2, k % 3 ? 2 : 1);
    }
  }

  if (m.dust >= 0) fxDust(c, fs + 13, Y0 + 44, m.dust);
  if (m.spark >= 0) fxSpark(c, fs + m.pose.tip[0], Y0 + m.pose.tip[1], m.spark);
  if (m.burst >= 0) drawBurst(c, L, m, fs, Y0);
}

/** Final-round celebration: dimmed arena, spotlight, podium, crying bug. */
function drawPodium(c: Ctx, L: Layout, m: Model, fs: number, lift: number, tick: number) {
  const { Wa, Ha, pisteTop: pt, mob: M } = L, k = m.podK;
  c.globalAlpha = k * 0.6;
  c.fillStyle = "#0b0a17";
  c.fillRect(0, 0, Wa, Ha);
  c.globalAlpha = k;
  // row of lit targets
  for (let n = 0; n < 10; n++) {
    const bx = Math.round((Wa * (n + 0.5)) / 10) - 3, by = M ? pt - 26 : Math.round(L.areaTop / L.S) + 6;
    if (!M && Math.abs(bx + 3 - (fs + 24)) < 60) continue;
    c.fillStyle = "rgba(60,255,122,.18)"; c.fillRect(bx - 3, by - 3, 13, 14);
    c.fillStyle = PAL.ol; c.fillRect(bx - 1, by - 1, 9, 10);
    c.fillStyle = "#e8e1cf"; c.fillRect(bx, by, 7, 8);
    c.fillStyle = PAL.green; c.fillRect(bx + 1, by + 1, 5, 6);
    c.fillStyle = "#e8e1cf"; c.fillRect(bx + 2, by + 2, 3, 4);
    c.fillStyle = PAL.green; c.fillRect(bx + 3, by + 3, 1, 2);
  }
  // spotlight
  const cx = fs + 24;
  drawCone(c, cx, Math.ceil(L.hudH / L.S), pt + 4, M ? 34 : 54, "#5e5028", 1.25);
  drawGlow(c, cx, pt + 3, M ? 30 : 46, 5, "#8a7436", 0.8);
  const base = pt + 4;
  drawStep(c, M ? fs - 16 : fs - 30, base - Math.round(lift * 0.65), M ? 24 : 35, Math.round(lift * 0.65), "#d9e1ee", "#6d6889", "2");
  drawStep(c, M ? fs + 40 : fs + 43, base - Math.round(lift * 0.42), M ? 24 : 35, Math.round(lift * 0.42), "#e0904a", "#6a3a1a", "3");
  drawStep(c, M ? fs + 8 : fs + 5, base - lift, M ? 32 : 38, lift, "#ffc94a", "#8a5a12", "1");
  drawCryBug(c, M ? 18 : fs + 116, M ? Ha - 2 : pt + 4, m.red ? 0 : tick % 4);
  c.globalAlpha = 1;
}

/** Particles that fly from the blade tip to the card being revealed. */
function drawBurst(c: Ctx, L: Layout, m: Model, fs: number, Y0: number) {
  const p = m.burst, e = 1 - Math.pow(1 - p, 2);
  const sx0 = fs + m.pose.tip[0], sy0 = Y0 + m.pose.tip[1];
  const tx = L.mob ? Math.round((m.bugS ? m.bugS.x : m.fx) - m.camX) : L.Wa / 2;
  const ty = L.mob ? (L.areaTop + L.areaH) / L.S - 6 : (L.areaTop + L.areaH / 2) / L.S;
  const cols = [PAL.green, PAL.spark, PAL.wh];
  for (let k = 0; k < 18; k++) {
    const an = (k / 18) * Math.PI * 2, txp = tx + Math.cos(an) * (30 + ((k * 13) % 40)), typ = ty + Math.sin(an) * (18 + ((k * 7) % 22));
    c.fillStyle = cols[k % 3];
    const z = p < 0.5 ? 2 : 1;
    c.fillRect(Math.round(sx0 + (txp - sx0) * e), Math.round(sy0 + (typ - sy0) * e), z, z);
  }
}

/** Scrolling text on the LED ribbon board, reacting to the bout. */
function ribbonFor(m: Model) {
  if (m.podK > 0 || m.win) return { text: "VICTORY 10-9 - ", color: "#ffc94a" };
  if (m.riposteP >= 0) return { text: "RIPOSTE! - ", color: "#ff3b4e" };
  if (m.toucheP >= 0) return { text: "TOUCHE! - ", color: "#3cff7a" };
  if (m.belle) return { text: "LA BELLE - NEXT TOUCH WINS - ", color: "#ffc94a" };
  // standby on the title screen so the menu never sits on lit LEDs; it powers on with round 1
  if (m.s.kind === "title") return { text: " ", color: null };
  return { text: `ROUND ${m.round} - ${RN[m.round]} - FENCE_THE_BUG - `, color: "#7a6230" };
}

/**
 * Separates the fencer from the busy backdrop: a dithered dark halo behind the body
 * (clipped above the piste) and a follow-spot pool on the strip under their feet.
 */
function heroLight(c: Ctx, Wa: number, pt: number, fs: number, Y0: number) {
  c.save();
  c.beginPath(); c.rect(0, 0, Wa, pt - 4); c.clip();
  drawGlow(c, fs + 24, Y0 + 22, 46, 34, "#07060f", 0.85);
  c.restore();
  drawGlow(c, fs + 24, pt + 4, 34, 4, "#6a7294", 0.9);
  c.fillStyle = "#c9cee3";
  for (let x = fs + 4; x <= fs + 44; x++) if (bayer(x, 0) < 1 - Math.abs(x - fs - 24) / 20) c.fillRect(x, pt, 1, 1);
}

/** Dithered contact shadow on the piste. */
function shadow(c: Ctx, x0: number, x1: number, y: number) {
  c.fillStyle = "#2b2e48";
  c.fillRect(x0 + 1, y, x1 - x0 - 1, 1);
  for (let x = x0 - 1; x <= x1 + 1; x++) if (bayer(x, y) < 0.5) c.fillRect(x, y + 1, 1, 1);
  c.fillRect(x0 - 1, y, 1, 1);
  c.fillRect(x1, y, 1, 1);
}

const W_DARK = rgba32("#0b0a17"), W_STRIPE = rgba32("#110f24"), W_MID = rgba32("#1d1838");
const W_CORE = rgba32("#f2efe6"), W_EDGE = rgba32("#ffc94a"), W_GLOW = rgba32("#8a5a12"), W_SPARK = rgba32("#ffe36b");
let wipeImg: ImageData | null = null;
/** What each wipe canvas currently shows, so unchanged frames (e.g. the fully dark hold) skip the per-pixel pass. */
const wipeShown = new WeakMap<HTMLCanvasElement, string>();
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Round transition: a diagonal sabre slash. A white-hot blade edge sweeps left → right
 * trailing sparks, with an ordered-dither ramp into darkness behind it; the second half
 * sweeps on in the same direction to reveal the next round. Fully dark while the
 * round banner is up (mode 0, k ≥ 0.7 and mode 1, k < 0.3).
 */
export function drawWipe(cv: HTMLCanvasElement, L: Layout, m: Model) {
  const { Wa, Ha } = L;
  sizeCanvas(cv, Wa, Ha);
  const d = cv.getContext("2d");
  if (!d) return;
  const w = m.wipe;
  if (!w) {
    if (wipeShown.get(cv) !== `${Wa}|${Ha}|clear`) {
      d.clearRect(0, 0, Wa, Ha);
      wipeShown.set(cv, `${Wa}|${Ha}|clear`);
    }
    return;
  }
  const SL = 0.45, span = Wa + Ha * SL, band = Math.max(14, Math.round(Wa * 0.07)), glow = 8;
  const f = w.mode === 0
    ? -glow + (span + band + glow) * smooth(w.k / 0.7)
    : -band + (span + band + glow) * smooth((w.k - 0.3) / 0.7);
  const key = `${Wa}|${Ha}|${w.mode}|${f}`;
  if (wipeShown.get(cv) === key) return;
  wipeShown.set(cv, key);
  if (!wipeImg || wipeImg.width !== Wa || wipeImg.height !== Ha) wipeImg = d.createImageData(Wa, Ha);
  const buf = new Uint32Array(wipeImg.data.buffer);
  const fs = Math.floor(f / 3);
  for (let y = 0; y < Ha; y++) {
    const uy = (Ha - 1 - y) * SL;
    for (let x = 0; x < Wa; x++) {
      const u = x + uy, dc = w.mode === 0 ? f - u : u - f; // > 0 on the dark side
      let px = 0;
      if (dc >= band) px = Math.floor(u) % 9 === 0 ? W_STRIPE : W_DARK;
      else if (dc >= 1.5) {
        const p = (dc - 1.5) / (band - 1.5), b = bayer(x, y);
        px = b < p ? W_DARK : b < p + 0.3 ? W_MID : 0;
      } else if (dc >= 0.5) px = W_CORE;
      else if (dc >= -1) px = W_EDGE;
      else if (dc > -glow) {
        const b = bayer(x, y), e = 1 + dc / glow;
        px = hash(x * 7919 + y * 104729 + fs) % 29 === 0 ? W_SPARK : b < e * 0.5 ? W_GLOW : 0;
      }
      buf[y * Wa + x] = px;
    }
  }
  d.putImageData(wipeImg, 0, 0);
}

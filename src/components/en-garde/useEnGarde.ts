"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { isCardOpen } from "@/lib/en-garde/cards";
import { boutY, computeLayout, pageY, type Layout, type Overflow, type Pace, type ViewportInfo } from "@/lib/en-garde/layout";
import { computeModel, type Model } from "@/lib/en-garde/model";
import { drawScene } from "@/lib/en-garde/scene";

export type EnGardeOptions = {
  /** Scroll distance per beat. */
  pace?: Pace;
  /** Skip all lunges/slides regardless of the OS setting. */
  forceReducedMotion?: boolean;
};

type ScrollState = { y: number; dir: number; moving: boolean };
/** Visible area when the on-screen keyboard is open (mobile). */
export type KeyboardViewport = { h: number; top: number } | null;

const TICK_MS = 260;
const MOVE_IDLE_MS = 170;

/** Global animation clock for idle loops (breathing, blinking, pulses). Paused while the tab is hidden. */
function useTick(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(id);
      id = document.hidden ? undefined : setInterval(() => setTick((t) => t + 1), ms);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ms]);
  return tick;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useKeyboardViewport(): KeyboardViewport {
  const [vv, setVv] = useState<KeyboardViewport>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    // only a real change re-renders (the viewport fires these on every scroll)
    const update = () =>
      setVv((prev) => {
        if (!(v.height < window.innerHeight * 0.8)) return null;
        return prev && prev.h === v.height && prev.top === v.offsetTop ? prev : { h: v.height, top: v.offsetTop };
      });
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, []);
  return vv;
}

/**
 * Reads what only CSS knows: the small viewport height (100svh, URL bar shown) and the
 * side safe-area insets. Uses a hidden fixed probe element that lives as long as the hook.
 */
function useViewportProbe() {
  const probe = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    // 100vh first: browsers without svh keep it and fall back to today's behaviour
    el.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none;" +
      "padding:0 env(safe-area-inset-right,0px) 0 env(safe-area-inset-left,0px)";
    document.body.appendChild(el);
    probe.current = el;
    return () => {
      el.remove();
      probe.current = null;
    };
  }, []);
  return useCallback((): ViewportInfo => {
    const el = probe.current;
    if (!el) return {};
    const cs = getComputedStyle(el);
    return {
      stableH: el.offsetHeight,
      insetX: Math.max(parseFloat(cs.paddingLeft) || 0, parseFloat(cs.paddingRight) || 0),
    };
  }, []);
}

/**
 * What scrolls the bout. Touch devices scroll an inner box (see useEnGarde); null means the window.
 * Module-level so `jumpTo` works from event handlers outside the hook.
 */
let scrollEl: HTMLElement | null = null;

/** Page y: the scroll position of whatever scrolls the bout. */
const readY = () => (scrollEl ? scrollEl.scrollTop : typeof window === "undefined" ? 0 : window.scrollY);

function scrollToPage(y: number) {
  if (Math.round(y) !== Math.round(readY())) (scrollEl ?? window).scrollTo({ top: y, behavior: "instant" });
}

/** Jump to a bout position (lands at the top of a card's reading pause). */
export function jumpTo(L: Layout, by: number) {
  scrollToPage(pageY(L, by));
}

const sameOverflow = (a: Overflow, b: Overflow) =>
  Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[Number(k)] === v);

/** Card id → how far each card's content overflows its panel. Cards mid-resize keep their last value. */
function measureOverflow(root: HTMLElement, prev: Overflow): Overflow {
  const out: Overflow = {};
  for (const slot of root.querySelectorAll<HTMLElement>("[data-ti]")) {
    const card = Number(slot.dataset.ti);
    const panel = slot.querySelector<HTMLElement>("[data-panel]");
    const content = panel?.firstElementChild;
    // fractional heights, rounded up: scrollHeight rounds and can leave the last px unreachable
    const ov = !panel || !content ? 0
      : slot.dataset.settled == null ? (prev[card] ?? 0)
      : Math.ceil(content.getBoundingClientRect().height - panel.getBoundingClientRect().height - 0.01);
    if (ov > 0) out[card] = ov;
  }
  return out;
}

/**
 * Owns the scroll-driven state machine: viewport layout, scroll position/direction,
 * the derived animation model, and drawing the arena canvases after each render.
 */
export function useEnGarde({ pace = "Normal", forceReducedMotion = false }: EnGardeOptions) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);

  // Touch devices scroll an inner box instead of the window. Scrolling the window makes the
  // browser hide and show its address bar, which slides the whole arena up and down with it.
  // Only read on the client; nothing that depends on it renders before the first layout.
  const [inner] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const scrollerRef = useCallback((el: HTMLDivElement | null) => {
    scrollEl = el;
    setScroller(el);
  }, []);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [scroll, setScroll] = useState<ScrollState>(() => ({
    y: readY(),
    dir: 1,
    moving: false,
  }));
  const tick = useTick(TICK_MS);
  const reduced = usePrefersReducedMotion() || forceReducedMotion;
  const keyboard = useKeyboardViewport();
  /** Latest layout, bout y and keyboard for event handlers. */
  const latest = useRef<{ layout: Layout | null; y: number; keyboard: KeyboardViewport }>({ layout: null, y: 0, keyboard });
  const readViewport = useViewportProbe();

  // ---- layout: on mount, resize, font load, and when the HUD's measured height changes
  const overflow = useRef<Overflow>({});
  const relayout = useCallback(() => {
    setLayout(computeLayout(window.innerWidth, window.innerHeight, hudRef.current?.offsetHeight || 100, pace, readViewport(), overflow.current));
  }, [pace, readViewport]);

  useLayoutEffect(() => {
    relayout();
    // resize can fire many times per frame (window drags, mobile URL bar); lay out once per frame
    let raf = 0, live = true;
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; relayout(); });
    };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => { if (live) relayout(); });
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [relayout]);

  useLayoutEffect(() => {
    const h = hudRef.current?.offsetHeight;
    if (layout && h && h !== layout.hudH) relayout();
  }, [layout, relayout]);

  // ---- reading pauses: re-measure card overflow whenever a panel or its content changes size
  // (fonts, viewport). Skipped while the mobile keyboard squeezes the card area.
  const anchor = useRef<{ by: number; card: number; read: number } | null>(null);
  const hasLayout = layout != null;
  useEffect(() => {
    const root = rootRef.current;
    if (!hasLayout || !root) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (latest.current.keyboard) return;
      const next = measureOverflow(root, overflow.current);
      if (sameOverflow(next, overflow.current)) return;
      // pauses before the reader move their page position: remember where they are in the bout
      const L = latest.current.layout;
      if (L) {
        const y = readY();
        // inclusive end: the last px of a pause and its start share one bout y, so keep the read offset
        const h = L.holds.find((g) => y >= g.y0 && y <= g.y0 + g.len);
        anchor.current = { by: boutY(L, y), card: h ? h.card : -1, read: h ? y - h.y0 : 0 };
      }
      overflow.current = next;
      relayout();
    };
    // a card mid-resize (contact on the podium) keeps its last value, so its frames needn't re-measure
    const settled = (e: ResizeObserverEntry) => e.target.closest<HTMLElement>("[data-ti]")?.dataset.settled != null;
    const ro = new ResizeObserver((entries) => {
      if (!raf && entries.some(settled)) raf = requestAnimationFrame(measure);
    });
    for (const panel of root.querySelectorAll("[data-panel]")) {
      ro.observe(panel);
      if (panel.firstElementChild) ro.observe(panel.firstElementChild);
    }
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [hasLayout, relayout]);

  useLayoutEffect(() => {
    const a = anchor.current;
    if (!layout || !a) return;
    anchor.current = null;
    const h = layout.holdOf[a.card];
    scrollToPage(pageY(layout, a.by) + (h ? Math.min(a.read, h.len) : 0));
  }, [layout]);

  // ---- scroll tracking (rAF-throttled); frozen while a form field has focus so the
  // mobile keyboard scrolling the page doesn't advance the bout.
  const freezeY = useRef(false);
  useEffect(() => {
    let raf = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (freezeY.current) return;
        const y = readY();
        // commit inside this frame so the scene tracks the scroll without a frame of lag
        flushSync(() => setScroll((s) => ({ y, dir: y < s.y ? -1 : y > s.y ? 1 : s.dir, moving: y !== s.y || s.moving })));
        clearTimeout(idle);
        idle = setTimeout(() => setScroll((s) => ({ ...s, moving: false })), MOVE_IDLE_MS);
      });
    };
    const isField = (e: FocusEvent) => e.target instanceof Element && e.target.matches("input,textarea");
    const onFocusIn = (e: FocusEvent) => { if (isField(e)) freezeY.current = true; };
    const onFocusOut = (e: FocusEvent) => { if (isField(e)) freezeY.current = false; };

    const target = scroller ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      target.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, [scroller]);

  // ---- derived model: the bout runs in bout y (reading pauses removed)
  const by = layout ? boutY(layout, scroll.y) : 0;
  const model: Model | null = useMemo(
    () => (layout ? computeModel(layout, { ...scroll, y: by, tick, reduced }) : null),
    [layout, scroll, by, tick, reduced],
  );

  useEffect(() => {
    latest.current = { layout, y: by, keyboard };
  });

  // ---- canvas drawing: before paint, so the canvases and the DOM cards always show the same frame
  useLayoutEffect(() => {
    if (!layout || !model) return;
    if (sceneRef.current) drawScene(sceneRef.current, layout, model, tick);
  }, [layout, model, tick]);

  // ---- keyboard a11y: tabbing into a card that isn't on screen jumps to it. Focus also scrolls
  // the card's content to the focused element, so the page scroll is moved to match it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-ti]") : null;
      const { layout: L, y } = latest.current;
      if (!el || !L) return;
      const card = Number(el.dataset.ti);
      if (!isCardOpen(L, y, card)) jumpTo(L, L.cardSnap[card]);
      const h = L.holdOf[card];
      const panel = el.querySelector<HTMLElement>("[data-panel]");
      if (!h || !panel) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => scrollToPage(h.y0 + Math.min(h.len, panel.scrollTop)));
    };
    root.addEventListener("focusin", onFocusIn);
    return () => {
      root.removeEventListener("focusin", onFocusIn);
      cancelAnimationFrame(raf);
    };
  }, [layout]);

  return { rootRef, hudRef, sceneRef, scrollerRef, inner, layout, model, scroll, by, tick, reduced, keyboard };
}

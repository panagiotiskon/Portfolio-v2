"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { isCardOpen } from "@/lib/en-garde/cards";
import { computeLayout, type Layout, type Pace } from "@/lib/en-garde/layout";
import { computeModel, type Model } from "@/lib/en-garde/model";
import { drawScene, drawWipe } from "@/lib/en-garde/scene";

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

export function jumpTo(y: number) {
  window.scrollTo({ top: y, behavior: "instant" });
}

/**
 * Owns the scroll-driven state machine: viewport layout, scroll position/direction,
 * the derived animation model, and drawing the arena canvases after each render.
 */
export function useEnGarde({ pace = "Normal", forceReducedMotion = false }: EnGardeOptions) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const wipeRef = useRef<HTMLCanvasElement>(null);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [scroll, setScroll] = useState<ScrollState>(() => ({
    y: typeof window === "undefined" ? 0 : window.scrollY,
    dir: 1,
    moving: false,
  }));
  const tick = useTick(TICK_MS);
  const reduced = usePrefersReducedMotion() || forceReducedMotion;
  const keyboard = useKeyboardViewport();

  // ---- layout: on mount, resize, font load, and when the HUD's measured height changes
  const relayout = useCallback(() => {
    setLayout(computeLayout(window.innerWidth, window.innerHeight, hudRef.current?.offsetHeight || 100, pace));
  }, [pace]);

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
        const y = window.scrollY;
        // commit inside this frame so the scene tracks the scroll without a frame of lag
        flushSync(() => setScroll((s) => ({ y, dir: y < s.y ? -1 : y > s.y ? 1 : s.dir, moving: y !== s.y || s.moving })));
        clearTimeout(idle);
        idle = setTimeout(() => setScroll((s) => ({ ...s, moving: false })), MOVE_IDLE_MS);
      });
    };
    const isField = (e: FocusEvent) => e.target instanceof Element && e.target.matches("input,textarea");
    const onFocusIn = (e: FocusEvent) => { if (isField(e)) freezeY.current = true; };
    const onFocusOut = (e: FocusEvent) => { if (isField(e)) freezeY.current = false; };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, []);

  // ---- derived model
  const model: Model | null = useMemo(
    () => (layout ? computeModel(layout, { ...scroll, tick, reduced }) : null),
    [layout, scroll, tick, reduced],
  );

  // ---- canvas drawing: before paint, so the canvases and the DOM cards always show the same frame
  useLayoutEffect(() => {
    if (!layout || !model) return;
    if (sceneRef.current) drawScene(sceneRef.current, layout, model, tick);
    if (wipeRef.current) drawWipe(wipeRef.current, layout, model);
  }, [layout, model, tick]);

  // ---- keyboard a11y: tabbing into a card that isn't on screen jumps to it
  const latest = useRef({ layout, y: scroll.y });
  useEffect(() => {
    latest.current = { layout, y: scroll.y };
  });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-ti]") : null;
      const { layout: L, y } = latest.current;
      if (!el || !L) return;
      const card = Number(el.dataset.ti);
      if (!isCardOpen(L, y, card)) jumpTo(L.cardSnap[card]);
    };
    root.addEventListener("focusin", onFocusIn);
    return () => root.removeEventListener("focusin", onFocusIn);
  }, [layout]);

  return { rootRef, hudRef, sceneRef, wipeRef, layout, model, scroll, tick, reduced, keyboard };
}

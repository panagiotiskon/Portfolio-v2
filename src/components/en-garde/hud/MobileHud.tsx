import type { Ref } from "react";
import { lampStyle, type Hud } from "@/lib/en-garde/hud";

type Props = {
  hud: Hud;
  hudRef: Ref<HTMLElement>;
  menuOpen: boolean;
  /** Top edge of the menu sheet, in px. */
  menuTop: number;
  onToggleMenu: () => void;
  onJump: (round: number) => void;
  /** Reduced motion (OS or forced): fades only, no wipe/stagger/morph. */
  red: boolean;
};

const MENU_BTN = "flex min-h-12 box-border items-center border-none cursor-pointer font-pixel text-ps-12";
const BAR = "h-0.75 w-5 bg-fg";

/**
 * Open: the sheet scans down out of the HUD bar in chunky steps, then the rows step in.
 * Close: a quicker scan back up, no stagger. Transitions (not keyframes) so a fast
 * double tap reverses mid-way. `visibility` rides along so a closed sheet is not hit-testable.
 */
function sheetClass(open: boolean, red: boolean) {
  if (red) return `transition-[opacity,visibility] duration-150 ${open ? "visible opacity-100" : "invisible opacity-0"}`;
  return open
    ? "visible transition-[clip-path,visibility] duration-280 ease-[steps(7,end)] [clip-path:inset(0)]"
    : "invisible transition-[clip-path,visibility] duration-160 ease-[steps(4,end)] [clip-path:inset(0_0_100%_0)]";
}

function rowMotion(open: boolean, red: boolean, i: number) {
  if (red) return { className: "", delay: "0ms" };
  return {
    className: `transition-[opacity,translate] duration-160 ease-[steps(3,end)] ${open ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0"}`,
    delay: open ? `${Math.min(40 + i * 30, 200)}ms` : "0ms",
  };
}

export function MobileHud({ hud, hudRef, menuOpen, menuTop, onToggleMenu, onJump, red }: Props) {
  const morph = red ? "" : "transition-[translate,rotate,opacity] duration-150";
  return (
    <>
      <header
        ref={hudRef}
        className="absolute inset-x-0 top-0 z-6 bg-ink pt-[env(safe-area-inset-top)] pr-[max(10px,env(safe-area-inset-right))] pl-[max(10px,env(safe-area-inset-left))] shadow-[0_3px_0_0_var(--color-edge)]"
      >
        <div className="grid h-11.25 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <span
            className={`justify-self-start font-pixel text-ps-12 whitespace-nowrap transition-[background-color,box-shadow] duration-300 ${hud.roundPop ? "bg-gold shadow-[0_0_0_3px_var(--color-gold)]" : "shadow-[0_0_0_3px_transparent]"}`}
            style={{ color: hud.roundPop ? "var(--color-ink)" : hud.shortColor }}
          >
            {hud.short}
          </span>
          <div role="img" aria-label={hud.scoreAria} className="flex items-center gap-2">
            <span className="h-3.5 w-4" style={lampStyle(hud.greenOn, "green")} />
            <span className="font-pixel text-[14px] whitespace-nowrap text-fg">
              {hud.me}–{hud.bug}
            </span>
            <span className="h-3.5 w-4" style={lampStyle(hud.redOn, "red")} />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onToggleMenu}
              aria-expanded={menuOpen}
              aria-controls="hud-menu"
              aria-label="Menu"
              className="flex size-11 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-0"
            >
              {/* bar 3px + gap 4px: ±7px meets the middle bar, so the ☰ folds into an ✕ */}
              <span className={`${BAR} ${morph} ${menuOpen ? "translate-y-1.75 rotate-45" : ""}`} />
              <span className={`${BAR} ${morph} ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`${BAR} ${morph} ${menuOpen ? "-translate-y-1.75 -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* always mounted so closing can animate; inert keeps it out of tab order and AT when shut */}
      <nav
        id="hud-menu"
        aria-label="Menu"
        inert={!menuOpen}
        className={`absolute inset-x-0 bottom-0 z-7 flex flex-col gap-2.5 overflow-y-auto bg-[rgba(11,10,23,.97)] p-4 ${sheetClass(menuOpen, red)}`}
        style={{ top: menuTop }}
      >
        {hud.sections.map((s, i) => {
          const row = rowMotion(menuOpen, red, i);
          return (
            <button
              key={s.round}
              type="button"
              onClick={() => onJump(s.round)}
              aria-current={s.current ? "step" : undefined}
              className={`${MENU_BTN} px-3.5 text-left ${row.className} ${s.current ? "bg-gold text-ink" : "bg-raised text-muted"}`}
              style={{ transitionDelay: row.delay }}
            >
              {s.long}
            </button>
          );
        })}
      </nav>
    </>
  );
}

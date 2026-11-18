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
};

const MENU_BTN = "flex min-h-12 box-border items-center border-none cursor-pointer font-pixel text-ps-12";

export function MobileHud({ hud, hudRef, menuOpen, menuTop, onToggleMenu, onJump }: Props) {
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
              aria-label="Menu"
              className="flex size-11 cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent p-0"
            >
              <span className="h-0.75 w-5 bg-fg" />
              <span className="h-0.75 w-5 bg-fg" />
              <span className="h-0.75 w-5 bg-fg" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav aria-label="Menu" className="absolute inset-x-0 bottom-0 z-7 flex flex-col gap-2.5 overflow-y-auto bg-[rgba(11,10,23,.97)] p-4" style={{ top: menuTop }}>
          {hud.sections.map((s) => (
            <button
              key={s.round}
              type="button"
              onClick={() => onJump(s.round)}
              aria-current={s.current ? "step" : undefined}
              className={`${MENU_BTN} px-3.5 text-left ${s.current ? "bg-gold text-ink" : "bg-raised text-muted"}`}
            >
              {s.long}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

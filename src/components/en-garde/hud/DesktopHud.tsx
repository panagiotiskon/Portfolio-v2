import type { Ref } from "react";
import { lampStyle, type Hud } from "@/lib/en-garde/hud";
import { TOTAL_ROUNDS } from "@/lib/en-garde/rounds";
import { PixelIcon } from "../ui";

type Props = {
  hud: Hud;
  hudRef: Ref<HTMLElement>;
  onJump: (round: number) => void;
};

const SMALL_BTN = "inline-flex min-h-(--tap) box-border items-center justify-center border-none cursor-pointer font-pixel text-ps-8";

export function DesktopHud({ hud, hudRef, onJump }: Props) {
  return (
    <header ref={hudRef} className="absolute inset-x-0 top-0 z-6 bg-ink pt-[max(10px,env(safe-area-inset-top))] pr-[max(14px,env(safe-area-inset-right))] pb-2.5 pl-[max(14px,env(safe-area-inset-left))] shadow-[0_4px_0_0_var(--color-edge)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className={`self-start font-pixel text-ps-11 transition-[background-color,color,box-shadow] duration-300 ${hud.roundPop ? "bg-gold text-ink shadow-[0_0_0_4px_var(--color-gold)]" : "text-gold shadow-[0_0_0_4px_transparent]"}`}
          >
            ROUND {hud.round}/{TOTAL_ROUNDS}
          </span>
          <span className="overflow-hidden font-pixel text-ps-8 text-ellipsis whitespace-nowrap" style={{ color: hud.subColor }}>
            {hud.sub}
          </span>
        </div>

        <Scoreboard hud={hud} />

        {/* full names need ~470px; below that the column swaps to the 3-letter labels, so the bar never wraps */}
        <div className="@container min-w-0">
          <nav aria-label="Sections" className="flex flex-wrap justify-end gap-1.5">
            {hud.sections.map((s) => (
              <button
                key={s.round}
                type="button"
                onClick={() => onJump(s.round)}
                aria-current={s.current ? "step" : undefined}
                title={s.long}
                className={`${SMALL_BTN} px-1.75 py-1.5 @max-[480px]:px-1 hover:shadow-[0_0_0_2px_var(--color-gold)] ${s.current ? "bg-gold text-ink" : "bg-raised text-muted"}`}
              >
                <span className="@max-[480px]:hidden">{s.name}</span>
                <span className="hidden @max-[480px]:inline">{s.abbr}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Scoreboard({ hud }: { hud: Hud }) {
  return (
    <div className="relative">
      <div role="img" aria-label={hud.scoreAria} className="flex items-center gap-2 bg-raised px-2 py-1.5 shadow-[0_0_0_3px_var(--color-edge)]">
        <span className="h-4 w-5.5" style={lampStyle(hud.greenOn, "green")} />
        <ScoreSlot name={hud.meName} nameClass="text-lime" value={hud.me} plus={hud.mePlus} plusSide="left" />
        <span className="mt-2.5 font-pixel text-ps-12 text-dim">:</span>
        <ScoreSlot name="THE BUG" nameClass="text-crimson" value={hud.bug} plus={hud.bugPlus} plusSide="right" />
        <PixelIcon name="bug" size={20} />
        <span className="h-4 w-5.5" style={lampStyle(hud.redOn, "red")} />
      </div>
    </div>
  );
}

function ScoreSlot({ name, nameClass, value, plus, plusSide }: { name: string; nameClass: string; value: string; plus: boolean; plusSide: "left" | "right" }) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <span className={`font-pixel text-ps-6 ${nameClass}`}>{name}</span>
      <span className="bg-ink px-1.5 py-0.75 font-pixel text-ps-13 text-fg">{value}</span>
      <span
        aria-hidden="true"
        className={`absolute bottom-0.5 font-pixel text-ps-9 ${nameClass} ${plusSide === "left" ? "-left-4.5" : "-right-4.5"}`}
        style={{ opacity: plus ? 1 : 0 }}
      >
        +1
      </span>
    </div>
  );
}

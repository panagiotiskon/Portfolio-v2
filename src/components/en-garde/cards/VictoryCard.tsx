import { memo, useEffect, useState } from "react";
import type { CardFrame } from "@/lib/en-garde/cards";
import { LINKS, VICTORY_PITCH } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Panel, PixelIcon, pixelButton, sameCardProps } from "../ui";

type Props = { frame: CardFrame; /** Final score, e.g. "5–4". */ score: string };

type CopyState = "idle" | "copied" | "failed";

/**
 * The winning touch: contact comes with the victory. Direct links only, nothing to fill in,
 * so a recruiter is one click from an email.
 */
export const VictoryCard = memo(function VictoryCard({ frame, score }: Props) {
  const [copy, setCopy] = useState<CopyState>("idle");
  useEffect(() => {
    if (copy === "idle") return;
    const id = setTimeout(() => setCopy("idle"), 2000);
    return () => clearTimeout(id);
  }, [copy]);

  const onCopy = () => {
    if (!navigator.clipboard) return setCopy("failed");
    navigator.clipboard.writeText(LINKS.email).then(
      () => setCopy("copied"),
      () => setCopy("failed"),
    );
  };

  const link = pixelButton("secondary", "gap-2 px-3 py-2.5 text-ps-9");
  return (
    <CardSlot card={CARD.contact} frame={frame}>
      <Panel accent="var(--color-lime)" className="gap-3.5 bg-panel px-5.5 pt-4.5 pb-5.5">
        <h2 className="m-0 font-pixel text-[clamp(16px,1.9vw,22px)]/[1.3] text-lime">VICTORY · {score}</h2>
        <p className="m-0 max-w-[44ch] font-vt text-vt-body text-pretty">{VICTORY_PITCH}</p>

        {LINKS.email && (
          <div className="flex flex-col gap-2">
            {/* one row height for both; COPY is sized for its longest label so the row never shifts */}
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${LINKS.email}`} className={pixelButton("primary", "px-4 py-3 text-ps-10")}>
                EMAIL ME ▶
              </a>
              <button type="button" onClick={onCopy} className={pixelButton("secondary", "min-w-[calc(8em+24px)] px-3 py-3 text-ps-10")}>
                {copy === "copied" ? "COPIED ✓" : copy === "failed" ? "FAILED" : "COPY"}
              </button>
            </div>
            <span className="font-vt text-vt-body break-all text-muted select-all">{LINKS.email}</span>
            <span role="status" className="sr-only">
              {copy === "copied" ? "Email address copied" : copy === "failed" ? "Could not copy. Select the address above instead." : ""}
            </span>
          </div>
        )}

        <nav aria-label="Elsewhere" className="mt-1.5 flex flex-wrap gap-3">
          <a href={LINKS.linkedin} target="_blank" rel="noopener" className={link}>
            <PixelIcon name="inbox" size={20} />
            LINKEDIN ↗
          </a>
          <a href={LINKS.github} target="_blank" rel="noopener" className={link}>
            <PixelIcon name="term" size={20} />
            GITHUB ↗
          </a>
          {LINKS.resume && (
            <a href={LINKS.resume} download className={link}>
              <PixelIcon name="scroll" size={20} />
              RESUME ↓
            </a>
          )}
        </nav>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

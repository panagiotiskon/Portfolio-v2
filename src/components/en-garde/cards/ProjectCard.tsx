import { memo } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import type { Project } from "@/lib/en-garde/content";
import { CardSlot, Chip, Panel, pixelButton, sameCardProps } from "../ui";

type Props = { card: number; frame: CardFrame; reveal: Reveal; project: Project; bout: number };

export const ProjectCard = memo(function ProjectCard({ card, frame, reveal, project, bout }: Props) {
  return (
    <CardSlot card={card} frame={frame}>
      <Panel className="gap-3.5 bg-panel px-5.5 pt-4.5 pb-5.5">
        <div className="flex items-center justify-between gap-2.5 font-pixel text-ps-9">
          <span className="bg-crimson px-2 py-1.5 text-white">BOUT {String(bout).padStart(2, "0")}</span>
          <span style={{ color: reveal.statusColor }}>{reveal.status}</span>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="m-0 font-pixel text-[clamp(max(12px,var(--hmin,0px)),1.4vw,16px)]/[1.45] text-pretty">{project.title}</h3>
          <p className="m-0 font-vt text-[21px]/[1.18] text-pretty">{project.desc}</p>
          <div className="flex flex-wrap gap-2">
            {project.chips.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-3.5">
            <a href={project.src} target="_blank" rel="noopener" className={pixelButton("secondary", "px-3 py-2.5 text-ps-9")}>
              VIEW SOURCE
            </a>
            {project.live && (
              <a href={project.live} target="_blank" rel="noopener" className={pixelButton("primary", "px-3 py-2.5 text-ps-9")}>
                PLAY LIVE ▶
              </a>
            )}
          </div>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

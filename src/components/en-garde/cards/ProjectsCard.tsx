import { memo, type CSSProperties } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import { PROJECTS, type Project, type ProjectArt } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import { CardSlot, Chip, Panel, PixelIcon, StatusTag, TitleRow, pixelButton, sameCardProps } from "../ui";

type Props = { frame: CardFrame; reveal: Reveal };

/**
 * Round 4, one touch: every project in order, each under its own coloured strip with its own
 * pixel motif, title colour and chip tint, so no two read alike.
 */
export const ProjectsCard = memo(function ProjectsCard({ frame, reveal }: Props) {
  const lead = PROJECTS[0];
  return (
    <CardSlot card={CARD.projects} frame={frame}>
      <Panel accent={lead.brand} className="bg-panel-alt">
        {PROJECTS.map((p, k) => (
          <ProjectBout key={p.title} project={p} reveal={k === 0 ? reveal : null} />
        ))}
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

function ProjectBout({ project: p, reveal }: { project: Project; reveal: Reveal | null }) {
  return (
    // --px-color: the SOURCE button's pixel border picks up this project's colour, not the panel's
    <section style={{ "--px-color": p.accent } as CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 font-pixel text-ps-9" style={{ background: p.brand, color: p.onBrand }}>
        <span>{p.tag}</span>
        {/* the status sits on a dark chip so its colour holds on any strip */}
        {reveal && (
          <span className="bg-ink px-1.5 py-1">
            <StatusTag reveal={reveal} />
          </span>
        )}
      </div>

      <div className="mx-5 mt-4 mb-5.5 flex flex-wrap items-start gap-x-6 gap-y-4">
        <figure
          aria-hidden="true"
          className="m-0 flex flex-[0_0_168px] flex-col items-center gap-2.5 bg-ink px-2.5 pt-3.5 pb-3 max-[599px]:hidden"
          style={{ boxShadow: `0 0 0 3px color-mix(in srgb, ${p.accent} 45%, var(--color-edge))` }}
        >
          <div className="flex h-15 items-center justify-center">
            <Art kind={p.art} accent={p.accent} brand={p.brand} />
          </div>
          <figcaption className="text-center font-pixel text-ps-8/[1.6] text-muted">
            {p.artLabel[0]}
            <br />
            <span style={{ color: p.accent }}>{p.artLabel[1]}</span>
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2.5">
          <TitleRow logo={p.logo}>
            <h3 className="m-0 flex min-w-0 flex-col gap-1.5">
              <span className="font-pixel text-[clamp(15px,1.7vw,20px)]" style={{ color: p.accent }}>
                {p.title}
              </span>
              <span className="font-vt text-vt-body text-fg">{p.tagline}</span>
            </h3>
          </TitleRow>
          <p className="m-0 max-w-[62ch] font-vt text-vt-body text-pretty">{p.desc}</p>
          {p.note && <p className="m-0 max-w-[62ch] font-vt text-vt-body text-pretty text-muted">{p.note}</p>}
          <div className="flex flex-wrap gap-2">
            {p.chips.map((c) => (
              <Chip key={c} accent={p.accent}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-3">
            {p.live && (
              <a href={p.live} target="_blank" rel="noopener" className={pixelButton("primary", "px-3.5 py-2.5 text-ps-9")}>
                PLAY LIVE ▶<span className="sr-only"> {p.title}</span>
              </a>
            )}
            {p.src && (
              <a href={p.src} target="_blank" rel="noopener" className={pixelButton("secondary", "px-3.5 py-2.5 text-ps-9")}>
                SOURCE<span className="sr-only"> code for {p.title}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- art

function Art({ kind, accent, brand }: { kind: ProjectArt; accent: string; brand: string }) {
  if (kind === "whistle") return <WhistleArt />;
  if (kind === "parcels") return <ParcelsArt accent={accent} />;
  return <NetworkArt accent={accent} brand={brand} />;
}

/** FencingRef: the referee's whistle + the terminal. */
function WhistleArt() {
  return (
    <div className="flex items-center gap-2.5">
      <PixelIcon name="whistle" size={52} />
      <span className="font-pixel text-[14px] text-gold">+</span>
      <PixelIcon name="term" size={52} />
    </div>
  );
}

/**
 * myField: a satellite view of parcels after the dry season. Every field has browned or been
 * mown, except one that stayed green: that's the plot that gets flagged for inspection.
 */
const PARCELS = ["dmdbdmd", "mdbdGdm", "bddmdbd", "dmbddmd"];
const PARCEL_FILL: Record<string, string> = { d: "#a8874a", m: "#7a6634", b: "#5c4a2a", G: "#3fbf5f" };

function ParcelsArt({ accent }: { accent: string }) {
  return (
    <div className="grid grid-cols-[repeat(7,12px)] gap-0.5">
      {PARCELS.flatMap((row, y) =>
        [...row].map((c, x) => (
          <span
            key={`${x}-${y}`}
            className="size-3"
            style={{ background: PARCEL_FILL[c], outline: c === "G" ? `2px solid ${accent}` : undefined, outlineOffset: c === "G" ? 1 : undefined }}
          />
        )),
      )}
    </div>
  );
}

/** ConnectIn: your node in the middle, your connections around it, and one suggested link (dashed). */
function NetworkArt({ accent, brand }: { accent: string; brand: string }) {
  const node = (x: number, y: number, fill: string) => <rect key={`${x}-${y}`} x={x} y={y} width={4} height={4} fill={fill} />;
  return (
    <svg viewBox="0 0 32 18" width={96} height={54} shapeRendering="crispEdges" className="block">
      <g fill={brand}>
        <rect x={3} y={6} width={2} height={8} />
        <rect x={27} y={6} width={2} height={8} />
        <rect x={3} y={9} width={26} height={2} />
      </g>
      <g fill={accent}>
        <rect x={15} y={4} width={2} height={1} />
        <rect x={15} y={6} width={2} height={1} />
      </g>
      {[node(2, 2, accent), node(2, 14, accent), node(26, 2, accent), node(26, 14, accent), node(14, 8, "#f2efe6")]}
      {/* suggested connection: hollow */}
      <path d="M14 0h4v4h-4zM15 1v2h2v-2z" fill={accent} fillRule="evenodd" />
    </svg>
  );
}

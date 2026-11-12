import { memo } from "react";
import type { CardFrame, Reveal } from "@/lib/en-garde/cards";
import { LINKS } from "@/lib/en-garde/content";
import { CARD } from "@/lib/en-garde/rounds";
import type { ContactForm } from "../useContactForm";
import { CardSlot, Panel, StatusTag, pixelButton, sameCardProps } from "../ui";

type Props = { frame: CardFrame; reveal: Reveal; form: ContactForm; messageRows: number };

const FIELD =
  "box-border min-h-(--tap) border-none bg-ink px-2.5 py-1.5 font-vt text-[22px] text-fg outline-none shadow-[0_0_0_3px_var(--color-edge)] focus:shadow-[0_0_0_3px_var(--color-lime)]";
const LABEL = "flex flex-col gap-1.5 font-pixel text-ps-8 text-muted";

export const ContactCard = memo(function ContactCard({ frame, reveal, form, messageRows }: Props) {
  const { fields, sent, setField, onSubmit } = form;
  return (
    <CardSlot card={CARD.contact} frame={frame}>
      <Panel accent="var(--color-lime)" className="gap-3 bg-panel px-5.5 pt-4.5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-pixel text-ps-9 text-crimson">FINAL ROUND · LA BELLE</span>
          <StatusTag reveal={reveal} />
        </div>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3.5">
          <div className="flex min-w-0 flex-[1_1_170px] flex-col gap-2.5">
            <h2 className="m-0 font-pixel text-[clamp(14px,1.7vw,20px)] text-fg">LET&apos;S CHAT</h2>
            <p className="m-0 font-vt text-[21px]/[1.15] text-pretty">
              Have a role, a project, or a question about fencing? Send me a message and I&apos;ll get back to you.
            </p>
            <div className="flex flex-wrap gap-x-4.5 gap-y-2 font-vt text-[21px] [flex-direction:var(--stack,row)]">
              <a href={LINKS.github} target="_blank" rel="noopener" className="inline-flex min-h-(--tap) items-center">
                GitHub ↗
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noopener" className="inline-flex min-h-(--tap) items-center">
                LinkedIn ↗
              </a>
            </div>
          </div>

          <div className="min-w-0 flex-[1.6_1_280px]">
            {sent ? (
              <div role="status" className="flex flex-col gap-2.5 py-4">
                <span className="font-pixel text-ps-13 text-lime">MESSAGE SENT · TOUCHÉ!</span>
                <span className="font-vt text-[22px]">Thanks, I&apos;ll get back to you soon.</span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(var(--field-min,130px),1fr))] gap-3">
                  <label className={LABEL}>
                    NAME
                    <input value={fields.name} onChange={(e) => setField("name")(e.target.value)} autoComplete="name" className={FIELD} />
                  </label>
                  <label className={LABEL}>
                    EMAIL
                    <input
                      type="email"
                      required
                      value={fields.email}
                      onChange={(e) => setField("email")(e.target.value)}
                      autoComplete="email"
                      className={FIELD}
                    />
                  </label>
                </div>
                <label className={LABEL}>
                  MESSAGE
                  <textarea
                    rows={messageRows}
                    required
                    value={fields.message}
                    onChange={(e) => setField("message")(e.target.value)}
                    className={`${FIELD} resize-none leading-[1.15]`}
                  />
                </label>
                <div className="sticky bottom-0 bg-panel pt-2">
                  <button type="submit" className={pixelButton("primary", "px-4 py-3 text-ps-10")}>
                    SEND ▶
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Panel>
    </CardSlot>
  );
}, sameCardProps);

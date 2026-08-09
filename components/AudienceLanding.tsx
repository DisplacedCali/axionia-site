import Link from "next/link";
import {
  Eyebrow,
  EyebrowLight,
  Section,
  DarkSection,
  GhostButton,
  GradientButton,
  GradientRule,
} from "./ui";
import { Reveal, Stagger, StaggerItem } from "./Reveal";

/**
 * One spine, three entrances.
 *
 * The versions leak — an HR leader forwards the page to their CFO, a broker
 * finds the one written for them. So no variant is allowed to make a
 * different party the villain than another one does, or the whole set
 * collapses the first time two of them land in the same inbox.
 *
 * The constant across all three is the antagonist: programs are approved one
 * at a time, against evidence that only ever describes one of them, and
 * nobody owns the union. Nobody in the chain caused that and nobody in the
 * chain can fix it alone. What varies is only what each audience *gains* —
 * air cover, standing, or evidence that isn't theirs.
 *
 * The shared headline stem ("The decisions are big.") is the site hero and
 * the deck opening. It stays fixed on purpose; only the italic line moves.
 */

export type AudienceConfig = {
  eyebrow: string;
  /** the italic second line — the only part of the headline that varies */
  headlineTail: string;
  lede: string;
  againstTitle: string;
  against: { k: string; v: string }[];
  changesTitle: string;
  changes: { k: string; v: string }[];
  /** optional relationship note — used to keep the broker page honest */
  note?: { k: string; v: string; href?: string; hrefLabel?: string };
  ctaPrimary: { href: string; label: string };
  ctaSecondary: { href: string; label: string };
  ctaFootnote: string;
};

export default function AudienceLanding({ cfg }: { cfg: AudienceConfig }) {
  return (
    <>
      {/* ─────────────── HERO ─────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full opacity-[0.07] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #4AC9DC 0%, #2463EB 55%, transparent 72%)",
          }}
        />
        <Section className="relative pt-24 pb-16">
          <Reveal>
            <div className="eyebrow mb-4">{cfg.eyebrow}</div>
            <h1 className="font-serif font-light text-5xl md:text-7xl leading-[1.08] tracking-tight max-w-4xl">
              <span className="block">The decisions are big.</span>
              <span className="block italic">{cfg.headlineTail}</span>
            </h1>
            <p className="mt-8 max-w-measure text-[17px] leading-[1.7] text-gray-warm">
              {cfg.lede}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <GradientButton href={cfg.ctaPrimary.href}>
                {cfg.ctaPrimary.label}
              </GradientButton>
              <GhostButton href={cfg.ctaSecondary.href}>
                {cfg.ctaSecondary.label}
              </GhostButton>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
              {cfg.ctaFootnote}
            </p>
          </Reveal>

          <div className="mt-16">
            <GradientRule />
            <p className="mt-4 font-serif italic text-xl text-gray-warm max-w-lg">
              &ldquo;We tell you what we think — but we expose the entire
              model.&rdquo;
            </p>
          </div>
        </Section>
      </div>

      {/* ─────────────── WHAT'S ACTUALLY IN THE WAY ───────────────
          Method failures, never accusations. Same test as REVIEW_GAPS on the
          homepage: none of these require anyone in the chain to be lazy or
          dishonest, which is both more accurate and the only version the
          reader can forward to their own committee. */}
      <DarkSection>
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20">
          <Reveal>
            <div>
              <EyebrowLight>{cfg.againstTitle}</EyebrowLight>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                Nobody in this chain{" "}
                <em className="italic">is doing anything wrong.</em>
              </h2>
              <p className="mt-6 text-[15px] leading-[1.75] text-gray-cool max-w-measure">
                That&rsquo;s what makes it durable. Every step is defensible on
                its own terms; the gap only appears when you look at all of them
                together, which is a view nobody in the process is positioned to
                have.
              </p>
            </div>
          </Reveal>

          <Stagger className="grid gap-7 lg:pt-4">
            {cfg.against.map((g) => (
              <StaggerItem key={g.k} className="border-t border-white/15 pt-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal mb-2">
                  {g.k}
                </div>
                <p className="text-[15px] leading-[1.7] text-gray-cool">{g.v}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </DarkSection>

      {/* ─────────────── WHAT CHANGES ─────────────── */}
      <Section className="py-16 sm:py-24">
        <Reveal>
          <div className="max-w-2xl mb-12">
            <Eyebrow>{cfg.changesTitle}</Eyebrow>
            <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
              Same analysis.{" "}
              <em className="italic">Different reason to want it.</em>
            </h2>
          </div>
        </Reveal>

        <Stagger className="grid md:grid-cols-3 gap-px bg-border border border-border">
          {cfg.changes.map((c) => (
            <StaggerItem key={c.k} className="bg-base p-7 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-4">
                {c.k}
              </div>
              <p className="text-[14px] leading-[1.7] text-gray-warm">{c.v}</p>
            </StaggerItem>
          ))}
        </Stagger>

        {cfg.note && (
          <Reveal delay={0.1}>
            <div className="mt-10 border border-border bg-base-2 p-7 md:p-8 max-w-3xl">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm mb-3">
                {cfg.note.k}
              </div>
              <p className="text-[15px] leading-[1.7] text-gray-warm">
                {cfg.note.v}
              </p>
              {cfg.note.href && (
                <Link
                  href={cfg.note.href}
                  className="inline-block mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-blue hover:underline"
                >
                  {cfg.note.hrefLabel} →
                </Link>
              )}
            </div>
          </Reveal>
        )}
      </Section>

      {/* ─────────────── CLOSE ─────────────── */}
      <div className="border-t border-border">
        <Section className="py-16 sm:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <Eyebrow>Start here</Eyebrow>
              <h2 className="font-serif font-light text-3xl md:text-5xl leading-tight">
                One scale, every program,{" "}
                <em className="italic">every assumption on the table.</em>
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-gray-warm">
                We&rsquo;re not replacing your vendors, your broker or your
                benefits team. We&rsquo;re giving everyone in the room the same
                independent picture — measured the same way.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <GradientButton href={cfg.ctaPrimary.href}>
                  {cfg.ctaPrimary.label}
                </GradientButton>
                <GhostButton href="/methodology">See the methodology</GhostButton>
              </div>
            </div>
          </Reveal>
        </Section>
      </div>
    </>
  );
}

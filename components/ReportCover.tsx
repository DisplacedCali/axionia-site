"use client";

import RadarChart, { type RadarAxis } from "@/components/RadarChart";
import MixMap from "@/components/MixMap";
import { SECTIONS } from "@/lib/modules/research/report";
import type { AssembledReport } from "@/lib/modules/research/report";

/**
 * Page one — at a glance, and where everything is.
 *
 * ── Why it exists ──
 *
 * Page one was a header, a score, eight axis names and a lot of white, then the
 * radar. A reader's first page told them almost nothing and gave them no way to
 * navigate what followed. In a thirteen-page PDF that lands in an inbox, page
 * one decides whether pages two to thirteen get read at all.
 *
 * Two thumbnails and a contents list. The thumbnails are the two charts they'll
 * meet properly later, small enough that only the SHAPE reads — which is the
 * point: a glance at where the dots cluster and where the radar is dented tells
 * you what kind of document this is before you've read a sentence.
 *
 * ── What it must not do ──
 *
 * Assert anything new. Everything here is drawn from sections that already
 * exist, so there is no path by which the cover says something the body
 * doesn't. A summary page that introduces its own claims is a second document
 * with no review step, and this report has been confidently wrong enough times
 * that giving it another surface would be careless.
 *
 * The contents descriptions say what each section ANSWERS rather than what it
 * contains — "where your options sit" rather than "a 2x2 chart" — because the
 * reader is deciding what to skip to, not what to admire.
 */

/** What each section answers, in the reader's terms. */
const ANSWERS: Record<string, string> = {
  questions: "What we can't tell from outside — and you can",
  designedMix: "Where the options sit, and three worth a conversation",
  scorecard: "How your portfolio reads across eight dimensions",
  findings: "The short version, and where we'd start",
  profile: "What we understand about your business",
  regulatory: "Where state law reaches you regardless of funding",
  workforce: "Your population, segment by segment",
  benefitDesign: "What to add, renegotiate or drop",
};

export default function ReportCover({
  report,
  radarAxes,
}: {
  report: AssembledReport;
  radarAxes: RadarAxis[];
}) {
  const mix = report.workforce?.designedMix;
  const visible = new Set(report.visibleSections);
  const contents = [...SECTIONS]
    .sort((a, b) => a.order - b.order)
    .filter((s) => visible.has(s.id) && ANSWERS[s.id]);

  return (
    <section className="print:break-after-page mb-12">
      {/* headline number */}
      <div className="flex flex-wrap items-end justify-between gap-6 pb-7 border-b border-border">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-3">
            At a glance
          </div>
          <h2 className="font-serif font-light text-3xl md:text-[38px] leading-tight text-navy max-w-xl">
            {mix?.picks?.length
              ? "Three options worth a conversation, and the evidence behind them."
              : "An independent read on your benefit portfolio."}
          </h2>
        </div>
        {report.overallScore !== null && (
          <div className="text-right">
            <div className="font-serif font-light text-5xl leading-none tabular-nums text-navy">
              {report.overallScore}
              <span className="text-2xl text-gray-cool">/100</span>
            </div>
            {report.band && (
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                {report.band.band} · {report.band.framing}
              </div>
            )}
          </div>
        )}
      </div>

      {/* the two shapes */}
      {/* print:grid-cols-2 is load-bearing. Tailwind's `md:` resolves against the
          PRINT viewport, which can fall below 768px — the two charts then stack,
          the cover runs past one page, and `break-after-page` breaks it in the
          wrong place. Print gets the two-up layout unconditionally. */}
      <div className="grid md:grid-cols-2 print:grid-cols-2 gap-px bg-border border border-border mt-8">
        {mix?.map?.length ? (
          <div className="bg-base p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-3">
              Where the options sit
            </div>
            <MixMap points={mix.map} compact />
            <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
              Cost against what employees actually feel. Grey is table stakes;
              blue is what we&rsquo;d raise.
            </p>
          </div>
        ) : null}

        {radarAxes.length > 0 && (
          <div className="bg-base p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-3">
              How your portfolio reads
            </div>
            <RadarChart axes={radarAxes} showPeer={false} gradientId="coverRadar" compact />
            <p className="mt-3 text-[12px] leading-[1.6] text-gray-warm">
              Eight dimensions. The dents are where the questions come from.
            </p>
          </div>
        )}
      </div>

      {/* the three, named — the single most useful thing to see early */}
      {mix?.picks?.length ? (
        <div className="mt-8">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-3">
            The three
          </div>
          <div className="grid sm:grid-cols-3 print:grid-cols-3 gap-px bg-border border border-border">
            {mix.picks.map((p) => (
              <div key={p.benefit} className="bg-base p-4">
                <div className="text-[14px] leading-snug text-navy">{p.benefit}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-blue">
                  {p.commonality === "rare" ? "Rarely offered" : "A differentiator"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* where everything is */}
      <div className="mt-8">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-3">
          What&rsquo;s in here
        </div>
        <ol className="border-t border-border">
          {contents.map((s, i) => (
            <li
              key={s.id}
              className="grid grid-cols-[auto_1fr_auto] gap-4 items-baseline py-2.5 border-b border-border"
            >
              <span className="font-mono text-[10px] text-gray-cool tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] text-navy">{s.label}</span>
              <span className="text-[13px] text-gray-warm text-right hidden sm:block print:block">
                {ANSWERS[s.id]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

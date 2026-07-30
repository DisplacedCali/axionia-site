"use client";

import RadarChart, { type RadarAxis } from "@/components/RadarChart";
import { CATEGORICAL, SEMANTIC } from "@/lib/modules/research/data/tokens";
import type { AssembledReport, SectionId } from "@/lib/modules/research/report";

/**
 * The report, rendered.
 *
 * One component serves both the admin preview and the client view. That is
 * deliberate: the only way to be sure you are reviewing what the client sees is
 * for it to be the same code. `slots` lets the admin inject comment boxes per
 * section without the client route knowing anything about them.
 *
 * Presentational only — no data fetching, no actions. Brand values come from
 * data/tokens.ts, which tracks axionia_brand_tokens.md.
 */

type Props = {
  report: AssembledReport;
  /** Per-section admin controls. Absent on the client route. */
  slots?: Partial<Record<SectionId, React.ReactNode>>;
  /** Show locked placeholders for withheld sections. */
  showWithheld?: boolean;
};

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm";

/** Score band colour, per brand tokens §5. */
function bandColor(score: number | null): string {
  if (score === null) return SEMANTIC.noSignal;
  if (score >= 75) return SEMANTIC.positive;
  if (score >= 60) return CATEGORICAL.teal;
  if (score >= 45) return SEMANTIC.caution;
  return SEMANTIC.risk;
}

/**
 * Minimal markdown for model output: ## headers, **bold**, and - bullets.
 *
 * A full markdown library would be heavier than the need. The pipeline emits
 * exactly these three things, and anything else should be caught in review
 * rather than silently rendered.
 */
function Prose({ text }: { text: string }) {
  if (!text?.trim()) {
    return <p className="text-[14px] italic text-gray-cool">Nothing generated for this section.</p>;
  }

  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-2.5 my-4">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-[1.75] text-navy">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue" />
            <span dangerouslySetInnerHTML={{ __html: inline(b) }} />
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push(
        <h4 key={`h-${blocks.length}`} className="font-serif text-[20px] font-light text-navy mt-7 mb-2">
          {line.slice(3)}
        </h4>,
      );
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      bullets.push(line.slice(2));
      continue;
    }
    flush();
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="text-[15px] leading-[1.75] text-navy my-3 max-w-measure"
        dangerouslySetInnerHTML={{ __html: inline(line) }}
      />,
    );
  }
  flush();
  return <>{blocks}</>;
}

/** **bold** only. Escapes first so model output can't inject markup. */
function inline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium">$1</strong>');
}

function Section({
  id,
  title,
  children,
  slot,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  slot?: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border pt-8 mt-10 print:break-inside-avoid">
      <h3 className={`${eyebrow} mb-5`}>{title}</h3>
      {children}
      {slot && <div className="mt-6 print:hidden">{slot}</div>}
    </section>
  );
}

export default function ReportRender({ report, slots, showWithheld = false }: Props) {
  const visible = new Set(report.visibleSections);

  const radarAxes: RadarAxis[] = report.axes.map((a) => ({
    label: a.shortLabel,
    value: a.score ?? 0,
    // No peer benchmark yet — the benchmark asset needs more companies before a
    // comparison line means anything. Mirroring the value hides the overlay
    // rather than drawing a fake peer.
    peer: a.score ?? 0,
    hue: CATEGORICAL[a.colorToken as keyof typeof CATEGORICAL] ?? CATEGORICAL.blue,
  }));

  return (
    <article className="max-w-[820px]">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header>
        <p className={eyebrow}>Benefit Decision Intelligence</p>
        <h1 className="font-serif text-[40px] font-light leading-[1.1] text-navy mt-3">
          {report.company}
        </h1>
        <p className="mt-3 text-[15px] text-gray-warm">
          {[report.industry, report.hq, report.size].filter(Boolean).join(" · ")}
        </p>
      </header>

      {report.isFallback && (
        <div className="mt-6 border border-risk/40 bg-red-light/60 px-5 py-4 print:hidden">
          <p className={`${eyebrow} text-risk mb-1`}>Estimated scores</p>
          <p className="text-[14px] leading-[1.7] text-navy">
            Scoring failed on this run and estimated defaults were substituted. Not
            releasable and excluded from benchmarks.
          </p>
        </div>
      )}

      {/* ── Scorecard ────────────────────────────────────────────── */}
      {visible.has("scorecard") && (
        <Section id="scorecard" title="Readiness Scorecard" slot={slots?.scorecard}>
          <div className="grid gap-10 md:grid-cols-[300px_1fr] items-start">
            <div>
              <div className="flex items-baseline gap-4">
                <span
                  className="font-serif text-[64px] leading-none font-light"
                  style={{ color: bandColor(report.overallScore) }}
                >
                  {report.overallScore ?? "—"}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
                  / 100
                </span>
              </div>
              {report.band && (
                <>
                  <p
                    className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em]"
                    style={{ color: bandColor(report.overallScore) }}
                  >
                    {report.band.band}
                  </p>
                  {/* The lowest band reads as opportunity, never failure — brand §5. */}
                  <p className="mt-1 text-[14px] text-gray-warm">{report.band.framing}</p>
                </>
              )}
              {report.anyScoreAdjusted && (
                <p className="mt-4 font-mono text-[10px] leading-[1.6] text-gray-cool">
                  One or more axes were adjusted by an analyst after review.
                </p>
              )}
            </div>

            <RadarChart axes={radarAxes} showPeer={false} gradientId="reportRadar" />
          </div>

          <div className="mt-8 divide-y divide-border border-t border-border">
            {report.axes.map((a) => (
              <div key={a.key} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        CATEGORICAL[a.colorToken as keyof typeof CATEGORICAL] ?? CATEGORICAL.blue,
                    }}
                  />
                  <span className="font-mono text-[13px] tabular-nums text-navy w-7 text-right">
                    {a.score ?? "—"}
                  </span>
                  <span className="text-[14px] text-navy w-[150px]">{a.shortLabel}</span>
                </div>
                <div>
                  <p className="text-[14px] leading-[1.65] text-gray-warm">{a.rationale}</p>
                  {a.adjusted && (
                    <p className="mt-1 font-mono text-[10px] text-gray-cool">
                      Adjusted from {a.modelScore} on review.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Findings ─────────────────────────────────────────────── */}
      {visible.has("findings") && (
        <Section id="findings" title="Key Findings" slot={slots?.findings}>
          {report.summary?.trim() && (
            <p className="font-serif text-[21px] font-light leading-[1.5] text-navy mb-7 max-w-measure">
              {report.summary}
            </p>
          )}
          <ol className="space-y-4">
            {report.findings.map((f, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-mono text-[10px] text-gray-cool pt-[6px] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] leading-[1.75] text-navy">{f.text}</span>
              </li>
            ))}
          </ol>
          {report.urgencySignal?.trim() && (
            <div className="mt-8 border-l-2 border-caution pl-5">
              <p className={`${eyebrow} text-caution mb-1`}>Time sensitivity</p>
              <p className="text-[15px] leading-[1.7] text-navy">{report.urgencySignal}</p>
            </div>
          )}
        </Section>
      )}

      {visible.has("profile") && (
        <Section id="profile" title="Company Profile" slot={slots?.profile}>
          <Prose text={report.profile} />
        </Section>
      )}

      {visible.has("regulatory") && (
        <Section id="regulatory" title="Regulatory Exposure" slot={slots?.regulatory}>
          <Prose text={report.regulatory} />
          {report.statesData?.states?.length ? (
            <p className="mt-5 font-mono text-[10px] text-gray-cool">
              States assessed: {report.statesData.states.join(", ")}
              {report.statesData.rationale ? ` · ${report.statesData.rationale}` : ""}
            </p>
          ) : null}
        </Section>
      )}

      {/* ── Workforce (paid) ─────────────────────────────────────── */}
      {visible.has("workforce") && report.workforce && (
        <Section id="workforce" title="Workforce Intelligence" slot={slots?.workforce}>
          {report.workforce.overallInsight && (
            <p className="font-serif text-[19px] font-light leading-[1.55] text-navy mb-7 max-w-measure">
              {report.workforce.overallInsight}
            </p>
          )}
          <div className="space-y-6">
            {report.workforce.segments.map((seg) => (
              <div key={seg.name} className="border border-border p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                  <h4 className="font-serif text-[19px] font-light text-navy">{seg.name}</h4>
                  <span className="flex gap-4 font-mono text-[10px] uppercase tracking-[0.1em]">
                    {seg.headcountEstimate && (
                      <span className="text-gray-cool">{seg.headcountEstimate}</span>
                    )}
                    {seg.retentionRisk && (
                      <span
                        style={{
                          color:
                            seg.retentionRisk === "high"
                              ? SEMANTIC.risk
                              : seg.retentionRisk === "medium"
                                ? SEMANTIC.caution
                                : SEMANTIC.positive,
                        }}
                      >
                        {seg.retentionRisk} retention risk
                      </span>
                    )}
                  </span>
                </div>
                {seg.insight && (
                  <p className="text-[15px] leading-[1.7] text-navy">{seg.insight}</p>
                )}
                {seg.replacementNote && (
                  <p className="mt-2 text-[14px] leading-[1.7] text-gray-warm">
                    {seg.replacementNote}
                  </p>
                )}
                {seg.topBenefit && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                    Most valued: <span className="text-navy">{seg.topBenefit}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Benefit design (paid) ────────────────────────────────── */}
      {visible.has("benefitDesign") && report.workforce?.benefitDesign?.length ? (
        <Section id="benefitDesign" title="Benefit Design" slot={slots?.benefitDesign}>
          <div className="space-y-8">
            {report.workforce.benefitDesign.map((seg) => (
              <div key={seg.segment}>
                <div className="flex items-baseline gap-3 mb-3">
                  <h4 className="font-serif text-[19px] font-light text-navy">{seg.segment}</h4>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm">
                    {seg.priority}
                  </span>
                </div>
                {seg.designInsight && (
                  <p className="text-[14px] leading-[1.7] text-gray-warm mb-4">
                    {seg.designInsight}
                  </p>
                )}
                <ul className="divide-y divide-border border-y border-border">
                  {seg.gap.map((g) => (
                    <li key={g.benefit} className="py-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[15px] text-navy">{g.benefit}</span>
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.1em]"
                          style={{
                            color:
                              g.urgency === "High"
                                ? SEMANTIC.caution
                                : g.urgency === "Medium"
                                  ? CATEGORICAL.teal
                                  : SEMANTIC.noSignal,
                          }}
                        >
                          {g.urgency}
                        </span>
                      </div>
                      <p className="mt-1 text-[14px] leading-[1.65] text-gray-warm">
                        {g.gapRationale}
                      </p>
                      {g.vendors.length > 0 && (
                        // Vendors in caution/amber per brand tokens: "their claim,
                        // unadjusted" — named, not endorsed.
                        <p
                          className="mt-1.5 font-mono text-[10px]"
                          style={{ color: SEMANTIC.caution }}
                        >
                          Vendors named: {g.vendors.join(", ")} — unverified claims
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {visible.has("brief") && (
        <Section id="brief" title="Pre-Meeting Brief" slot={slots?.brief}>
          <p className={`${eyebrow} text-caution mb-4`}>Internal — not client-facing</p>
          <Prose text={report.brief} />
        </Section>
      )}

      {/* ── Withheld ─────────────────────────────────────────────── */}
      {showWithheld && report.withheldSections.length > 0 && (
        <section className="border-t border-border pt-8 mt-10 print:hidden">
          <h3 className={`${eyebrow} mb-4`}>Not included in this report</h3>
          <ul className="space-y-2">
            {report.withheldSections.map((s) => (
              <li key={s} className="text-[14px] text-gray-cool">
                {s === "workforce" && "Workforce Intelligence — segment-level retention and replacement economics"}
                {s === "benefitDesign" && "Benefit Design — prioritised prescription per segment, with gap analysis"}
                {s === "brief" && "Pre-Meeting Brief — internal"}
                {!["workforce", "benefitDesign", "brief"].includes(s) && s}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-border mt-12 pt-6">
        <p className="text-[12px] leading-[1.7] text-gray-cool max-w-measure">
          Scores derive from publicly available company information, industry benchmarks and
          Axionia&rsquo;s benefit intelligence library. Dollar impacts are expressed as ranges.
          Vendor references describe the vendor&rsquo;s own claims, unadjusted for selection
          bias. Reviewed by a human before release.
        </p>
      </footer>
    </article>
  );
}

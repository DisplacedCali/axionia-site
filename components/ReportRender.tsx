"use client";

import RadarChart, { type RadarAxis } from "@/components/RadarChart";
import MixMap from "@/components/MixMap";
import ReportCover from "@/components/ReportCover";
import { CATEGORICAL, SEMANTIC } from "@/lib/modules/research/data/tokens";
import { openingQuestions } from "@/lib/modules/research/report";
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
  /**
   * Per-target admin controls. Absent on the client route.
   *
   * Keyed by REVISION TARGET, not by section. The findings section renders
   * three separately editable things — the summary paragraph, the findings
   * list, and the "Where to start" recommendation — and giving them one shared
   * slot at the foot of the section made every revision look like it had
   * failed: the box sat under the recommendation and edited the list.
   */
  slots?: Partial<Record<SectionId | "summary" | "topOpportunity", React.ReactNode>>;
  /** Show locked placeholders for withheld sections. */
  showWithheld?: boolean;
  /**
   * Admin score editing, inline on the scorecard.
   *
   * Editing scores here rather than in a separate form matters: you adjust the
   * number while reading the rationale that justifies it. A score and its
   * justification are one judgement, so they belong in one place.
   */
  editScores?: {
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    /**
     * Per-axis justification, required by saveReportEdits for any changed
     * score. Rendered inline under the axis rather than in a separate form:
     * you write the reason while looking at the rationale you're disagreeing
     * with, which is the same argument that put score editing on the scorecard
     * in the first place.
     */
    notes: Record<string, string>;
    onNoteChange: (key: string, value: string) => void;
  };
};

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm";

/**
 * Copy for sections the client's view withholds.
 *
 * Two rules, both about not being sleazy with a free deliverable.
 *
 * The blurb describes what the section CONTAINS, never what the client is
 * missing out on. "Segment-level replacement cost" is information; "see what
 * you're losing" is a trailer, and a report that reads as a trailer undermines
 * the part that was free and real.
 *
 * `brief` is deliberately absent. The Pre-Meeting Brief is Axionia's internal
 * preparation — it isn't a paid upgrade, it's not for sale, and advertising it
 * to the client as a locked feature would be advertising something that will
 * never be delivered.
 */
const WITHHELD_COPY: Record<
  string,
  { label: string; blurb: string; interest: string; cta: string }
> = {
  workforce: {
    label: "Workforce Intelligence",
    blurb:
      "Your covered population broken into segments, with the retention and replacement economics that decide which benefits actually pay back for each one. This is what turns a portfolio score into a specific answer about your workforce rather than your industry's.",
    // Must match a key in interestLabels in app/contact/page.tsx — an unknown
    // value lands on a select with nothing selected.
    interest: "workforce-strategy",
    cta: "Ask about the full analysis",
  },
  benefitDesign: {
    label: "Benefit Design",
    blurb:
      "The mix above was built from your workforce shape alone. This is the same analysis run against what you actually carry — your programs scored, overlapping claims separated and quantified, the spend reallocated rather than only ranked, and the cross-segment view showing where serving one group well serves another badly.",
    interest: "benefit-design",
    cta: "Ask about the full analysis",
  },
};

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

export default function ReportRender({
  report,
  slots,
  showWithheld = false,
  editScores,
}: Props) {
  const visible = new Set(report.visibleSections);

  // Only sections with client-facing copy are advertised. Anything withheld
  // that isn't in the table — today that's the internal brief — is simply not
  // shown, rather than surfaced as a locked row the client can't ever unlock.
  const clientWithheld = report.withheldSections.flatMap((id) => {
    const copy = WITHHELD_COPY[id];
    return copy ? [{ id, ...copy }] : [];
  });

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
          {report.fallbackReason && (
            <p className="mt-2 font-mono text-[11px] leading-[1.6] text-navy/80">
              {report.fallbackReason}
            </p>
          )}
          {!report.fallbackReason && (
            <p className="mt-2 font-mono text-[11px] leading-[1.6] text-gray-warm">
              No cause recorded — this run predates cause capture. Re-running will
              record one if it happens again.
            </p>
          )}
        </div>
      )}

      {/* ── Scorecard ────────────────────────────────────────────── */}
      {/* Page one: at a glance, and where everything is.
          Client view only — the admin preview has the orientation panel above
          it, which answers the same question with different content. */}
      {showWithheld && <ReportCover report={report} radarAxes={radarAxes} />}

      {/* ── questions ──
          Deterministic, derived from the axis scores. No model call: a
          generated question would reintroduce the fabrication risk this
          section exists to avoid. */}
      {visible.has("questions") && (
        <Section id="questions" title="Questions Worth Asking">
          <p className="text-[15px] leading-[1.75] text-navy max-w-measure mb-7">
            These are the questions this analysis raised about your portfolio
            that we can&rsquo;t answer from the outside. If any of them are
            uncomfortable to answer quickly, that discomfort is the finding.
          </p>
          <ol className="space-y-6">
            {openingQuestions({ axes: report.axes, company: report.company }).map(
              (q, i) => (
                <li key={q.q} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="font-mono text-[11px] text-gray-cool tabular-nums pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-serif font-light text-xl md:text-[23px] leading-snug text-navy">
                      {q.q}
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.7] text-gray-warm max-w-measure">
                      {q.why}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </Section>
      )}

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

          {/*
            Score, bar and rationale as one row.
            Previously the numbers sat in a radar and the rationales ran as a
            separate column, so in print they collapsed into overlapping text
            and the justification read as unrelated prose. A score without its
            reasoning beside it is just an assertion.
          */}
          <div className="mt-8 divide-y divide-border border-t border-b border-border">
            {report.axes.map((a) => {
              const hue = CATEGORICAL[a.colorToken as keyof typeof CATEGORICAL] ?? CATEGORICAL.blue;
              return (
                <div key={a.key} className="py-4 print:break-inside-avoid">
                  <div className="flex items-baseline gap-3">
                    {editScores ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editScores.values[a.key] ?? ""}
                        onChange={(e) => editScores.onChange(a.key, e.target.value)}
                        className={`w-14 shrink-0 border px-1.5 py-1 text-center font-mono text-[13px] tabular-nums focus:outline-none print:hidden ${
                          a.adjusted ? "border-blue text-blue" : "border-border text-navy"
                        }`}
                      />
                    ) : null}
                    <span
                      className={`font-mono text-[15px] tabular-nums w-8 text-right ${editScores ? "hidden print:inline" : ""}`}
                      style={{ color: hue }}
                    >
                      {a.score ?? "—"}
                    </span>
                    <span className="flex-1 text-[15px] text-navy">{a.shortLabel}</span>
                    {a.adjusted && a.modelScore !== null && (
                      <span className="font-mono text-[10px] text-gray-cool shrink-0">
                        model said {a.modelScore}
                      </span>
                    )}
                  </div>

                  {/* Bar carries the axis hue, so the radar and the table agree. */}
                  <div className="mt-2 h-[3px] bg-base-2">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, a.score ?? 0))}%`, background: hue }}
                    />
                  </div>

                  {a.rationale && (
                    <p className="mt-2.5 text-[14px] leading-[1.7] text-gray-warm">
                      {a.rationale}
                    </p>
                  )}

                  {/*
                    Only when the score actually differs from the model's. An
                    always-visible box on eight axes reads as eight chores; one
                    that appears the moment you disagree reads as the natural
                    next step.
                  */}
                  {editScores &&
                    editScores.values[a.key] !== "" &&
                    editScores.values[a.key] !== undefined &&
                    Number(editScores.values[a.key]) !== a.modelScore && (
                      <div className="mt-3 print:hidden">
                        <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-blue">
                          Why you changed it
                          {!editScores.notes[a.key]?.trim() && (
                            <span className="text-risk"> · required</span>
                          )}
                        </label>
                        <textarea
                          rows={2}
                          value={editScores.notes[a.key] ?? ""}
                          onChange={(e) => editScores.onNoteChange(a.key, e.target.value)}
                          placeholder={`Model said ${a.modelScore ?? "—"}. What does it not know?`}
                          className={`mt-1 w-full border px-2 py-1.5 text-[13px] leading-[1.6] focus:outline-none ${
                            editScores.notes[a.key]?.trim()
                              ? "border-border text-navy"
                              : "border-risk text-navy"
                          }`}
                        />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Findings ───────────────────────────────────────────────
          No section-level slot here: this section renders three separately
          editable blocks, and each carries its own below. */}
      {visible.has("findings") && (
        <Section id="findings" title="Key Findings">
          {report.summary?.trim() && (
            <p className="font-serif text-[21px] font-light leading-[1.5] text-navy mb-7 max-w-measure">
              {report.summary}
            </p>
          )}
          {slots?.summary && <div className="mb-7 print:hidden">{slots.summary}</div>}
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
          {slots?.findings && <div className="mt-6 print:hidden">{slots.findings}</div>}
          {report.urgencySignal?.trim() && (
            <div className="mt-8 border-l-2 border-caution pl-5">
              <p className={`${eyebrow} text-caution mb-1`}>Time sensitivity</p>
              <p className="text-[15px] leading-[1.7] text-navy">{report.urgencySignal}</p>
            </div>
          )}

          {/*
            The ask. conversationHook was generated on every run and rendered
            nowhere, so every report ended without one.
          */}
          {report.callToAction && (
            <div className="mt-9 border border-navy p-6">
              <p className={`${eyebrow} mb-2`}>Where to start</p>
              {report.callToAction.headline && (
                <p className="font-serif text-[21px] font-light leading-[1.45] text-navy">
                  {report.callToAction.headline}
                </p>
              )}
              {report.callToAction.question && (
                <p className="mt-4 text-[15px] leading-[1.7] text-gray-warm">
                  The question worth asking internally:{" "}
                  <span className="text-navy italic">
                    &ldquo;{report.callToAction.question}&rdquo;
                  </span>
                </p>
              )}
            </div>
          )}
          {slots?.topOpportunity && (
            <div className="mt-4 print:hidden">{slots.topOpportunity}</div>
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
          {/*
            Curated library FIRST, model prose second.

            The mandate library carries the one fact that decides whether a
            mandate matters to a self-insured employer — whether ERISA
            preemption saves them — and it was going entirely unrendered while
            five pages of model prose said the same things less reliably.
            Curated rows are the spine; the model annotates.
          */}
          {report.mandates.selfInsuredFull.length > 0 && (
            <div className="border-l-2 border-risk pl-5 mb-8">
              <p className={`${eyebrow} mb-2`} style={{ color: SEMANTIC.risk }}>
                Reaches self-insured plans — ERISA preemption does not apply
              </p>
              <ul className="space-y-3">
                {report.mandates.selfInsuredFull.map((m) => (
                  <li key={m.id}>
                    <p className="text-[15px] leading-[1.6] text-navy">
                      <span className="font-mono text-[11px] mr-2 text-gray-warm">{m.state}</span>
                      <span className="font-medium">{m.benefit}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-gray-cool">
                      {m.law} · effective {m.effectiveDate}
                    </p>
                    {m.axioniaTake && (
                      <p className="mt-1.5 text-[14px] leading-[1.65] text-gray-warm">
                        {m.axioniaTake}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.mandates.selfInsuredPartial.length > 0 && (
            <div className="border-l-2 border-caution pl-5 mb-8">
              <p className={`${eyebrow} mb-2`} style={{ color: SEMANTIC.caution }}>
                Partial reach — federal floor applies, state adds enforcement
              </p>
              <ul className="space-y-2">
                {report.mandates.selfInsuredPartial.map((m) => (
                  <li key={m.id} className="text-[14px] leading-[1.65] text-navy">
                    <span className="font-mono text-[11px] mr-2 text-gray-warm">{m.state}</span>
                    {m.benefit} — <span className="text-gray-warm">{m.erisa}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.mandates.all.length > 0 && (
            <table className="w-full text-left mb-8 border-t border-border">
              <thead>
                <tr className={eyebrow}>
                  <th className="py-2.5 pr-3 font-normal">State</th>
                  <th className="py-2.5 pr-3 font-normal">Mandate</th>
                  <th className="py-2.5 pr-3 font-normal">Effective</th>
                  <th className="py-2.5 font-normal">Self-insured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.mandates.all.map((m) => (
                  <tr key={m.id} className="align-top">
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-gray-warm">{m.state}</td>
                    <td className="py-2.5 pr-3 text-[14px] text-navy">{m.benefit}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-gray-cool whitespace-nowrap">
                      {m.effectiveDate}
                    </td>
                    <td className="py-2.5">
                      {/* Dot + word, never colour alone — brand tokens §5, accessibility. */}
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              m.selfInsured === true
                                ? SEMANTIC.risk
                                : m.selfInsured === "partial"
                                  ? SEMANTIC.caution
                                  : SEMANTIC.noSignal,
                          }}
                        />
                        <span className="font-mono text-[11px] text-gray-warm">
                          {m.selfInsured === true
                            ? "Applies"
                            : m.selfInsured === "partial"
                              ? "Partial"
                              : "Preempted"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {report.mandates.uncoveredStates.length > 0 && (
            <p className="mb-6 text-[13px] leading-[1.7] text-gray-warm">
              The commentary below also covers{" "}
              <span className="text-navy">{report.mandates.uncoveredStates.join(", ")}</span>, which
              the curated mandate library does not yet include — treat those passages as
              model-generated and unverified.
            </p>
          )}

          <Prose text={report.regulatory} />

          {report.statesData?.states?.length ? (
            <p className="mt-5 font-mono text-[10px] leading-[1.6] text-gray-cool">
              States assessed: {report.statesData.states.join(", ")}
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

      {/* ── A mix built for this workforce (free) ──────────────────
          Deliberately opens by naming what it doesn't know. A confident
          prescription assembled without the client's current programs would be
          the exact overreach this product exists to catch — and the honest
          version converts better, because the reader's objection ("you don't
          know we already run X") is the buying signal, and stating it first
          turns it into the invitation.

          Nothing here scores a program the client told us they run. Those are
          listed, unranked, under `acknowledged`. Ranking someone's own decision
          from a bubble is the line between provocative and offensive. */}
      {visible.has("designedMix") && report.workforce?.designedMix?.picks?.length ? (
        <Section id="designedMix" title="A Mix Built for This Workforce">
          <p className="text-[14px] leading-[1.75] text-gray-warm max-w-measure border-l-2 border-blue pl-5 mb-8">
            {report.workforce.designedMix.premise}
          </p>

          {report.workforce.designedMix.nothingSurprising && (
            <p className="mb-8 text-[15px] leading-[1.75] text-navy border-l-2 border-stone pl-5 max-w-measure">
              {report.workforce.designedMix.nothingSurprising}
            </p>
          )}

          {report.workforce.designedMix.map?.length ? (
            <div className="mb-10 border border-border bg-base p-5 sm:p-7">
              <MixMap points={report.workforce.designedMix.map} />
            </div>
          ) : null}

          <ul className="divide-y divide-border border-y border-border">
            {report.workforce.designedMix.picks.map((p) => (
              <li key={p.benefit} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-[15px] text-navy">{p.benefit}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-blue">
                    {p.commonality === "rare" ? "RARELY OFFERED · " : ""}
                    {p.kind === "no-seller"
                      ? "Nobody sells this"
                      : p.kind === "cheap-high-rank"
                        ? "Low cost, high rank"
                        : "Outside the clinical stack"}
                  </span>
                </div>
                <p className="text-[13px] leading-[1.7] text-gray-warm max-w-measure">
                  {p.why}
                </p>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-cool">
                  {p.forSegment} · perceived {p.scores.perceived}/5 · retention{" "}
                  {p.scores.retention}/5 · employer leverage {p.scores.financial}/5
                </div>
              </li>
            ))}
          </ul>

          {report.workforce.designedMix.acknowledged.length > 0 && (
            <p className="mt-6 text-[13px] leading-[1.7] text-gray-cool max-w-measure">
              You told us about{" "}
              <span className="text-gray-warm">
                {report.workforce.designedMix.acknowledged.join(", ")}
              </span>
              . We&rsquo;ve deliberately left those out of the ranking above —
              judging a program you already chose, without seeing what it costs
              you or who else it overlaps, isn&rsquo;t a call we&rsquo;ve earned
              the right to make yet.
            </p>
          )}

          <p className="mt-6 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
            Ordering only. We don&rsquo;t put a dollar figure on retention or
            satisfaction — those are too confounded by pay, management and the
            labour market to attribute honestly, and a method that invents one is
            the thing we exist to catch.
          </p>
        </Section>
      ) : null}

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

                {/*
                  No library coverage for this role type. Said plainly rather
                  than prescribing the nearest-match benefits, which is how
                  portfolio managers previously got childcare subsidies.
                */}
                {seg.gap.length === 0 && (
                  <p className="text-[14px] leading-[1.7] text-gray-warm border-l-2 border-stone pl-4">
                    No prescription generated — the benefit library does not yet cover this role
                    type, so anything shown here would be a guess.
                    {seg.libraryMatch?.reason ? ` ${seg.libraryMatch.reason}` : ""}
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
      {/* ── the ask ──────────────────────────────────────────────
          The document used to end on two locked boxes saying "ask about the
          full analysis". That is absence, not an invitation — it tells a
          reader what they don't have and gives them nothing to do about it.

          One close, naming a specific next step and what it costs, placed
          before the withheld list so the last thing read is an offer rather
          than a wall. */}
      {showWithheld && (
        <section className="border-t-2 border-navy pt-8 mt-12 print:break-inside-avoid">
          <h3 className={`${eyebrow} mb-4`}>What we&rsquo;d do next</h3>
          <p className="font-serif font-light text-2xl md:text-[28px] leading-snug text-navy max-w-2xl">
            Send us what you actually run — the programs, the renewal, the
            invoice. We&rsquo;ll tell you what overlaps.
          </p>
          <p className="mt-5 text-[15px] leading-[1.75] text-gray-warm max-w-measure">
            Everything above was built from the shape of your workforce and
            nothing else. The questions at the top are the ones we can&rsquo;t
            answer without your numbers — and they&rsquo;re the ones where the
            money usually is. One conversation is normally enough to tell whether
            there&rsquo;s anything here worth pursuing, and if there isn&rsquo;t
            we&rsquo;ll say so.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              href="/contact?interest=benefit-design"
              className="inline-block px-6 py-3 bg-navy text-base font-mono text-[10px] uppercase tracking-[0.14em] hover:opacity-90 transition-opacity print:hidden"
            >
              Start that conversation
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
              No commitment · we&rsquo;ll tell you if there&rsquo;s nothing here
            </span>
          </div>
        </section>
      )}

      {showWithheld && clientWithheld.length > 0 && (
        <section className="border-t border-border pt-8 mt-10 print:break-inside-avoid">
          <h3 className={`${eyebrow} mb-2`}>Analysed, not included</h3>
          <p className="text-[14px] leading-[1.7] text-gray-warm max-w-measure mb-6">
            These ran against your intake in the same pass as everything above.
            They sit outside the free report because they carry the prescriptive
            work — what to do, in what order, for which segment.
          </p>

          <div className="grid gap-px bg-border border border-border">
            {clientWithheld.map((s) => (
              <div key={s.id} className="bg-base-2 p-6 md:p-7">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h4 className="font-serif text-xl leading-snug text-navy">
                    {s.label}
                  </h4>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-cool shrink-0">
                    Not in this report
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-[1.7] text-gray-warm max-w-measure">
                  {s.blurb}
                </p>
                <a
                  href={`/contact?interest=${s.interest}`}
                  className="inline-block mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-blue border-b border-blue/40 hover:border-blue pb-0.5"
                >
                  {s.cta}
                </a>
              </div>
            ))}
          </div>
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

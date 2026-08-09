import type { AssembledReport } from "@/lib/modules/research/report";
import { SECTIONS } from "@/lib/modules/research/report";

/**
 * The internal reader's way in.
 *
 * The internal report is deliberately long — everything the pipeline produced,
 * nothing withheld. Long is fine; unnavigable is not. This sits at the top and
 * answers three questions before the document starts:
 *
 *   what should I look at first
 *   what should I not trust
 *   where is the thing I came for
 *
 * Nothing here is generated. It's composed from output that already exists, so
 * it costs no model call and cannot introduce a claim of its own — which
 * matters, because an orientation panel that invented a priority would be
 * steering the reader with something nobody checked.
 *
 * Internal audience ONLY. It surfaces the pre-meeting brief's existence and the
 * report's own soft spots, neither of which belongs in front of a client.
 */
export default function InternalOrientation({
  report,
}: {
  report: AssembledReport;
}) {
  /**
   * Things worth knowing before believing the rest.
   *
   * Deliberately prominent rather than tucked in a footnote. The Valtruis run
   * asserted a parent company that didn't exist and nothing on the page said
   * "this was a guess" — the reader had no cue to check.
   */
  const caveats: string[] = [];
  if (report.isFallback) {
    caveats.push(
      report.fallbackReason
        ? `Scores are estimated defaults — the scoring step failed. ${report.fallbackReason}`
        : "Scores are estimated defaults because the scoring step failed. Treat the radar as decoration until it's re-run.",
    );
  }
  if (report.anyScoreAdjusted) {
    caveats.push(
      "At least one score was adjusted by hand. The model's original is preserved alongside it.",
    );
  }
  if (report.mandates.uncoveredStates.length > 0) {
    caveats.push(
      `Regulatory commentary covers ${report.mandates.uncoveredStates.join(", ")}, which the curated mandate library does not — those passages are model-generated and unverified.`,
    );
  }
  if (!report.hq || !report.size) {
    caveats.push(
      "Company identification is incomplete — check the profile before quoting anything structural.",
    );
  }

  const visible = new Set(report.visibleSections);
  const nav = [...SECTIONS]
    .sort((a, b) => a.order - b.order)
    .filter((s) => visible.has(s.id));

  return (
    <div className="border-2 border-navy bg-base-2 p-6 md:p-8 mb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy">
          Internal — not for the client
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool">
          {report.company}
          {report.overallScore !== null ? ` · ${report.overallScore}/100` : ""}
          {report.band ? ` · ${report.band.band}` : ""}
        </span>
      </div>

      {/* 1. what to look at first */}
      {(report.topOpportunity || report.urgencySignal) && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {report.topOpportunity && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-blue mb-1.5">
                Lead with this
              </div>
              <p className="text-[14px] leading-[1.7] text-navy">
                {report.topOpportunity}
              </p>
            </div>
          )}
          {report.urgencySignal && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-caution-dark mb-1.5">
                Why now
              </div>
              <p className="text-[14px] leading-[1.7] text-navy">
                {report.urgencySignal}
              </p>
            </div>
          )}
        </div>
      )}

      {report.callToAction?.question && (
        <div className="border-l-2 border-blue pl-5 py-1 mb-6">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-1.5">
            The question to ask them
          </div>
          <p className="font-serif italic text-lg leading-snug text-navy max-w-measure">
            {report.callToAction.question}
          </p>
        </div>
      )}

      {/* 2. what not to trust */}
      {caveats.length > 0 && (
        <div className="border border-caution/40 bg-amber-light px-5 py-4 mb-6">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-caution-dark mb-2">
            Check before you repeat any of this
          </div>
          <ul className="space-y-1.5">
            {caveats.map((c) => (
              <li key={c} className="text-[13px] leading-[1.65] text-navy">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. where things are */}
      <div className="border-t border-border pt-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm mb-2.5">
          In this report
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {nav.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline"
            >
              {s.label}
              {s.internalOnly && (
                <span className="text-caution-dark"> · internal</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

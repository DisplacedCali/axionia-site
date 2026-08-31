"use client";

import { useState, useMemo } from "react";

/**
 * The ninety-second test, as something the reader runs on their own numbers.
 *
 * Every input is supplied by the visitor. There is not a single constant in
 * this component that we invented — no category shares, no benchmark spend,
 * no engagement assumption. That is deliberate and it is the whole reason the
 * page is credible: the arithmetic is doing the work, not our data.
 *
 * The defaults describe a mid-sized self-funded employer and are there to make
 * the page legible on first paint. They are labelled as an example and every
 * one of them is editable.
 *
 * Brand: the vendor's own figure is Amber throughout, per the semantic scale —
 * "their claim, unadjusted; not wrong, just unverified." The adjusted figure is
 * Blue. Nothing here is Risk red: a claim that fails this test is usually a
 * denominator problem rather than a lie, and the page says so.
 */

const money = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${Math.round(n).toLocaleString("en-US")}`;

function Field({
  label,
  hint,
  prefix,
  suffix,
  value,
  onChange,
  step = 1,
  max,
}: {
  label: string;
  hint: string;
  prefix?: string;
  suffix?: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-warm mb-2">
        {label}
      </label>
      <div className="flex items-center border border-border bg-base focus-within:border-navy transition-colors">
        {prefix && (
          <span className="pl-3 font-mono text-[13px] text-gray-cool">{prefix}</span>
        )}
        <input
          type="number"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) && n >= 0 ? (max ? Math.min(n, max) : n) : 0);
          }}
          className="w-full px-2 py-2.5 bg-transparent font-mono text-[15px] text-navy tabular-nums outline-none"
        />
        {suffix && (
          <span className="pr-3 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-cool whitespace-nowrap">
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.6] text-gray-warm">{hint}</p>
    </div>
  );
}

export default function ClaimCheck() {
  const [lives, setLives] = useState(1100);
  const [spend, setSpend] = useState(9_000_000);
  const [claim, setClaim] = useState(2941);
  const [engagement, setEngagement] = useState(3.4);

  const m = useMemo(() => {
    const headline = claim * lives;
    const headlineShare = spend > 0 ? (headline / spend) * 100 : 0;
    const users = Math.round(lives * (engagement / 100));
    const adjusted = claim * users;
    const adjustedShare = spend > 0 ? (adjusted / spend) * 100 : 0;
    const factor = adjusted > 0 ? headline / adjusted : 0;
    return { headline, headlineShare, users, adjusted, adjustedShare, factor };
  }, [lives, spend, claim, engagement]);

  /*
    Framing rule from the brand file: the weak end reads as opportunity, never
    failure, and never as an accusation. A claim above a quarter of total plan
    spend is arithmetically impossible for any single condition category — but
    the honest reading is a denominator mismatch, not dishonesty.
  */
  const verdict =
    m.headlineShare >= 25
      ? {
          tone: "text-caution-dark",
          dot: "bg-caution",
          word: "Impossible as stated",
          text: "No single programme removes a quarter of everything a plan pays in a year. This is almost never a false claim — it is a different denominator. Ask what the per-member figure is per member of.",
        }
      : m.headlineShare >= 10
      ? {
          tone: "text-caution-dark",
          dot: "bg-caution",
          word: "Needs a denominator",
          text: "Large enough that it should be checked before it reaches a board paper. Ask whether the figure is per covered member or per member who actually engaged.",
        }
      : {
          tone: "text-pos-dark",
          dot: "bg-pos",
          word: "Within the plausible range",
          text: "The headline survives the arithmetic. That does not make it true — it means the next question is the study design rather than the maths.",
        };

  return (
    <div className="border border-border bg-base">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-base-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-warm">
          Your numbers · nothing is sent anywhere
        </span>
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-7">
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Field
            label="Covered lives"
            hint="Employees plus dependents on the plan."
            value={lives}
            onChange={setLives}
            step={10}
          />
          <Field
            label="Annual plan spend"
            hint="What the plan pays out in a year, before this programme."
            prefix="$"
            value={spend}
            onChange={setSpend}
            step={100000}
          />
          <Field
            label="Their claimed saving"
            hint="The headline figure, per member per year. A PMPM number × 12."
            prefix="$"
            suffix="per member / yr"
            value={claim}
            onChange={setClaim}
            step={50}
          />
          <Field
            label="Share who actually use it"
            hint="Engagement. Vendors publish this reluctantly; some disclose it in SEC filings."
            suffix="%"
            value={engagement}
            onChange={setEngagement}
            step={0.1}
            max={100}
          />
        </div>

        {/* ── the two readings ── */}
        <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
          <div className="bg-base p-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-caution mb-3">
              As the deck reads it
            </div>
            <div className="font-serif font-light text-4xl leading-none tabular-nums text-caution-dark">
              {money(m.headline)}
            </div>
            <div className="mt-3 font-mono text-[11px] tabular-nums text-gray-warm">
              {m.headlineShare.toFixed(1)}% of everything your plan pays
            </div>
            <p className="mt-4 text-[13px] leading-[1.65] text-gray-warm">
              Their figure multiplied by every covered life — which is how a
              buyer reads it, and how it lands in a board paper.
            </p>
          </div>

          <div className="bg-base p-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-blue mb-3">
              On the people who actually use it
            </div>
            <div className="font-serif font-light text-4xl leading-none tabular-nums text-blue">
              {money(m.adjusted)}
            </div>
            <div className="mt-3 font-mono text-[11px] tabular-nums text-gray-warm">
              {m.adjustedShare.toFixed(1)}% of plan spend ·{" "}
              {m.users.toLocaleString("en-US")} people
            </div>
            <p className="mt-4 text-[13px] leading-[1.65] text-gray-warm">
              The same claim on the denominator it was measured against. Often a
              real number, and worth buying at the right price.
            </p>
          </div>
        </div>

        {m.factor > 1.05 && (
          <div className="mt-6 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            <span className="text-navy text-[15px] tabular-nums">
              {m.factor.toFixed(1)}×
            </span>
            <span>between the two readings of one sentence</span>
          </div>
        )}

        {/* status = dot + word, never colour alone */}
        <div className="mt-7 border-t border-border pt-5">
          <div className="flex items-center gap-2.5 mb-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${verdict.dot}`} />
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.14em] ${verdict.tone}`}
            >
              {verdict.word}
            </span>
          </div>
          <p className="text-[14.5px] leading-[1.7] text-gray-warm max-w-measure">
            {verdict.text}
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-4 border-t border-border">
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool leading-[1.7]">
          Every figure above comes from what you typed. This page holds no
          benchmark data and sends nothing anywhere — it is four numbers and a
          division.
        </p>
      </div>
    </div>
  );
}

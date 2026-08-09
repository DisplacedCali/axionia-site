/**
 * The override surface for a company-specific deck.
 *
 * ── Why this is deliberately small ──
 *
 * The tempting version lets an agent rewrite any line on any slide. It is also
 * unreviewable: twenty slides of subtly-adjusted prose is not something anyone
 * checks properly at 11pm before a meeting, and "reviewed" then means "skimmed".
 *
 * So the surface is three things — the cover headline, the cover sub, and one
 * clearly attributed slide that is *about them*. A whole version can be read in
 * under a minute, which is the only review that actually happens. Everything
 * else in the deck stays the argument Tom already decided on.
 *
 * The second reason is attribution. When generated claims live on one slide,
 * a reader can see which parts are about their company and which are Axionia's
 * standing position. Sprinkling them through the deck blurs that line, and the
 * blur is exactly what makes a wrong fact expensive.
 */

export type DeckContextPoint = {
  /** short label, e.g. "Point solutions in place" */
  k: string;
  /** one sentence. No numbers the report didn't establish. */
  v: string;
};

export type DeckCustom = {
  cover?: {
    headline?: string;
    sub?: string;
  };
  /** The one slide that is about this company. Omitted → slide not inserted. */
  context?: {
    eyebrow?: string;
    title?: string;
    lede?: string;
    points?: DeckContextPoint[];
  };
};

/** Empty is the default deck. */
export const NO_CUSTOM: DeckCustom = {};

/**
 * Layer edits over generated output.
 *
 * Same shape as reports.content / reports.edits (migration 010): the generated
 * object is never mutated, so "what did the agent actually say" stays
 * answerable after it has been corrected.
 *
 * Shallow per section on purpose. A deep merge would let an edit half-replace
 * a points array and leave a sentence from the model interleaved with one from
 * Tom, which is the least reviewable outcome available.
 */
export function mergeCustom(
  generated: DeckCustom | null | undefined,
  edits: DeckCustom | null | undefined,
): DeckCustom {
  const g = generated ?? {};
  const e = edits ?? {};
  return {
    cover: e.cover ?? g.cover,
    context: e.context ?? g.context,
  };
}

/**
 * Trim anything the agent produced down to the shape above.
 *
 * A model asked for JSON will occasionally return more than it was asked for.
 * Storing that verbatim means an unexpected key eventually reaches a renderer
 * that wasn't written for it, so the boundary is enforced on the way in rather
 * than hoped for.
 */
export function sanitiseCustom(raw: unknown): DeckCustom {
  const out: DeckCustom = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;

  const str = (v: unknown, max: number): string | undefined => {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    return s ? s.slice(0, max) : undefined;
  };

  const cover = r.cover as Record<string, unknown> | undefined;
  if (cover && typeof cover === "object") {
    const headline = str(cover.headline, 160);
    const sub = str(cover.sub, 400);
    if (headline || sub) out.cover = { headline, sub };
  }

  const ctx = r.context as Record<string, unknown> | undefined;
  if (ctx && typeof ctx === "object") {
    const points = Array.isArray(ctx.points)
      ? (ctx.points as unknown[])
          .map((p) => {
            const o = p as Record<string, unknown>;
            const k = str(o?.k, 60);
            const v = str(o?.v, 320);
            return k && v ? { k, v } : null;
          })
          .filter(Boolean)
          .slice(0, 5) as DeckContextPoint[]
      : undefined;

    const eyebrow = str(ctx.eyebrow, 60);
    const title = str(ctx.title, 160);
    const lede = str(ctx.lede, 500);

    if (eyebrow || title || lede || points?.length) {
      out.context = { eyebrow, title, lede, points };
    }
  }

  return out;
}

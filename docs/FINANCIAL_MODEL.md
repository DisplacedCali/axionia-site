# Financial model — headline figures

Generated from `docs/model/axionia_3statement_model.xlsx`. **The workbook wins.**
If anything here disagrees with it, this file is stale and should be regenerated —
do not edit the workbook to match this page.

The distribution copy lives in the admin at `/admin/decks`, one timestamped upload
per revision, which is the answer to "which version did that investor see". The copy
in `docs/model/` exists so a session can read the numbers without Supabase access.

Scope is deliberately headline-only, so it goes stale slowly. Anything deeper — the
bottom-up revenue build, the staffing plan, the exit returns — open the workbook.

---

## The gate

One falsifiable milestone decides the funding path: **has a third party — a health
plan, a PE diligence team, a reinsurer — paid for the benchmark data by the end of
Year 3.** Not expressed interest, not a pilot. A signed, invoiced contract.

Years 1–3 are identical in all three scenarios and funded entirely by the seed.
Divergence starts in Year 4.

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Revenue | $349K | $1.34M | $3.18M |
| EBIT | −$131K | $58K | $834K |

EBIT turns positive in Year 2 in every scenario, which is what makes the Series A a
choice rather than a requirement.

## Year 7 by scenario

| | Revenue | EBIT | Net income | Founder | Seed |
|---|---|---|---|---|---|
| **Bear** | $11.8M | $6.17M | $4.83M | 72.9% | 14.3% |
| **Base** | $60.6M | $33.4M | $25.7M | 57.1% | 11.2% |
| **Bull** | $91.3M | $49.0M | $38.2M | 42.8% | 8.4% |

Bear takes no further capital at all. Base is the underwritten case — it assumes no
channel or data revenue until the gate clears. Bull's Series B is illustrative of a
shape, most likely acquisition-shaped, and is not what the round is priced off.

Founder and seed percentages are fully diluted, after the 10% employee pool and the
5% partner grant. Both are carved pre-money, so they dilute the founder rather than
the incoming investor.

## The rounds

| Round | Timing | Raise | Pre | Post | New investor |
|---|---|---|---|---|---|
| Seed — all scenarios | Year 1 | $1.00M | $6.00M | $7.00M | 14.3% |
| Series A — Base and Bull | Year 4 | $8.00M | $29.0M | $37.0M | 21.6% |
| Series B — Bull only, illustrative | Year 5 | $30.0M | $90.0M | $120.0M | 25.0% |

The Series A was cut from $15M to $8M deliberately. At $15M the capital sat
permanently undrawn, because the business self-funds from Year 2; the smaller round,
actually deployed, produces higher Year 7 revenue *and* less dilution.

## Rule

Any figure stated in a deck, a page or a document should trace to this file or to the
workbook behind it. On 2026-08-14 the investor deck disagreed with the model in four
separate places — twice in the same content, once in the HTML original and again
after the port to React — because nothing tied them together and no reviewer could
see the numbers.

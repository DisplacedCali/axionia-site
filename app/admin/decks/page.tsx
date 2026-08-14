import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { linksEnabled } from "@/lib/deckLinks";
import { Section } from "@/components/ui";
import ShareLinkForm from "@/components/admin/ShareLinkForm";
import FinancialModel from "@/components/admin/FinancialModel";
import DeckAnalytics from "@/components/admin/DeckAnalytics";
import { analyzeDeckEvents, type DeckEventRow } from "@/lib/deckAnalytics";
import { listModelVersions, type ModelVersion } from "./model-actions";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

/*
  Two selects, because the depth columns only exist once 036 has run and
  PostgREST answers an unknown column with an error rather than a null. The
  fallback is the invariant from /admin/companies applied here: a discarded
  query error renders as an empty state, and an empty deck log looks like
  every open we ever recorded was lost.
*/
const BASE_COLS =
  "id, deck, event, created_at, contact_name, contact_email, contact_org, " +
  "link_label, user_id, referrer, user_agent";
const DEPTH_COLS = `${BASE_COLS}, session_id, max_slide, total_slides`;
const FULL_COLS = `${DEPTH_COLS}, company_id, firm_id, attribution, org_name`;

function when(ts: string) {
  const h = (Date.now() - new Date(ts).getTime()) / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  if (h < 24 * 14) return `${Math.round(h / 24)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Decks: present them, share the gated one, and see who has opened either.
 *
 * The log is the reason this page exists rather than two bookmarks. /deck is a
 * public URL, so the only thing that ever tells you a deck travelled is what
 * we record when it's opened.
 */
export default async function AdminDecks() {
  await requireStaff();
  const admin = createAdminClient();

  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();

  const read = (cols: string) =>
    admin
      .from("deck_events")
      .select(cols)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

  /*
    Widest select first, narrowing on error. Two migrations can each be absent
    independently — 036 added depth, 037 added attribution — so this walks down
    rather than branching on a version number nothing records.
  */
  let events = await read(FULL_COLS);
  if (events.error) events = await read(DEPTH_COLS);
  if (events.error) events = await read(BASE_COLS);

  const all = (events.data ?? []) as unknown as DeckEventRow[];
  const analytics = analyzeDeckEvents(all, { days: WINDOW_DAYS });

  /*
    Names for the rollup, resolved here rather than denormalised onto the
    event. A company that gets renamed should be renamed everywhere it appears
    — the point-in-time snapshot on the row is the ATTRIBUTION, which must not
    move, not the label, which should.
  */
  const orgNames: Record<string, string> = {};
  const companyIds = analytics.orgs.filter((o) => o.kind === "company" && o.id).map((o) => o.id!);
  const firmIds = analytics.orgs.filter((o) => o.kind === "firm" && o.id).map((o) => o.id!);

  const [companyRows, firmRows] = await Promise.all([
    companyIds.length
      ? admin.from("companies").select("id, name, domain").in("id", companyIds)
      : Promise.resolve({ data: [] as any[] }),
    firmIds.length
      ? admin.from("firms").select("id, name").in("id", firmIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  for (const c of companyRows.data ?? []) {
    orgNames[`company:${c.id}`] = c.name || c.domain || "Unknown company";
  }
  for (const f of firmRows.data ?? []) {
    orgNames[`firm:${f.id}`] = f.name || "Unnamed firm";
  }

  /*
    The feed is access only.

    A progress row revises what a view already recorded — it is not somebody
    arriving — and once depth is logging they outnumber real events. Left in,
    the answer to "has anything happened" would be forty rows of the same
    person still reading.
  */
  const rows = all.filter((r) => r.event !== "progress").slice(0, 60);

  /*
    A missing storage bucket must not take the decks page down with it.

    listModelVersions throws on a read error rather than returning [], because
    an empty folder and a failed read look identical downstream and empty looks
    like the model was deleted. That's the right behaviour for the function and
    the wrong behaviour for this page, which exists to show deck activity — so
    the error is caught here and rendered as a message beside the section it
    belongs to. Same principle as /admin/companies: read the error, say which
    thing is missing, don't let a subsystem's absence read as data loss.
  */
  let versions: ModelVersion[] = [];
  let modelError: string | null = null;
  try {
    versions = await listModelVersions();
  } catch (e) {
    modelError = e instanceof Error ? e.message : "Could not read the model folder.";
  }

  return (
    <Section className="pt-12 pb-24">
      <div className="mb-10">
        <h1 className="font-serif font-light text-4xl">Decks</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
          {analytics.people.length}{" "}
          {analytics.people.length === 1 ? "person" : "people"} ·{" "}
          {analytics.totalOpens - analytics.staffOpens} opens · last{" "}
          {WINDOW_DAYS} days
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-14">
        <div className="border border-border p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-3">
            Buyer deck
          </div>
          <h2 className="font-serif text-2xl leading-snug mb-2">
            Eight slides, public link
          </h2>
          <p className="text-[14px] leading-[1.7] text-gray-warm mb-5">
            Open to anyone with the URL, but noindex and absent from nav, footer
            and sitemap. Anonymous visitors give a name and email before the PDF.
          </p>
          <Link
            href="/deck"
            className="inline-block px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
          >
            Present →
          </Link>
        </div>

        <div className="border border-navy p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-3">
            Founders deck · $250K
          </div>
          <h2 className="font-serif text-2xl leading-snug mb-2">
            Seven slides, gated
          </h2>
          <p className="text-[14px] leading-[1.7] text-gray-warm mb-5">
            Reachable only from a staff session or a signed per-recipient link.
            Anything else 404s rather than redirecting to a login, so the URL
            never confirms it exists.
          </p>
          <Link
            href="/deck/founders"
            className="inline-block px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
          >
            Present →
          </Link>
        </div>

        {/*
          Two offers, one company. The founders deck sells ten seats at $250K as
          prepaid service and explicitly not a raise; this one sells equity at a
          priced round. Only one of them is going to happen, and until that's
          decided both exist — so the cards say what each is rather than leaving
          the difference to memory at the moment a link is being minted.
        */}
        <div className="border border-navy p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue mb-3">
            Investor deck · $1.0M
          </div>
          <h2 className="font-serif text-2xl leading-snug mb-2">
            Thirteen slides, gated
          </h2>
          <p className="text-[14px] leading-[1.7] text-gray-warm mb-5">
            Priced round at $6.0M pre. Same gate as founders, but a separate
            signing key — revoking a leaked investor link leaves the founding
            members&rsquo; links working, and neither opens the other&rsquo;s deck.
          </p>
          <Link
            href="/deck/investor"
            className="inline-block px-5 py-2.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
          >
            Present →
          </Link>
        </div>
      </div>

      {/*
        Buyer sits apart from the other two, and the copy has to carry why.
        A founders or investor link IS the access — no link, no page. A buyer
        link grants nothing: /deck is public either way, and all the link does
        is put a name on the view. Presented as three identical forms, the next
        person to use this page would reasonably assume /deck had been closed.
      */}
      <div className="mb-14">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
          Share a buyer link
        </h2>
        <div className="border border-border p-7">
          <p className="text-[14px] leading-[1.7] text-gray-warm mb-5 max-w-measure">
            <strong className="font-medium text-navy">
              This labels a view. It doesn&rsquo;t gate one.
            </strong>{" "}
            /deck stays public and the plain URL keeps working — a link just
            attaches a name, so an open shows up below as that person instead of
            as &ldquo;Anonymous&rdquo;. Signed, so the name can&rsquo;t be
            changed by editing the URL, and worth using because the download gate
            only learns who someone is once they&rsquo;ve already decided they
            want the PDF.
          </p>
          <ShareLinkForm enabled={linksEnabled("buyer")} deck="buyer" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-14">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Share a founders link
          </h2>
          <div className="border border-border p-7">
            <ShareLinkForm enabled={linksEnabled("founders")} deck="founders" />
          </div>
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Share an investor link
          </h2>
          <div className="border border-border p-7">
            <ShareLinkForm enabled={linksEnabled("investor")} deck="investor" />
          </div>
        </div>
      </div>

      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
        Financial model
      </h2>
      <div className="border border-border p-7 mb-14">
        {modelError ? (
          <div className="border-l-2 border-caution bg-amber-light px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
              Model folder unreadable
            </p>
            <p className="mt-1.5 text-[14px] leading-[1.7] text-gray-warm">
              {modelError}
              <br />
              The <code className="font-mono text-[13px]">reports</code> bucket
              is the same one report artifacts use, so if that&rsquo;s working
              this is a permissions problem rather than a missing bucket.
            </p>
          </div>
        ) : (
          <FinancialModel versions={versions} />
        )}
      </div>

      <DeckAnalytics data={analytics} days={WINDOW_DAYS} orgNames={orgNames} />

      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
        Recent activity
      </h2>
      <div className="border border-border">
        <div className="hidden md:grid grid-cols-[0.7fr_0.6fr_1.6fr_0.7fr] gap-4 px-5 py-3 bg-base-2 border-b border-border font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
          <span>Deck</span>
          <span>Event</span>
          <span>Who</span>
          <span className="text-right">When</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-gray-cool">
            Nothing logged in the last {WINDOW_DAYS} days. Views and downloads
            appear here as soon as migrations 012 and 013 are applied.
          </p>
        ) : (
          rows.map((r) => {
            const who = r.user_id
              ? "Staff"
              : r.link_label
              ? r.link_label
              : r.contact_name
              ? `${r.contact_name}${r.contact_org ? ` · ${r.contact_org}` : ""}`
              : "Anonymous";
            return (
              <div
                key={r.id}
                className="grid md:grid-cols-[0.7fr_0.6fr_1.6fr_0.7fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-border last:border-b-0"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-warm self-center">
                  {r.deck}
                </span>
                <span className="self-center">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-1 border ${
                      r.event === "print"
                        ? "border-navy bg-navy text-base"
                        : r.event === "request"
                        ? "border-caution text-caution-dark bg-amber-light"
                        : "border-border text-gray-warm"
                    }`}
                  >
                    {r.event}
                  </span>
                </span>
                <span className="self-center text-[14px] text-navy truncate">
                  {who}
                  {r.contact_email && (
                    <span className="block text-[12px] text-gray-cool truncate">
                      {r.contact_email}
                    </span>
                  )}
                </span>
                <span className="self-center md:text-right font-mono text-[11px] text-gray-cool">
                  {when(r.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-5 text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        No IP addresses are recorded, and <code className="font-mono">/privacy</code>{" "}
        now commits to that publicly — adding one is a policy change rather than
        a migration. Depth and the grouping of events into people come from the
        same first-party session cookie the rest of the site already sets, so
        clearing cookies genuinely resets it. <strong className="font-medium text-gray-warm">
        Request</strong> means somebody asked for the emailed link;{" "}
        <strong className="font-medium text-gray-warm">print</strong> means the
        file actually left. Before migration 036 both were logged as a print,
        which double-counted every completed download.
      </p>
    </Section>
  );
}

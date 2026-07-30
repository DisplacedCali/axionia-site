import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Site analytics.
 *
 * Deliberately not a Google Analytics clone. What a general-purpose tool gives
 * you — sessions, bounce, time on page — is available from Vercel Web Analytics
 * for one line of config and is not worth rebuilding.
 *
 * What no third party can give you is the join: which COMPANY read which page,
 * and what they did next. That's the whole reason this is first-party, and it's
 * what the bottom two panels are for.
 *
 * Everything is computed in-process from a bounded window rather than in SQL
 * views. At this volume that's simpler to read and change; when the table gets
 * big enough for it to matter, the fix is a materialised daily rollup, not a
 * cleverer query here.
 */

const WINDOW_DAYS = 30;
const BUCKETS = 14;

type Row = {
  session_id: string;
  event: string;
  path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  country: string | null;
  city: string | null;
  user_id: string | null;
  company_id: string | null;
  created_at: string;
};

function tally<T extends string | null>(
  rows: Row[],
  pick: (r: Row) => T,
  limit = 8
) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = pick(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

/** Bare host, so "https://google.com/search?q=…" collapses to "google.com". */
function host(url: string | null) {
  if (!url) return null;
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h.endsWith("axionia.com") ? null : h;
  } catch {
    return null;
  }
}

function Bars({ data, empty }: { data: [string, number][]; empty: string }) {
  if (data.length === 0) {
    return <p className="text-[13px] text-gray-cool py-2">{empty}</p>;
  }
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div className="space-y-2">
      {data.map(([label, n]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="flex-1 min-w-0 text-[13px] text-gray-warm truncate">
            {label}
          </span>
          <span className="w-24 h-1.5 bg-base-2 shrink-0">
            <span
              className="block h-full bg-axionia-gradient"
              style={{ width: `${Math.max(4, (n / max) * 100)}%` }}
            />
          </span>
          <span className="w-10 text-right font-mono text-[11px] text-navy tabular-nums shrink-0">
            {n}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({ n, label, sub }: { n: string | number; label: string; sub?: string }) {
  return (
    <div className="border-t border-border pt-3">
      <div className="font-serif font-light text-4xl leading-none tabular-nums">{n}</div>
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-warm">
        {label}
      </div>
      {sub && <div className="mt-1 text-[11px] text-gray-cool">{sub}</div>}
    </div>
  );
}

export default async function Analytics() {
  await requireStaff();
  const admin = createAdminClient();

  const since = new Date(Date.now() - WINDOW_DAYS * 864e5).toISOString();

  const { data, error } = await admin
    .from("site_events")
    .select(
      "session_id, event, path, referrer, utm_source, utm_campaign, country, city, user_id, company_id, created_at"
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);

  // The table doesn't exist until 014 runs, and a red screen is a worse
  // explanation than a sentence.
  if (error) {
    return (
      <Section className="pt-12 pb-24">
        <h1 className="font-serif font-light text-4xl">Analytics</h1>
        <div className="mt-8 border-l-2 border-caution bg-amber-light px-5 py-4 max-w-measure">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-caution">
            Not collecting yet
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.7] text-gray-warm">
            Run <code className="font-mono text-[13px]">014_analytics_and_crm.sql</code>{" "}
            in the Supabase SQL editor. Page views are being sent already — they&rsquo;re
            being dropped silently until the table exists.
          </p>
        </div>
      </Section>
    );
  }

  const rows = (data ?? []) as Row[];
  const views = rows.filter((r) => r.event === "view");

  const sessions = new Set(views.map((r) => r.session_id));
  const known = new Set(
    rows.filter((r) => r.company_id).map((r) => r.session_id)
  );
  const requests = rows.filter((r) => r.event === "scorer_request").length;
  const contacts = rows.filter((r) => r.event === "contact_submit").length;

  // Daily buckets, oldest first.
  const day = 864e5;
  const start = Date.now() - BUCKETS * day;
  const buckets = Array.from({ length: BUCKETS }, (_, i) => ({
    label: new Date(start + i * day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    sessions: new Set<string>(),
  }));
  for (const v of views) {
    const i = Math.floor((new Date(v.created_at).getTime() - start) / day);
    if (i >= 0 && i < BUCKETS) buckets[i].sessions.add(v.session_id);
  }
  const daily = buckets.map((b) => ({ label: b.label, n: b.sessions.size }));
  const dailyMax = Math.max(1, ...daily.map((d) => d.n));

  // Companies seen, most recent first.
  const byCompany = new Map<string, { views: number; last: string }>();
  for (const r of rows) {
    if (!r.company_id) continue;
    const cur = byCompany.get(r.company_id);
    if (!cur) byCompany.set(r.company_id, { views: 1, last: r.created_at });
    else cur.views += 1;
  }
  const companyIds = [...byCompany.keys()];
  const { data: companies } = companyIds.length
    ? await admin.from("companies").select("id, name, domain, stage").in("id", companyIds)
    : { data: [] };
  const companyById = new Map((companies ?? []).map((c) => [c.id, c]));

  const identified = [...byCompany.entries()]
    .map(([id, v]) => ({ id, ...v, company: companyById.get(id) }))
    .sort((a, b) => +new Date(b.last) - +new Date(a.last))
    .slice(0, 12);

  const conversion = sessions.size
    ? ((requests / sessions.size) * 100).toFixed(1)
    : "0.0";

  return (
    <Section className="pt-12 pb-24">
      <div className="mb-10">
        <h1 className="font-serif font-light text-4xl">Analytics</h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
          Last {WINDOW_DAYS} days · first-party · no IP addresses stored
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
        <Stat n={sessions.size} label="Unique visitors" sub={`${views.length} views`} />
        <Stat
          n={known.size}
          label="Resolved to a company"
          sub={sessions.size ? `${Math.round((known.size / sessions.size) * 100)}% of visitors` : undefined}
        />
        <Stat n={requests} label="Report requests" sub={`${conversion}% of visitors`} />
        <Stat n={contacts} label="Contact submissions" />
      </div>

      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
        Visitors per day
      </h2>
      <div className="border border-border p-6 mb-14">
        <div className="flex items-end gap-1.5 h-32">
          {daily.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col justify-end h-full group">
              <span className="text-center font-mono text-[9px] text-gray-cool mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.n}
              </span>
              <span
                className="w-full bg-axionia-gradient"
                style={{ height: `${Math.max(2, (d.n / dailyMax) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 font-mono text-[9px] text-gray-cool">
          <span>{daily[0]?.label}</span>
          <span>{daily[daily.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-14 gap-y-10 mb-14">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Top pages
          </h2>
          <Bars data={tally(views, (r) => r.path)} empty="No views yet." />
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Referrers
          </h2>
          <Bars
            data={tally(views, (r) => host(r.referrer))}
            empty="All direct so far."
          />
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Location
          </h2>
          <Bars
            data={tally(views, (r) =>
              r.city && r.country ? `${r.city}, ${r.country}` : r.country
            )}
            empty="Geography resolves at the Vercel edge — nothing in local dev."
          />
        </div>
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
            Campaigns
          </h2>
          <Bars
            data={tally(views, (r) =>
              r.utm_campaign ? `${r.utm_source ?? "?"} · ${r.utm_campaign}` : null
            )}
            empty="No tagged campaigns. Add ?utm_source=…&utm_campaign=… to a link."
          />
        </div>
      </div>

      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-4">
        Companies on the site
      </h2>
      <div className="border border-border mb-4">
        {identified.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-gray-cool">
            Nobody has resolved to a company yet. A session becomes identified when
            someone requests a report or submits the contact form from a corporate
            domain — and everything they read beforehand is attributed retroactively.
          </p>
        ) : (
          identified.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="grid md:grid-cols-[2fr_1fr_0.7fr_0.7fr] gap-2 md:gap-4 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-base-2 transition-colors"
            >
              <span className="text-[14px] text-navy self-center truncate">
                {c.company?.name || c.company?.domain || "Unknown company"}
              </span>
              <span className="font-mono text-[12px] text-gray-warm self-center truncate">
                {c.company?.domain}
              </span>
              <span className="self-center font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
                {c.company?.stage ?? "—"}
              </span>
              <span className="self-center md:text-right font-mono text-[11px] text-navy tabular-nums">
                {c.views} views
              </span>
            </Link>
          ))
        )}
      </div>

      <p className="text-[12px] leading-[1.6] text-gray-cool max-w-measure">
        Location is resolved at Vercel&rsquo;s edge and stored as country and city
        only — the address it was derived from is never written down. Identity
        comes from a first-party session cookie stitched to a real person when
        they submit a form, not from matching addresses. Clearing cookies resets
        it, which is the honest behaviour.
      </p>
    </Section>
  );
}

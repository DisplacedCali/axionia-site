import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What is waiting on a person, counted in one place.
 *
 * Exists because three separate things could be waiting and none of them
 * announced itself. Contact-form and founders-deck submissions wrote a `leads`
 * row and no screen displayed it; report requests sent an admin email that
 * silently no-ops while RESEND_API_KEY is unset. A real inquiry could sit for
 * weeks with nothing anywhere going wrong loudly enough to notice.
 *
 * Deliberately NOT realtime. A count that is correct on every admin page load
 * covers the actual need — one person checking a few times a day — and a
 * websocket subscription is a whole failure surface to maintain for the
 * privilege of learning something eleven seconds sooner.
 *
 * SERVER ONLY. Uses the service role.
 */

export interface InboxCounts {
  leads: number;
  newRequests: number;
  unassigned: number;
  total: number;
}

const EMPTY: InboxCounts = { leads: 0, newRequests: 0, unassigned: 0, total: 0 };

export async function inboxCounts(): Promise<InboxCounts> {
  try {
    const admin = createAdminClient();

    const [leads, requests] = await Promise.all([
      admin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .is("handled_at", null)
        // Ignored is a decision, not an omission — it must not keep the badge
        // lit, or the badge stops meaning "something needs you".
        .is("ignored_at", null),
      admin
        .from("report_requests")
        .select("id, status, assigned_to")
        .in("status", ["new", "in_review", "ready"]),
    ]);

    const rows = requests.data ?? [];
    const counts: InboxCounts = {
      leads: leads.count ?? 0,
      newRequests: rows.filter((r) => r.status === "new").length,
      unassigned: rows.filter((r) => !r.assigned_to).length,
      total: 0,
    };

    // Requests are counted once. A new AND unassigned request is one thing to
    // do, and a badge that double-counts trains you to distrust the badge.
    counts.total =
      counts.leads + rows.filter((r) => r.status === "new" || !r.assigned_to).length;

    return counts;
  } catch {
    // A dashboard that 500s because the badge query failed is worse than a
    // dashboard with no badge.
    return EMPTY;
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import { assessLead } from "@/lib/leadAuthenticity";

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

    /*
      The rows, not a count.

      This was `head: true` with an exact count, which is cheaper and was
      counting spam. A badge that says four when three of them are bulk
      submissions trains you to ignore the badge, and then it stops working for
      the one that mattered — so the rows come back and get the same
      authenticity judgement the inbox itself applies. Same rule in both
      places, or the badge and the list disagree about what is waiting.
    */
    const [leads, requests, deckRows] = await Promise.all([
      admin
        .from("leads")
        .select("email, full_name, company_name, message")
        .is("handled_at", null)
        // Ignored is a decision, not an omission — it must not keep the badge
        // lit, or the badge stops meaning "something needs you".
        .is("ignored_at", null)
        .limit(500),
      admin
        .from("report_requests")
        .select("id, status, assigned_to")
        .in("status", ["new", "in_review", "ready"]),
      admin
        .from("deck_events")
        .select("contact_email")
        .eq("event", "view")
        .not("contact_email", "is", null),
    ]);

    const opened = new Set(
      (deckRows.data ?? [])
        .map((r) => (r.contact_email as string | null)?.toLowerCase())
        .filter(Boolean) as string[],
    );

    const messageCounts = new Map<string, number>();
    for (const l of leads.data ?? []) {
      const m = (l.message as string | null)?.trim().toLowerCase();
      if (m) messageCounts.set(m, (messageCounts.get(m) ?? 0) + 1);
    }

    const realLeads = (leads.data ?? []).filter(
      (l) =>
        !assessLead({
          email: l.email as string,
          fullName: (l.full_name as string) ?? null,
          companyName: (l.company_name as string) ?? null,
          message: (l.message as string) ?? null,
          duplicateMessages:
            messageCounts.get((l.message as string | null)?.trim().toLowerCase() ?? "") ?? 0,
          deckOpens: opened.has((l.email as string).toLowerCase()) ? 1 : 0,
        }).fake,
    ).length;

    const rows = requests.data ?? [];
    const counts: InboxCounts = {
      leads: realLeads,
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

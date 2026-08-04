"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client report view and print logging.
 *
 * Mirrors app/deck/actions.ts, and for the same reason: the two rules that
 * make a self-reported log worth reading at all.
 *
 * 1. Identity is resolved SERVER-SIDE from the session. The caller passes a
 *    report id and nothing else — no user id, no company. A caller who can
 *    name themselves in the payload can name someone else.
 *
 * 2. The write is re-checked against RLS before it lands. `createClient()` is
 *    the anon client carrying the user's session, so selecting the report
 *    through it proves this user is actually allowed to see this report. Only
 *    then does the service role write the row. Without that step, anyone
 *    signed in could enumerate report ids and mint log entries against
 *    reports they can't read.
 *
 * No IP is recorded — see migration 015.
 */
export async function logReportEvent(reportId: string, event: "view" | "print") {
  if (!reportId) return;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // RLS gate. Returns nothing unless the report is released AND belongs to
    // this user or their company.
    const { data: report } = await supabase
      .from("reports")
      .select("id, company_id")
      .eq("id", reportId)
      .maybeSingle();
    if (!report) return;

    const h = headers();

    await createAdminClient()
      .from("report_events")
      .insert({
        report_id: report.id,
        event,
        user_id: user.id,
        company_id: report.company_id ?? null,
        referrer: h.get("referer")?.slice(0, 500) ?? null,
        user_agent: h.get("user-agent")?.slice(0, 400) ?? null,
      });
  } catch {
    // Swallowed on purpose. A logging failure must never stop a client
    // reading a report they paid attention to get.
  }
}

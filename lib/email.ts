import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Transactional email via Resend.
 *
 * Sends FROM your axionia.com domain (verified in Resend via Cloudflare DNS)
 * with Reply-To pointed at your Google Workspace inbox — so replies land in
 * Gmail as normal and recipients see ordinary mail from you. Workspace stays
 * the human mailbox; Resend handles automated sends, which gives delivery
 * logs and bounce visibility that SMTP-through-Gmail doesn't.
 *
 * Uses fetch rather than the SDK so there's no extra dependency.
 * If RESEND_API_KEY is absent (e.g. local dev), sends are skipped and logged
 * rather than throwing — the workflow still works, mail just doesn't go out.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const FROM = process.env.EMAIL_FROM || "Axionia <reports@axionia.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "tom@axionia.com";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  template: string;
  requestId?: string | null;
};

export async function sendEmail({
  to,
  subject,
  html,
  template,
  requestId = null,
}: SendArgs): Promise<{ ok: boolean; skipped?: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;

  let result: { ok: boolean; skipped?: boolean; id?: string; error?: string };

  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${template}" to ${to}`);
    result = { ok: false, skipped: true, error: "RESEND_API_KEY not configured" };
  } else {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [to],
          reply_to: REPLY_TO,
          subject,
          html,
        }),
      });

      const body = await res.json().catch(() => ({}));
      result = res.ok
        ? { ok: true, id: body?.id }
        : { ok: false, error: body?.message || `HTTP ${res.status}` };
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Log every attempt so a silent failure is visible in the admin view.
  try {
    const admin = createAdminClient();
    await admin.from("email_log").insert({
      to_email: to,
      template,
      subject,
      status: result.ok ? "sent" : result.skipped ? "skipped" : "failed",
      provider_id: result.id ?? null,
      error: result.error ?? null,
      request_id: requestId,
    });
  } catch (err) {
    console.error("[email] failed to write email_log:", err);
  }

  return result;
}

/* ─────────────────────── templates ─────────────────────── */

const shell = (body: string) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8F6F1;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E6E2D9;padding:40px;">
    <div style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#1C2431;font-weight:500;">
      AXIONIA
    </div>
    <div style="height:3px;width:56px;background:linear-gradient(135deg,#4AC9DC 0%,#2463EB 70%,#3CBF6C 130%);margin:14px 0 28px;"></div>
    ${body}
    <div style="margin-top:36px;padding-top:20px;border-top:1px solid #E6E2D9;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:0.1em;color:#AEB4BC;text-transform:uppercase;">
      Axionia — A CareVisory LLC company
    </div>
  </div>
</div>`;

const p = (text: string) =>
  `<p style="font-size:15px;line-height:1.7;color:#706C63;margin:0 0 16px;">${text}</p>`;

const h = (text: string) =>
  `<h1 style="font-family:Georgia,serif;font-weight:300;font-size:26px;line-height:1.3;color:#1C2431;margin:0 0 20px;">${text}</h1>`;

/** Sent to the requester immediately on submit — first pull for their company. */
export function requestReceivedNew(name?: string | null) {
  return {
    subject: "Your Axionia report is in process",
    html: shell(
      h("Your report is in process.") +
        p(`${name ? `${name}, t` : "T"}hanks for the request — we've got it.`) +
        p(
          "Your portfolio analysis is being prepared now. Every report is reviewed by a person before it goes out, so this isn't instant: <strong>you'll have it by email within 24 hours</strong>."
        ) +
        p("No call is required, and nothing else is needed from you in the meantime.")
    ),
  };
}

/** Sent when the company already has a released report on file. */
export function requestReceivedRefresh(companyName?: string | null) {
  const co = companyName ? `<strong>${companyName}</strong>` : "your company";
  return {
    subject: "Your Axionia report is being updated",
    html: shell(
      h("We already have a pull for your company.") +
        p(
          `We've previously run an analysis for ${co}. Rather than start from scratch, we're reviewing and updating that existing work with anything that's changed.`
        ) +
        p("<strong>You'll have the updated report by email within 24 hours.</strong>") +
        p("No call is required, and nothing else is needed from you in the meantime.")
    ),
  };
}

/** Sent to the client when the admin releases the report. */
export function reportReleased(name: string | null | undefined, url: string) {
  return {
    subject: "Your Axionia report is ready",
    html: shell(
      h("Your report is ready.") +
        p(`${name ? `${name}, y` : "Y"}our portfolio analysis has been reviewed and released.`) +
        `<a href="${url}" style="display:inline-block;padding:14px 26px;background:#1C2431;color:#F8F6F1;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;margin:8px 0 20px;">View your report</a>` +
        p(
          "Every figure in it traces back to an assumption you can see and question. If anything looks wrong, reply to this email — that feedback makes the next version better."
        )
    ),
  };
}

/** Sent to you when a new request lands. */
export function adminNewRequest(args: {
  contactName?: string | null;
  contactEmail: string;
  companyName?: string | null;
  kind: "new" | "refresh";
  thirdParty?: boolean;
  url: string;
}) {
  const tag = args.thirdParty
    ? "Third-party?"
    : args.kind === "refresh"
    ? "Refresh"
    : "New";
  return {
    subject: `[Axionia] ${tag} report request — ${
      args.companyName || args.contactEmail
    }`,
    html: shell(
      h(
        args.thirdParty
          ? "Possible third-party research"
          : args.kind === "refresh"
          ? "Refresh request"
          : "New report request"
      ) +
        p(
          `<strong>${args.contactName || "—"}</strong><br/>${args.contactEmail}<br/>${
            args.companyName || "—"
          }`
        ) +
        (args.thirdParty
          ? p(
              "The company named doesn't match the requester's email domain. Classify it as their own employer or route it as a paid research engagement."
            )
          : "") +
        (args.kind === "refresh"
          ? p("This company already has a released report. The prior version is loaded for comparison.")
          : "") +
        `<a href="${args.url}" style="display:inline-block;padding:14px 26px;background:#1C2431;color:#F8F6F1;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;margin:8px 0 0;">Open in admin</a>`
    ),
  };
}

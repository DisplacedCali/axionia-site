/**
 * Supabase auth errors sometimes arrive with an empty or absent message —
 * typically when the auth mailer itself fails (rate limit, bad template,
 * SMTP misconfiguration). Rendering `error.message` directly then shows
 * the user a literal "{}". This turns whatever came back into something
 * actionable.
 */
export function readableAuthError(error: unknown): {
  message: string;
  noAccount: boolean;
} {
  const err = error as {
    message?: string;
    status?: number;
    code?: string;
    name?: string;
  } | null;

  const raw = (err?.message ?? "").trim();
  const code = err?.code ?? "";
  const status = err?.status;

  const noAccount =
    /signups? not allowed/i.test(raw) ||
    /user not found/i.test(raw) ||
    code === "otp_disabled";

  if (noAccount) {
    return {
      message:
        "No account found for that email. Check the address, or create an account first.",
      noAccount: true,
    };
  }

  if (/rate limit|too many/i.test(raw) || code === "over_email_send_rate_limit" || status === 429) {
    return {
      message:
        "Too many codes requested. Supabase's built-in email service is rate-limited — wait a few minutes and try again.",
      noAccount: false,
    };
  }

  if (/token has expired|expired/i.test(raw)) {
    return { message: "That code has expired. Request a new one.", noAccount: false };
  }

  if (/invalid/i.test(raw) && /token|otp|code/i.test(raw)) {
    return { message: "That code doesn't match. Check it and try again.", noAccount: false };
  }

  // Empty or "{}" — the mailer failed and gave us nothing useful.
  if (!raw || raw === "{}" || raw === "[object Object]") {
    const detail = [err?.name, code, status ? `HTTP ${status}` : null]
      .filter(Boolean)
      .join(" · ");
    return {
      message:
        "Couldn't send the code — the email service returned an error. This is usually a send rate limit or an email-template problem. Check Supabase → Logs → Auth Logs." +
        (detail ? ` (${detail})` : ""),
      noAccount: false,
    };
  }

  return { message: raw, noAccount: false };
}

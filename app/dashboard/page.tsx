import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Section, GradientButton } from "@/components/ui";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const REQUEST_COPY: Record<string, { label: string; body: string; tone: string }> = {
  new: {
    label: "In process",
    body: "Your analysis is being prepared. You'll have it by email within 24 hours.",
    tone: "text-blue",
  },
  in_review: {
    label: "In review",
    body: "Your report is written and being reviewed before release.",
    tone: "text-caution",
  },
  ready: {
    label: "Finalizing",
    body: "Review is complete. Release is imminent.",
    tone: "text-teal",
  },
  sent: {
    label: "Delivered",
    body: "Your report has been released — it's below.",
    tone: "text-pos",
  },
  archived: {
    label: "Closed",
    body: "This request has been closed.",
    tone: "text-gray-warm",
  },
};

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role, company_id")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "client";

  // RLS limits these to the user's own requests and their company's
  // released reports.
  const [{ data: requests }, { data: reports }] = await Promise.all([
    supabase
      .from("report_requests")
      .select("id, status, kind, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reports")
      .select("id, title, summary, version, released_at")
      .order("released_at", { ascending: false }),
  ]);

  const openRequest = (requests ?? []).find((r) => r.status !== "archived");

  return (
    <Section className="pt-24 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <h1 className="font-serif font-light text-4xl md:text-5xl">
            Welcome
            {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-[14px] text-gray-warm">
            {user.email}
            {profile?.company_name ? ` · ${profile.company_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {role === "admin" && (
            <Link
              href="/admin"
              className="px-4 py-2 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
            >
              Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* ── open request status ── */}
      {openRequest && (
        <div className="border border-border p-8 mb-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-axionia-gradient" />
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                REQUEST_COPY[openRequest.status]?.tone ?? "text-gray-warm"
              }`}
            >
              {REQUEST_COPY[openRequest.status]?.label ?? openRequest.status}
            </span>
            {openRequest.kind === "refresh" && (
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-gray-cool">
                · update to an existing company report
              </span>
            )}
          </div>
          <p className="text-[15px] leading-[1.7] text-gray-warm">
            {REQUEST_COPY[openRequest.status]?.body ??
              "Your request is being handled."}
          </p>
        </div>
      )}

      {/* ── released reports ── */}
      <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-warm mb-5">
        Your reports
      </h2>

      {(reports ?? []).length === 0 ? (
        <div className="border border-border p-10 max-w-2xl">
          <p className="font-serif text-2xl mb-3">Nothing released yet.</p>
          <p className="text-[15px] leading-[1.7] text-gray-warm mb-7">
            {openRequest
              ? "Your report is in process — we'll email you the moment it's released."
              : "Request your free portfolio analysis and it'll appear here once released."}
          </p>
          {!openRequest && (
            <GradientButton href="/request-report">
              Request your free report
            </GradientButton>
          )}
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {(reports ?? []).map((r) => (
            <div key={r.id} className="border border-border p-7">
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <h3 className="font-serif text-2xl">{r.title || "Axionia Insight"}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool shrink-0">
                  v{r.version}
                  {r.released_at
                    ? ` · ${new Date(r.released_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : ""}
                </span>
              </div>
              {r.summary && (
                <p className="text-[15px] leading-[1.75] text-gray-warm whitespace-pre-line">
                  {r.summary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

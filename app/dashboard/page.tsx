import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, Section } from "@/components/ui";
import LogoutButton from "@/components/LogoutButton";

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "client";

  return (
    <Section className="pt-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <h1 className="font-serif font-light text-4xl">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
          </h1>
        </div>
        <LogoutButton />
      </div>

      <div className="border border-border p-8 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-cool mb-2">
          Signed in as
        </p>
        <p className="text-[15px] mb-1">{user.email}</p>
        {profile?.company_name && (
          <p className="text-[15px] text-gray-warm mb-1">{profile.company_name}</p>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool mt-4">
          Role: {role}
        </p>
      </div>

      <div className="mt-10 max-w-measure text-[15px] leading-[1.7] text-gray-warm">
        {role === "admin" ? (
          <p>
            You&rsquo;re signed in with admin access. The intake, scoring, and report
            tooling for the full application isn&rsquo;t wired into this dashboard yet —
            that&rsquo;s next.
          </p>
        ) : (
          <p>
            You&rsquo;re in. The Portfolio Scorer and full intake experience are launching
            here shortly — we&rsquo;ll email you the moment they&rsquo;re live for your
            account.
          </p>
        )}
      </div>
    </Section>
  );
}

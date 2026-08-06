import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { inboxCounts } from "@/lib/inbox";

const tabs = [
  { href: "/admin", label: "Queue" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/decks", label: "Decks" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff();

  /*
    The count is computed on every admin page load rather than pushed over a
    socket. That's the whole notification system, and it's enough: one person
    checking a few times a day learns about an inquiry the moment they open any
    admin screen, with no connection to keep alive and nothing to fail quietly.

    Email is the second channel, not the first — it was the ONLY channel, and
    it silently no-ops while RESEND_API_KEY is unset, which is how a real
    inquiry sat in the database with nothing anywhere going wrong loudly.
  */
  const counts = await inboxCounts();

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-base-2">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy">
            Admin
          </span>
          <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="hover:text-navy transition-colors flex items-center gap-1.5"
              >
                {t.label}
                {t.href === "/admin/inbox" && counts.total > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-risk text-base font-mono text-[9px] leading-none">
                    {counts.total > 99 ? "99+" : counts.total}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <Link
            href="/admin/new"
            className="ml-auto px-3 py-1.5 border border-navy text-navy font-mono text-[10px] uppercase tracking-[0.12em] hover:bg-navy hover:text-base transition-colors"
          >
            + Start research
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-cool hidden lg:inline">
            {profile?.email}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

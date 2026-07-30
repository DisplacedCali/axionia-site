import Link from "next/link";
import { requireStaff } from "@/lib/auth";

const tabs = [
  { href: "/admin", label: "Queue" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff();

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-base-2">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-navy">
            Admin
          </span>
          <nav className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-warm">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="hover:text-navy transition-colors">
                {t.label}
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

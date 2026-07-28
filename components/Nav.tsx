import Link from "next/link";
import Logo from "./Logo";

const links = [
  { href: "/platform", label: "Platform" },
  { href: "/founding-members", label: "Founding Members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-md supports-[backdrop-filter]:bg-base/70">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size={30} withWordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.14em] text-gray-warm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative group py-1 hover:text-navy transition-colors"
            >
              {l.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-axionia-gradient transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
          <Link href="/login" className="text-gray-warm hover:text-navy transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 border border-navy text-navy hover:bg-navy hover:text-base transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <Logo size={26} withWordmark />
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-cool max-w-[220px]">
            Healthcare Decision Intelligence
          </p>
        </div>
        <div className="flex gap-12 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
          <div className="flex flex-col gap-2">
            <span className="text-gray-cool">Company</span>
            <Link href="/about" className="hover:text-navy">About</Link>
            <Link href="/founding-members" className="hover:text-navy">Founding Members</Link>
            <Link href="/contact" className="hover:text-navy">Contact</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-gray-cool">Product</span>
            <Link href="/platform" className="hover:text-navy">Platform</Link>
            <Link href="/research" className="hover:text-navy">Research</Link>
            <Link href="/pricing" className="hover:text-navy">Pricing</Link>
            <Link href="/login" className="hover:text-navy">Client Login</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-10 font-mono text-[9px] tracking-[0.1em] text-gray-cool">
        © {new Date().getFullYear()} Axionia. A CareVisory LLC company.
      </div>
    </footer>
  );
}

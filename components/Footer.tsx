import Link from "next/link";
import Logo from "./Logo";
import Subscribe from "./Subscribe";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14">
        <div className="grid md:grid-cols-[1.2fr_auto_auto] gap-10 md:gap-16">
          <div>
            <Logo size={26} withWordmark />
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-gray-cool max-w-[240px]">
              Independent analysis of employee benefit programs
            </p>
            <div className="mt-8">
              <Subscribe />
            </div>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            <span className="text-gray-cool">Company</span>
            <Link href="/about" className="hover:text-navy">About</Link>
            <Link href="/founding-members" className="hover:text-navy">Founding Members</Link>
            <Link href="/contact" className="hover:text-navy">Contact</Link>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
            <span className="text-gray-cool">Product</span>
            <Link href="/platform" className="hover:text-navy">Platform</Link>
            <Link href="/platform/outputs" className="hover:text-navy">What You Receive</Link>
            <Link href="/methodology" className="hover:text-navy">Methodology</Link>
            <Link href="/research" className="hover:text-navy">Research</Link>
            <Link href="/pricing" className="hover:text-navy">Pricing</Link>
            <Link href="/login" className="hover:text-navy">Client Login</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-10 font-mono text-[9px] tracking-[0.1em] text-gray-cool">
        © {new Date().getFullYear()} Axionia. All rights reserved.
      </div>
    </footer>
  );
}

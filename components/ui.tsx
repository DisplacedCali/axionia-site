import Link from "next/link";
import { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-4">{children}</div>;
}

export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`max-w-6xl mx-auto px-5 sm:px-6 py-14 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}

/**
 * Full-bleed navy surface. Navy is a foundation color in the brand tokens
 * (not an accent), so using it as a large surface is in-spec — it's what
 * creates rhythm against the dominant warm base.
 */
export function DarkSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative bg-navy text-base overflow-hidden ${className}`}>
      {/* signature gradient hairline along the top edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-axionia-gradient opacity-70" />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-24 md:py-28">
        {children}
      </div>
    </section>
  );
}

/** Eyebrow for use on dark surfaces. */
export function EyebrowLight({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-cool mb-4">
      {children}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-block px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] transition-all duration-300 ease-out hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
    >
      {children}
    </Link>
  );
}

export function GhostButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-block overflow-hidden px-6 py-3 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em]"
    >
      <span className="absolute inset-0 origin-left scale-x-0 bg-axionia-gradient transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <span className="relative z-10 transition-colors duration-300 group-hover:text-base">
        {children}
      </span>
    </Link>
  );
}

/** Solid gradient CTA — the highest-emphasis action. Works on light or dark. */
export function GradientButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-block overflow-hidden px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
    >
      <span className="absolute inset-0 bg-axionia-gradient transition-transform duration-500 ease-out group-hover:scale-110" />
      <span className="relative z-10">{children}</span>
    </Link>
  );
}

/** Ghost button for dark surfaces (the standard one would vanish on navy). */
export function GhostButtonLight({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-block overflow-hidden px-6 py-3 border border-white/30 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
    >
      <span className="absolute inset-0 origin-left scale-x-0 bg-base transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <span className="relative z-10 transition-colors duration-300 group-hover:text-navy">
        {children}
      </span>
    </Link>
  );
}

export { default as GradientRule } from "./GradientRule";

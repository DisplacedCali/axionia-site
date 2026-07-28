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
  return <section className={`max-w-6xl mx-auto px-6 py-20 ${className}`}>{children}</section>;
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
      className="inline-block px-6 py-3 bg-navy text-base font-mono text-[11px] uppercase tracking-[0.14em] hover:opacity-85 transition-opacity"
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
      className="inline-block px-6 py-3 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-navy hover:text-base transition-colors"
    >
      {children}
    </Link>
  );
}

export function GradientRule() {
  return <div className="h-[3px] w-16 bg-axionia-gradient" />;
}

"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";

const links = [
  { href: "/platform", label: "Platform" },
  { href: "/research", label: "Research" },
  { href: "/founding-members", label: "Founding Members" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [headerH, setHeaderH] = useState(73);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Measure the header rather than hardcoding — its height changes with
  // font loading and viewport width.
  useEffect(() => {
    const measure = () => setHeaderH(headerRef.current?.offsetHeight ?? 73);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-border bg-base/85 backdrop-blur-md supports-[backdrop-filter]:bg-base/70"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Logo size={28} withWordmark />
          </Link>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-warm">
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

          <div className="hidden md:flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.14em]">
            <Link href="/login" className="text-gray-warm hover:text-navy transition-colors">
              Log in
            </Link>
            <Link
              href="/request-report"
              className="px-4 py-2 border border-navy text-navy hover:bg-navy hover:text-base transition-colors"
            >
              Free report
            </Link>
          </div>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden relative w-11 h-11 -mr-2 flex flex-col items-center justify-center gap-[5px]"
          >
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-6 h-px bg-navy"
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </header>

      {/*
        Rendered as a SIBLING of <header>, not a child. The header uses
        backdrop-blur, and backdrop-filter makes an element the containing
        block for position:fixed descendants — nesting the panel inside it
        sizes it against the 73px header instead of the viewport, collapsing
        it to nothing.
      */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ top: headerH }}
            className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-base overflow-y-auto overscroll-contain"
          >
            <nav className="px-5 py-6 flex flex-col min-h-full">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.045, duration: 0.3 }}
                >
                  <Link
                    href={l.href}
                    className={`flex items-center justify-between py-4 border-b border-border font-serif text-[28px] leading-tight ${
                      pathname === l.href ? "text-blue" : "text-navy"
                    }`}
                  >
                    {l.label}
                    <span className="font-mono text-[11px] text-gray-cool">
                      0{i + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
                className="mt-7 flex flex-col gap-3"
              >
                <Link
                  href="/request-report"
                  className="relative overflow-hidden text-center px-6 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-base"
                >
                  <span className="absolute inset-0 bg-axionia-gradient" />
                  <span className="relative z-10">Get your free report</span>
                </Link>
                <Link
                  href="/login"
                  className="text-center px-6 py-4 border border-navy text-navy font-mono text-[11px] uppercase tracking-[0.14em]"
                >
                  Client log in
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38 }}
                className="mt-auto pt-10 font-serif italic text-[17px] leading-snug text-gray-warm"
              >
                &ldquo;We tell you what we think — but we expose the entire model.&rdquo;
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
